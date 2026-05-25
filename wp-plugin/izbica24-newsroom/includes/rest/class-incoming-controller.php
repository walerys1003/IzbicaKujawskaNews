<?php
/**
 * REST Controller: POST /iz24/v1/incoming
 *
 * Headers:
 *   Authorization: Bearer iz24_xxx
 *   X-Idempotency-Key: <sha256/uuid>
 *   Content-Type: application/json
 *
 * Body schema:
 *   { source, source_url?, source_name?, title, body, fetched_at,
 *     published_at_source?, author_source?, suggested_category?, suggested_tags?,
 *     suggested_geo?, ai_summary?, ai_model?, ai_prompt_slug?,
 *     ai_input_tokens?, ai_output_tokens?, ai_cost_usd?,
 *     workflow_id?, workflow_execution? }
 *
 * Response 201:
 *   { ok:true, raw_item_id, wp_admin_url, dedup:{status,...}, rate_limit:{...} }
 *
 * @package Izbica24\Newsroom\Rest
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Rest;

use Izbica24\Newsroom\CPT\Raw_Item;
use Izbica24\Newsroom\Helpers\Validator;
use Izbica24\Newsroom\Helpers\Logger;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class Incoming_Controller
{
    public function register_routes(): void
    {
        register_rest_route(IZ24_NEWSROOM_REST_NS, '/incoming', [
            'methods'             => 'POST',
            'callback'            => [$this, 'handle_incoming'],
            'permission_callback' => [$this, 'permission_check'],
            'args'                => $this->args_schema(),
        ]);

        register_rest_route(IZ24_NEWSROOM_REST_NS, '/incoming/healthz', [
            'methods'             => 'GET',
            'callback'            => static fn() => new WP_REST_Response(['ok' => true, 'time' => current_time('mysql', true)]),
            'permission_callback' => '__return_true',
        ]);
    }

    public function permission_check(WP_REST_Request $req): bool|WP_Error
    {
        $auth = $req->get_header('authorization');
        if (!$auth || stripos($auth, 'Bearer ') !== 0) {
            return new WP_Error('iz24_unauthorized', 'Missing or invalid Authorization header', ['status' => 401]);
        }
        $token = trim(substr($auth, 7));
        $info = Token_Manager::verify($token);
        if (!$info) {
            Logger::warn('Invalid token attempt', ['ip' => $_SERVER['REMOTE_ADDR'] ?? '?']);
            return new WP_Error('iz24_unauthorized', 'Invalid or revoked token', ['status' => 401]);
        }
        if (!in_array('incoming', $info['scopes'], true) && !in_array('*', $info['scopes'], true)) {
            return new WP_Error('iz24_forbidden', 'Token lacks scope: incoming', ['status' => 403]);
        }

        // Store info dla handlera
        $req->set_param('_iz24_token', $info);
        return true;
    }

    public function handle_incoming(WP_REST_Request $req): WP_REST_Response|WP_Error
    {
        $token = $req->get_param('_iz24_token');
        $bucket = 'token:' . $token['id'];

        // Rate limit
        $rl = Rate_Limiter::check($bucket);
        if (!$rl['ok']) {
            return new WP_Error('iz24_rate_limited', 'Rate limit exceeded', [
                'status' => 429,
                'retry_after' => $rl['retry_after'],
            ]);
        }

        // Idempotency
        $idem_key = $req->get_header('x-idempotency-key');
        if ($idem_key) {
            $cached = $this->idempotency_get($idem_key);
            if ($cached) {
                return new WP_REST_Response(json_decode($cached['response_body'], true), (int) $cached['response_code']);
            }
        }

        $data = $req->get_json_params() ?: [];

        // Walidacja
        $v = Validator::check_incoming($data);
        if (!$v['ok']) {
            return new WP_Error('iz24_invalid', 'Validation failed', ['status' => 422, 'errors' => $v['errors']]);
        }

        // Deduplikacja
        $dedup = Deduplicator::check((string) $data['title'], (string) $data['body']);
        if ($dedup['status'] === 'duplicate') {
            $resp = [
                'ok' => false,
                'reason' => 'duplicate',
                'existing_raw_item_id' => $dedup['match_id'],
                'wp_admin_url' => admin_url('post.php?action=edit&post=' . $dedup['match_id']),
            ];
            $code = 409;
            if ($idem_key) $this->idempotency_put($idem_key, $code, $resp);
            return new WP_REST_Response($resp, $code);
        }

        // Tworzenie posta
        $post_id = wp_insert_post([
            'post_type'    => Raw_Item::POST_TYPE,
            'post_status'  => 'draft',
            'post_title'   => Validator::sanitize_text((string) $data['title']),
            'post_content' => Validator::sanitize_body((string) $data['body']),
            'post_author'  => apply_filters('iz24_raw_default_author', 1),
        ], true);

        if (is_wp_error($post_id)) {
            Logger::error('wp_insert_post failed', ['err' => $post_id->get_error_message(), 'data' => $data]);
            return new WP_Error('iz24_insert_failed', 'Failed to create raw item', ['status' => 500]);
        }

        // Meta
        $meta_map = [
            'iz24_source_name'         => $data['source'],
            'iz24_source_url'          => $data['source_url'] ?? '',
            'iz24_workflow_id'         => $data['workflow_id'] ?? '',
            'iz24_workflow_execution'  => $data['workflow_execution'] ?? '',
            'iz24_fetched_at'          => $data['fetched_at'],
            'iz24_published_at_source' => $data['published_at_source'] ?? '',
            'iz24_author_source'       => $data['author_source'] ?? '',
            'iz24_suggested_category'  => $data['suggested_category'] ?? '',
            'iz24_suggested_tags'      => $data['suggested_tags'] ?? [],
            'iz24_suggested_geo'       => $data['suggested_geo'] ?? '',
            'iz24_ai_summary'          => $data['ai_summary'] ?? '',
            'iz24_ai_full_text'        => $data['ai_full_text'] ?? '',
            'iz24_ai_model'            => $data['ai_model'] ?? '',
            'iz24_ai_prompt_slug'      => $data['ai_prompt_slug'] ?? '',
            'iz24_ai_input_tokens'     => (int) ($data['ai_input_tokens'] ?? 0),
            'iz24_ai_output_tokens'    => (int) ($data['ai_output_tokens'] ?? 0),
            'iz24_ai_cost_usd'         => (float) ($data['ai_cost_usd'] ?? 0),
            'iz24_dedup_hash'          => $dedup['hash'],
            'iz24_dedup_similar_id'    => $dedup['match_id'] ?? 0,
        ];
        foreach ($meta_map as $k => $val) {
            update_post_meta($post_id, $k, $val);
        }

        // Taksonomie
        $source_term = wp_insert_term($data['source'], Raw_Item::TAX_SOURCE);
        if (!is_wp_error($source_term)) {
            wp_set_object_terms($post_id, [$data['source']], Raw_Item::TAX_SOURCE);
        } else {
            wp_set_object_terms($post_id, [$data['source']], Raw_Item::TAX_SOURCE);
        }
        wp_set_object_terms($post_id, ['new'], Raw_Item::TAX_STATUS);

        // Logowanie kosztu jeśli podano
        if (!empty($data['ai_cost_usd'])) {
            global $wpdb;
            $wpdb->insert($wpdb->prefix . 'iz24_cost_runs', [
                'service' => 'claude_via_n8n',
                'model'   => $data['ai_model'] ?? null,
                'input_tokens'  => (int) ($data['ai_input_tokens'] ?? 0),
                'output_tokens' => (int) ($data['ai_output_tokens'] ?? 0),
                'cost_usd' => (float) $data['ai_cost_usd'],
                'workflow_id' => $data['workflow_id'] ?? null,
                'raw_item_id' => $post_id,
                'created_at'  => current_time('mysql', true),
            ]);
        }

        // Trigger N3 router
        do_action('iz24_raw_item_created', $post_id, $data, $dedup);

        $resp = [
            'ok'           => true,
            'raw_item_id'  => $post_id,
            'wp_admin_url' => admin_url('post.php?action=edit&post=' . $post_id),
            'dedup'        => $dedup,
            'rate_limit'   => $rl,
        ];
        if ($idem_key) $this->idempotency_put($idem_key, 201, $resp);

        Logger::info('Incoming raw_item created', ['id' => $post_id, 'source' => $data['source']]);

        return new WP_REST_Response($resp, 201);
    }

    private function idempotency_get(string $key): ?array
    {
        global $wpdb;
        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT response_code, response_body FROM {$wpdb->prefix}iz24_idempotency
             WHERE idem_key = %s AND created_at > %s LIMIT 1",
            hash('sha256', $key),
            gmdate('Y-m-d H:i:s', time() - 24 * HOUR_IN_SECONDS)
        ), ARRAY_A);
        return $row ?: null;
    }

    private function idempotency_put(string $key, int $code, array $body): void
    {
        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'iz24_idempotency', [
            'idem_key' => hash('sha256', $key),
            'response_code' => $code,
            'response_body' => wp_json_encode($body),
            'created_at' => current_time('mysql', true),
        ], ['%s', '%d', '%s', '%s']);
    }

    private function args_schema(): array
    {
        return [
            'source' => ['required' => true, 'type' => 'string'],
            'title'  => ['required' => true, 'type' => 'string'],
            'body'   => ['required' => true, 'type' => 'string'],
            'fetched_at' => ['required' => true, 'type' => 'string', 'format' => 'date-time'],
            'source_url' => ['type' => 'string', 'format' => 'uri'],
            'suggested_category' => ['type' => 'string'],
            'suggested_tags' => ['type' => 'array', 'items' => ['type' => 'string']],
            'ai_cost_usd' => ['type' => 'number'],
            'ai_input_tokens' => ['type' => 'integer'],
            'ai_output_tokens' => ['type' => 'integer'],
        ];
    }
}

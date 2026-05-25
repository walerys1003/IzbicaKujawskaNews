<?php
/**
 * REST Controller: GET /iz24/v1/prompts/{slug}
 *                  POST /iz24/v1/prompts/{slug}/feedback
 *                  POST /iz24/v1/prompts/{slug}/test (admin only)
 *
 * @package Izbica24\Newsroom\Rest
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Rest;

use Izbica24\Newsroom\CPT\Prompt_Template;
use Izbica24\Newsroom\Prompts\Renderer;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

if (!defined('ABSPATH')) {
    exit;
}

final class Prompts_Controller
{
    public function register_routes(): void
    {
        $ns = IZ24_NEWSROOM_REST_NS;

        register_rest_route($ns, '/prompts/(?P<slug>[a-z0-9-]+)', [
            'methods'             => 'GET',
            'callback'            => [$this, 'get_prompt'],
            'permission_callback' => [$this, 'check_bearer'],
            'args' => [
                'slug' => ['type' => 'string', 'required' => true],
                'variant' => ['type' => 'string', 'enum' => ['A', 'B', 'auto'], 'default' => 'auto'],
            ],
        ]);

        register_rest_route($ns, '/prompts/(?P<slug>[a-z0-9-]+)/feedback', [
            'methods'             => 'POST',
            'callback'            => [$this, 'submit_feedback'],
            'permission_callback' => [$this, 'check_bearer'],
        ]);

        register_rest_route($ns, '/prompts/list', [
            'methods'             => 'GET',
            'callback'            => [$this, 'list_prompts'],
            'permission_callback' => [$this, 'check_bearer'],
        ]);
    }

    public function check_bearer(WP_REST_Request $req): bool|WP_Error
    {
        $auth = $req->get_header('authorization');
        if (!$auth || stripos($auth, 'Bearer ') !== 0) {
            return new WP_Error('iz24_unauthorized', 'Missing Authorization', ['status' => 401]);
        }
        $info = Token_Manager::verify(trim(substr($auth, 7)));
        if (!$info) {
            return new WP_Error('iz24_unauthorized', 'Invalid token', ['status' => 401]);
        }
        return true;
    }

    public function get_prompt(WP_REST_Request $req): WP_REST_Response|WP_Error
    {
        $slug = sanitize_title($req->get_param('slug'));
        $variant = $req->get_param('variant') ?: 'auto';

        $post = get_page_by_path($slug, OBJECT, Prompt_Template::POST_TYPE);
        if (!$post) {
            return new WP_Error('iz24_not_found', 'Prompt not found', ['status' => 404]);
        }

        $vars_input = (array) ($req->get_json_params()['variables'] ?? []);
        $rendered = Renderer::render($post->ID, $vars_input, $variant);

        return new WP_REST_Response([
            'slug'        => $slug,
            'variant'     => $rendered['variant'],
            'system'      => $rendered['system'],
            'user'        => $rendered['user'],
            'model'       => $rendered['model'],
            'temperature' => $rendered['temperature'],
            'max_tokens'  => $rendered['max_tokens'],
            'version'     => $rendered['version'],
        ], 200);
    }

    public function submit_feedback(WP_REST_Request $req): WP_REST_Response
    {
        $slug = sanitize_title($req->get_param('slug'));
        $data = $req->get_json_params() ?: [];

        global $wpdb;
        $wpdb->insert($wpdb->prefix . 'iz24_prompt_runs', [
            'prompt_slug'   => $slug,
            'variant'       => in_array($data['variant'] ?? 'A', ['A', 'B', 'control'], true) ? $data['variant'] : 'A',
            'version_used'  => (int) ($data['version'] ?? 1),
            'raw_item_id'   => (int) ($data['raw_item_id'] ?? 0) ?: null,
            'input_tokens'  => (int) ($data['input_tokens'] ?? 0),
            'output_tokens' => (int) ($data['output_tokens'] ?? 0),
            'cost_usd'      => (float) ($data['cost_usd'] ?? 0),
            'latency_ms'    => (int) ($data['latency_ms'] ?? 0),
            'model'         => (string) ($data['model'] ?? ''),
            'success'       => (int) (bool) ($data['success'] ?? true),
            'feedback_score' => isset($data['feedback_score']) ? max(-1, min(1, (int) $data['feedback_score'])) : null,
            'created_at'    => current_time('mysql', true),
        ]);

        return new WP_REST_Response(['ok' => true, 'id' => (int) $wpdb->insert_id], 201);
    }

    public function list_prompts(WP_REST_Request $req): WP_REST_Response
    {
        $posts = get_posts([
            'post_type'   => Prompt_Template::POST_TYPE,
            'numberposts' => 100,
            'post_status' => 'publish',
        ]);
        $out = [];
        foreach ($posts as $p) {
            $out[] = [
                'slug'    => $p->post_name,
                'title'   => $p->post_title,
                'model'   => get_post_meta($p->ID, 'iz24_prompt_model', true) ?: 'claude-3-5-sonnet-20241022',
                'version' => (int) (get_post_meta($p->ID, 'iz24_prompt_version', true) ?: 1),
                'active'  => (bool) get_post_meta($p->ID, 'iz24_prompt_active', true),
            ];
        }
        return new WP_REST_Response($out, 200);
    }
}

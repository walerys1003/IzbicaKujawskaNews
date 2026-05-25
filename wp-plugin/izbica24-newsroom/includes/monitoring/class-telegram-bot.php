<?php
/**
 * N6 — Telegram Bot.
 *
 * Obsługa:
 *   • `setWebhook()` — admin action, ustawia webhook na `/wp-json/iz24/v1/telegram/webhook`
 *   • REST POST /telegram/webhook — odbiera update z Telegrama, parsuje komendy
 *   • Komendy: /status, /cost, /queue, /help
 *   • Akcja `iz24_telegram_notify` (filter+do_action) — wysyła wiadomość do skonfigurowanego chat_id
 *
 * Konfiguracja via options:
 *   - iz24_telegram_bot_token (string, secret)
 *   - iz24_telegram_chat_id    (string)
 *   - iz24_telegram_webhook_secret (string)
 *
 * @package Izbica24\Newsroom\Monitoring
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Monitoring;

use Izbica24\Newsroom\Helpers\Logger;

if (!defined('ABSPATH')) {
    exit;
}

class Telegram_Bot
{
    private const API_BASE = 'https://api.telegram.org/bot';

    public function register(): void
    {
        add_action('iz24_telegram_notify', [$this, 'send_message'], 10, 2);
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('admin_post_iz24_set_webhook', [$this, 'admin_set_webhook']);
    }

    /**
     * Wysyła wiadomość do default chat_id.
     *
     * @param string      $text     HTML-formatted text (Telegram parse_mode=HTML).
     * @param string|null $chat_id  Override chat ID.
     */
    public function send_message(string $text, ?string $chat_id = null): bool
    {
        $token = (string) get_option('iz24_telegram_bot_token', '');
        $chat  = $chat_id ?: (string) get_option('iz24_telegram_chat_id', '');

        if ($token === '' || $chat === '') {
            return false;
        }

        $resp = wp_remote_post(self::API_BASE . $token . '/sendMessage', [
            'timeout' => 10,
            'body'    => [
                'chat_id'                  => $chat,
                'text'                     => $text,
                'parse_mode'               => 'HTML',
                'disable_web_page_preview' => 'true',
            ],
        ]);

        if (is_wp_error($resp)) {
            Logger::error('Telegram sendMessage failed', ['err' => $resp->get_error_message()]);
            return false;
        }
        $code = wp_remote_retrieve_response_code($resp);
        if ($code !== 200) {
            Logger::warning('Telegram sendMessage non-200', [
                'code' => $code,
                'body' => wp_remote_retrieve_body($resp),
            ]);
            return false;
        }
        return true;
    }

    public function register_rest_routes(): void
    {
        register_rest_route('iz24/v1', '/telegram/webhook', [
            'methods'             => 'POST',
            'permission_callback' => [$this, 'verify_webhook_secret'],
            'callback'            => [$this, 'handle_webhook'],
        ]);
    }

    /**
     * Sprawdza X-Telegram-Bot-Api-Secret-Token header.
     */
    public function verify_webhook_secret(\WP_REST_Request $req): bool
    {
        $expected = (string) get_option('iz24_telegram_webhook_secret', '');
        if ($expected === '') {
            return false;
        }
        $got = (string) $req->get_header('x_telegram_bot_api_secret_token');
        return hash_equals($expected, $got);
    }

    /**
     * Handler webhooka — parsuje update, dispatchuje komendy.
     */
    public function handle_webhook(\WP_REST_Request $req): \WP_REST_Response
    {
        $body = $req->get_json_params();
        if (!is_array($body) || empty($body['message'])) {
            return new \WP_REST_Response(['ok' => true], 200);
        }

        $message = $body['message'];
        $chat_id = (string) ($message['chat']['id'] ?? '');
        $text    = trim((string) ($message['text'] ?? ''));

        // Whitelist chat_id
        $allowed = (string) get_option('iz24_telegram_chat_id', '');
        if ($allowed !== '' && $chat_id !== $allowed) {
            $this->send_message('⛔ Unauthorized chat.', $chat_id);
            return new \WP_REST_Response(['ok' => true], 200);
        }

        if ($text === '' || $text[0] !== '/') {
            return new \WP_REST_Response(['ok' => true], 200);
        }

        // Parse command
        $parts = preg_split('/\s+/', $text, 2);
        $cmd   = strtolower($parts[0]);
        // Strip @botname if present
        $cmd = explode('@', $cmd)[0];

        switch ($cmd) {
            case '/start':
            case '/help':
                $this->cmd_help($chat_id);
                break;
            case '/status':
                $this->cmd_status($chat_id);
                break;
            case '/cost':
                $this->cmd_cost($chat_id);
                break;
            case '/queue':
                $this->cmd_queue($chat_id);
                break;
            default:
                $this->send_message("❓ Nieznana komenda: <code>{$cmd}</code>\nUżyj /help", $chat_id);
        }

        return new \WP_REST_Response(['ok' => true], 200);
    }

    private function cmd_help(string $chat_id): void
    {
        $msg = "<b>izbica24 Newsroom — Telegram Bot</b>\n\n"
             . "/status — stan systemu (cron, kill-switch, last tick)\n"
             . "/cost — dzisiejsze i miesięczne wydatki\n"
             . "/queue — liczba items per status w kolejce\n"
             . "/help — ta pomoc\n";
        $this->send_message($msg, $chat_id);
    }

    private function cmd_status(string $chat_id): void
    {
        $kill = (bool) get_option('iz24_kill_switch_active', 0);
        $last = get_option('iz24_cost_guard_last_tick', '—');
        $next = wp_next_scheduled('iz24_cost_guard_tick');
        $next_str = $next ? wp_date('Y-m-d H:i:s', $next) : '—';

        $msg = "<b>📡 Status</b>\n"
             . "Kill switch: " . ($kill ? '🛑 <b>ON</b>' : '✅ off') . "\n"
             . "Cost Guard last tick: <code>{$last}</code>\n"
             . "Next tick: <code>{$next_str}</code>\n"
             . "PHP: " . PHP_VERSION . "\n"
             . "WP: " . get_bloginfo('version');
        $this->send_message($msg, $chat_id);
    }

    private function cmd_cost(string $chat_id): void
    {
        $guard = new Cost_Guard();
        $d = $guard->sum_daily();
        $m = $guard->sum_monthly();
        $dl = (float) get_option('iz24_daily_cost_limit', 5.00);
        $ml = (float) get_option('iz24_monthly_cost_limit', 100.00);

        $msg = sprintf(
            "<b>💰 Koszty</b>\nDziś: <b>$%.4f</b> / $%.2f (%.1f%%)\nMiesiąc: <b>$%.4f</b> / $%.2f (%.1f%%)",
            $d,
            $dl,
            $dl > 0 ? ($d / $dl) * 100 : 0,
            $m,
            $ml,
            $ml > 0 ? ($m / $ml) * 100 : 0
        );
        $this->send_message($msg, $chat_id);
    }

    private function cmd_queue(string $chat_id): void
    {
        global $wpdb;
        $rows = $wpdb->get_results(
            "SELECT post_status, COUNT(*) AS cnt
             FROM `{$wpdb->posts}`
             WHERE post_type = 'iz24_raw_item'
             GROUP BY post_status
             ORDER BY cnt DESC",
            ARRAY_A
        );

        $lines = ["<b>📋 Kolejka raw items</b>"];
        if (empty($rows)) {
            $lines[] = '<i>(pusto)</i>';
        } else {
            foreach ($rows as $r) {
                $lines[] = sprintf('• <code>%s</code>: <b>%d</b>', esc_html($r['post_status']), (int) $r['cnt']);
            }
        }
        $this->send_message(implode("\n", $lines), $chat_id);
    }

    /**
     * Admin action — set webhook.
     */
    public function admin_set_webhook(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die('Forbidden');
        }
        check_admin_referer('iz24_set_webhook');

        $token  = (string) get_option('iz24_telegram_bot_token', '');
        $secret = (string) get_option('iz24_telegram_webhook_secret', '');

        if ($token === '') {
            wp_safe_redirect(add_query_arg('iz24_webhook', 'no_token', wp_get_referer() ?: admin_url()));
            exit;
        }

        if ($secret === '') {
            $secret = bin2hex(random_bytes(24));
            update_option('iz24_telegram_webhook_secret', $secret, false);
        }

        $url = rest_url('iz24/v1/telegram/webhook');
        $resp = wp_remote_post(self::API_BASE . $token . '/setWebhook', [
            'timeout' => 10,
            'body'    => [
                'url'          => $url,
                'secret_token' => $secret,
            ],
        ]);

        $ok = !is_wp_error($resp) && wp_remote_retrieve_response_code($resp) === 200;
        wp_safe_redirect(add_query_arg('iz24_webhook', $ok ? 'ok' : 'fail', wp_get_referer() ?: admin_url()));
        exit;
    }
}

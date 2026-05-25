<?php
declare(strict_types=1);
namespace Izbica24\Newsroom\Admin;

if (!defined('ABSPATH')) exit;

final class Page_Settings
{
    private const OPTIONS = [
        'iz24_daily_cost_limit_usd'   => ['label' => 'Dzienny limit kosztów ($)', 'type' => 'number'],
        'iz24_monthly_cost_limit_usd' => ['label' => 'Miesięczny limit kosztów ($)', 'type' => 'number'],
        'iz24_rate_limit_per_minute'  => ['label' => 'Rate limit / minutę', 'type' => 'integer'],
        'iz24_rate_limit_per_hour'    => ['label' => 'Rate limit / godzinę', 'type' => 'integer'],
        'iz24_dedup_levenshtein_threshold' => ['label' => 'Próg deduplikacji (0-1)', 'type' => 'number'],
        'iz24_claude_api_key'         => ['label' => 'Claude API key (opcjonalnie, jeśli WP sam pyta)', 'type' => 'password'],
        'iz24_n8n_base_url'           => ['label' => 'n8n base URL', 'type' => 'url'],
        'iz24_telegram_bot_token'     => ['label' => 'Telegram bot token', 'type' => 'password'],
        'iz24_telegram_chat_id'       => ['label' => 'Telegram chat ID redakcji', 'type' => 'text'],
        'iz24_remove_data_on_uninstall' => ['label' => 'Usuń wszystkie dane przy odinstalowaniu', 'type' => 'checkbox'],
    ];

    public static function render(): void
    {
        if (!current_user_can('manage_options')) wp_die('forbidden');

        if (isset($_POST['iz24_settings_save']) && check_admin_referer('iz24_settings')) {
            foreach (self::OPTIONS as $key => $cfg) {
                $v = $_POST[$key] ?? '';
                $clean = match ($cfg['type']) {
                    'number' => (float) $v,
                    'integer' => (int) $v,
                    'checkbox' => !empty($v),
                    'url' => esc_url_raw((string) $v),
                    'password', 'text' => sanitize_text_field((string) $v),
                    default => sanitize_text_field((string) $v),
                };
                update_option($key, $clean);
            }
            echo '<div class="notice notice-success"><p>Zapisano.</p></div>';
        }

        echo '<div class="wrap"><h1>Ustawienia · izbica24 Newsroom</h1>';
        echo '<form method="post"><table class="form-table"><tbody>';
        wp_nonce_field('iz24_settings');
        foreach (self::OPTIONS as $key => $cfg) {
            $val = get_option($key, '');
            printf('<tr><th scope="row"><label for="%s">%s</label></th><td>', esc_attr($key), esc_html($cfg['label']));
            if ($cfg['type'] === 'checkbox') {
                printf('<input type="checkbox" id="%s" name="%s" value="1" %s />', esc_attr($key), esc_attr($key), checked((bool) $val, true, false));
            } else {
                $type = $cfg['type'] === 'integer' ? 'number' : $cfg['type'];
                printf('<input type="%s" id="%s" name="%s" value="%s" class="regular-text" />',
                    esc_attr($type), esc_attr($key), esc_attr($key), esc_attr((string) $val));
            }
            echo '</td></tr>';
        }
        echo '</tbody></table>';
        submit_button('Zapisz', 'primary', 'iz24_settings_save');
        echo '</form></div>';
    }
}

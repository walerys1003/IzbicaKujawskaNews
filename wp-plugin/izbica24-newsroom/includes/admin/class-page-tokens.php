<?php
declare(strict_types=1);
namespace Izbica24\Newsroom\Admin;

use Izbica24\Newsroom\Rest\Token_Manager;

if (!defined('ABSPATH')) exit;

final class Page_Tokens
{
    public static function render(): void
    {
        if (!current_user_can('manage_options')) wp_die('forbidden');

        $generated = null;
        if (isset($_POST['iz24_token_action']) && check_admin_referer('iz24_tokens')) {
            if ($_POST['iz24_token_action'] === 'create') {
                $generated = Token_Manager::generate(
                    sanitize_text_field((string) $_POST['name']),
                    array_filter(array_map('sanitize_key', (array) ($_POST['scopes'] ?? ['incoming'])))
                );
            } elseif ($_POST['iz24_token_action'] === 'revoke') {
                Token_Manager::revoke((int) $_POST['token_id']);
            }
        }

        $tokens = Token_Manager::list();
        echo '<div class="wrap"><h1>Tokeny API · izbica24 Newsroom</h1>';

        if ($generated) {
            printf(
                '<div class="notice notice-warning"><p><strong>Twój nowy token (zapisz teraz — nie da się go odzyskać):</strong></p>
                <p><code style="background:#1a1a1a;color:#fa6400;padding:8px 12px;font-size:14px;">%s</code></p></div>',
                esc_html($generated['token'])
            );
        }

        echo '<h2>Utwórz nowy token</h2>';
        echo '<form method="post">';
        wp_nonce_field('iz24_tokens');
        echo '<input type="hidden" name="iz24_token_action" value="create" />';
        echo '<table class="form-table"><tbody>';
        echo '<tr><th>Nazwa (przyjazna)</th><td><input type="text" name="name" required class="regular-text" placeholder="np. n8n-bridge-production" /></td></tr>';
        echo '<tr><th>Scopes</th><td>';
        foreach (['incoming', 'prompts', 'metrics', '*'] as $sc) {
            printf('<label style="margin-right:14px;"><input type="checkbox" name="scopes[]" value="%s" %s /> %s</label>',
                $sc, $sc === 'incoming' ? 'checked' : '', $sc);
        }
        echo '</td></tr></tbody></table>';
        submit_button('Wygeneruj token');
        echo '</form>';

        echo '<h2 style="margin-top:30px;">Istniejące tokeny</h2>';
        echo '<table class="widefat striped"><thead><tr><th>ID</th><th>Nazwa</th><th>Scopes</th><th>Ostatnio użyty</th><th>Liczba zapytań</th><th>Status</th><th>Akcja</th></tr></thead><tbody>';
        foreach ($tokens as $t) {
            printf(
                '<tr><td>%d</td><td><strong>%s</strong></td><td><code>%s</code></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                (int) $t['id'],
                esc_html((string) $t['name']),
                esc_html((string) ($t['scopes'] ?? '[]')),
                esc_html($t['last_used_at'] ?: '—'),
                number_format((int) $t['requests_total']),
                $t['revoked_at'] ? '<span style="color:#d63638;">cofnięty</span>' : '<span style="color:#1e7a4f;">aktywny</span>',
                $t['revoked_at'] ? '—' : sprintf(
                    '<form method="post" style="display:inline;" onsubmit="return confirm(\'Cofnąć token?\')">%s<input type="hidden" name="iz24_token_action" value="revoke"/><input type="hidden" name="token_id" value="%d"/><button class="button button-link-delete">Cofnij</button></form>',
                    wp_nonce_field('iz24_tokens', '_wpnonce', true, false),
                    (int) $t['id']
                )
            );
        }
        echo '</tbody></table>';
        echo '</div>';
    }
}

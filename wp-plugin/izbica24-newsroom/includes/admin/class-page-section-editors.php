<?php
declare(strict_types=1);
namespace Izbica24\Newsroom\Admin;

use Izbica24\Newsroom\Helpers\Validator;

if (!defined('ABSPATH')) exit;

final class Page_Section_Editors
{
    public static function render(): void
    {
        if (!current_user_can('iz24_assign_section')) wp_die('forbidden');

        global $wpdb;
        $table = $wpdb->prefix . 'iz24_section_editors';

        if (isset($_POST['action']) && check_admin_referer('iz24_section_editors')) {
            if ($_POST['action'] === 'add') {
                $wpdb->insert($table, [
                    'category_slug'   => sanitize_text_field((string) $_POST['category_slug']),
                    'user_id'         => (int) $_POST['user_id'],
                    'role'            => in_array($_POST['role'] ?? '', ['owner', 'editor', 'reviewer'], true) ? $_POST['role'] : 'editor',
                    'sla_hours'       => max(1, (int) ($_POST['sla_hours'] ?? 24)),
                    'notify_email'    => isset($_POST['notify_email']) ? 1 : 0,
                    'notify_telegram' => isset($_POST['notify_telegram']) ? 1 : 0,
                    'created_at'      => current_time('mysql', true),
                ]);
            } elseif ($_POST['action'] === 'delete') {
                $wpdb->delete($table, ['id' => (int) $_POST['id']], ['%d']);
            }
        }

        $rows = $wpdb->get_results("SELECT * FROM {$table} ORDER BY category_slug, role DESC", ARRAY_A);

        echo '<div class="wrap"><h1>Section Editors</h1>';
        echo '<p>Przypisuje redaktorów do kategorii. Każdy nowy <code>iz24_raw_item</code> z taką suggested_category zostanie auto-przypisany.</p>';

        echo '<h2>Dodaj przypisanie</h2><form method="post">';
        wp_nonce_field('iz24_section_editors');
        echo '<input type="hidden" name="action" value="add" />';
        echo '<table class="form-table"><tbody>';
        echo '<tr><th>Kategoria</th><td><select name="category_slug" required>';
        foreach (Validator::ALLOWED_CATEGORIES as $cat) {
            printf('<option value="%s">%s</option>', esc_attr($cat), esc_html($cat));
        }
        echo '</select></td></tr>';

        echo '<tr><th>Użytkownik</th><td><select name="user_id" required>';
        foreach (get_users(['role__in' => ['administrator', 'editor', 'author']]) as $u) {
            printf('<option value="%d">%s (%s)</option>', $u->ID, esc_html($u->display_name), esc_html($u->user_login));
        }
        echo '</select></td></tr>';

        echo '<tr><th>Rola</th><td><select name="role"><option value="owner">owner</option><option value="editor" selected>editor</option><option value="reviewer">reviewer</option></select></td></tr>';
        echo '<tr><th>SLA (godziny)</th><td><input type="number" name="sla_hours" value="24" min="1" max="168" /></td></tr>';
        echo '<tr><th>Powiadomienia</th><td><label><input type="checkbox" name="notify_email" checked /> E-mail</label> &nbsp; <label><input type="checkbox" name="notify_telegram" /> Telegram</label></td></tr>';
        echo '</tbody></table>';
        submit_button('Dodaj');
        echo '</form>';

        echo '<h2 style="margin-top:30px;">Aktualne przypisania</h2>';
        echo '<table class="widefat striped"><thead><tr><th>Kategoria</th><th>Redaktor</th><th>Rola</th><th>SLA</th><th>Powiadomienia</th><th>Akcja</th></tr></thead><tbody>';
        foreach ($rows as $r) {
            $user = get_userdata((int) $r['user_id']);
            printf(
                '<tr><td><strong>%s</strong></td><td>%s</td><td>%s</td><td>%dh</td><td>%s</td><td>%s</td></tr>',
                esc_html((string) $r['category_slug']),
                esc_html($user ? $user->display_name : "(usunięty user #{$r['user_id']})"),
                esc_html((string) $r['role']),
                (int) $r['sla_hours'],
                ((int) $r['notify_email'] ? '✉️' : '') . ((int) $r['notify_telegram'] ? ' 💬' : ''),
                sprintf(
                    '<form method="post" style="display:inline;" onsubmit="return confirm(\'Usunąć?\')">%s<input type="hidden" name="action" value="delete"/><input type="hidden" name="id" value="%d"/><button class="button button-link-delete">Usuń</button></form>',
                    wp_nonce_field('iz24_section_editors', '_wpnonce', true, false),
                    (int) $r['id']
                )
            );
        }
        echo '</tbody></table></div>';
    }
}

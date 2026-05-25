<?php
declare(strict_types=1);
namespace Izbica24\Newsroom\Admin;

use Izbica24\Newsroom\Helpers\Validator;

if (!defined('ABSPATH')) exit;

final class Page_Workflow_Rules
{
    public static function render(): void
    {
        if (!current_user_can('iz24_assign_section')) wp_die('forbidden');

        global $wpdb;
        $table = $wpdb->prefix . 'iz24_workflow_rules';

        if (isset($_POST['action']) && check_admin_referer('iz24_workflow_rules')) {
            if ($_POST['action'] === 'add') {
                $wpdb->insert($table, [
                    'category_slug' => sanitize_text_field((string) $_POST['category_slug']),
                    'trigger_status' => sanitize_text_field((string) $_POST['trigger_status']),
                    'action_type'  => in_array($_POST['action_type'] ?? '', ['assign', 'notify', 'autoreject', 'escalate', 'publish'], true) ? $_POST['action_type'] : 'notify',
                    'action_target' => sanitize_text_field((string) $_POST['action_target']),
                    'conditions'   => wp_json_encode([]),
                    'priority'     => (int) ($_POST['priority'] ?? 100),
                    'active'       => isset($_POST['active']) ? 1 : 0,
                    'created_at'   => current_time('mysql', true),
                ]);
            } elseif ($_POST['action'] === 'delete') {
                $wpdb->delete($table, ['id' => (int) $_POST['id']], ['%d']);
            } elseif ($_POST['action'] === 'toggle') {
                $wpdb->query($wpdb->prepare("UPDATE {$table} SET active = 1-active WHERE id = %d", (int) $_POST['id']));
            }
        }

        $rows = $wpdb->get_results("SELECT * FROM {$table} ORDER BY priority ASC, id DESC", ARRAY_A);

        echo '<div class="wrap"><h1>Workflow Rules · routing redakcyjny</h1>';
        echo '<p>Reguły uruchamiane przy zmianie statusu raw_item. Wykonywane wg priority (niższy = wcześniej).</p>';

        echo '<h2>Dodaj regułę</h2><form method="post">';
        wp_nonce_field('iz24_workflow_rules');
        echo '<input type="hidden" name="action" value="add" />';
        echo '<table class="form-table"><tbody>';

        echo '<tr><th>Kategoria</th><td><select name="category_slug" required><option value="*">* (wszystkie)</option>';
        foreach (Validator::ALLOWED_CATEGORIES as $cat) {
            printf('<option value="%s">%s</option>', esc_attr($cat), esc_html($cat));
        }
        echo '</select></td></tr>';

        echo '<tr><th>Trigger status</th><td><select name="trigger_status">';
        foreach (['new', 'pitch', 'assigned', 'in_progress', 'review_needed', 'ready_to_publish', 'promoted'] as $s) {
            printf('<option value="%s">%s</option>', esc_attr($s), esc_html($s));
        }
        echo '</select></td></tr>';

        echo '<tr><th>Akcja</th><td><select name="action_type">
            <option value="assign">assign — przypisz do section editora</option>
            <option value="notify">notify — wyślij powiadomienie</option>
            <option value="autoreject">autoreject — automatyczne odrzucenie</option>
            <option value="escalate">escalate — eskaluj wyżej</option>
            <option value="publish">publish — automatyczna publikacja</option>
        </select></td></tr>';

        echo '<tr><th>Target (user_id/email/chat_id/...)</th><td><input type="text" name="action_target" class="regular-text" /></td></tr>';
        echo '<tr><th>Priority</th><td><input type="number" name="priority" value="100" min="1" max="1000" /></td></tr>';
        echo '<tr><th>Aktywna</th><td><input type="checkbox" name="active" value="1" checked /></td></tr>';
        echo '</tbody></table>';
        submit_button('Dodaj regułę');
        echo '</form>';

        echo '<h2 style="margin-top:30px;">Aktywne reguły</h2>';
        echo '<table class="widefat striped"><thead><tr><th>#</th><th>Kategoria</th><th>Trigger</th><th>Akcja</th><th>Target</th><th>Prio</th><th>Status</th><th>Akcje</th></tr></thead><tbody>';
        foreach ($rows as $r) {
            printf(
                '<tr><td>%d</td><td>%s</td><td><code>%s</code></td><td><strong>%s</strong></td><td>%s</td><td>%d</td><td>%s</td><td>%s</td></tr>',
                (int) $r['id'],
                esc_html((string) $r['category_slug']),
                esc_html((string) $r['trigger_status']),
                esc_html((string) $r['action_type']),
                esc_html((string) $r['action_target']),
                (int) $r['priority'],
                (int) $r['active'] ? '<span style="color:#1e7a4f;">●</span> aktywna' : '<span style="color:#d63638;">●</span> wyłączona',
                self::action_form((int) $r['id'])
            );
        }
        echo '</tbody></table></div>';
    }

    private static function action_form(int $id): string
    {
        $nonce = wp_nonce_field('iz24_workflow_rules', '_wpnonce', true, false);
        return sprintf(
            '<form method="post" style="display:inline;">%s<input type="hidden" name="action" value="toggle"/><input type="hidden" name="id" value="%d"/><button class="button button-small">⇄</button></form>
             <form method="post" style="display:inline;" onsubmit="return confirm(\'Usunąć?\')">%s<input type="hidden" name="action" value="delete"/><input type="hidden" name="id" value="%d"/><button class="button button-small button-link-delete">×</button></form>',
            $nonce, $id, $nonce, $id
        );
    }
}

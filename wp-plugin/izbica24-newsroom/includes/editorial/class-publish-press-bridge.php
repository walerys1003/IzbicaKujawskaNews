<?php
/**
 * N3 — Editorial Workflow Bridge.
 *
 * Rejestruje 5 customowych statusów (pitch, assigned, in_progress, review_needed, ready_to_publish),
 * podpina się pod akcję `iz24_raw_item_created` (emitowaną przez Incoming_Controller) i uruchamia
 * silnik reguł workflow (tabela `wp_iz24_workflow_rules`) — przypisywanie do redaktorów sekcji
 * (tabela `wp_iz24_section_editors`) z kolejką priorytetową.
 *
 * Jeśli wtyczka PublishPress Statuses jest aktywna, używamy jej API; w przeciwnym wypadku
 * fallback — rejestrujemy statusy bezpośrednio przez register_post_status().
 *
 * @package Izbica24\Newsroom\Editorial
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Editorial;

use Izbica24\Newsroom\Helpers\Logger;

if (!defined('ABSPATH')) {
    exit;
}

class PublishPress_Bridge
{
    public const STATUSES = [
        'iz24_pitch' => [
            'label'   => 'Pitch',
            'color'   => '#777777',
            'icon'    => 'dashicons-lightbulb',
            'order'   => 1,
        ],
        'iz24_assigned' => [
            'label'   => 'Przypisany',
            'color'   => '#3b82f6',
            'icon'    => 'dashicons-businessman',
            'order'   => 2,
        ],
        'iz24_in_progress' => [
            'label'   => 'W trakcie',
            'color'   => '#f59e0b',
            'icon'    => 'dashicons-edit',
            'order'   => 3,
        ],
        'iz24_review_needed' => [
            'label'   => 'Do recenzji',
            'color'   => '#a855f7',
            'icon'    => 'dashicons-search',
            'order'   => 4,
        ],
        'iz24_ready_to_publish' => [
            'label'   => 'Gotowy do publikacji',
            'color'   => '#10b981',
            'icon'    => 'dashicons-yes-alt',
            'order'   => 5,
        ],
    ];

    public function register(): void
    {
        add_action('init', [$this, 'register_statuses'], 5);
        add_action('iz24_raw_item_created', [$this, 'on_item_created'], 10, 2);
        add_action('iz24_raw_item_status_changed', [$this, 'on_status_changed'], 10, 3);
        add_filter('display_post_states', [$this, 'show_post_states'], 10, 2);
    }

    /**
     * Rejestracja 5 customowych statusów.
     */
    public function register_statuses(): void
    {
        foreach (self::STATUSES as $slug => $cfg) {
            register_post_status($slug, [
                'label'                     => $cfg['label'],
                'public'                    => false,
                'internal'                  => false,
                'protected'                 => true,
                'exclude_from_search'       => false,
                'show_in_admin_all_list'    => true,
                'show_in_admin_status_list' => true,
                /* translators: %s: liczba wpisów */
                'label_count'               => _n_noop(
                    $cfg['label'] . ' (%s)',
                    $cfg['label'] . ' (%s)',
                    'izbica24-newsroom'
                ),
            ]);
        }
    }

    /**
     * Wyświetla etykietę statusu na liście postów.
     */
    public function show_post_states(array $states, \WP_Post $post): array
    {
        if ($post->post_type !== 'iz24_raw_item') {
            return $states;
        }
        if (isset(self::STATUSES[$post->post_status])) {
            $states['iz24_status'] = self::STATUSES[$post->post_status]['label'];
        }
        return $states;
    }

    /**
     * Hook: nowy raw item powstał z REST /incoming.
     *
     * @param int   $post_id ID nowego raw item.
     * @param array $payload Pełny payload od n8n.
     */
    public function on_item_created(int $post_id, array $payload): void
    {
        $rules = $this->get_active_rules();
        if (empty($rules)) {
            return;
        }

        // Sortowanie po priority (DESC) — wyższy priorytet pierwszy
        usort($rules, fn($a, $b) => (int) $b['priority'] <=> (int) $a['priority']);

        foreach ($rules as $rule) {
            if ($this->rule_matches($rule, $payload, $post_id)) {
                $this->apply_rule($rule, $post_id, $payload);

                // Jeśli reguła ma flagę "stop_on_match" — przerywamy
                $cond = json_decode($rule['conditions'] ?? '{}', true) ?: [];
                if (!empty($cond['_stop_on_match'])) {
                    break;
                }
            }
        }

        Logger::info('PublishPress_Bridge: processed rules for post', [
            'post_id'      => $post_id,
            'rules_count'  => count($rules),
        ]);
    }

    /**
     * Hook: zmiana statusu raw item — log + ewentualnie notyfikacja.
     */
    public function on_status_changed(int $post_id, string $new_status, string $old_status): void
    {
        Logger::info('Raw item status changed', [
            'post_id'    => $post_id,
            'from'       => $old_status,
            'to'         => $new_status,
        ]);

        // Trigger Telegram alert dla ready_to_publish
        if ($new_status === 'iz24_ready_to_publish') {
            do_action('iz24_telegram_notify', sprintf(
                '✅ Artykuł gotowy do publikacji: <code>#%d</code>',
                $post_id
            ));
        }
    }

    /**
     * Pobiera aktywne reguły workflow z bazy.
     *
     * @return array<array<string,mixed>>
     */
    private function get_active_rules(): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'iz24_workflow_rules';

        $rows = $wpdb->get_results(
            "SELECT * FROM `{$table}` WHERE is_active = 1 ORDER BY priority DESC",
            ARRAY_A
        );

        return is_array($rows) ? $rows : [];
    }

    /**
     * Czy reguła pasuje do payloadu?
     *
     * Conditions JSON np.:
     * {
     *   "source": ["facebook_official", "user_submission"],
     *   "category": ["na_sygnale"],
     *   "min_priority": 7,
     *   "keywords_any": ["pożar", "wypadek"]
     * }
     */
    private function rule_matches(array $rule, array $payload, int $post_id): bool
    {
        $cond = json_decode($rule['conditions'] ?? '{}', true);
        if (!is_array($cond) || empty($cond)) {
            return true;
        }

        // source match
        if (!empty($cond['source']) && is_array($cond['source'])) {
            $src = (string) ($payload['source'] ?? '');
            if (!in_array($src, $cond['source'], true)) {
                return false;
            }
        }

        // category match
        if (!empty($cond['category']) && is_array($cond['category'])) {
            $cat = (string) ($payload['category'] ?? '');
            if (!in_array($cat, $cond['category'], true)) {
                return false;
            }
        }

        // min_priority
        if (isset($cond['min_priority'])) {
            $prio = (int) ($payload['priority_score'] ?? 0);
            if ($prio < (int) $cond['min_priority']) {
                return false;
            }
        }

        // keywords_any — szuka w title+content
        if (!empty($cond['keywords_any']) && is_array($cond['keywords_any'])) {
            $haystack = mb_strtolower(($payload['title'] ?? '') . ' ' . ($payload['content'] ?? ''));
            $found = false;
            foreach ($cond['keywords_any'] as $kw) {
                if (mb_stripos($haystack, mb_strtolower((string) $kw)) !== false) {
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                return false;
            }
        }

        return true;
    }

    /**
     * Wykonuje akcje zdefiniowane w regule.
     *
     * Actions JSON np.:
     * {
     *   "set_status": "iz24_assigned",
     *   "assign_section_editor": "na_sygnale",
     *   "set_priority": 9,
     *   "notify_telegram": true,
     *   "add_term": {"taxonomy":"iz24_topic","term":"breaking"}
     * }
     */
    private function apply_rule(array $rule, int $post_id, array $payload): void
    {
        $actions = json_decode($rule['actions'] ?? '{}', true);
        if (!is_array($actions)) {
            return;
        }

        // set_status
        if (!empty($actions['set_status'])) {
            $new_status = (string) $actions['set_status'];
            if (isset(self::STATUSES[$new_status]) || in_array($new_status, ['new', 'queued', 'in_review', 'rejected', 'promoted'], true)) {
                wp_update_post([
                    'ID'          => $post_id,
                    'post_status' => $new_status,
                ]);
            }
        }

        // assign_section_editor — pobiera redaktora z wp_iz24_section_editors
        if (!empty($actions['assign_section_editor'])) {
            $section = (string) $actions['assign_section_editor'];
            $editor_id = $this->find_section_editor($section);
            if ($editor_id > 0) {
                update_post_meta($post_id, '_iz24_assigned_editor', $editor_id);
                wp_update_post([
                    'ID'          => $post_id,
                    'post_author' => $editor_id,
                ]);
            }
        }

        // set_priority
        if (isset($actions['set_priority'])) {
            update_post_meta($post_id, '_iz24_priority_score', (int) $actions['set_priority']);
        }

        // notify_telegram
        if (!empty($actions['notify_telegram'])) {
            $title = (string) ($payload['title'] ?? '(bez tytułu)');
            do_action('iz24_telegram_notify', sprintf(
                '🔔 Nowy materiał (reguła: %s)\n<b>%s</b>\nID: #%d',
                esc_html($rule['name'] ?? '?'),
                esc_html(mb_substr($title, 0, 80)),
                $post_id
            ));
        }

        // add_term
        if (!empty($actions['add_term']) && is_array($actions['add_term'])) {
            $tax = (string) ($actions['add_term']['taxonomy'] ?? '');
            $term = (string) ($actions['add_term']['term'] ?? '');
            if ($tax && $term) {
                wp_set_object_terms($post_id, $term, $tax, true);
            }
        }

        // Increment match counter
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            "UPDATE `{$wpdb->prefix}iz24_workflow_rules` SET matched_count = matched_count + 1, last_matched_at = %s WHERE id = %d",
            current_time('mysql'),
            (int) $rule['id']
        ));
    }

    /**
     * Znajduje redaktora przypisanego do sekcji (round-robin po `last_assigned_at`).
     */
    private function find_section_editor(string $section): int
    {
        global $wpdb;
        $table = $wpdb->prefix . 'iz24_section_editors';

        $row = $wpdb->get_row($wpdb->prepare(
            "SELECT id, user_id FROM `{$table}`
             WHERE section = %s AND is_active = 1
             ORDER BY COALESCE(last_assigned_at, '1970-01-01') ASC, id ASC
             LIMIT 1",
            $section
        ), ARRAY_A);

        if (!$row) {
            return 0;
        }

        // touch
        $wpdb->update(
            $table,
            ['last_assigned_at' => current_time('mysql'), 'assigned_count' => 0],
            ['id' => (int) $row['id']],
            ['%s', '%d'],
            ['%d']
        );
        $wpdb->query($wpdb->prepare(
            "UPDATE `{$table}` SET assigned_count = assigned_count + 1 WHERE id = %d",
            (int) $row['id']
        ));

        return (int) $row['user_id'];
    }
}

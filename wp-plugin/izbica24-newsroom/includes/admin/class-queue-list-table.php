<?php
/**
 * Queue List Table — WP_List_Table dla iz24_raw_item.
 * Kolumny: title, source, status, suggested_category, ai_cost, fetched_at, actions
 * Bulk actions: approve, reject, assign-editor, mark-duplicate, delete, mark-reviewed
 *
 * @package Izbica24\Newsroom\Admin
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Admin;

use Izbica24\Newsroom\CPT\Raw_Item;

if (!defined('ABSPATH')) {
    exit;
}

if (!class_exists('\WP_List_Table')) {
    require_once ABSPATH . 'wp-admin/includes/class-wp-list-table.php';
}

final class Queue_List_Table extends \WP_List_Table
{
    public function __construct()
    {
        parent::__construct([
            'singular' => 'iz24_raw_item',
            'plural'   => 'iz24_raw_items',
            'ajax'     => false,
        ]);
    }

    public function get_columns(): array
    {
        return [
            'cb'         => '<input type="checkbox" />',
            'title'      => __('Tytuł', 'izbica24-newsroom'),
            'source'     => __('Źródło', 'izbica24-newsroom'),
            'status'     => __('Status', 'izbica24-newsroom'),
            'category'   => __('Kategoria (AI)', 'izbica24-newsroom'),
            'cost'       => __('Koszt $', 'izbica24-newsroom'),
            'fetched_at' => __('Pobrano', 'izbica24-newsroom'),
            'actions'    => __('Akcje', 'izbica24-newsroom'),
        ];
    }

    public function get_sortable_columns(): array
    {
        return [
            'title'      => ['title', false],
            'fetched_at' => ['date', true],
            'cost'       => ['iz24_ai_cost_usd', false],
        ];
    }

    public function get_bulk_actions(): array
    {
        return [
            'approve'         => __('Zatwierdź (→ promuj)', 'izbica24-newsroom'),
            'reject'          => __('Odrzuć', 'izbica24-newsroom'),
            'assign-editor'   => __('Przypisz redaktora', 'izbica24-newsroom'),
            'mark-duplicate'  => __('Oznacz jako duplikat', 'izbica24-newsroom'),
            'mark-reviewed'   => __('Oznacz jako sprawdzone', 'izbica24-newsroom'),
            'delete'          => __('Usuń', 'izbica24-newsroom'),
        ];
    }

    public function prepare_items(): void
    {
        $per_page = 20;
        $current_page = $this->get_pagenum();
        $offset = ($current_page - 1) * $per_page;

        $orderby = sanitize_key($_GET['orderby'] ?? 'date');
        $order = strtoupper((string) ($_GET['order'] ?? 'DESC')) === 'ASC' ? 'ASC' : 'DESC';
        $search = sanitize_text_field((string) ($_GET['s'] ?? ''));

        $args = [
            'post_type'      => Raw_Item::POST_TYPE,
            'post_status'    => ['draft', 'pending', 'private'],
            'posts_per_page' => $per_page,
            'offset'         => $offset,
            'orderby'        => $orderby,
            'order'          => $order,
        ];
        if ($search) {
            $args['s'] = $search;
        }
        if (!empty($_GET['filter_source'])) {
            $args['tax_query'][] = [
                'taxonomy' => Raw_Item::TAX_SOURCE,
                'field' => 'slug',
                'terms' => sanitize_text_field((string) $_GET['filter_source']),
            ];
        }
        if (!empty($_GET['filter_status'])) {
            $args['tax_query'][] = [
                'taxonomy' => Raw_Item::TAX_STATUS,
                'field' => 'slug',
                'terms' => sanitize_text_field((string) $_GET['filter_status']),
            ];
        }

        $query = new \WP_Query($args);
        $this->items = $query->posts;

        $this->set_pagination_args([
            'total_items' => (int) $query->found_posts,
            'per_page'    => $per_page,
            'total_pages' => max(1, (int) $query->max_num_pages),
        ]);

        $this->_column_headers = [$this->get_columns(), [], $this->get_sortable_columns()];

        $this->process_bulk_action();
    }

    public function process_bulk_action(): void
    {
        if (!isset($_POST['_wpnonce'])) return;
        if (!wp_verify_nonce((string) $_POST['_wpnonce'], 'bulk-iz24_raw_items')) return;

        $action = $this->current_action();
        if (!$action) return;

        $ids = array_map('intval', (array) ($_POST['raw_ids'] ?? []));
        if (!$ids) return;

        foreach ($ids as $id) {
            switch ($action) {
                case 'approve':
                    wp_set_object_terms($id, ['promoted'], Raw_Item::TAX_STATUS);
                    do_action('iz24_queue_approved', $id);
                    break;
                case 'reject':
                    wp_set_object_terms($id, ['rejected'], Raw_Item::TAX_STATUS);
                    break;
                case 'mark-duplicate':
                    wp_set_object_terms($id, ['duplicate'], Raw_Item::TAX_STATUS);
                    break;
                case 'mark-reviewed':
                    wp_set_object_terms($id, ['in_review'], Raw_Item::TAX_STATUS);
                    break;
                case 'assign-editor':
                    $user = (int) ($_POST['assign_user'] ?? 0);
                    if ($user > 0) {
                        update_post_meta($id, 'iz24_assignee_user_id', $user);
                    }
                    break;
                case 'delete':
                    wp_trash_post($id);
                    break;
            }
        }

        add_action('admin_notices', static function () use ($action, $ids): void {
            $count = count($ids);
            printf('<div class="notice notice-success is-dismissible"><p>%s</p></div>',
                esc_html(sprintf('Akcja "%s" wykonana na %d itemach.', $action, $count)));
        });
    }

    public function column_cb($item): string
    {
        return sprintf('<input type="checkbox" name="raw_ids[]" value="%d" />', (int) $item->ID);
    }

    public function column_title($item): string
    {
        $title = esc_html(get_the_title($item->ID));
        $edit = esc_url(admin_url('post.php?action=edit&post=' . $item->ID));
        return sprintf(
            '<strong><a href="#" class="iz24-open-side" data-id="%d">%s</a></strong>
             <div class="row-actions"><span><a href="%s">Edytuj</a></span></div>',
            $item->ID, $title, $edit
        );
    }

    public function column_source($item): string
    {
        $terms = wp_get_object_terms($item->ID, Raw_Item::TAX_SOURCE, ['fields' => 'names']);
        $name = get_post_meta($item->ID, 'iz24_source_name', true);
        return esc_html(implode(', ', $terms) ?: (string) $name ?: '—');
    }

    public function column_status($item): string
    {
        $terms = wp_get_object_terms($item->ID, Raw_Item::TAX_STATUS, ['fields' => 'names']);
        $status = $terms[0] ?? 'new';
        return sprintf('<span class="iz24-status iz24-status-%s">%s</span>',
            esc_attr(sanitize_title($status)),
            esc_html($status));
    }

    public function column_category($item): string
    {
        return esc_html((string) get_post_meta($item->ID, 'iz24_suggested_category', true) ?: '—');
    }

    public function column_cost($item): string
    {
        $cost = (float) get_post_meta($item->ID, 'iz24_ai_cost_usd', true);
        return $cost > 0 ? '$' . number_format($cost, 4) : '—';
    }

    public function column_fetched_at($item): string
    {
        $t = (string) get_post_meta($item->ID, 'iz24_fetched_at', true);
        return $t ? esc_html(human_time_diff(strtotime($t), time()) . ' temu') : esc_html(get_the_date('Y-m-d H:i', $item->ID));
    }

    public function column_actions($item): string
    {
        return sprintf(
            '<button class="button button-small iz24-quick-approve" data-id="%d">✓</button>
             <button class="button button-small iz24-quick-reject" data-id="%d">✗</button>',
            $item->ID, $item->ID
        );
    }

    public function extra_tablenav($which): void
    {
        if ($which !== 'top') return;
        $sources = get_terms(['taxonomy' => Raw_Item::TAX_SOURCE, 'hide_empty' => false]);
        $statuses = get_terms(['taxonomy' => Raw_Item::TAX_STATUS, 'hide_empty' => false]);
        echo '<div class="alignleft actions">';
        echo '<select name="filter_source"><option value="">— wszystkie źródła —</option>';
        foreach ($sources as $s) {
            printf('<option value="%s"%s>%s</option>',
                esc_attr($s->slug),
                selected($_GET['filter_source'] ?? '', $s->slug, false),
                esc_html($s->name)
            );
        }
        echo '</select>';
        echo '<select name="filter_status"><option value="">— wszystkie statusy —</option>';
        foreach ($statuses as $st) {
            printf('<option value="%s"%s>%s</option>',
                esc_attr($st->slug),
                selected($_GET['filter_status'] ?? '', $st->slug, false),
                esc_html($st->name)
            );
        }
        echo '</select>';
        submit_button(__('Filtruj', 'izbica24-newsroom'), 'button', 'iz24_filter', false);
        echo '</div>';
    }

    public function no_items(): void
    {
        esc_html_e('Brak surowców w kolejce.', 'izbica24-newsroom');
    }
}

<?php
/**
 * Admin Menu — top-level "Newsroom" + podstrony.
 *
 * @package Izbica24\Newsroom\Admin
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Admin;

if (!defined('ABSPATH')) {
    exit;
}

final class Menu
{
    public function register(): void
    {
        add_action('admin_menu', [$this, 'add_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
    }

    public function add_menu(): void
    {
        add_menu_page(
            __('Newsroom', 'izbica24-newsroom'),
            __('Newsroom', 'izbica24-newsroom'),
            'iz24_view_queue',
            'iz24_newsroom',
            [$this, 'render_queue_page'],
            'dashicons-megaphone',
            6
        );

        // Queue jest stroną główną (slug ten sam co parent)
        add_submenu_page(
            'iz24_newsroom',
            __('Kolejka surowców', 'izbica24-newsroom'),
            __('Kolejka', 'izbica24-newsroom'),
            'iz24_view_queue',
            'iz24_newsroom',
            [$this, 'render_queue_page']
        );

        add_submenu_page(
            'iz24_newsroom',
            __('Section Editors', 'izbica24-newsroom'),
            __('Section Editors', 'izbica24-newsroom'),
            'iz24_assign_section',
            'iz24_section_editors',
            [Page_Section_Editors::class, 'render']
        );

        add_submenu_page(
            'iz24_newsroom',
            __('Workflow Rules', 'izbica24-newsroom'),
            __('Workflow Rules', 'izbica24-newsroom'),
            'iz24_assign_section',
            'iz24_workflow_rules',
            [Page_Workflow_Rules::class, 'render']
        );

        add_submenu_page(
            'iz24_newsroom',
            __('Cost Guard', 'izbica24-newsroom'),
            __('Cost Guard', 'izbica24-newsroom'),
            'iz24_manage_costs',
            'iz24_cost_guard',
            [Page_Cost_Guard::class, 'render']
        );

        add_submenu_page(
            'iz24_newsroom',
            __('Prompt Templates', 'izbica24-newsroom'),
            __('Prompty AI', 'izbica24-newsroom'),
            'iz24_manage_prompts',
            'edit.php?post_type=iz24_prompt_template'
        );

        add_submenu_page(
            'iz24_newsroom',
            __('Tokens API', 'izbica24-newsroom'),
            __('Tokeny API', 'izbica24-newsroom'),
            'manage_options',
            'iz24_tokens',
            [Page_Tokens::class, 'render']
        );

        add_submenu_page(
            'iz24_newsroom',
            __('Ustawienia', 'izbica24-newsroom'),
            __('Ustawienia', 'izbica24-newsroom'),
            'manage_options',
            'iz24_settings',
            [Page_Settings::class, 'render']
        );
    }

    public function render_queue_page(): void
    {
        require_once __DIR__ . '/class-queue-list-table.php';
        $table = new Queue_List_Table();
        $table->prepare_items();

        echo '<div class="wrap iz24-queue-wrap">';
        echo '<h1 class="wp-heading-inline">' . esc_html__('Kolejka surowców', 'izbica24-newsroom') . '</h1>';
        echo '<a href="' . esc_url(admin_url('post-new.php?post_type=iz24_raw_item')) . '" class="page-title-action">' . esc_html__('Dodaj ręcznie', 'izbica24-newsroom') . '</a>';
        echo '<hr class="wp-header-end" />';
        echo '<form id="iz24-queue-filter" method="get">';
        echo '<input type="hidden" name="page" value="iz24_newsroom" />';
        $table->search_box(__('Szukaj', 'izbica24-newsroom'), 'iz24-search');
        $table->display();
        echo '</form>';
        echo '<div id="iz24-side-panel" class="iz24-side-panel" hidden>';
        echo '  <div class="iz24-side-header"><h2></h2><button class="iz24-close" aria-label="Zamknij">×</button></div>';
        echo '  <div class="iz24-side-body"><pre id="iz24-json"></pre></div>';
        echo '  <div class="iz24-side-footer">';
        echo '    <button class="button button-primary iz24-promote">Promuj do postu</button>';
        echo '    <button class="button iz24-assign">Przypisz redaktora</button>';
        echo '    <button class="button iz24-reject">Odrzuć</button>';
        echo '  </div>';
        echo '</div>';
        echo '</div>';
    }

    public function enqueue_assets(string $hook): void
    {
        if (!str_contains($hook, 'iz24_')) {
            return;
        }
        wp_enqueue_style(
            'iz24-admin',
            IZ24_NEWSROOM_URL . 'admin/assets/css/admin.css',
            [],
            IZ24_NEWSROOM_VERSION
        );
        wp_enqueue_script(
            'iz24-admin',
            IZ24_NEWSROOM_URL . 'admin/assets/js/admin.js',
            ['jquery', 'wp-api'],
            IZ24_NEWSROOM_VERSION,
            true
        );
        wp_localize_script('iz24-admin', 'IZ24', [
            'nonce'      => wp_create_nonce('wp_rest'),
            'rest_root'  => esc_url_raw(rest_url(IZ24_NEWSROOM_REST_NS)),
            'admin_url'  => admin_url(),
        ]);
    }
}

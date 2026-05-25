<?php
/**
 * Plugin bootstrapper — rejestruje wszystkie usługi.
 *
 * @package Izbica24\Newsroom
 */

declare(strict_types=1);

namespace Izbica24\Newsroom;

use Izbica24\Newsroom\Traits\Singleton;
use Izbica24\Newsroom\CPT\Raw_Item;
use Izbica24\Newsroom\CPT\Prompt_Template;
use Izbica24\Newsroom\Rest\Incoming_Controller;
use Izbica24\Newsroom\Rest\Prompts_Controller;
use Izbica24\Newsroom\Admin\Menu;
use Izbica24\Newsroom\Admin\Dashboard_Widget;
use Izbica24\Newsroom\Editorial\PublishPress_Bridge;
use Izbica24\Newsroom\Monitoring\Cost_Guard;
use Izbica24\Newsroom\Monitoring\Telegram_Bot;

if (!defined('ABSPATH')) {
    exit;
}

final class Plugin
{
    use Singleton;

    private array $services = [];

    public function boot(): void
    {
        load_plugin_textdomain('izbica24-newsroom', false, dirname(IZ24_NEWSROOM_BASENAME) . '/languages');

        // === N1: Raw item CPT + taksonomie + REST /incoming
        $this->services['cpt_raw'] = new Raw_Item();
        $this->services['cpt_raw']->register();

        $this->services['rest_incoming'] = new Incoming_Controller();
        add_action('rest_api_init', [$this->services['rest_incoming'], 'register_routes']);

        // === N2: Admin panel (Queue + Dashboard Widget)
        if (is_admin()) {
            $this->services['admin_menu'] = new Menu();
            $this->services['admin_menu']->register();

            $this->services['dashboard_widget'] = new Dashboard_Widget();
            add_action('wp_dashboard_setup', [$this->services['dashboard_widget'], 'register']);
        }

        // === N3: PublishPress bridge
        $this->services['pp_bridge'] = new PublishPress_Bridge();
        $this->services['pp_bridge']->register();

        // === N4: Prompt Templates CPT + REST
        $this->services['cpt_prompt'] = new Prompt_Template();
        $this->services['cpt_prompt']->register();

        $this->services['rest_prompts'] = new Prompts_Controller();
        add_action('rest_api_init', [$this->services['rest_prompts'], 'register_routes']);

        // === N6: Cost Guard (cron co 5 min) + Telegram bot
        $this->services['cost_guard'] = new Cost_Guard();
        $this->services['cost_guard']->register();

        $this->services['telegram'] = new Telegram_Bot();
        $this->services['telegram']->register();

        // Capabilities — przy aktywacji dodajemy do admin/editor, tutaj tylko upewniamy się
        add_action('init', [self::class, 'register_capabilities'], 1);
    }

    public static function register_capabilities(): void
    {
        $caps = [
            'iz24_view_queue',
            'iz24_publish_raw',
            'iz24_manage_prompts',
            'iz24_assign_section',
            'iz24_manage_costs',
        ];
        foreach (['administrator', 'editor'] as $role_name) {
            $role = get_role($role_name);
            if ($role) {
                foreach ($caps as $c) {
                    if (!$role->has_cap($c)) {
                        $role->add_cap($c);
                    }
                }
            }
        }
    }

    public function service(string $key): ?object
    {
        return $this->services[$key] ?? null;
    }
}

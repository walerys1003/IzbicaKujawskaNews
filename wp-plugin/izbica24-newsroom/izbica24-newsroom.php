<?php
/**
 * Plugin Name:       izbica24 Newsroom
 * Plugin URI:        https://izbica24.pl/
 * Description:       AI-driven newsroom dla portalu izbica24.pl — CPT iz24_raw_item, REST /incoming, PublishPress integration, Prompt Templates, Cost Guard, Telegram bot, n8n bridge.
 * Version:           1.0.0
 * Requires at least: 6.4
 * Requires PHP:      8.1
 * Author:            Redakcja izbica24.pl
 * Author URI:        https://izbica24.pl/redakcja
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       izbica24-newsroom
 * Domain Path:       /languages
 *
 * @package Izbica24\Newsroom
 */

declare(strict_types=1);

if (!defined('ABSPATH')) {
    exit;
}

// ---------------------------------------------------------------------------
// Stałe wtyczki
// ---------------------------------------------------------------------------
define('IZ24_NEWSROOM_VERSION', '1.0.0');
define('IZ24_NEWSROOM_FILE', __FILE__);
define('IZ24_NEWSROOM_DIR', plugin_dir_path(__FILE__));
define('IZ24_NEWSROOM_URL', plugin_dir_url(__FILE__));
define('IZ24_NEWSROOM_BASENAME', plugin_basename(__FILE__));
define('IZ24_NEWSROOM_REST_NS', 'iz24/v1');
define('IZ24_NEWSROOM_MIN_PHP', '8.1');
define('IZ24_NEWSROOM_MIN_WP', '6.4');

// ---------------------------------------------------------------------------
// PHP/WP version guard
// ---------------------------------------------------------------------------
if (version_compare(PHP_VERSION, IZ24_NEWSROOM_MIN_PHP, '<')) {
    add_action('admin_notices', static function (): void {
        echo '<div class="notice notice-error"><p><strong>izbica24 Newsroom:</strong> wymaga PHP ' . esc_html(IZ24_NEWSROOM_MIN_PHP) . '+ (masz ' . esc_html(PHP_VERSION) . ').</p></div>';
    });
    return;
}

// ---------------------------------------------------------------------------
// Autoloader PSR-4 (namespace Izbica24\Newsroom → includes/)
// ---------------------------------------------------------------------------
require_once IZ24_NEWSROOM_DIR . 'includes/helpers/class-autoloader.php';
\Izbica24\Newsroom\Helpers\Autoloader::register();

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------
register_activation_hook(__FILE__, ['\Izbica24\Newsroom\Activator', 'activate']);
register_deactivation_hook(__FILE__, ['\Izbica24\Newsroom\Deactivator', 'deactivate']);

add_action('plugins_loaded', static function (): void {
    \Izbica24\Newsroom\Plugin::instance()->boot();
}, 5);

// WP-CLI
if (defined('WP_CLI') && WP_CLI) {
    \WP_CLI::add_command('iz24', \Izbica24\Newsroom\CLI\Commands::class);
}

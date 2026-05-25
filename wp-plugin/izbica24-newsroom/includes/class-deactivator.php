<?php
/**
 * Deactivator — czyści crony.
 *
 * @package Izbica24\Newsroom
 */

declare(strict_types=1);

namespace Izbica24\Newsroom;

if (!defined('ABSPATH')) {
    exit;
}

final class Deactivator
{
    public static function deactivate(): void
    {
        wp_clear_scheduled_hook('iz24_cost_guard_tick');
        wp_clear_scheduled_hook('iz24_monthly_report');
        flush_rewrite_rules();
    }
}

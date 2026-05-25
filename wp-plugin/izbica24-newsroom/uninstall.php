<?php
/**
 * Uninstall handler — czyści dane wtyczki przy usuwaniu.
 *
 * @package Izbica24\Newsroom
 */

declare(strict_types=1);

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

global $wpdb;

// Tabele wtyczki — usuwane tylko jeśli option iz24_remove_data_on_uninstall = true
$remove = get_option('iz24_remove_data_on_uninstall', false);
if (!$remove) {
    return;
}

$tables = [
    'iz24_section_editors',
    'iz24_workflow_rules',
    'iz24_prompt_runs',
    'iz24_cost_runs',
    'iz24_error_log',
    'iz24_monthly_reports',
    'iz24_rate_limit',
    'iz24_idempotency',
    'iz24_tokens',
];

foreach ($tables as $t) {
    $table = $wpdb->prefix . $t;
    $wpdb->query("DROP TABLE IF EXISTS `{$table}`");
}

// Posts: iz24_raw_item, iz24_prompt_template
$post_types = ['iz24_raw_item', 'iz24_prompt_template'];
$ids = $wpdb->get_col(
    $wpdb->prepare(
        "SELECT ID FROM {$wpdb->posts} WHERE post_type IN (%s, %s)",
        ...$post_types
    )
);
foreach ($ids as $id) {
    wp_delete_post((int) $id, true);
}

// Opcje
$opts = $wpdb->get_col("SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE 'iz24_%'");
foreach ($opts as $o) {
    delete_option($o);
}

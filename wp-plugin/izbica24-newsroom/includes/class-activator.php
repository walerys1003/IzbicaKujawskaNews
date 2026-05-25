<?php
/**
 * Activator — tworzy tabele i seedy.
 *
 * @package Izbica24\Newsroom
 */

declare(strict_types=1);

namespace Izbica24\Newsroom;

if (!defined('ABSPATH')) {
    exit;
}

final class Activator
{
    public static function activate(): void
    {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset = $wpdb->get_charset_collate();
        $p = $wpdb->prefix;

        // ============================================================
        // N1: Tokens, Rate Limit, Idempotency
        // ============================================================
        dbDelta("CREATE TABLE {$p}iz24_tokens (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            name VARCHAR(120) NOT NULL,
            token_hash CHAR(64) NOT NULL,
            scopes TEXT NULL,
            last_used_at DATETIME NULL,
            requests_total BIGINT UNSIGNED NOT NULL DEFAULT 0,
            created_by BIGINT UNSIGNED NULL,
            created_at DATETIME NOT NULL,
            revoked_at DATETIME NULL,
            PRIMARY KEY (id),
            UNIQUE KEY token_hash (token_hash),
            KEY name (name)
        ) {$charset};");

        dbDelta("CREATE TABLE {$p}iz24_rate_limit (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            bucket VARCHAR(180) NOT NULL,
            window_start DATETIME NOT NULL,
            counter INT UNSIGNED NOT NULL DEFAULT 0,
            PRIMARY KEY (id),
            UNIQUE KEY bucket_window (bucket, window_start),
            KEY window_start (window_start)
        ) {$charset};");

        dbDelta("CREATE TABLE {$p}iz24_idempotency (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            idem_key CHAR(64) NOT NULL,
            response_code SMALLINT NOT NULL,
            response_body LONGTEXT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY idem_key (idem_key),
            KEY created_at (created_at)
        ) {$charset};");

        // ============================================================
        // N3: PublishPress section editors + workflow rules
        // ============================================================
        dbDelta("CREATE TABLE {$p}iz24_section_editors (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            category_slug VARCHAR(80) NOT NULL,
            user_id BIGINT UNSIGNED NOT NULL,
            role ENUM('owner','editor','reviewer') NOT NULL DEFAULT 'editor',
            sla_hours INT UNSIGNED NOT NULL DEFAULT 24,
            notify_email TINYINT(1) NOT NULL DEFAULT 1,
            notify_telegram TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY cat_user (category_slug, user_id),
            KEY user_id (user_id)
        ) {$charset};");

        dbDelta("CREATE TABLE {$p}iz24_workflow_rules (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            category_slug VARCHAR(80) NOT NULL,
            trigger_status VARCHAR(40) NOT NULL,
            action_type ENUM('assign','notify','autoreject','escalate','publish') NOT NULL,
            action_target VARCHAR(180) NOT NULL,
            conditions LONGTEXT NULL,
            priority INT UNSIGNED NOT NULL DEFAULT 100,
            active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY cat_status (category_slug, trigger_status)
        ) {$charset};");

        // ============================================================
        // N4: Prompt runs (A/B + analytics)
        // ============================================================
        dbDelta("CREATE TABLE {$p}iz24_prompt_runs (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            prompt_slug VARCHAR(120) NOT NULL,
            variant ENUM('A','B','control') NOT NULL DEFAULT 'A',
            version_used INT UNSIGNED NOT NULL DEFAULT 1,
            raw_item_id BIGINT UNSIGNED NULL,
            input_tokens INT UNSIGNED NULL,
            output_tokens INT UNSIGNED NULL,
            cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
            latency_ms INT UNSIGNED NULL,
            model VARCHAR(80) NULL,
            success TINYINT(1) NOT NULL DEFAULT 1,
            feedback_score TINYINT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY prompt_slug (prompt_slug),
            KEY created_at (created_at)
        ) {$charset};");

        // ============================================================
        // N6: Cost Guard + reports + error log
        // ============================================================
        dbDelta("CREATE TABLE {$p}iz24_cost_runs (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            service VARCHAR(40) NOT NULL,
            model VARCHAR(80) NULL,
            input_tokens INT UNSIGNED NULL,
            output_tokens INT UNSIGNED NULL,
            cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
            workflow_id VARCHAR(120) NULL,
            raw_item_id BIGINT UNSIGNED NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY service (service),
            KEY created_at (created_at)
        ) {$charset};");

        dbDelta("CREATE TABLE {$p}iz24_monthly_reports (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            year SMALLINT UNSIGNED NOT NULL,
            month TINYINT UNSIGNED NOT NULL,
            payload LONGTEXT NULL,
            pdf_attachment_id BIGINT UNSIGNED NULL,
            generated_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY year_month (year, month)
        ) {$charset};");

        dbDelta("CREATE TABLE {$p}iz24_error_log (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            level ENUM('debug','info','warn','error') NOT NULL DEFAULT 'info',
            message TEXT NOT NULL,
            context LONGTEXT NULL,
            created_at DATETIME NOT NULL,
            PRIMARY KEY (id),
            KEY level_created (level, created_at)
        ) {$charset};");

        // ============================================================
        // Seedy: opcje + cron + capabilities
        // ============================================================
        $defaults = [
            'iz24_daily_cost_limit_usd'   => 5.00,
            'iz24_monthly_cost_limit_usd' => 100.00,
            'iz24_rate_limit_per_minute'  => 60,
            'iz24_rate_limit_per_hour'    => 1000,
            'iz24_dedup_levenshtein_threshold' => 0.85,
            'iz24_telegram_chat_id'       => '',
            'iz24_telegram_bot_token'     => '',
            'iz24_claude_api_key'         => '',
            'iz24_n8n_base_url'           => 'https://n8n.izbica24.pl',
            'iz24_remove_data_on_uninstall' => false,
            'iz24_db_version'             => IZ24_NEWSROOM_VERSION,
        ];
        foreach ($defaults as $k => $v) {
            if (get_option($k, '__missing__') === '__missing__') {
                add_option($k, $v);
            }
        }

        // Cron schedules
        if (!wp_next_scheduled('iz24_cost_guard_tick')) {
            wp_schedule_event(time() + 60, 'five_minutes', 'iz24_cost_guard_tick');
        }
        if (!wp_next_scheduled('iz24_monthly_report')) {
            wp_schedule_event(strtotime('first day of next month 03:00'), 'monthly_first', 'iz24_monthly_report');
        }

        // Capabilities
        Plugin::register_capabilities();

        // Seed PublishPress statuses (jeśli już zarejestrowane — pomijamy)
        update_option('iz24_pp_seeded', false);
        flush_rewrite_rules();
    }
}

// Custom cron intervals (5 min + monthly)
add_filter('cron_schedules', static function (array $sch): array {
    $sch['five_minutes'] = ['interval' => 5 * MINUTE_IN_SECONDS, 'display' => '5 minut'];
    $sch['monthly_first'] = ['interval' => 30 * DAY_IN_SECONDS, 'display' => 'Co miesiąc (1 dnia)'];
    return $sch;
});

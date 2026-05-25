<?php
/**
 * Rate Limiter — limity per token, per minutę i godzinę (sliding window minutowe).
 *
 * @package Izbica24\Newsroom\Rest
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Rest;

if (!defined('ABSPATH')) {
    exit;
}

final class Rate_Limiter
{
    /**
     * @return array{ok:bool, remaining_minute:int, remaining_hour:int, retry_after:int}
     */
    public static function check(string $bucket): array
    {
        global $wpdb;
        $now = time();
        $minute_window = gmdate('Y-m-d H:i:00', $now);
        $hour_window = gmdate('Y-m-d H:00:00', $now);

        $limit_min = (int) get_option('iz24_rate_limit_per_minute', 60);
        $limit_hour = (int) get_option('iz24_rate_limit_per_hour', 1000);

        $table = $wpdb->prefix . 'iz24_rate_limit';

        // Minutowy
        $row_min = $wpdb->get_row($wpdb->prepare(
            "SELECT counter FROM {$table} WHERE bucket = %s AND window_start = %s LIMIT 1",
            $bucket . ':minute', $minute_window
        ), ARRAY_A);
        $count_min = (int) ($row_min['counter'] ?? 0);

        $row_hour = $wpdb->get_row($wpdb->prepare(
            "SELECT counter FROM {$table} WHERE bucket = %s AND window_start = %s LIMIT 1",
            $bucket . ':hour', $hour_window
        ), ARRAY_A);
        $count_hour = (int) ($row_hour['counter'] ?? 0);

        if ($count_min >= $limit_min) {
            return ['ok' => false, 'remaining_minute' => 0, 'remaining_hour' => max(0, $limit_hour - $count_hour), 'retry_after' => 60 - ($now % 60)];
        }
        if ($count_hour >= $limit_hour) {
            return ['ok' => false, 'remaining_minute' => max(0, $limit_min - $count_min), 'remaining_hour' => 0, 'retry_after' => 3600 - ($now % 3600)];
        }

        // Increment (upsert)
        $wpdb->query($wpdb->prepare(
            "INSERT INTO {$table} (bucket, window_start, counter) VALUES (%s, %s, 1)
             ON DUPLICATE KEY UPDATE counter = counter + 1",
            $bucket . ':minute', $minute_window
        ));
        $wpdb->query($wpdb->prepare(
            "INSERT INTO {$table} (bucket, window_start, counter) VALUES (%s, %s, 1)
             ON DUPLICATE KEY UPDATE counter = counter + 1",
            $bucket . ':hour', $hour_window
        ));

        // Czyszczenie starych (lazy, 1% szansa)
        if (random_int(0, 100) < 1) {
            $wpdb->query($wpdb->prepare(
                "DELETE FROM {$table} WHERE window_start < %s",
                gmdate('Y-m-d H:00:00', $now - 3 * HOUR_IN_SECONDS)
            ));
        }

        return [
            'ok' => true,
            'remaining_minute' => max(0, $limit_min - $count_min - 1),
            'remaining_hour'   => max(0, $limit_hour - $count_hour - 1),
            'retry_after'      => 0,
        ];
    }
}

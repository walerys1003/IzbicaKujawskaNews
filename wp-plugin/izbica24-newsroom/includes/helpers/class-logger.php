<?php
/**
 * Logger — strukturowany log do DB + opcjonalnie error_log().
 *
 * @package Izbica24\Newsroom\Helpers
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Helpers;

if (!defined('ABSPATH')) {
    exit;
}

final class Logger
{
    public const LEVEL_DEBUG = 'debug';
    public const LEVEL_INFO  = 'info';
    public const LEVEL_WARN  = 'warn';
    public const LEVEL_ERROR = 'error';

    public static function log(string $level, string $message, array $context = []): void
    {
        global $wpdb;

        $table = $wpdb->prefix . 'iz24_error_log';
        $wpdb->insert($table, [
            'level'      => $level,
            'message'    => mb_substr($message, 0, 1000),
            'context'    => wp_json_encode($context, JSON_UNESCAPED_UNICODE),
            'created_at' => current_time('mysql', true),
        ], ['%s', '%s', '%s', '%s']);

        if (defined('WP_DEBUG') && WP_DEBUG && in_array($level, [self::LEVEL_WARN, self::LEVEL_ERROR], true)) {
            error_log(sprintf('[iz24:%s] %s | %s', $level, $message, wp_json_encode($context)));
        }
    }

    public static function debug(string $m, array $c = []): void { self::log(self::LEVEL_DEBUG, $m, $c); }
    public static function info(string $m, array $c = []): void  { self::log(self::LEVEL_INFO, $m, $c); }
    public static function warn(string $m, array $c = []): void  { self::log(self::LEVEL_WARN, $m, $c); }
    public static function error(string $m, array $c = []): void { self::log(self::LEVEL_ERROR, $m, $c); }
}

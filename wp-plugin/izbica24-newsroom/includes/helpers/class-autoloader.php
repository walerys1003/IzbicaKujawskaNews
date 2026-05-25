<?php
/**
 * Autoloader PSR-4 dla izbica24 Newsroom.
 *
 * Konwencja:
 *   Izbica24\Newsroom\Foo\Bar_Baz  →  includes/foo/class-bar-baz.php
 *
 * @package Izbica24\Newsroom\Helpers
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Helpers;

if (!defined('ABSPATH')) {
    exit;
}

final class Autoloader
{
    private const PREFIX = 'Izbica24\\Newsroom\\';

    public static function register(): void
    {
        spl_autoload_register([self::class, 'load']);
    }

    public static function load(string $class): void
    {
        if (!str_starts_with($class, self::PREFIX)) {
            return;
        }

        $relative = substr($class, strlen(self::PREFIX));
        $parts = explode('\\', $relative);
        $file_name = 'class-' . strtolower(str_replace('_', '-', array_pop($parts))) . '.php';
        $dir = $parts ? strtolower(implode('/', array_map(static fn(string $p): string => str_replace('_', '-', $p), $parts))) . '/' : '';

        $path = IZ24_NEWSROOM_DIR . 'includes/' . $dir . $file_name;
        if (is_file($path)) {
            require_once $path;
        }
    }
}

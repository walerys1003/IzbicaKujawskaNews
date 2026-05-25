<?php
/**
 * Trait Singleton.
 *
 * @package Izbica24\Newsroom\Traits
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Traits;

if (!defined('ABSPATH')) {
    exit;
}

trait Singleton
{
    private static ?self $instance = null;

    public static function instance(): static
    {
        if (self::$instance === null) {
            self::$instance = new static();
        }
        return self::$instance;
    }

    private function __construct() {}
    private function __clone() {}
    public function __wakeup(): void {
        throw new \RuntimeException('Cannot unserialize a singleton.');
    }
}

<?php
/**
 * Mustache-style prompt renderer + A/B variant selector + version tracking.
 *
 * Placeholders: {{variable_name}}
 *
 * @package Izbica24\Newsroom\Prompts
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Prompts;

if (!defined('ABSPATH')) {
    exit;
}

final class Renderer
{
    /**
     * @return array{system:string,user:string,variant:string,model:string,temperature:float,max_tokens:int,version:int}
     */
    public static function render(int $post_id, array $vars, string $variant = 'auto'): array
    {
        $system = (string) get_post_meta($post_id, 'iz24_prompt_system', true);
        $user_a = (string) get_post_meta($post_id, 'iz24_prompt_user', true);
        $user_b = (string) get_post_meta($post_id, 'iz24_prompt_variant_b', true);
        $ab_split = (float) (get_post_meta($post_id, 'iz24_prompt_ab_split', true) ?: 0.0);

        // Wybór wariantu
        if ($variant === 'auto') {
            $variant = ($user_b && mt_rand(0, 99) / 100 < $ab_split) ? 'B' : 'A';
        }

        $user = $variant === 'B' && $user_b ? $user_b : $user_a;

        // Render Mustache
        $rendered_system = self::interpolate($system, $vars);
        $rendered_user   = self::interpolate($user, $vars);

        return [
            'system'      => $rendered_system,
            'user'        => $rendered_user,
            'variant'     => $variant,
            'model'       => (string) (get_post_meta($post_id, 'iz24_prompt_model', true) ?: 'claude-3-5-sonnet-20241022'),
            'temperature' => (float)  (get_post_meta($post_id, 'iz24_prompt_temperature', true) ?: 0.4),
            'max_tokens'  => (int)    (get_post_meta($post_id, 'iz24_prompt_max_tokens', true) ?: 2000),
            'version'     => (int)    (get_post_meta($post_id, 'iz24_prompt_version', true) ?: 1),
        ];
    }

    public static function interpolate(string $tpl, array $vars): string
    {
        return preg_replace_callback(
            '/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/u',
            static function (array $m) use ($vars): string {
                $key = $m[1];
                if (str_contains($key, '.')) {
                    $parts = explode('.', $key);
                    $val = $vars;
                    foreach ($parts as $p) {
                        if (!is_array($val) || !array_key_exists($p, $val)) {
                            return $m[0];
                        }
                        $val = $val[$p];
                    }
                    return is_scalar($val) ? (string) $val : wp_json_encode($val);
                }
                if (!array_key_exists($key, $vars)) {
                    return $m[0];
                }
                $v = $vars[$key];
                if (is_array($v)) {
                    return implode(', ', array_map('strval', $v));
                }
                return is_scalar($v) ? (string) $v : '';
            },
            $tpl
        ) ?? $tpl;
    }
}

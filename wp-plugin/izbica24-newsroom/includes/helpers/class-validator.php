<?php
/**
 * Validator — walidacja payloadu z n8n.
 *
 * @package Izbica24\Newsroom\Helpers
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Helpers;

if (!defined('ABSPATH')) {
    exit;
}

final class Validator
{
    public const ALLOWED_SOURCES = [
        'perplexity', 'rss', 'manual', 'tip-form',
        'facebook', 'twitter', 'webhook', 'email', 'sms',
    ];

    public const ALLOWED_CATEGORIES = [
        'wiadomosci', 'na-sygnale', 'samorzad', 'kujawianka',
        'kultura', 'historia', 'ludzie', 'zycie-codzienne',
        'przeglad-mediow', 'multimedia', 'ogloszenia',
    ];

    /**
     * @return array{ok:bool, errors:array<string,string>}
     */
    public static function check_incoming(array $data): array
    {
        $errors = [];

        // required
        foreach (['source', 'title', 'body', 'fetched_at'] as $req) {
            if (empty($data[$req])) {
                $errors[$req] = "Pole '{$req}' jest wymagane.";
            }
        }

        if (isset($data['source']) && !in_array($data['source'], self::ALLOWED_SOURCES, true)) {
            $errors['source'] = 'Nieznane źródło: ' . esc_html((string) $data['source']);
        }

        if (isset($data['suggested_category']) && !in_array($data['suggested_category'], self::ALLOWED_CATEGORIES, true)) {
            $errors['suggested_category'] = 'Nieznana kategoria.';
        }

        if (!empty($data['source_url']) && !filter_var($data['source_url'], FILTER_VALIDATE_URL)) {
            $errors['source_url'] = 'Niepoprawny URL.';
        }

        if (!empty($data['title']) && mb_strlen((string) $data['title']) > 500) {
            $errors['title'] = 'Tytuł zbyt długi (>500 znaków).';
        }

        return [
            'ok'     => empty($errors),
            'errors' => $errors,
        ];
    }

    public static function sanitize_text(string $s): string
    {
        return wp_strip_all_tags(trim($s));
    }

    public static function sanitize_body(string $s): string
    {
        return wp_kses_post(trim($s));
    }
}

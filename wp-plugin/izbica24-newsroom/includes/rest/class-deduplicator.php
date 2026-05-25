<?php
/**
 * Deduplicator — sha256 (exact match) + Levenshtein similarity (>0.85).
 * Wyszukuje wśród ostatnich 200 raw_items.
 *
 * @package Izbica24\Newsroom\Rest
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Rest;

use Izbica24\Newsroom\CPT\Raw_Item;

if (!defined('ABSPATH')) {
    exit;
}

final class Deduplicator
{
    /**
     * @return array{status:'unique'|'duplicate'|'similar', match_id?:int, score?:float, hash:string}
     */
    public static function check(string $title, string $body): array
    {
        $norm = self::normalize($title . "\n" . $body);
        $hash = hash('sha256', $norm);

        // 1. Exact sha256
        global $wpdb;
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = 'iz24_dedup_hash' AND meta_value = %s LIMIT 1",
            $hash
        ));
        if ($existing) {
            return ['status' => 'duplicate', 'match_id' => (int) $existing, 'hash' => $hash];
        }

        // 2. Levenshtein nad ostatnimi 200 (po tytule — szybkie, ograniczone do 250 zn)
        $recent_titles = $wpdb->get_results($wpdb->prepare(
            "SELECT ID, post_title FROM {$wpdb->posts}
             WHERE post_type = %s AND post_status != 'trash'
             ORDER BY ID DESC LIMIT 200",
            Raw_Item::POST_TYPE
        ), ARRAY_A);

        $threshold = (float) get_option('iz24_dedup_levenshtein_threshold', 0.85);
        $title_short = mb_substr($title, 0, 250);

        foreach ($recent_titles as $r) {
            $other = mb_substr((string) $r['post_title'], 0, 250);
            $score = self::similarity($title_short, $other);
            if ($score >= $threshold) {
                return [
                    'status'   => 'similar',
                    'match_id' => (int) $r['ID'],
                    'score'    => round($score, 3),
                    'hash'     => $hash,
                ];
            }
        }

        return ['status' => 'unique', 'hash' => $hash];
    }

    private static function normalize(string $s): string
    {
        $s = mb_strtolower($s);
        $s = preg_replace('/\s+/u', ' ', $s) ?? $s;
        $s = preg_replace('/[^\p{L}\p{N}\s]/u', '', $s) ?? $s;
        return trim($s);
    }

    private static function similarity(string $a, string $b): float
    {
        $a = self::normalize($a);
        $b = self::normalize($b);
        if ($a === '' || $b === '') return 0.0;
        if ($a === $b) return 1.0;
        $maxlen = max(mb_strlen($a), mb_strlen($b));
        // levenshtein() = byte-based, OK dla normalized lowercase ASCII-ish
        $dist = levenshtein(mb_substr($a, 0, 250), mb_substr($b, 0, 250));
        return 1.0 - ($dist / max(1, $maxlen));
    }
}

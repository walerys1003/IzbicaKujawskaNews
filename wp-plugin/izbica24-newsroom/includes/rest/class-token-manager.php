<?php
/**
 * Token Manager — bearer tokens dla n8n (i innych usług).
 * Tokeny przechowywane jako sha256 hash. Tylko podgląd przy tworzeniu.
 *
 * @package Izbica24\Newsroom\Rest
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Rest;

if (!defined('ABSPATH')) {
    exit;
}

final class Token_Manager
{
    public static function generate(string $name, array $scopes = ['incoming']): array
    {
        global $wpdb;
        $token_raw = 'iz24_' . bin2hex(random_bytes(24));
        $hash = hash('sha256', $token_raw);

        $wpdb->insert($wpdb->prefix . 'iz24_tokens', [
            'name'       => sanitize_text_field($name),
            'token_hash' => $hash,
            'scopes'     => wp_json_encode(array_values($scopes)),
            'created_by' => get_current_user_id() ?: null,
            'created_at' => current_time('mysql', true),
        ], ['%s', '%s', '%s', '%d', '%s']);

        $id = (int) $wpdb->insert_id;
        return [
            'id'    => $id,
            'name'  => $name,
            'token' => $token_raw,
            'hash'  => $hash,
            'note'  => 'Zachowaj ten token — nie da się go odzyskać.',
        ];
    }

    /**
     * @return null|array{id:int,name:string,scopes:array<string>}
     */
    public static function verify(string $token): ?array
    {
        if (!str_starts_with($token, 'iz24_')) {
            return null;
        }
        global $wpdb;
        $hash = hash('sha256', $token);
        $table = $wpdb->prefix . 'iz24_tokens';
        $row = $wpdb->get_row(
            $wpdb->prepare("SELECT id, name, scopes, revoked_at FROM {$table} WHERE token_hash = %s LIMIT 1", $hash),
            ARRAY_A
        );
        if (!$row || $row['revoked_at']) {
            return null;
        }
        // Aktualizuj last_used (non-blocking)
        $wpdb->query($wpdb->prepare(
            "UPDATE {$table} SET last_used_at = %s, requests_total = requests_total + 1 WHERE id = %d",
            current_time('mysql', true), (int) $row['id']
        ));
        return [
            'id'     => (int) $row['id'],
            'name'   => (string) $row['name'],
            'scopes' => json_decode((string) ($row['scopes'] ?? '[]'), true) ?: [],
        ];
    }

    public static function revoke(int $id): bool
    {
        global $wpdb;
        return false !== $wpdb->update(
            $wpdb->prefix . 'iz24_tokens',
            ['revoked_at' => current_time('mysql', true)],
            ['id' => $id],
            ['%s'], ['%d']
        );
    }

    public static function list(): array
    {
        global $wpdb;
        return (array) $wpdb->get_results(
            "SELECT id, name, scopes, last_used_at, requests_total, created_at, revoked_at
             FROM {$wpdb->prefix}iz24_tokens
             ORDER BY id DESC",
            ARRAY_A
        );
    }
}

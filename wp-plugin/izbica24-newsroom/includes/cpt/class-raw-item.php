<?php
/**
 * CPT: iz24_raw_item — surowy materiał z n8n (Perplexity/RSS/itp.)
 * + taksonomie iz24_source, iz24_status + 24 meta-fields w REST.
 *
 * @package Izbica24\Newsroom\CPT
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\CPT;

if (!defined('ABSPATH')) {
    exit;
}

final class Raw_Item
{
    public const POST_TYPE = 'iz24_raw_item';
    public const TAX_SOURCE = 'iz24_source';
    public const TAX_STATUS = 'iz24_status';

    /** @var array<string,array{type:string,description:string,single?:bool}> */
    public const META_FIELDS = [
        'iz24_source_url'          => ['type' => 'string', 'description' => 'Oryginalny URL źródła'],
        'iz24_source_name'         => ['type' => 'string', 'description' => 'Nazwa źródła (Perplexity, RSS, itp.)'],
        'iz24_workflow_id'         => ['type' => 'string', 'description' => 'ID workflow n8n'],
        'iz24_workflow_execution'  => ['type' => 'string', 'description' => 'Execution ID n8n'],
        'iz24_fetched_at'          => ['type' => 'string', 'description' => 'ISO 8601 timestamp fetcha'],
        'iz24_published_at_source' => ['type' => 'string', 'description' => 'Data publikacji w źródle'],
        'iz24_author_source'       => ['type' => 'string', 'description' => 'Autor wg źródła'],
        'iz24_suggested_category'  => ['type' => 'string', 'description' => 'Kategoria zaproponowana przez AI'],
        'iz24_suggested_tags'      => ['type' => 'array',  'description' => 'Tagi zaproponowane przez AI'],
        'iz24_suggested_geo'       => ['type' => 'string', 'description' => 'Geo (np. solectwo)'],
        'iz24_ai_summary'          => ['type' => 'string', 'description' => 'Streszczenie AI (lead)'],
        'iz24_ai_full_text'        => ['type' => 'string', 'description' => 'Pełna wersja AI'],
        'iz24_ai_model'            => ['type' => 'string', 'description' => 'Model AI użyty'],
        'iz24_ai_prompt_slug'      => ['type' => 'string', 'description' => 'Slug promptu (N4)'],
        'iz24_ai_input_tokens'     => ['type' => 'integer', 'description' => 'Tokeny wejściowe'],
        'iz24_ai_output_tokens'    => ['type' => 'integer', 'description' => 'Tokeny wyjściowe'],
        'iz24_ai_cost_usd'         => ['type' => 'number', 'description' => 'Koszt $'],
        'iz24_dedup_hash'          => ['type' => 'string', 'description' => 'SHA256 z (title+body)'],
        'iz24_dedup_similar_id'    => ['type' => 'integer', 'description' => 'ID podobnego itemu'],
        'iz24_quality_score'       => ['type' => 'number',  'description' => '0-1 jakość'],
        'iz24_pii_detected'        => ['type' => 'boolean', 'description' => 'PII (nazwiska/telefony) wykryte'],
        'iz24_fact_check_status'   => ['type' => 'string',  'description' => 'verified/pending/failed'],
        'iz24_fact_check_sources'  => ['type' => 'array',   'description' => 'Źródła weryfikacji'],
        'iz24_assignee_user_id'    => ['type' => 'integer', 'description' => 'Przypisany redaktor'],
    ];

    public function register(): void
    {
        add_action('init', [$this, 'register_post_type']);
        add_action('init', [$this, 'register_taxonomies']);
        add_action('init', [$this, 'register_meta_fields']);
    }

    public function register_post_type(): void
    {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name'                  => __('Surowce', 'izbica24-newsroom'),
                'singular_name'         => __('Surowiec', 'izbica24-newsroom'),
                'add_new_item'          => __('Dodaj surowiec', 'izbica24-newsroom'),
                'edit_item'             => __('Edytuj surowiec', 'izbica24-newsroom'),
                'search_items'          => __('Szukaj w surowcach', 'izbica24-newsroom'),
                'not_found'             => __('Brak surowców.', 'izbica24-newsroom'),
                'menu_name'             => __('Surowce', 'izbica24-newsroom'),
            ],
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => 'iz24_newsroom',
            'show_in_rest'        => true,
            'rest_base'           => 'iz24_raw_items',
            'rest_namespace'      => IZ24_NEWSROOM_REST_NS,
            'supports'            => ['title', 'editor', 'custom-fields', 'revisions', 'author'],
            'has_archive'         => false,
            'exclude_from_search' => true,
            'capability_type'     => 'post',
            'map_meta_cap'        => true,
        ]);
    }

    public function register_taxonomies(): void
    {
        register_taxonomy(self::TAX_SOURCE, [self::POST_TYPE], [
            'labels' => [
                'name'          => __('Źródła', 'izbica24-newsroom'),
                'singular_name' => __('Źródło', 'izbica24-newsroom'),
            ],
            'hierarchical' => false,
            'public'       => false,
            'show_ui'      => true,
            'show_in_rest' => true,
            'rewrite'      => false,
        ]);

        register_taxonomy(self::TAX_STATUS, [self::POST_TYPE], [
            'labels' => [
                'name'          => __('Statusy', 'izbica24-newsroom'),
                'singular_name' => __('Status', 'izbica24-newsroom'),
            ],
            'hierarchical' => true,
            'public'       => false,
            'show_ui'      => true,
            'show_in_rest' => true,
            'rewrite'      => false,
        ]);

        // Seed statusów przy aktywacji (idempotentne)
        foreach (['new', 'queued', 'in_review', 'rejected', 'promoted', 'duplicate'] as $slug) {
            if (!term_exists($slug, self::TAX_STATUS)) {
                wp_insert_term(ucfirst($slug), self::TAX_STATUS, ['slug' => $slug]);
            }
        }
    }

    public function register_meta_fields(): void
    {
        foreach (self::META_FIELDS as $key => $cfg) {
            register_post_meta(self::POST_TYPE, $key, [
                'type'              => $cfg['type'],
                'description'       => $cfg['description'],
                'single'            => $cfg['single'] ?? true,
                'show_in_rest'      => $cfg['type'] === 'array'
                    ? ['schema' => ['type' => 'array', 'items' => ['type' => 'string']]]
                    : true,
                'auth_callback'     => static fn(): bool => current_user_can('edit_posts'),
                'sanitize_callback' => static function ($v) use ($cfg) {
                    return match ($cfg['type']) {
                        'integer' => (int) $v,
                        'number'  => (float) $v,
                        'boolean' => (bool) $v,
                        'array'   => is_array($v) ? array_map('sanitize_text_field', $v) : [],
                        default   => sanitize_text_field((string) $v),
                    };
                },
            ]);
        }
    }
}

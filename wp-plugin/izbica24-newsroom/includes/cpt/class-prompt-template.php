<?php
/**
 * CPT: iz24_prompt_template — Mustache-style prompts dla AI.
 *
 * @package Izbica24\Newsroom\CPT
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\CPT;

if (!defined('ABSPATH')) {
    exit;
}

final class Prompt_Template
{
    public const POST_TYPE = 'iz24_prompt_template';

    public const META_FIELDS = [
        'iz24_prompt_slug'        => 'string',
        'iz24_prompt_system'      => 'string',
        'iz24_prompt_user'        => 'string',
        'iz24_prompt_variables'   => 'array',
        'iz24_prompt_model'       => 'string',
        'iz24_prompt_temperature' => 'number',
        'iz24_prompt_max_tokens'  => 'integer',
        'iz24_prompt_version'     => 'integer',
        'iz24_prompt_variant_b'   => 'string',
        'iz24_prompt_ab_split'    => 'number',
        'iz24_prompt_active'      => 'boolean',
    ];

    public function register(): void
    {
        add_action('init', [$this, 'register_post_type']);
        add_action('init', [$this, 'register_meta']);
        add_action('init', [$this, 'maybe_seed_prompts'], 20);
    }

    public function register_post_type(): void
    {
        register_post_type(self::POST_TYPE, [
            'labels' => [
                'name'          => __('Prompty AI', 'izbica24-newsroom'),
                'singular_name' => __('Prompt', 'izbica24-newsroom'),
                'add_new_item'  => __('Dodaj prompt', 'izbica24-newsroom'),
            ],
            'public'         => false,
            'show_ui'        => true,
            'show_in_menu'   => 'iz24_newsroom',
            'show_in_rest'   => true,
            'rest_base'      => 'iz24_prompts',
            'rest_namespace' => IZ24_NEWSROOM_REST_NS,
            'supports'       => ['title', 'editor', 'revisions', 'author'],
            'has_archive'    => false,
            'capability_type'=> 'post',
        ]);
    }

    public function register_meta(): void
    {
        foreach (self::META_FIELDS as $key => $type) {
            register_post_meta(self::POST_TYPE, $key, [
                'type'          => $type,
                'single'        => true,
                'show_in_rest'  => $type === 'array'
                    ? ['schema' => ['type' => 'array', 'items' => ['type' => 'string']]]
                    : true,
                'auth_callback' => static fn(): bool => current_user_can('iz24_manage_prompts'),
            ]);
        }
    }

    /**
     * Seed 12 polskich promptów (jednorazowo).
     */
    public function maybe_seed_prompts(): void
    {
        if (get_option('iz24_prompts_seeded', false)) {
            return;
        }

        $seeds = self::seed_data();
        foreach ($seeds as $s) {
            $existing = get_page_by_path($s['slug'], OBJECT, self::POST_TYPE);
            if ($existing) {
                continue;
            }
            $post_id = wp_insert_post([
                'post_type'    => self::POST_TYPE,
                'post_status'  => 'publish',
                'post_title'   => $s['title'],
                'post_name'    => $s['slug'],
                'post_content' => $s['user'],
            ], true);

            if (is_wp_error($post_id) || !$post_id) {
                continue;
            }

            update_post_meta($post_id, 'iz24_prompt_slug', $s['slug']);
            update_post_meta($post_id, 'iz24_prompt_system', $s['system']);
            update_post_meta($post_id, 'iz24_prompt_user', $s['user']);
            update_post_meta($post_id, 'iz24_prompt_variables', $s['vars']);
            update_post_meta($post_id, 'iz24_prompt_model', $s['model'] ?? 'claude-3-5-sonnet-20241022');
            update_post_meta($post_id, 'iz24_prompt_temperature', $s['temp'] ?? 0.4);
            update_post_meta($post_id, 'iz24_prompt_max_tokens', $s['max_tokens'] ?? 2000);
            update_post_meta($post_id, 'iz24_prompt_version', 1);
            update_post_meta($post_id, 'iz24_prompt_active', true);
        }

        update_option('iz24_prompts_seeded', true);
    }

    /**
     * @return list<array{slug:string,title:string,system:string,user:string,vars:array<string>,model?:string,temp?:float,max_tokens?:int}>
     */
    public static function seed_data(): array
    {
        $base_system = "Jesteś redaktorem portalu izbica24.pl — niezależnego portalu Gminy Izbica Kujawska (woj. kujawsko-pomorskie, 5400 mieszkańców). Pisz po polsku, rzetelnie, faktograficznie, w stylu Reutera. Bez kiczu, bez dramatyzowania. Zawsze podawaj źródła. NIGDY nie wymyślaj danych których nie ma w inpucie. Jeśli czegoś brakuje — zaznacz to wprost.";

        return [
            [
                'slug' => 'rewrite-news',
                'title' => 'Przepisanie newsa (z Perplexity/RSS)',
                'system' => $base_system,
                'user' => "Przepisz poniższy materiał na artykuł newsowy do izbica24.pl.\n\nZasady:\n- Lead: 1-2 zdania, kto/co/gdzie/kiedy\n- Treść: 3-5 akapitów\n- Dateline: IZBICA — / SADŁNO — / WIETRZYCHOWICE — itp.\n- Cytaty: zachowaj w cudzysłowach\n- Źródła: na końcu w sekcji „Źródła\"\n\nMateriał:\n{{title}}\n\n{{body}}\n\nŹródło: {{source_url}}",
                'vars' => ['title', 'body', 'source_url'],
            ],
            [
                'slug' => 'evergreen-author',
                'title' => 'Artykuł evergreen (sezonowy/poradnikowy)',
                'system' => $base_system,
                'user' => "Napisz artykuł sezonowy do działu „Dziś w Izbicy\".\n\nTemat: {{topic}}\nSezon/data: {{season}}\nKontekst lokalny (gmina Izbica Kujawska): {{local_context}}\n\nStruktura:\n1. Lead z lokalnym konkretem (np. „Maj na Kujawach...\")\n2. 3-4 akapity z praktycznymi informacjami\n3. Dane historyczne/sezonowe jeśli pasują\n4. Kontakt do specjalisty lokalnego jeśli relevant\n\nDługość: 600-800 słów. Dateline: IZBICA —",
                'vars' => ['topic', 'season', 'local_context'],
                'max_tokens' => 2500,
            ],
            [
                'slug' => 'na-sygnale-conversion',
                'title' => 'Zdarzenie OSP/Policja/Pogotowie → krótki news',
                'system' => $base_system,
                'user' => "Przekonwertuj zgłoszenie służb na krótki news „Na Sygnale\".\n\nZgłoszenie:\nCzas: {{time}}\nTyp: {{type}}\nLokalizacja: {{location}}\nOpis: {{description}}\nSłużba: {{service}}\n\nFormat:\n- Tytuł: konkretny, bez sensacji (max 80 zn.)\n- Lead: 1 zdanie\n- 2-3 zdania szczegółów\n- Stopka: „Akcja zakończona\" lub „W toku\"\n\nNIE ujawniaj nazwisk poszkodowanych. NIE spekuluj o przyczynach.",
                'vars' => ['time', 'type', 'location', 'description', 'service'],
                'max_tokens' => 800,
                'temp' => 0.3,
            ],
            [
                'slug' => 'sport-match-report',
                'title' => 'Relacja meczu Kujawianki',
                'system' => $base_system,
                'user' => "Napisz relację z meczu Kujawianki Izbica Kujawska.\n\nDane:\nDrużyny: {{home}} vs {{away}}\nWynik: {{home_score}}:{{away_score}}\nKolejka: {{round}}\nData: {{date}}\nStadion: {{venue}}\nStrzelcy: {{scorers}}\nKluczowe momenty: {{key_moments}}\n\nFormat:\n- Lead z wynikiem i bohaterem meczu\n- 3-4 akapity\n- Wypowiedź trenera (jeśli {{coach_quote}})\n- Następny mecz na końcu\n\nStyl: dziennikarski, bez nadmiernego entuzjazmu. Dateline: IZBICA —",
                'vars' => ['home', 'away', 'home_score', 'away_score', 'round', 'date', 'venue', 'scorers', 'key_moments', 'coach_quote'],
                'max_tokens' => 1500,
            ],
            [
                'slug' => 'fact-check',
                'title' => 'Fact-check (weryfikacja przed publikacją)',
                'system' => "Jesteś fact-checkerem. Sprawdzasz fakty z artykułu izbica24.pl. Zwracasz JSON z listą stwierdzeń + status (verified/unverifiable/false) + źródła. Bez wymyślania.",
                'user' => "Sprawdź fakty w poniższym artykule. Zwróć JSON.\n\nArtykuł:\n{{article_text}}\n\nKontekst lokalny (jeśli relevant): {{local_context}}\n\nFormat output:\n{\"claims\":[{\"text\":\"...\",\"status\":\"verified|unverifiable|false\",\"source\":\"...\",\"confidence\":0.0-1.0}],\"overall_status\":\"ok|needs_review|reject\",\"notes\":\"...\"}",
                'vars' => ['article_text', 'local_context'],
                'temp' => 0.1,
                'max_tokens' => 2000,
            ],
            [
                'slug' => 'samorzad-summary',
                'title' => 'Streszczenie sesji Rady Miejskiej',
                'system' => $base_system,
                'user' => "Streszcz porządek obrad / protokół sesji Rady Miejskiej Izbicy Kujawskiej.\n\nMateriał:\n{{minutes}}\n\nFormat:\n- Lead: data, główny temat\n- Lista uchwał (każda 1 zdanie + numer)\n- Najważniejsze głosowania (kto za, kto przeciw)\n- Wnioski mieszkańców\n- Następna sesja\n\nDługość: 400-600 słów. Dateline: IZBICA —",
                'vars' => ['minutes'],
                'max_tokens' => 2000,
            ],
            [
                'slug' => 'kultura-event',
                'title' => 'Zapowiedź wydarzenia kulturalnego (MGCK/biblioteka/parafia)',
                'system' => $base_system,
                'user' => "Napisz zapowiedź wydarzenia kulturalnego w gminie Izbica.\n\nDane:\nNazwa: {{event_name}}\nData: {{date}}\nMiejsce: {{venue}}\nOrganizator: {{organizer}}\nProgram: {{program}}\nWstęp: {{ticket_info}}\nKontakt: {{contact}}\n\nFormat: 300-500 słów, lead + szczegóły + zachęta. Dateline: IZBICA —",
                'vars' => ['event_name', 'date', 'venue', 'organizer', 'program', 'ticket_info', 'contact'],
                'max_tokens' => 1200,
            ],
            [
                'slug' => 'historia-todays-anniversary',
                'title' => 'Rocznica historyczna (Tego dnia w Izbicy)',
                'system' => $base_system,
                'user' => "Napisz artykuł o rocznicy historycznej dla rubryki „Tego dnia w Izbicy\".\n\nData: {{date}}\nRok: {{year}}\nWydarzenie: {{event}}\nKontekst historyczny: {{historical_context}}\nŹródła: {{sources}}\n\nFormat:\n- Lead z konkretną datą\n- Co się stało (faktograficznie)\n- Kontekst (co działo się w Polsce/Europie)\n- Wpływ na lokalną społeczność\n- Aktualne miejsca pamięci / upamiętnienie\n\nDługość: 500-700 słów. Ton: poważny, dokumentalny.",
                'vars' => ['date', 'year', 'event', 'historical_context', 'sources'],
                'max_tokens' => 2000,
                'temp' => 0.3,
            ],
            [
                'slug' => 'ludzie-interview-intro',
                'title' => 'Wstęp do wywiadu z mieszkańcem',
                'system' => $base_system,
                'user' => "Napisz wstęp redakcyjny do wywiadu z mieszkańcem Izbicy.\n\nRozmówca: {{name}}, {{age}}, {{role}}\nDlaczego ciekawy: {{angle}}\nKluczowe wypowiedzi: {{key_quotes}}\n\nFormat:\n- Hook: jedno mocne zdanie z osobą\n- 2 akapity wprowadzenia (kto to jest, dlaczego z nim rozmawiamy)\n- Cytat-zajawka\n- „Czytaj rozmowę →\"\n\nDługość: 200-300 słów.",
                'vars' => ['name', 'age', 'role', 'angle', 'key_quotes'],
                'max_tokens' => 1000,
            ],
            [
                'slug' => 'przeglad-mediow-summary',
                'title' => 'Streszczenie artykułu z innego portalu',
                'system' => $base_system,
                'user' => "Streszcz artykuł z innego portalu w 2-3 zdaniach. Jasno wskaż źródło.\n\nŹródło: {{source}}\nTytuł oryginału: {{original_title}}\nLink: {{source_url}}\nFragment: {{excerpt}}\n\nFormat: 2-3 zdania + na końcu „Źródło: {{source}} → {{source_url}}\". NIE kopiuj treści dosłownie. NIE wymyślaj danych.",
                'vars' => ['source', 'original_title', 'source_url', 'excerpt'],
                'max_tokens' => 500,
                'temp' => 0.2,
            ],
            [
                'slug' => 'ogloszenie-nekrolog',
                'title' => 'Nekrolog (z taktem)',
                'system' => "Jesteś redaktorem portalu lokalnego. Piszesz nekrologi z najwyższym szacunkiem dla zmarłego i rodziny. Bez patosu. Bez detali medycznych. Tylko fakty podane przez rodzinę. Nigdy nie spekulujesz o przyczynach.",
                'user' => "Napisz nekrolog wg podanych danych.\n\nDane:\nImię i nazwisko: {{name}}\nWiek: {{age}}\nMiejscowość: {{place}}\nData śmierci: {{death_date}}\nData pogrzebu: {{funeral_date}}\nMiejsce pogrzebu: {{funeral_place}}\nRodzina: {{family_info}}\nOpcjonalna prośba rodziny: {{family_note}}\n\nFormat klasyczny:\n„Z głębokim żalem zawiadamiamy, że dnia... odszedł od nas...\"\n\nTon: powściągliwy, ciepły, szanujący prywatność rodziny.",
                'vars' => ['name', 'age', 'place', 'death_date', 'funeral_date', 'funeral_place', 'family_info', 'family_note'],
                'max_tokens' => 600,
                'temp' => 0.2,
            ],
            [
                'slug' => 'solectwo-news',
                'title' => 'News z konkretnego sołectwa',
                'system' => $base_system,
                'user' => "Napisz news dotyczący sołectwa {{solectwo}} (gmina Izbica Kujawska).\n\nTemat: {{topic}}\nSzczegóły: {{details}}\nSołtys: {{soltys}}\nKontakt do sołtysa: {{soltys_contact}}\n\nFormat: dateline z nazwą sołectwa wielkimi literami (np. SADŁNO —), 300-500 słów, lead + 2-3 akapity + cytat sołtysa jeśli {{soltys_quote}}.",
                'vars' => ['solectwo', 'topic', 'details', 'soltys', 'soltys_contact', 'soltys_quote'],
                'max_tokens' => 1500,
            ],
        ];
    }
}

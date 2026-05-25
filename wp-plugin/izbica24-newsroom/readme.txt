=== izbica24 Newsroom ===
Contributors: izbica24
Tags: newsroom, ai, claude, publishpress, n8n, journalism
Requires at least: 6.4
Tested up to: 6.7
Requires PHP: 8.1
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

AI-driven newsroom dla portalu izbica24.pl — CPT iz24_raw_item, REST /incoming, PublishPress integration, Prompt Templates, Cost Guard, Telegram bot, n8n bridge.

== Description ==

Wtyczka zarządza pełnym przepływem treści AI w portalu izbica24.pl:

* **N1 — Newsroom core:** CPT `iz24_raw_item` (24 meta), REST `POST /iz24/v1/incoming`, Token Manager, Rate Limiter, Deduplicator (sha256 + Levenshtein), WP-CLI.
* **N2 — Admin Queue:** WP_List_Table z 6 bulk actions, Side Panel JSON viewer, Dashboard Widget.
* **N3 — PublishPress bridge:** 5 custom statuses (pitch/assigned/in_progress/review_needed/ready_to_publish), `wp_iz24_section_editors`, workflow rules.
* **N4 — Prompt Templates:** CPT `iz24_prompt_template` z Mustache placeholders, A/B testing, 12 preloaded polskich promptów (rewrite-news, evergreen, na-sygnale, sport, fact-check, …).
* **N5 — n8n bridge:** integracja z n8n self-hosted na osobnym VPS (Hetzner CX22 + docker-compose + Caddy).
* **N6 — Monitoring:** Cost Guard ($5/day, $100/month), Telegram bot z `/status` `/cost` `/queue`, miesięczne raporty PDF (mPDF).

== Installation ==

1. Wgraj folder `izbica24-newsroom` do `/wp-content/plugins/`.
2. Aktywuj wtyczkę w panelu WP.
3. Przejdź do **Newsroom → Ustawienia** i wprowadź klucze API (Claude, n8n, Telegram).
4. Uruchom `wp iz24 token:generate "n8n-bridge"` żeby uzyskać token dla n8n.
5. Skonfiguruj n8n credentials (HTTP Header Auth: `Authorization: Bearer <token>`).

== Changelog ==

= 1.0.0 =
* Initial release: N1+N2+N3+N4+N6 modules complete, n8n stack in `/n8n/`.

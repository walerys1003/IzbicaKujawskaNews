<?php
/**
 * WP-CLI commands.
 *
 * Rejestracja:
 *   wp iz24 token:generate <name> [--scopes=incoming,prompts] [--expires=2027-01-01]
 *   wp iz24 token:list
 *   wp iz24 token:revoke <id>
 *   wp iz24 cost:report [--month=YYYY-MM]
 *   wp iz24 cost:reset-kill-switch
 *   wp iz24 dedup:check --title="..." [--content="..."]
 *   wp iz24 prompt:test <slug> [--vars-json='{"foo":"bar"}']
 *   wp iz24 monthly-report:generate [--month=YYYY-MM]
 *   wp iz24 seed:prompts
 *
 * @package Izbica24\Newsroom\CLI
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\CLI;

use Izbica24\Newsroom\Rest\Token_Manager;
use Izbica24\Newsroom\Rest\Deduplicator;
use Izbica24\Newsroom\Monitoring\Cost_Guard;
use Izbica24\Newsroom\Monitoring\Monthly_Report;
use Izbica24\Newsroom\Prompts\Renderer;
use Izbica24\Newsroom\CPT\Prompt_Template;

if (!defined('ABSPATH') || !defined('WP_CLI') || !WP_CLI) {
    return;
}

class Commands
{
    /**
     * Generates a new API token for /incoming or /prompts.
     *
     * ## OPTIONS
     *
     * <name>
     * : Human-readable token name.
     *
     * [--scopes=<scopes>]
     * : Comma-separated scopes (default: incoming).
     *
     * [--expires=<date>]
     * : Expiry date YYYY-MM-DD (default: never).
     *
     * ## EXAMPLES
     *
     *     wp iz24 token:generate "n8n production" --scopes=incoming
     *
     * @when after_wp_load
     */
    public function token_generate(array $args, array $assoc): void
    {
        list($name) = $args;
        $scopes = isset($assoc['scopes']) ? array_map('trim', explode(',', (string) $assoc['scopes'])) : ['incoming'];
        $expires = $assoc['expires'] ?? null;

        $manager = new Token_Manager();
        $result = $manager->generate($name, $scopes, $expires);

        \WP_CLI::success('Token created. STORE IT NOW — it cannot be retrieved later:');
        \WP_CLI::line('  ID:        ' . $result['id']);
        \WP_CLI::line('  Name:      ' . $result['name']);
        \WP_CLI::line('  Scopes:    ' . implode(',', $result['scopes']));
        \WP_CLI::line('  Token:     ' . $result['token']);
        \WP_CLI::line('');
        \WP_CLI::line('Authorization header:');
        \WP_CLI::line('  Authorization: Bearer ' . $result['token']);
    }

    /**
     * Lists all tokens.
     *
     * @when after_wp_load
     */
    public function token_list(array $args, array $assoc): void
    {
        $manager = new Token_Manager();
        $rows = $manager->list();
        if (empty($rows)) {
            \WP_CLI::warning('No tokens.');
            return;
        }
        \WP_CLI\Utils\format_items('table', $rows, ['id', 'name', 'scopes', 'last_used_at', 'expires_at', 'is_active']);
    }

    /**
     * Revokes a token by ID.
     *
     * ## OPTIONS
     * <id>
     * : Token ID.
     *
     * @when after_wp_load
     */
    public function token_revoke(array $args, array $assoc): void
    {
        list($id) = $args;
        $manager = new Token_Manager();
        $ok = $manager->revoke((int) $id);
        if ($ok) {
            \WP_CLI::success("Token #{$id} revoked.");
        } else {
            \WP_CLI::error("Token #{$id} not found or already revoked.");
        }
    }

    /**
     * Cost report for a month.
     *
     * [--month=<YYYY-MM>]
     * : Defaults to current month.
     *
     * @when after_wp_load
     */
    public function cost_report(array $args, array $assoc): void
    {
        $month = $assoc['month'] ?? wp_date('Y-m');
        $guard = new Cost_Guard();

        $monthly = $guard->sum_monthly($month);
        $daily_today = $guard->sum_daily();
        $daily_limit = (float) get_option('iz24_daily_cost_limit', 5.00);
        $monthly_limit = (float) get_option('iz24_monthly_cost_limit', 100.00);

        \WP_CLI::line("== Cost report ({$month}) ==");
        \WP_CLI::line(sprintf('  Monthly total:   $%.4f / $%.2f (%.1f%%)', $monthly, $monthly_limit, $monthly_limit > 0 ? ($monthly/$monthly_limit)*100 : 0));
        \WP_CLI::line(sprintf('  Today (live):    $%.4f / $%.2f (%.1f%%)', $daily_today, $daily_limit, $daily_limit > 0 ? ($daily_today/$daily_limit)*100 : 0));
        \WP_CLI::line(sprintf('  Kill switch:     %s', get_option('iz24_kill_switch_active') ? 'ON' : 'off'));

        $top = $guard->get_top_prompts(10);
        if (!empty($top)) {
            \WP_CLI::line('');
            \WP_CLI::line('== Top 10 prompts (last 30 days) ==');
            \WP_CLI\Utils\format_items('table', $top, ['prompt_slug', 'runs', 'total_cost', 'avg_tokens']);
        }
    }

    /**
     * Resets the kill switch flag.
     *
     * @when after_wp_load
     */
    public function cost_reset_kill_switch(array $args, array $assoc): void
    {
        update_option('iz24_kill_switch_active', 0);
        \WP_CLI::success('Kill switch reset to OFF.');
    }

    /**
     * Checks duplicate for a candidate title/content.
     *
     * --title=<title>
     * : Candidate title.
     *
     * [--content=<content>]
     * : Candidate content.
     *
     * @when after_wp_load
     */
    public function dedup_check(array $args, array $assoc): void
    {
        $title = (string) ($assoc['title'] ?? '');
        $content = (string) ($assoc['content'] ?? '');
        if ($title === '') {
            \WP_CLI::error('--title is required.');
        }

        $dedup = new Deduplicator();
        $check = $dedup->check($title, $content);

        \WP_CLI::line('Hash: ' . $check['hash']);
        if ($check['is_duplicate']) {
            \WP_CLI::warning(sprintf(
                'DUPLICATE (reason: %s, similarity: %.2f, matched #%d)',
                $check['reason'],
                $check['similarity'] ?? 0,
                $check['matched_post_id'] ?? 0
            ));
        } else {
            \WP_CLI::success('UNIQUE — no duplicates found.');
        }
    }

    /**
     * Tests a prompt template (renders it with provided variables).
     *
     * ## OPTIONS
     * <slug>
     * : Prompt slug.
     *
     * [--vars-json=<json>]
     * : JSON object with variables.
     *
     * @when after_wp_load
     */
    public function prompt_test(array $args, array $assoc): void
    {
        list($slug) = $args;
        $vars = [];
        if (!empty($assoc['vars-json'])) {
            $vars = json_decode($assoc['vars-json'], true);
            if (!is_array($vars)) {
                \WP_CLI::error('Invalid --vars-json.');
            }
        }

        $renderer = new Renderer();
        $rendered = $renderer->render_by_slug($slug, $vars);

        if (!$rendered) {
            \WP_CLI::error("Prompt '{$slug}' not found.");
        }

        \WP_CLI::line('== System ==');
        \WP_CLI::line($rendered['system']);
        \WP_CLI::line('');
        \WP_CLI::line('== User ==');
        \WP_CLI::line($rendered['user']);
        \WP_CLI::line('');
        \WP_CLI::line('Model: ' . $rendered['model']);
        \WP_CLI::line('Variant: ' . ($rendered['variant'] ?? 'A'));
    }

    /**
     * Generates monthly PDF report.
     *
     * [--month=<YYYY-MM>]
     * : Defaults to last month.
     *
     * @when after_wp_load
     */
    public function monthly_report_generate(array $args, array $assoc): void
    {
        $month = $assoc['month'] ?? wp_date('Y-m', strtotime('first day of last month'));
        $report = new Monthly_Report();
        $path = $report->generate($month);
        if ($path) {
            \WP_CLI::success("Report generated: {$path}");
        } else {
            \WP_CLI::error('Failed to generate report.');
        }
    }

    /**
     * Re-seeds the 12 default prompt templates (skips existing).
     *
     * @when after_wp_load
     */
    public function seed_prompts(array $args, array $assoc): void
    {
        $cpt = new Prompt_Template();
        if (method_exists($cpt, 'maybe_seed_prompts')) {
            $cpt->maybe_seed_prompts(true);
            \WP_CLI::success('Prompts seeded.');
        } else {
            \WP_CLI::error('Seeder method unavailable.');
        }
    }
}

\WP_CLI::add_command('iz24 token:generate', [Commands::class, 'token_generate']);
\WP_CLI::add_command('iz24 token:list', [Commands::class, 'token_list']);
\WP_CLI::add_command('iz24 token:revoke', [Commands::class, 'token_revoke']);
\WP_CLI::add_command('iz24 cost:report', [Commands::class, 'cost_report']);
\WP_CLI::add_command('iz24 cost:reset-kill-switch', [Commands::class, 'cost_reset_kill_switch']);
\WP_CLI::add_command('iz24 dedup:check', [Commands::class, 'dedup_check']);
\WP_CLI::add_command('iz24 prompt:test', [Commands::class, 'prompt_test']);
\WP_CLI::add_command('iz24 monthly-report:generate', [Commands::class, 'monthly_report_generate']);
\WP_CLI::add_command('iz24 seed:prompts', [Commands::class, 'seed_prompts']);

<?php
/**
 * N6 — Cost Guard.
 *
 * Cron co 5 minut (`iz24_cost_guard_tick`):
 *   1. Sumuje koszty z `wp_iz24_cost_runs` za bieżący dzień i miesiąc.
 *   2. Porównuje z limitami: option `iz24_daily_cost_limit` (default 5.00 USD)
 *      oraz `iz24_monthly_cost_limit` (default 100.00 USD).
 *   3. Przy progach 80% i 100% emituje akcję `iz24_telegram_notify`.
 *   4. Przy 100% ustawia option `iz24_kill_switch_active = 1` → REST /incoming
 *      odrzuca payload aż do reset cyklu.
 *
 * @package Izbica24\Newsroom\Monitoring
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Monitoring;

use Izbica24\Newsroom\Helpers\Logger;

if (!defined('ABSPATH')) {
    exit;
}

class Cost_Guard
{
    public const HOOK_TICK    = 'iz24_cost_guard_tick';
    public const HOOK_MONTHLY = 'iz24_monthly_report';

    public function register(): void
    {
        add_action(self::HOOK_TICK, [$this, 'tick']);
        add_action(self::HOOK_MONTHLY, [Monthly_Report::class, 'generate_for_previous_month']);

        // REST endpoint do dashboardu (Chart.js fetch)
        add_action('rest_api_init', [$this, 'register_rest_routes']);
    }

    /**
     * Główna pętla — wywoływana co 5 minut przez WP-Cron.
     */
    public function tick(): void
    {
        $daily   = $this->sum_daily();
        $monthly = $this->sum_monthly();

        $daily_limit   = (float) get_option('iz24_daily_cost_limit', 5.00);
        $monthly_limit = (float) get_option('iz24_monthly_cost_limit', 100.00);

        $daily_pct   = $daily_limit > 0 ? ($daily / $daily_limit) * 100 : 0;
        $monthly_pct = $monthly_limit > 0 ? ($monthly / $monthly_limit) * 100 : 0;

        // === Daily checks
        $this->maybe_alert(
            'daily',
            $daily,
            $daily_limit,
            $daily_pct,
            (string) wp_date('Y-m-d')
        );

        // === Monthly checks
        $this->maybe_alert(
            'monthly',
            $monthly,
            $monthly_limit,
            $monthly_pct,
            (string) wp_date('Y-m')
        );

        // === Kill switch
        $kill = ($daily_pct >= 100 || $monthly_pct >= 100);
        update_option('iz24_kill_switch_active', $kill ? 1 : 0);
        update_option('iz24_cost_guard_last_tick', current_time('mysql'));

        Logger::info('Cost_Guard tick', [
            'daily'         => $daily,
            'monthly'       => $monthly,
            'daily_pct'     => round($daily_pct, 2),
            'monthly_pct'   => round($monthly_pct, 2),
            'kill_switch'   => $kill,
        ]);
    }

    private function maybe_alert(string $scope, float $value, float $limit, float $pct, string $bucket_id): void
    {
        $opt_key = sprintf('iz24_cost_alert_%s_%s', $scope, $bucket_id);
        $already = get_option($opt_key, ['80' => 0, '100' => 0]);

        // 80% próg
        if ($pct >= 80 && empty($already['80'])) {
            $already['80'] = time();
            update_option($opt_key, $already, false);
            do_action('iz24_telegram_notify', sprintf(
                "⚠️ <b>Cost Guard 80%%</b> (%s)\nWydano: <b>$%.2f</b> / $%.2f\nBucket: <code>%s</code>",
                strtoupper($scope),
                $value,
                $limit,
                $bucket_id
            ));
        }

        // 100% próg
        if ($pct >= 100 && empty($already['100'])) {
            $already['100'] = time();
            update_option($opt_key, $already, false);
            do_action('iz24_telegram_notify', sprintf(
                "🛑 <b>Cost Guard 100%% — KILL SWITCH</b> (%s)\nWydano: <b>$%.2f</b> / $%.2f\nBucket: <code>%s</code>\nREST /incoming będzie odrzucać payload.",
                strtoupper($scope),
                $value,
                $limit,
                $bucket_id
            ));
        }
    }

    public function sum_daily(?string $date = null): float
    {
        global $wpdb;
        $date = $date ?: wp_date('Y-m-d');
        $table = $wpdb->prefix . 'iz24_cost_runs';
        $sum = $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(cost_usd), 0) FROM `{$table}` WHERE DATE(created_at) = %s",
            $date
        ));
        return (float) $sum;
    }

    public function sum_monthly(?string $year_month = null): float
    {
        global $wpdb;
        $year_month = $year_month ?: wp_date('Y-m');
        $table = $wpdb->prefix . 'iz24_cost_runs';
        $sum = $wpdb->get_var($wpdb->prepare(
            "SELECT COALESCE(SUM(cost_usd), 0) FROM `{$table}` WHERE DATE_FORMAT(created_at, '%%Y-%%m') = %s",
            $year_month
        ));
        return (float) $sum;
    }

    /**
     * Zwraca dane dla Chart.js — ostatnie 30 dni, breakdown per service.
     */
    public function get_chart_data(int $days = 30): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'iz24_cost_runs';

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT DATE(created_at) AS day, service, COALESCE(SUM(cost_usd), 0) AS total
             FROM `{$table}`
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL %d DAY)
             GROUP BY day, service
             ORDER BY day ASC",
            $days
        ), ARRAY_A);

        $by_day = [];
        $services = [];
        foreach ((array) $rows as $r) {
            $d = $r['day'];
            $s = $r['service'];
            $by_day[$d][$s] = (float) $r['total'];
            $services[$s] = true;
        }

        $labels = [];
        for ($i = $days - 1; $i >= 0; $i--) {
            $labels[] = wp_date('Y-m-d', strtotime("-{$i} days"));
        }

        $datasets = [];
        $palette = ['#fa6400', '#1a1a1a', '#666666', '#aaaaaa', '#3b82f6', '#10b981'];
        $idx = 0;
        foreach (array_keys($services) as $svc) {
            $data = [];
            foreach ($labels as $day) {
                $data[] = (float) ($by_day[$day][$svc] ?? 0);
            }
            $datasets[] = [
                'label'           => $svc,
                'data'            => $data,
                'backgroundColor' => $palette[$idx % count($palette)],
                'borderColor'     => $palette[$idx % count($palette)],
                'borderWidth'     => 1,
            ];
            $idx++;
        }

        return [
            'labels'   => $labels,
            'datasets' => $datasets,
        ];
    }

    /**
     * Top prompts po koszcie (ostatnie 30 dni).
     */
    public function get_top_prompts(int $limit = 10): array
    {
        global $wpdb;
        $table = $wpdb->prefix . 'iz24_cost_runs';

        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT prompt_slug, COUNT(*) AS runs, COALESCE(SUM(cost_usd), 0) AS total_cost, COALESCE(AVG(tokens_in + tokens_out), 0) AS avg_tokens
             FROM `{$table}`
             WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) AND prompt_slug IS NOT NULL
             GROUP BY prompt_slug
             ORDER BY total_cost DESC
             LIMIT %d",
            $limit
        ), ARRAY_A);

        return is_array($rows) ? $rows : [];
    }

    public function register_rest_routes(): void
    {
        register_rest_route('iz24/v1', '/cost/summary', [
            'methods'             => 'GET',
            'permission_callback' => function () {
                return current_user_can('iz24_manage_costs') || current_user_can('manage_options');
            },
            'callback'            => function () {
                return rest_ensure_response([
                    'daily'         => $this->sum_daily(),
                    'monthly'       => $this->sum_monthly(),
                    'daily_limit'   => (float) get_option('iz24_daily_cost_limit', 5.00),
                    'monthly_limit' => (float) get_option('iz24_monthly_cost_limit', 100.00),
                    'kill_switch'   => (bool) get_option('iz24_kill_switch_active', 0),
                    'last_tick'     => get_option('iz24_cost_guard_last_tick', null),
                ]);
            },
        ]);

        register_rest_route('iz24/v1', '/cost/chart', [
            'methods'             => 'GET',
            'permission_callback' => function () {
                return current_user_can('iz24_manage_costs') || current_user_can('manage_options');
            },
            'callback'            => function (\WP_REST_Request $req) {
                $days = max(7, min(90, (int) $req->get_param('days') ?: 30));
                return rest_ensure_response($this->get_chart_data($days));
            },
        ]);
    }
}

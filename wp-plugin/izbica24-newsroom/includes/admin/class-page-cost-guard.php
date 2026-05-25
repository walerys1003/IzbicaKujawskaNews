<?php
declare(strict_types=1);
namespace Izbica24\Newsroom\Admin;

if (!defined('ABSPATH')) exit;

final class Page_Cost_Guard
{
    public static function render(): void
    {
        if (!current_user_can('iz24_manage_costs')) wp_die('forbidden');

        global $wpdb;
        $today = $wpdb->get_var("SELECT COALESCE(SUM(cost_usd),0) FROM {$wpdb->prefix}iz24_cost_runs WHERE DATE(created_at)=CURDATE()");
        $month = $wpdb->get_var("SELECT COALESCE(SUM(cost_usd),0) FROM {$wpdb->prefix}iz24_cost_runs WHERE YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())");
        $limit_d = (float) get_option('iz24_daily_cost_limit_usd', 5);
        $limit_m = (float) get_option('iz24_monthly_cost_limit_usd', 100);

        // Top services (last 30d)
        $services = $wpdb->get_results(
            "SELECT service, COUNT(*) AS runs, SUM(cost_usd) AS total, SUM(input_tokens) AS in_tok, SUM(output_tokens) AS out_tok
             FROM {$wpdb->prefix}iz24_cost_runs
             WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY service ORDER BY total DESC",
            ARRAY_A
        );

        // Top prompts last 30d
        $prompts = $wpdb->get_results(
            "SELECT prompt_slug, COUNT(*) AS runs, SUM(cost_usd) AS total, AVG(latency_ms) AS avg_lat, AVG(feedback_score) AS avg_fb
             FROM {$wpdb->prefix}iz24_prompt_runs
             WHERE created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY prompt_slug ORDER BY total DESC LIMIT 20",
            ARRAY_A
        );

        // Last 14 days chart
        $daily = $wpdb->get_results(
            "SELECT DATE(created_at) AS d, SUM(cost_usd) AS total
             FROM {$wpdb->prefix}iz24_cost_runs
             WHERE created_at > DATE_SUB(NOW(), INTERVAL 14 DAY)
             GROUP BY DATE(created_at) ORDER BY d ASC",
            ARRAY_A
        );

        echo '<div class="wrap"><h1>Cost Guard · izbica24 Newsroom</h1>';
        $pct_d = $limit_d > 0 ? round(min(100, ((float) $today / $limit_d) * 100)) : 0;
        $pct_m = $limit_m > 0 ? round(min(100, ((float) $month / $limit_m) * 100)) : 0;
        printf(
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:24px;">
              <div style="background:#fff;padding:20px;border-left:4px solid %s;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#646970;">Dzisiaj</div>
                <div style="font-size:36px;font-weight:700;line-height:1;">$%.2f <span style="font-size:14px;color:#646970;">/ $%.2f</span></div>
                <div style="height:6px;background:#dcdcde;margin-top:10px;"><div style="height:100%%;width:%d%%;background:%s;"></div></div>
              </div>
              <div style="background:#fff;padding:20px;border-left:4px solid %s;">
                <div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#646970;">Ten miesiąc</div>
                <div style="font-size:36px;font-weight:700;line-height:1;">$%.2f <span style="font-size:14px;color:#646970;">/ $%.2f</span></div>
                <div style="height:6px;background:#dcdcde;margin-top:10px;"><div style="height:100%%;width:%d%%;background:%s;"></div></div>
              </div>
             </div>',
            $pct_d > 100 ? '#d63638' : ($pct_d > 80 ? '#dba617' : '#1e7a4f'),
            (float) $today, $limit_d, $pct_d, $pct_d > 100 ? '#d63638' : ($pct_d > 80 ? '#dba617' : '#fa6400'),
            $pct_m > 100 ? '#d63638' : ($pct_m > 80 ? '#dba617' : '#1e7a4f'),
            (float) $month, $limit_m, $pct_m, $pct_m > 100 ? '#d63638' : ($pct_m > 80 ? '#dba617' : '#fa6400')
        );

        // chart przez Chart.js CDN
        $labels = array_map(static fn($r) => $r['d'], $daily);
        $values = array_map(static fn($r) => round((float) $r['total'], 4), $daily);
        echo '<h2>Koszt dzienny — ostatnie 14 dni</h2>';
        echo '<div style="background:#fff;padding:18px;"><canvas id="iz24-cost-chart" height="80"></canvas></div>';
        echo '<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>';
        echo '<script>document.addEventListener("DOMContentLoaded",function(){
              new Chart(document.getElementById("iz24-cost-chart"),{
                type:"bar",
                data:{labels:' . wp_json_encode($labels) . ',
                  datasets:[{label:"USD",data:' . wp_json_encode($values) . ',
                  backgroundColor:"#fa6400",borderWidth:0}]},
                options:{scales:{y:{beginAtZero:true}},plugins:{legend:{display:false}}}
              });});</script>';

        echo '<h2 style="margin-top:30px;">Top usługi (30 dni)</h2>';
        echo '<table class="widefat striped"><thead><tr><th>Service</th><th>Runs</th><th>Cost $</th><th>Input tok</th><th>Output tok</th><th>$/1k tok</th></tr></thead><tbody>';
        foreach ($services as $s) {
            $totalTok = (int) $s['in_tok'] + (int) $s['out_tok'];
            $perK = $totalTok > 0 ? '$' . number_format(((float) $s['total'] / $totalTok) * 1000, 4) : '—';
            printf('<tr><td><strong>%s</strong></td><td>%d</td><td>$%.4f</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                esc_html((string) $s['service']), (int) $s['runs'], (float) $s['total'],
                number_format((int) $s['in_tok']), number_format((int) $s['out_tok']), $perK);
        }
        echo '</tbody></table>';

        echo '<h2 style="margin-top:30px;">Top prompty (30 dni)</h2>';
        echo '<table class="widefat striped"><thead><tr><th>Slug</th><th>Runs</th><th>Cost $</th><th>Avg latency ms</th><th>Avg feedback</th></tr></thead><tbody>';
        foreach ($prompts as $p) {
            printf('<tr><td><code>%s</code></td><td>%d</td><td>$%.4f</td><td>%d</td><td>%s</td></tr>',
                esc_html((string) $p['prompt_slug']), (int) $p['runs'], (float) $p['total'],
                (int) $p['avg_lat'], $p['avg_fb'] !== null ? number_format((float) $p['avg_fb'], 2) : '—');
        }
        echo '</tbody></table>';

        echo '</div>';
    }
}

<?php
/**
 * N6 — Monthly Report Generator.
 *
 * Cron `iz24_monthly_report` (1. dnia miesiąca o 02:00) generuje raport PDF za poprzedni miesiąc
 * z metrykami: koszty per service+prompt, ilość items per status, top 10 prompts po liczbie wywołań,
 * average tokens, success rate. Plik trafia do `uploads/iz24-reports/YYYY-MM.pdf` i record w
 * tabeli `wp_iz24_monthly_reports`.
 *
 * Używa mPDF jeśli dostępny (composer require mpdf/mpdf), inaczej fallback na HTML.
 *
 * @package Izbica24\Newsroom\Monitoring
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Monitoring;

use Izbica24\Newsroom\Helpers\Logger;

if (!defined('ABSPATH')) {
    exit;
}

class Monthly_Report
{
    /**
     * Wywoływane przez cron `iz24_monthly_report`.
     */
    public static function generate_for_previous_month(): void
    {
        $year_month = wp_date('Y-m', strtotime('first day of last month'));
        (new self())->generate($year_month);
    }

    /**
     * @return string|false Ścieżka do wygenerowanego pliku lub false.
     */
    public function generate(string $year_month)
    {
        $data = $this->collect_metrics($year_month);
        $html = $this->render_html($year_month, $data);

        $upload_dir = wp_upload_dir();
        $report_dir = trailingslashit($upload_dir['basedir']) . 'iz24-reports';
        if (!file_exists($report_dir)) {
            wp_mkdir_p($report_dir);
        }

        $file_name = "report-{$year_month}.pdf";
        $file_path = trailingslashit($report_dir) . $file_name;
        $html_path = trailingslashit($report_dir) . "report-{$year_month}.html";

        // Zawsze zapisz HTML (fallback i debug)
        file_put_contents($html_path, $html);

        $pdf_generated = false;

        // Spróbuj mPDF
        $vendor_autoload = IZ24_NEWSROOM_PATH . 'vendor/autoload.php';
        if (file_exists($vendor_autoload)) {
            require_once $vendor_autoload;
            if (class_exists('\\Mpdf\\Mpdf')) {
                try {
                    $mpdf = new \Mpdf\Mpdf([
                        'mode'         => 'utf-8',
                        'format'       => 'A4',
                        'default_font' => 'dejavusans',
                    ]);
                    $mpdf->WriteHTML($html);
                    $mpdf->Output($file_path, \Mpdf\Output\Destination::FILE);
                    $pdf_generated = true;
                } catch (\Throwable $e) {
                    Logger::error('mPDF generation failed', ['err' => $e->getMessage()]);
                }
            }
        }

        $final_path = $pdf_generated ? $file_path : $html_path;
        $url = str_replace(
            trailingslashit($upload_dir['basedir']),
            trailingslashit($upload_dir['baseurl']),
            $final_path
        );

        // Insert record
        global $wpdb;
        $wpdb->insert(
            $wpdb->prefix . 'iz24_monthly_reports',
            [
                'year_month'   => $year_month,
                'file_path'    => $final_path,
                'file_url'     => $url,
                'total_cost'   => $data['total_cost'],
                'total_items'  => $data['total_items'],
                'metrics_json' => wp_json_encode($data),
                'generated_at' => current_time('mysql'),
            ],
            ['%s', '%s', '%s', '%f', '%d', '%s', '%s']
        );

        do_action('iz24_telegram_notify', sprintf(
            "📊 <b>Miesięczny raport gotowy</b> — %s\nKoszt: $%.2f | Items: %d\n<a href=\"%s\">Pobierz</a>",
            $year_month,
            (float) $data['total_cost'],
            (int) $data['total_items'],
            esc_url($url)
        ));

        Logger::info('Monthly report generated', [
            'year_month' => $year_month,
            'path'       => $final_path,
            'pdf'        => $pdf_generated,
        ]);

        return $final_path;
    }

    private function collect_metrics(string $year_month): array
    {
        global $wpdb;

        $cost_table = $wpdb->prefix . 'iz24_cost_runs';

        // Total cost + tokens
        $totals = $wpdb->get_row($wpdb->prepare(
            "SELECT COUNT(*) AS runs, COALESCE(SUM(cost_usd),0) AS total_cost,
                    COALESCE(SUM(tokens_in),0) AS tokens_in,
                    COALESCE(SUM(tokens_out),0) AS tokens_out,
                    COALESCE(AVG(latency_ms),0) AS avg_latency
             FROM `{$cost_table}`
             WHERE DATE_FORMAT(created_at, '%%Y-%%m') = %s",
            $year_month
        ), ARRAY_A);

        // Per service
        $per_service = $wpdb->get_results($wpdb->prepare(
            "SELECT service, COUNT(*) AS runs, COALESCE(SUM(cost_usd),0) AS cost
             FROM `{$cost_table}` WHERE DATE_FORMAT(created_at, '%%Y-%%m') = %s
             GROUP BY service ORDER BY cost DESC",
            $year_month
        ), ARRAY_A);

        // Top prompts
        $top_prompts = $wpdb->get_results($wpdb->prepare(
            "SELECT prompt_slug, COUNT(*) AS runs, COALESCE(SUM(cost_usd),0) AS cost,
                    COALESCE(AVG(latency_ms),0) AS avg_latency
             FROM `{$cost_table}` WHERE DATE_FORMAT(created_at, '%%Y-%%m') = %s AND prompt_slug IS NOT NULL
             GROUP BY prompt_slug ORDER BY cost DESC LIMIT 15",
            $year_month
        ), ARRAY_A);

        // Items per status
        $items_per_status = $wpdb->get_results($wpdb->prepare(
            "SELECT post_status, COUNT(*) AS cnt FROM `{$wpdb->posts}`
             WHERE post_type = 'iz24_raw_item' AND DATE_FORMAT(post_date, '%%Y-%%m') = %s
             GROUP BY post_status",
            $year_month
        ), ARRAY_A);

        $total_items = 0;
        foreach ($items_per_status as $r) {
            $total_items += (int) $r['cnt'];
        }

        return [
            'year_month'       => $year_month,
            'total_cost'       => (float) ($totals['total_cost'] ?? 0),
            'total_runs'       => (int) ($totals['runs'] ?? 0),
            'tokens_in'        => (int) ($totals['tokens_in'] ?? 0),
            'tokens_out'       => (int) ($totals['tokens_out'] ?? 0),
            'avg_latency'      => round((float) ($totals['avg_latency'] ?? 0), 1),
            'total_items'      => $total_items,
            'per_service'      => $per_service ?: [],
            'top_prompts'      => $top_prompts ?: [],
            'items_per_status' => $items_per_status ?: [],
        ];
    }

    private function render_html(string $year_month, array $d): string
    {
        ob_start();
        ?>
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>izbica24 — Raport <?= esc_html($year_month) ?></title>
<style>
  body { font-family: dejavusans, sans-serif; color: #1a1a1a; font-size: 11px; line-height: 1.5; }
  h1 { font-size: 20px; border-bottom: 2px solid #fa6400; padding-bottom: 6px; margin-bottom: 14px; }
  h2 { font-size: 14px; margin-top: 22px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 10px; }
  th { background: #f4f4f4; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .kpi { display: inline-block; padding: 10px 14px; margin: 4px 8px 4px 0; border: 1px solid #ddd; }
  .kpi .label { font-size: 9px; text-transform: uppercase; color: #666; }
  .kpi .value { font-size: 16px; font-weight: 700; }
  .footer { margin-top: 30px; font-size: 9px; color: #888; border-top: 1px solid #ddd; padding-top: 6px; }
</style>
</head>
<body>
<h1>izbica24 — Raport miesięczny: <?= esc_html($year_month) ?></h1>

<div>
  <div class="kpi"><div class="label">Total cost</div><div class="value">$<?= number_format($d['total_cost'], 2) ?></div></div>
  <div class="kpi"><div class="label">AI runs</div><div class="value"><?= (int) $d['total_runs'] ?></div></div>
  <div class="kpi"><div class="label">Tokens in</div><div class="value"><?= number_format($d['tokens_in']) ?></div></div>
  <div class="kpi"><div class="label">Tokens out</div><div class="value"><?= number_format($d['tokens_out']) ?></div></div>
  <div class="kpi"><div class="label">Avg latency</div><div class="value"><?= $d['avg_latency'] ?> ms</div></div>
  <div class="kpi"><div class="label">Items total</div><div class="value"><?= (int) $d['total_items'] ?></div></div>
</div>

<h2>Koszty per service</h2>
<table>
  <thead><tr><th>Service</th><th>Runs</th><th>Cost (USD)</th></tr></thead>
  <tbody>
    <?php foreach ($d['per_service'] as $r): ?>
      <tr>
        <td><?= esc_html($r['service']) ?></td>
        <td class="num"><?= (int) $r['runs'] ?></td>
        <td class="num">$<?= number_format((float) $r['cost'], 4) ?></td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>

<h2>Top 15 prompts po koszcie</h2>
<table>
  <thead><tr><th>Prompt</th><th>Runs</th><th>Cost (USD)</th><th>Avg latency (ms)</th></tr></thead>
  <tbody>
    <?php foreach ($d['top_prompts'] as $r): ?>
      <tr>
        <td><code><?= esc_html($r['prompt_slug']) ?></code></td>
        <td class="num"><?= (int) $r['runs'] ?></td>
        <td class="num">$<?= number_format((float) $r['cost'], 4) ?></td>
        <td class="num"><?= number_format((float) $r['avg_latency'], 1) ?></td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>

<h2>Items per status</h2>
<table>
  <thead><tr><th>Status</th><th>Liczba</th></tr></thead>
  <tbody>
    <?php foreach ($d['items_per_status'] as $r): ?>
      <tr>
        <td><?= esc_html($r['post_status']) ?></td>
        <td class="num"><?= (int) $r['cnt'] ?></td>
      </tr>
    <?php endforeach; ?>
  </tbody>
</table>

<div class="footer">
  Wygenerowano: <?= esc_html(current_time('mysql')) ?> · izbica24 Newsroom v<?= esc_html(defined('IZ24_NEWSROOM_VERSION') ? IZ24_NEWSROOM_VERSION : '1.0') ?>
</div>
</body>
</html>
        <?php
        return (string) ob_get_clean();
    }
}

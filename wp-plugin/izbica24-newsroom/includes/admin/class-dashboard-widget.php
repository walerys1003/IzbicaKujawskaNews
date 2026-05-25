<?php
/**
 * Dashboard Widget — szybkie statystyki kolejki, kosztów, ostatnich akcji.
 *
 * @package Izbica24\Newsroom\Admin
 */

declare(strict_types=1);

namespace Izbica24\Newsroom\Admin;

use Izbica24\Newsroom\CPT\Raw_Item;

if (!defined('ABSPATH')) {
    exit;
}

final class Dashboard_Widget
{
    public function register(): void
    {
        if (!current_user_can('iz24_view_queue')) {
            return;
        }
        wp_add_dashboard_widget(
            'iz24_newsroom_widget',
            __('Newsroom izbica24 — przegląd', 'izbica24-newsroom'),
            [$this, 'render']
        );
    }

    public function render(): void
    {
        global $wpdb;

        $count_new = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts} p
             INNER JOIN {$wpdb->term_relationships} tr ON p.ID = tr.object_id
             INNER JOIN {$wpdb->term_taxonomy} tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
             INNER JOIN {$wpdb->terms} t ON tt.term_id = t.term_id
             WHERE p.post_type = %s AND tt.taxonomy = %s AND t.slug = %s",
            Raw_Item::POST_TYPE, Raw_Item::TAX_STATUS, 'new'
        ));

        $count_today = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->posts}
             WHERE post_type = %s AND DATE(post_date_gmt) = CURDATE()",
            Raw_Item::POST_TYPE
        ));

        $cost_today = (float) $wpdb->get_var(
            "SELECT COALESCE(SUM(cost_usd),0) FROM {$wpdb->prefix}iz24_cost_runs
             WHERE DATE(created_at) = CURDATE()"
        );

        $cost_month = (float) $wpdb->get_var(
            "SELECT COALESCE(SUM(cost_usd),0) FROM {$wpdb->prefix}iz24_cost_runs
             WHERE YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())"
        );

        $limit_day = (float) get_option('iz24_daily_cost_limit_usd', 5.0);
        $limit_mo  = (float) get_option('iz24_monthly_cost_limit_usd', 100.0);
        $pct_day = $limit_day > 0 ? round(min(100, ($cost_today / $limit_day) * 100)) : 0;
        $pct_mo  = $limit_mo  > 0 ? round(min(100, ($cost_month / $limit_mo)  * 100)) : 0;

        ?>
        <style>
        .iz24-dash-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; margin-bottom:14px; }
        .iz24-dash-stat { background:#f0f0f1; padding:10px 12px; border-left:3px solid #fa6400; }
        .iz24-dash-stat .num { font-size:24px; font-weight:700; color:#1a1a1a; line-height:1; }
        .iz24-dash-stat .lbl { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#646970; margin-top:4px; }
        .iz24-bar { height:6px; background:#dcdcde; border-radius:0; overflow:hidden; margin-top:6px; }
        .iz24-bar i { display:block; height:100%; background:#fa6400; }
        .iz24-bar.warn i { background:#dba617; }
        .iz24-bar.danger i { background:#d63638; }
        </style>
        <div class="iz24-dash-grid">
            <div class="iz24-dash-stat"><div class="num"><?php echo (int) $count_new; ?></div><div class="lbl">Nowych w kolejce</div></div>
            <div class="iz24-dash-stat"><div class="num"><?php echo (int) $count_today; ?></div><div class="lbl">Dziś przyjęto</div></div>
        </div>
        <p><strong>Koszt dziś:</strong> $<?php echo number_format($cost_today, 2); ?> / $<?php echo number_format($limit_day, 2); ?> (<?php echo $pct_day; ?>%)</p>
        <div class="iz24-bar <?php echo $pct_day > 80 ? ($pct_day > 100 ? 'danger' : 'warn') : ''; ?>"><i style="width:<?php echo $pct_day; ?>%"></i></div>
        <p style="margin-top:10px;"><strong>Koszt miesięczny:</strong> $<?php echo number_format($cost_month, 2); ?> / $<?php echo number_format($limit_mo, 2); ?> (<?php echo $pct_mo; ?>%)</p>
        <div class="iz24-bar <?php echo $pct_mo > 80 ? ($pct_mo > 100 ? 'danger' : 'warn') : ''; ?>"><i style="width:<?php echo $pct_mo; ?>%"></i></div>

        <p style="margin-top:12px;">
            <a href="<?php echo esc_url(admin_url('admin.php?page=iz24_newsroom')); ?>" class="button button-primary">→ Otwórz kolejkę</a>
            <a href="<?php echo esc_url(admin_url('admin.php?page=iz24_cost_guard')); ?>" class="button">→ Cost Guard</a>
        </p>
        <?php
    }
}

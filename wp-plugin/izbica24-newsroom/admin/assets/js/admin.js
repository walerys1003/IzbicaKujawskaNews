/**
 * izbica24 Newsroom — Admin JS.
 *
 * Funkcjonalność:
 *   - Side panel viewer dla raw items (klik na link "View JSON")
 *   - Confirm dialogs dla destructive actions
 *   - Copy token button
 *   - Real-time cost refresh (fetch /wp-json/iz24/v1/cost/summary co 30s)
 */
(function () {
  'use strict';

  // === Side panel
  function initSidePanel() {
    var panel = document.getElementById('iz24-side-panel');
    if (!panel) {
      // Create lazily
      panel = document.createElement('div');
      panel.id = 'iz24-side-panel';
      panel.className = 'iz24-side-panel';
      panel.innerHTML = '<button type="button" class="close-btn" aria-label="Close">&times;</button>' +
                        '<h2 style="margin-top:0">Raw item details</h2>' +
                        '<div id="iz24-side-panel-body">Loading…</div>';
      document.body.appendChild(panel);
      panel.querySelector('.close-btn').addEventListener('click', closeSidePanel);
    }

    document.querySelectorAll('.iz24-view-json').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var postId = link.getAttribute('data-post-id');
        if (!postId) return;
        openSidePanel(postId);
      });
    });

    // ESC closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeSidePanel();
    });
  }

  function openSidePanel(postId) {
    var panel = document.getElementById('iz24-side-panel');
    var body  = document.getElementById('iz24-side-panel-body');
    if (!panel || !body) return;
    panel.classList.add('open');
    body.innerHTML = '<em>Loading…</em>';

    var nonce = (window.iz24Admin && window.iz24Admin.nonce) || '';
    fetch('/wp-json/wp/v2/iz24_raw_item/' + encodeURIComponent(postId) + '?context=edit', {
      credentials: 'same-origin',
      headers: { 'X-WP-Nonce': nonce }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        body.innerHTML = '<pre>' + escapeHtml(JSON.stringify(data, null, 2)) + '</pre>';
      })
      .catch(function (err) {
        body.innerHTML = '<div class="iz24-notice danger">Error: ' + escapeHtml(err.message) + '</div>';
      });
  }

  function closeSidePanel() {
    var panel = document.getElementById('iz24-side-panel');
    if (panel) panel.classList.remove('open');
  }

  // === Confirm dialogs
  function initConfirms() {
    document.querySelectorAll('.iz24-confirm').forEach(function (el) {
      el.addEventListener('click', function (e) {
        var msg = el.getAttribute('data-confirm') || 'Are you sure?';
        if (!window.confirm(msg)) {
          e.preventDefault();
          return false;
        }
      });
    });
  }

  // === Copy token button
  function initCopyButtons() {
    document.querySelectorAll('.iz24-copy-token').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        var target = document.querySelector(btn.getAttribute('data-target'));
        if (!target) return;
        var text = target.innerText || target.textContent || '';
        navigator.clipboard.writeText(text).then(function () {
          var orig = btn.innerText;
          btn.innerText = 'Copied!';
          setTimeout(function () { btn.innerText = orig; }, 1500);
        });
      });
    });
  }

  // === Real-time cost refresh
  function initCostRefresh() {
    var box = document.getElementById('iz24-cost-summary');
    if (!box) return;

    var nonce = (window.iz24Admin && window.iz24Admin.nonce) || '';
    function refresh() {
      fetch('/wp-json/iz24/v1/cost/summary', {
        credentials: 'same-origin',
        headers: { 'X-WP-Nonce': nonce }
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var dailyEl = box.querySelector('[data-kpi="daily"]');
          var monthlyEl = box.querySelector('[data-kpi="monthly"]');
          if (dailyEl) dailyEl.innerText = '$' + Number(d.daily || 0).toFixed(2);
          if (monthlyEl) monthlyEl.innerText = '$' + Number(d.monthly || 0).toFixed(2);

          var killEl = box.querySelector('[data-kpi="kill"]');
          if (killEl) {
            killEl.className = 'iz24-kill-switch' + (d.kill_switch ? ' active' : '');
            killEl.innerText = d.kill_switch ? 'KILL SWITCH ON' : 'OK';
          }

          // Progress bars
          var dailyBar = box.querySelector('.iz24-progress.daily .bar');
          if (dailyBar && d.daily_limit > 0) {
            var pct = Math.min(100, (d.daily / d.daily_limit) * 100);
            dailyBar.style.width = pct.toFixed(1) + '%';
          }
          var monthlyBar = box.querySelector('.iz24-progress.monthly .bar');
          if (monthlyBar && d.monthly_limit > 0) {
            var mpct = Math.min(100, (d.monthly / d.monthly_limit) * 100);
            monthlyBar.style.width = mpct.toFixed(1) + '%';
          }
        })
        .catch(function () { /* silent */ });
    }
    refresh();
    setInterval(refresh, 30000);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  document.addEventListener('DOMContentLoaded', function () {
    initSidePanel();
    initConfirms();
    initCopyButtons();
    initCostRefresh();
  });
})();

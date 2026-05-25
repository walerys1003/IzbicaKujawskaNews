// _debug-layout.js — runtime measurement (auto + ?debug=1 overlay)
(function () {
  function measure(sel) {
    var el = document.querySelector(sel);
    if (!el) return { sel: sel, missing: true };
    var r = el.getBoundingClientRect();
    return {
      sel: sel,
      left: Math.round(r.left),
      right: Math.round(window.innerWidth - r.right),
      width: Math.round(r.width),
      full: r.left === 0 && Math.round(window.innerWidth - r.right) === 0,
    };
  }

  function run() {
    var vw = window.innerWidth;
    var docW = document.documentElement.scrollWidth;
    var hScroll = docW > vw + 1;

    var targets = [
      '#super-header','#main-nav','#breaking-bar','#hero','#na-sygnale','footer',
      '#page-main','.main-grid','#content-col','.skrot-dnia','.newsletter-inline',
      'body','html'
    ];
    var data = targets.map(measure);
    var mods = {
      kpi:        !!document.querySelector('.kpi-strip'),
      awarie:     !!document.querySelector('.awarie-list'),
      drogi:      !!document.querySelector('.drogi-item'),
      dyzury:     !!document.querySelector('.dyzury-grid'),
      ceny:       !!document.querySelector('.ceny-table'),
      pomagamy:   !!document.querySelector('.pomagamy-card'),
      kronika:    !!document.querySelector('.kronika-row'),
      kalendarz:  !!document.querySelector('.kalendarz-week'),
      top:        !!document.querySelector('.top-item'),
      mowia:      !!document.querySelector('.mowia-quote'),
      newsletter: !!document.querySelector('.newsletter-inline'),
    };

    var body = data.find(function(d){return d.sel==='body'});
    var verdict = body && body.left === 0 && body.right === 0 ? 'OK_ZERO_MARGINS' : 'FAIL_L=' + (body?body.left:'?') + 'px_R=' + (body?body.right:'?') + 'px';

    var summary = {
      verdict: verdict, vw: vw, docW: docW, hScroll: hScroll,
      modules_count: Object.values(mods).filter(Boolean).length,
      modules: mods,
      elements: data,
    };
    console.log('[V2-VALIDATE]', JSON.stringify(summary));

    // Overlay z ?debug=1
    if (location.search.includes('debug=1')) {
      var ov = document.createElement('div');
      ov.style.cssText = 'position:fixed;top:10px;right:10px;z-index:99999;background:#1a1a1a;color:#fff;font:11px/1.4 monospace;padding:12px;max-width:380px;border:2px solid #fa6400';
      var html = '<strong style="color:#fa6400">' + verdict + '</strong> · vw=' + vw + 'px<br>';
      data.forEach(function(d) {
        if (d.missing) html += '<span style="color:#888">'+d.sel+': missing</span><br>';
        else html += d.sel + ': L=' + d.left + ' R=' + d.right + ' W=' + d.width + (d.full ? ' <span style="color:#0c7">[FULL]</span>' : '') + '<br>';
      });
      ov.innerHTML = html;
      document.body.appendChild(ov);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){setTimeout(run,200);});
  } else {
    setTimeout(run, 200);
  }
})();

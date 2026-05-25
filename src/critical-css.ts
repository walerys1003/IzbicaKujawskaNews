export const criticalCss = `
:root {
  color-scheme: light;
  --bg: #f6f2e9;
  --navy: #0a2540;
  --burgundy: #8b1d2a;
  --ink: #111827;
  --muted: #6b7280;
  --line: rgba(10, 37, 64, 0.12);
  --card: #ffffff;
  --shadow: 0 18px 40px rgba(10, 37, 64, 0.08);
}
* { box-sizing: border-box; }
html { background: var(--bg); }
body {
  margin: 0;
  min-width: 320px;
  color: var(--ink);
  background: linear-gradient(180deg, #fbf8f3 0%, #f6f2e9 100%);
  font: 400 16px/1.6 Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; text-decoration: none; }
img { display: block; max-width: 100%; height: auto; }
#super-header {
  background: var(--navy);
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,.08);
}
.sh-inner,
.nav-inner,
.footer-sub-inner,
.container,
.cont,
.main-wrap {
  width: min(100%, 1280px);
  margin: 0 auto;
}
.sh-inner {
  display: flex;
  gap: 16px;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
  font-size: 12px;
}
#main-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255,255,255,.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.nav-inner {
  display: flex;
  gap: 24px;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
}
#logo { display: inline-flex; flex-direction: column; gap: 2px; }
.logo-row { display: flex; align-items: baseline; gap: 2px; }
.logo-main, .logo-num, .logo-sub {
  font-family: 'Playfair Display', Georgia, serif;
  line-height: 1;
}
.logo-main { font-size: 34px; font-weight: 800; color: var(--navy); }
.logo-num { font-size: 34px; font-weight: 900; color: var(--burgundy); }
.logo-sub { font-size: 18px; color: var(--navy); }
.logo-tagline { color: var(--muted); font-size: 11px; letter-spacing: .08em; text-transform: uppercase; }
.main-menu ul { display: flex; flex-wrap: wrap; gap: 14px; list-style: none; margin: 0; padding: 0; }
.main-menu a { font-weight: 600; color: var(--navy); }
.nav-right { display: flex; align-items: center; gap: 10px; }
.nav-btn, .nav-cta, .hamburger {
  border: 1px solid var(--line);
  background: #fff;
  border-radius: 999px;
}
.nav-btn, .hamburger { width: 40px; height: 40px; }
.nav-cta { padding: 10px 14px; font-weight: 700; color: var(--burgundy); }
.demo-pages-strip {
  background: rgba(10, 37, 64, 0.04);
  border-bottom: 1px solid var(--line);
}
.demo-inner { display: flex; gap: 12px; align-items: center; padding: 10px 20px; flex-wrap: wrap; }
.demo-pill {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: #fff;
  border: 1px solid var(--line);
}
.demo-pill.active { color: var(--burgundy); border-color: rgba(139, 29, 42, 0.35); }
.info { color: var(--muted); font-size: 12px; }
main#page-main { padding-inline: 20px; }
.v3-shell, .home-v3, .main-grid { width: 100%; }
.v3-hero, .v3-hero-section, .hero {
  margin: 24px auto;
  border-radius: 28px;
  overflow: hidden;
  background: var(--card);
  box-shadow: var(--shadow);
}
.v3-hero-main, .hero-main {
  display: grid;
  gap: 24px;
  grid-template-columns: minmax(0, 1.15fr) minmax(320px, .85fr);
  align-items: stretch;
}
.v3-hero-main img, .hero-main img { width: 100%; object-fit: cover; }
.v3-hero-main-content, .hero-main-copy { padding: 28px; }
.v3-hero-card-title, .hero-title {
  margin: 0 0 12px;
  color: var(--ink);
  font: 800 clamp(2rem, 4vw, 4.25rem)/1.05 'Playfair Display', Georgia, serif;
}
.v3-hero-card-title:hover { color: var(--burgundy); }
.section-zebra { background: rgba(255,255,255,.55); }
footer { margin-top: 48px; }
@media (max-width: 960px) {
  .main-menu { display: none; }
  .v3-hero-main, .hero-main { grid-template-columns: 1fr; }
}
`;

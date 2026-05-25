-- =============================================================================
-- izbica24 Newsroom — seed źródeł danych
-- =============================================================================

INSERT INTO sources (slug, name, type, config, poll_every_s) VALUES
  ('rss_gazeta_pomorska', 'Gazeta Pomorska — Włocławek', 'rss',
   '{"url":"https://pomorska.pl/wloclawek/rss.xml","category_hint":"wiadomosci"}', 900),

  ('rss_dziennik_kujawski', 'Dziennik Kujawski', 'rss',
   '{"url":"https://www.dk.com.pl/rss/index.html","category_hint":"wiadomosci"}', 900),

  ('rss_radio_pik', 'Polskie Radio PiK', 'rss',
   '{"url":"https://www.radiopik.pl/rss/aktualnosci.rss","category_hint":"wiadomosci"}', 900),

  ('fb_gmina_izbica', 'Facebook — Gmina Izbica Kujawska', 'facebook',
   '{"page_id":"GminaIzbicaKujawska","category_hint":"samorzad"}', 1800),

  ('fb_osp_izbica', 'Facebook — OSP Izbica Kujawska', 'facebook',
   '{"page_id":"OSPIzbicaKujawska","category_hint":"na_sygnale"}', 1800),

  ('scrape_powiat_wloclawski', 'Powiat Włocławski — komunikaty', 'scrape_html',
   '{"url":"https://www.powiat.wloclawski.pl/aktualnosci","selector":".news-item","category_hint":"samorzad"}', 3600),

  ('scrape_kpp_wloclawek', 'KPP Włocławek — komunikaty', 'scrape_html',
   '{"url":"https://wloclawek.policja.gov.pl/","selector":"article","category_hint":"na_sygnale"}', 3600),

  ('form_user_submission', 'Formularz mieszkańca', 'form',
   '{"endpoint":"/wp-json/iz24-form/v1/submit","captcha":true}', 0),

  ('manual_editor', 'Wpis ręczny redaktora', 'manual',
   '{}', 0)
ON CONFLICT (slug) DO NOTHING;

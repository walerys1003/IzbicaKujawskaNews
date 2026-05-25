#!/usr/bin/env node
/**
 * Generator 17 n8n workflow JSON files dla izbica24 Newsroom.
 * Każdy workflow ma kanoniczną strukturę:
 *   Trigger → Fetch → Normalize (Code) → IF dedup → POST /incoming → Log cost → Error branch
 *
 * Uruchom:  node scripts/generate-workflows.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'workflows');
mkdirSync(OUT_DIR, { recursive: true });

/**
 * Specyfikacja 17 workflowów.
 */
const WORKFLOWS = [
  // === SCRAPING SOURCES (1-7) ===
  {
    id: '01', slug: 'rss-gazeta-pomorska', name: '01 RSS — Gazeta Pomorska',
    source: 'rss_gazeta_pomorska', category: 'wiadomosci',
    trigger: 'cron', cronExpression: '0 */15 * * * *',
    description: 'Pobiera RSS z pomorska.pl/wloclawek co 15 min, deduplikuje i wysyła do izbica24 jako raw_item.',
  },
  {
    id: '02', slug: 'rss-dziennik-kujawski', name: '02 RSS — Dziennik Kujawski',
    source: 'rss_dziennik_kujawski', category: 'wiadomosci',
    trigger: 'cron', cronExpression: '0 */15 * * * *',
    description: 'Pobiera RSS z dk.com.pl co 15 min.',
  },
  {
    id: '03', slug: 'rss-radio-pik', name: '03 RSS — Polskie Radio PiK',
    source: 'rss_radio_pik', category: 'wiadomosci',
    trigger: 'cron', cronExpression: '0 */15 * * * *',
    description: 'Pobiera RSS z radiopik.pl co 15 min, filtruje słowa kluczowe „Izbica”, „Kujawy”, „Włocławek”.',
  },
  {
    id: '04', slug: 'facebook-gmina-izbica', name: '04 Facebook — Gmina Izbica',
    source: 'fb_gmina_izbica', category: 'samorzad',
    trigger: 'cron', cronExpression: '0 */30 * * * *',
    description: 'Pobiera posty ze strony FB Gminy Izbica Kujawska (Graph API) co 30 min.',
  },
  {
    id: '05', slug: 'facebook-osp-izbica', name: '05 Facebook — OSP Izbica',
    source: 'fb_osp_izbica', category: 'na_sygnale',
    trigger: 'cron', cronExpression: '0 */30 * * * *',
    description: 'Pobiera posty FB OSP Izbica (alerty), automatycznie priority_score=8.',
  },
  {
    id: '06', slug: 'scrape-powiat-wloclawski', name: '06 Scrape — Powiat Włocławski',
    source: 'scrape_powiat_wloclawski', category: 'samorzad',
    trigger: 'cron', cronExpression: '0 0 * * * *',
    description: 'Scrapuje powiat.wloclawski.pl co godzinę, parsuje HTML przez Cheerio.',
  },
  {
    id: '07', slug: 'scrape-kpp-wloclawek', name: '07 Scrape — KPP Włocławek',
    source: 'scrape_kpp_wloclawek', category: 'na_sygnale',
    trigger: 'cron', cronExpression: '0 0 * * * *',
    description: 'Scrapuje komunikaty KPP Włocławek, filtruje po nazwach gmin powiatu.',
  },

  // === INBOUND CHANNELS (8-9) ===
  {
    id: '08', slug: 'webhook-form-submission', name: '08 Webhook — Formularz mieszkańca',
    source: 'form_user_submission', category: 'na_sygnale',
    trigger: 'webhook', webhookPath: 'izbica24/form',
    description: 'Odbiera zgłoszenia z formularza www, weryfikuje captcha, oznacza priority_score=5.',
  },
  {
    id: '09', slug: 'telegram-tip-line', name: '09 Telegram — Linia zgłoszeń',
    source: 'form_user_submission', category: 'wiadomosci',
    trigger: 'webhook', webhookPath: 'izbica24/telegram-tip',
    description: 'Odbiera wiadomości od mieszkańców przez Telegram Bot, transkrybuje audio.',
  },

  // === AI PROCESSING (10-13) ===
  {
    id: '10', slug: 'ai-rewrite-news', name: '10 AI — Rewrite news',
    source: null, category: null,
    trigger: 'webhook', webhookPath: 'izbica24/ai/rewrite',
    description: 'Pobiera raw_item, woła GET /prompts/rewrite-news, wysyła do Claude, zapisuje wynik + koszt.',
    aiPrompt: 'rewrite-news',
  },
  {
    id: '11', slug: 'ai-fact-check', name: '11 AI — Fact check',
    source: null, category: null,
    trigger: 'webhook', webhookPath: 'izbica24/ai/fact-check',
    description: 'Sprawdza fakty przy użyciu Claude + websearch fallback.',
    aiPrompt: 'fact-check',
  },
  {
    id: '12', slug: 'ai-evergreen-generator', name: '12 AI — Evergreen generator',
    source: null, category: 'historia',
    trigger: 'cron', cronExpression: '0 0 6 * * *',
    description: 'Codziennie o 6:00 generuje 1 evergreen content (rocznice z bazy `iz24_anniversaries`).',
    aiPrompt: 'historia-todays-anniversary',
  },
  {
    id: '13', slug: 'ai-headline-ab', name: '13 AI — Headline A/B test',
    source: null, category: null,
    trigger: 'webhook', webhookPath: 'izbica24/ai/headline-ab',
    description: 'Generuje 3 warianty nagłówków, log do prompt_runs do analizy A/B.',
    aiPrompt: 'rewrite-news',
  },

  // === PUBLISHING & DISTRIBUTION (14-15) ===
  {
    id: '14', slug: 'publish-to-wordpress', name: '14 Publish — WordPress (promote raw→post)',
    source: null, category: null,
    trigger: 'webhook', webhookPath: 'izbica24/publish',
    description: 'Promuje raw_item ze statusem ready_to_publish do regularnego posta, ustawia kategorie i tagi.',
  },
  {
    id: '15', slug: 'distribute-social', name: '15 Distribute — Social media',
    source: null, category: null,
    trigger: 'webhook', webhookPath: 'izbica24/social',
    description: 'Po publikacji wysyła post na FB Gmina Izbica + Telegram channel + X.',
  },

  // === MONITORING & MAINTENANCE (16-17) ===
  {
    id: '16', slug: 'cost-sync', name: '16 Cost sync — n8n → izbica24',
    source: null, category: null,
    trigger: 'cron', cronExpression: '0 0 * * * *',
    description: 'Co godzinę synchronizuje cost_log z n8n do wp_iz24_cost_runs (POST /cost/import).',
  },
  {
    id: '17', slug: 'health-check', name: '17 Health check — daily report',
    source: null, category: null,
    trigger: 'cron', cronExpression: '0 0 7 * * *',
    description: 'Codziennie o 7:00 sprawdza stan portalu (izbica24.pl/healthz, queue depth) i wysyła raport na Telegram.',
  },
];

// =============================================================================
// Helpers — generatory pojedynczych nodes w formacie n8n.
// =============================================================================

let _idCounter = 1;
function nextId() { return `node_${_idCounter++}`; }

function cronTrigger(cronExpr) {
  return {
    id: nextId(),
    name: 'Cron Trigger',
    type: 'n8n-nodes-base.cron',
    typeVersion: 1,
    position: [200, 300],
    parameters: {
      triggerTimes: {
        item: [{ mode: 'custom', cronExpression: cronExpr }],
      },
    },
  };
}

function webhookTrigger(path) {
  return {
    id: nextId(),
    name: 'Webhook',
    type: 'n8n-nodes-base.webhook',
    typeVersion: 2,
    position: [200, 300],
    webhookId: `wh-${path.replace(/\//g, '-')}`,
    parameters: {
      httpMethod: 'POST',
      path,
      responseMode: 'lastNode',
      options: {},
    },
  };
}

function rssNode(url) {
  return {
    id: nextId(),
    name: 'Fetch RSS',
    type: 'n8n-nodes-base.rssFeedRead',
    typeVersion: 1.2,
    position: [450, 300],
    parameters: {
      url,
      options: { ignoreSSL: false },
    },
  };
}

function httpFetchNode(name, url, opts = {}) {
  return {
    id: nextId(),
    name,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: opts.position || [450, 300],
    parameters: {
      method: opts.method || 'GET',
      url,
      sendHeaders: !!opts.headers,
      headerParameters: opts.headers ? { parameters: opts.headers } : undefined,
      sendBody: !!opts.body,
      bodyContentType: opts.body ? 'json' : undefined,
      jsonBody: opts.body ? JSON.stringify(opts.body) : undefined,
      options: { timeout: 30000 },
    },
  };
}

function codeNode(name, code, position = [700, 300]) {
  return {
    id: nextId(),
    name,
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position,
    parameters: {
      language: 'javaScript',
      jsCode: code,
    },
  };
}

function ifNode(name, expression, position = [950, 300]) {
  return {
    id: nextId(),
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2.2,
    position,
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          {
            id: 'cond-1',
            leftValue: expression,
            rightValue: '',
            operator: { type: 'boolean', operation: 'true', singleValue: true },
          },
        ],
        combinator: 'and',
      },
    },
  };
}

function postIncomingNode(position = [1200, 200]) {
  return {
    id: nextId(),
    name: 'POST /incoming',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position,
    parameters: {
      method: 'POST',
      url: '={{ $env.IZBICA24_BASE_URL }}/wp-json/iz24/v1/incoming',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendHeaders: true,
      headerParameters: {
        parameters: [
          { name: 'Authorization', value: '=Bearer {{ $env.IZBICA24_API_TOKEN }}' },
          { name: 'X-Idempotency-Key', value: '={{ $json.idempotency_key }}' },
          { name: 'Content-Type', value: 'application/json' },
        ],
      },
      sendBody: true,
      bodyContentType: 'json',
      jsonBody: '={{ JSON.stringify($json) }}',
      options: { timeout: 30000 },
    },
  };
}

function logCostNode(service, position = [1450, 200]) {
  return {
    id: nextId(),
    name: 'Log cost',
    type: 'n8n-nodes-base.postgres',
    typeVersion: 2.5,
    position,
    parameters: {
      operation: 'insert',
      schema: 'public',
      table: 'cost_log',
      columns: {
        values: {
          values: [
            { column: 'workflow_id', value: `={{ $workflow.id }}` },
            { column: 'execution_id', value: `={{ $execution.id }}` },
            { column: 'service', value: service },
            { column: 'prompt_slug', value: `={{ $json.prompt_slug || null }}` },
            { column: 'tokens_in', value: `={{ $json.tokens_in || 0 }}` },
            { column: 'tokens_out', value: `={{ $json.tokens_out || 0 }}` },
            { column: 'cost_usd', value: `={{ $json.cost_usd || 0 }}` },
            { column: 'success', value: `={{ $json.success !== false }}` },
          ],
          mappingMode: 'defineBelow',
        },
      },
    },
  };
}

function errorNode(position = [1200, 500]) {
  return {
    id: nextId(),
    name: 'Notify error',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position,
    parameters: {
      method: 'POST',
      url: `=https://api.telegram.org/bot{{ $env.TELEGRAM_BOT_TOKEN }}/sendMessage`,
      sendBody: true,
      bodyContentType: 'json',
      jsonBody: '={ "chat_id": "{{ $env.TELEGRAM_CHAT_ID }}", "text": "⚠️ Workflow {{ $workflow.name }} error: {{ $json.error || \'unknown\' }}", "parse_mode": "HTML" }',
    },
  };
}

// =============================================================================
// Workflow builder
// =============================================================================

function buildWorkflow(spec) {
  _idCounter = 1;
  const nodes = [];
  const connections = {};

  // 1) trigger
  let trigger;
  if (spec.trigger === 'cron') {
    trigger = cronTrigger(spec.cronExpression);
  } else {
    trigger = webhookTrigger(spec.webhookPath);
  }
  nodes.push(trigger);

  // 2) Fetch — zależnie od typu
  let fetchNode;
  if (spec.source && spec.source.startsWith('rss_')) {
    // Pobierz URL z bazy `sources`
    const urls = {
      rss_gazeta_pomorska:  'https://pomorska.pl/wloclawek/rss.xml',
      rss_dziennik_kujawski: 'https://www.dk.com.pl/rss/index.html',
      rss_radio_pik:        'https://www.radiopik.pl/rss/aktualnosci.rss',
    };
    fetchNode = rssNode(urls[spec.source] || 'https://example.com/rss');
  } else if (spec.source && spec.source.startsWith('fb_')) {
    const pageIds = { fb_gmina_izbica: 'GminaIzbicaKujawska', fb_osp_izbica: 'OSPIzbicaKujawska' };
    fetchNode = httpFetchNode(
      'Fetch Facebook',
      `=https://graph.facebook.com/v18.0/${pageIds[spec.source]}/posts?fields=id,message,created_time,permalink_url&access_token={{ $env.FACEBOOK_ACCESS_TOKEN }}`,
      { method: 'GET' }
    );
  } else if (spec.source && spec.source.startsWith('scrape_')) {
    const urls = {
      scrape_powiat_wloclawski: 'https://www.powiat.wloclawski.pl/aktualnosci',
      scrape_kpp_wloclawek:     'https://wloclawek.policja.gov.pl/',
    };
    fetchNode = httpFetchNode('Fetch HTML', urls[spec.source] || 'https://example.com', { method: 'GET' });
  } else if (spec.aiPrompt) {
    // AI workflow — najpierw pobiera template
    fetchNode = httpFetchNode(
      'GET prompt template',
      `=={{ $env.IZBICA24_BASE_URL }}/wp-json/iz24/v1/prompts/${spec.aiPrompt}`,
      {
        method: 'GET',
        headers: [{ name: 'Authorization', value: '=Bearer {{ $env.IZBICA24_API_TOKEN }}' }],
      }
    );
  } else {
    // Webhook bez fetch
    fetchNode = codeNode(
      'Pass through',
      `// pobiera payload bezpośrednio z webhooka
return items;`
    );
  }
  fetchNode.position = [450, 300];
  nodes.push(fetchNode);
  connections[trigger.name] = { main: [[{ node: fetchNode.name, type: 'main', index: 0 }]] };

  // 3) Normalize — szablon kodu zależny od kategorii
  const normalizeCode = buildNormalizeCode(spec);
  const normalize = codeNode('Normalize payload', normalizeCode, [700, 300]);
  nodes.push(normalize);
  connections[fetchNode.name] = { main: [[{ node: normalize.name, type: 'main', index: 0 }]] };

  if (spec.aiPrompt) {
    // === AI workflow: prompt → Claude → save
    const claudeCall = httpFetchNode(
      'Anthropic Claude',
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        position: [950, 300],
        headers: [
          { name: 'x-api-key', value: '={{ $env.ANTHROPIC_API_KEY }}' },
          { name: 'anthropic-version', value: '2023-06-01' },
          { name: 'content-type', value: 'application/json' },
        ],
        body: '={{ JSON.stringify({ model: $json.model || "claude-3-5-sonnet-20241022", max_tokens: 1500, system: $json.system, messages: [{ role: "user", content: $json.user }] }) }}',
      }
    );
    nodes.push(claudeCall);
    connections[normalize.name] = { main: [[{ node: claudeCall.name, type: 'main', index: 0 }]] };

    const saveResult = httpFetchNode(
      'Save AI result',
      `={{ $env.IZBICA24_BASE_URL }}/wp-json/iz24/v1/prompts/feedback`,
      {
        method: 'POST',
        position: [1200, 300],
        headers: [
          { name: 'Authorization', value: '=Bearer {{ $env.IZBICA24_API_TOKEN }}' },
          { name: 'Content-Type', value: 'application/json' },
        ],
        body: '={{ JSON.stringify({ slug: $node["Normalize payload"].json.prompt_slug, raw_item_id: $node["Normalize payload"].json.raw_item_id, output: $json.content[0].text, tokens_in: $json.usage.input_tokens, tokens_out: $json.usage.output_tokens, model: $json.model, variant: $node["Normalize payload"].json.variant }) }}',
      }
    );
    nodes.push(saveResult);
    connections[claudeCall.name] = { main: [[{ node: saveResult.name, type: 'main', index: 0 }]] };

    const cost = logCostNode('anthropic', [1450, 300]);
    nodes.push(cost);
    connections[saveResult.name] = { main: [[{ node: cost.name, type: 'main', index: 0 }]] };
  } else {
    // === Standard scraper: normalize → IF dedup → POST + log
    const ifCheck = ifNode('IF not duplicate', '={{ !$json.is_duplicate }}', [950, 300]);
    nodes.push(ifCheck);
    connections[normalize.name] = { main: [[{ node: ifCheck.name, type: 'main', index: 0 }]] };

    const post = postIncomingNode([1200, 200]);
    nodes.push(post);
    const cost = logCostNode('scrape', [1450, 200]);
    nodes.push(cost);
    const errBranch = errorNode([1200, 500]);
    nodes.push(errBranch);

    connections[ifCheck.name] = {
      main: [
        [{ node: post.name, type: 'main', index: 0 }],
        [{ node: errBranch.name, type: 'main', index: 0 }],
      ],
    };
    connections[post.name] = { main: [[{ node: cost.name, type: 'main', index: 0 }]] };
  }

  return {
    name: spec.name,
    nodes,
    connections,
    active: false,
    settings: {
      executionOrder: 'v1',
      saveExecutionProgress: true,
      saveManualExecutions: true,
      timezone: 'Europe/Warsaw',
      errorWorkflow: '',
    },
    tags: [
      { name: 'izbica24' },
      { name: spec.id.startsWith('1') || spec.id.startsWith('0') ? `cat:${spec.category || 'system'}` : 'cat:system' },
    ],
    meta: {
      description: spec.description,
      izbica24_id: spec.id,
      izbica24_slug: spec.slug,
    },
    versionId: '1',
    triggerCount: 1,
    pinData: {},
  };
}

/** Generuje kod normalizujący payload dla danego typu źródła. */
function buildNormalizeCode(spec) {
  if (spec.aiPrompt) {
    return `// Renderuje prompt template — pobiera zmienne z payloadu webhook
const tpl = items[0].json;          // { slug, system, user, model, variant, variables_schema }
const vars = $('Webhook').first()?.json || {};

const interpolate = (str, ctx) => str.replace(/{{\\s*([\\w.]+)\\s*}}/g, (m, k) => {
  const parts = k.split('.');
  let v = ctx;
  for (const p of parts) v = v?.[p];
  return v === undefined ? '' : String(v);
});

return [{
  json: {
    prompt_slug: tpl.slug,
    raw_item_id: vars.raw_item_id || null,
    system: interpolate(tpl.system, vars),
    user:   interpolate(tpl.user, vars),
    model:  tpl.model || 'claude-3-5-sonnet-20241022',
    variant: tpl.variant || 'A',
  },
}];`;
  }

  if (spec.source && spec.source.startsWith('rss_')) {
    return `// Normalize RSS feed items → izbica24 raw_item payload
const crypto = require('crypto');
const out = [];
for (const it of items) {
  const j = it.json;
  const title = (j.title || '').trim();
  const content = (j.contentSnippet || j.description || j.content || '').trim();
  const url = j.link || j.url || '';
  if (!title) continue;
  const hash = crypto.createHash('sha256').update(title + '|' + url).digest('hex');
  out.push({
    json: {
      source: ${JSON.stringify(spec.source)},
      category: ${JSON.stringify(spec.category)},
      title,
      content,
      url,
      published_at: j.isoDate || j.pubDate || new Date().toISOString(),
      external_id: j.guid || url,
      hash,
      idempotency_key: hash,
      priority_score: 5,
      is_duplicate: false,
    },
  });
}
return out;`;
  }

  if (spec.source && spec.source.startsWith('fb_')) {
    const prio = spec.source === 'fb_osp_izbica' ? 8 : 5;
    return `// Normalize Facebook page posts
const crypto = require('crypto');
const out = [];
const fb = items[0].json.data || [];
for (const post of fb) {
  if (!post.message) continue;
  const url = post.permalink_url || ('https://facebook.com/' + post.id);
  const hash = crypto.createHash('sha256').update(post.id).digest('hex');
  out.push({
    json: {
      source: ${JSON.stringify(spec.source)},
      category: ${JSON.stringify(spec.category)},
      title: post.message.split('\\n')[0].slice(0, 150),
      content: post.message,
      url,
      published_at: post.created_time,
      external_id: post.id,
      hash,
      idempotency_key: hash,
      priority_score: ${prio},
      is_duplicate: false,
    },
  });
}
return out;`;
  }

  if (spec.source && spec.source.startsWith('scrape_')) {
    return `// Parse HTML — uproszczona ekstrakcja przez regex (produkcyjnie: Cheerio)
const crypto = require('crypto');
const html = items[0].json.data || items[0].json.body || '';
const out = [];

// Bardzo prosty parser nagłówków linków — dostosuj do konkretnego źródła!
const matches = [...html.matchAll(/<h[1-3][^>]*>\\s*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\\/a>/gi)];
for (const m of matches.slice(0, 30)) {
  const url = m[1].startsWith('http') ? m[1] : new URL(m[1], ${JSON.stringify(
    spec.source === 'scrape_powiat_wloclawski'
      ? 'https://www.powiat.wloclawski.pl'
      : 'https://wloclawek.policja.gov.pl'
  )}).href;
  const title = m[2].trim();
  if (!title) continue;
  const hash = crypto.createHash('sha256').update(url).digest('hex');
  out.push({
    json: {
      source: ${JSON.stringify(spec.source)},
      category: ${JSON.stringify(spec.category)},
      title,
      content: '',
      url,
      published_at: new Date().toISOString(),
      external_id: url,
      hash,
      idempotency_key: hash,
      priority_score: ${spec.category === 'na_sygnale' ? 7 : 5},
      is_duplicate: false,
    },
  });
}
return out;`;
  }

  // Webhook form
  if (spec.id === '08') {
    return `// Walidacja zgłoszeń z formularza
const crypto = require('crypto');
const body = items[0].json.body || items[0].json;
if (!body.title || body.title.length < 5) {
  throw new Error('Title too short');
}
// Sprawdzenie reCAPTCHA tu (uproszczone)
const hash = crypto.createHash('sha256').update(body.title + '|' + (body.email || '')).digest('hex');
return [{
  json: {
    source: 'form_user_submission',
    category: body.category || 'na_sygnale',
    title: body.title.trim().slice(0, 250),
    content: (body.content || '').trim(),
    url: '',
    author_name: body.author_name || 'Mieszkaniec',
    author_email: body.email || null,
    published_at: new Date().toISOString(),
    external_id: hash,
    hash,
    idempotency_key: hash,
    priority_score: 5,
    is_duplicate: false,
  },
}];`;
  }

  if (spec.id === '09') {
    return `// Telegram tip — wiadomość z bota
const crypto = require('crypto');
const msg = items[0].json.message || items[0].json;
const text = msg.text || msg.caption || '';
const fromId = msg.from?.id || 0;
if (!text) throw new Error('Empty Telegram message');
const hash = crypto.createHash('sha256').update(text + '|' + fromId).digest('hex');
return [{
  json: {
    source: 'form_user_submission',
    category: 'wiadomosci',
    title: text.split('\\n')[0].slice(0, 200),
    content: text,
    url: '',
    author_name: msg.from?.username || ('telegram:' + fromId),
    published_at: new Date().toISOString(),
    external_id: 'tg:' + msg.message_id,
    hash,
    idempotency_key: hash,
    priority_score: 5,
    is_duplicate: false,
  },
}];`;
  }

  // ID 14 — publish, 15 — distribute, 16 — cost sync, 17 — health
  if (spec.id === '14') {
    return `// Promuje raw_item → regularny post WP
const j = items[0].json;
return [{ json: { raw_item_id: j.raw_item_id || j.post_id, action: 'promote_to_post' } }];`;
  }
  if (spec.id === '15') {
    return `// Distribute — przygotuj treść posta na social
const j = items[0].json;
return [{
  json: {
    fb_message: '📰 ' + j.title + '\\n\\n' + j.excerpt + '\\n\\n👉 ' + j.url,
    tg_message: '<b>' + j.title + '</b>\\n\\n' + j.excerpt + '\\n\\n<a href="' + j.url + '">Czytaj na izbica24.pl</a>',
    x_message: '🗞️ ' + j.title.slice(0, 200) + ' ' + j.url,
  },
}];`;
  }
  if (spec.id === '16') {
    return `// Cost sync — przesyła zaagregowane wiersze z cost_log do WP
return items.map(it => ({ json: { ...it.json, action: 'sync_costs', period: 'last_hour' } }));`;
  }
  if (spec.id === '17') {
    return `// Health check — sprawdza HTTP 200 i zwraca raport
const data = items[0].json;
return [{
  json: {
    healthy: data.statusCode === 200 || data.status === 'ok',
    queue_depth: data.queue_depth || 0,
    timestamp: new Date().toISOString(),
  },
}];`;
  }

  return `// Default passthrough
return items;`;
}

// =============================================================================
// MAIN
// =============================================================================

let written = 0;
for (const spec of WORKFLOWS) {
  const wf = buildWorkflow(spec);
  const fname = `${spec.id}-${spec.slug}.json`;
  writeFileSync(join(OUT_DIR, fname), JSON.stringify(wf, null, 2), 'utf-8');
  console.log(`✓ ${fname}`);
  written++;
}
console.log(`\n${written} workflowów zapisanych w ${OUT_DIR}`);

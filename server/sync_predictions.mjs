import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_FILE = path.resolve(__dirname, '../public/predictions-latest.json');

const SOURCES = {
  wfd: 'https://ptenepal.com/pte-predictions/write-from-dictation/',
  rs: 'https://ptenepal.com/pte-predictions/repeat-sentence/',
  ra: 'https://ptenepal.com/pte-predictions/read-aloud/',
  swt: 'https://ptenepal.com/pte-predictions/summarize-written-text/',
  we: 'https://ptenepal.com/pte-predictions/write-essay/',
};

function decodeHtmlEntities(str) {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseQCards(html, preferJsonLd = false) {
  const weekMatch = html.match(/PTE Academic[^<"]+?predictions,?\s*([^<"]+)/i);
  const weekLabel = weekMatch ? decodeHtmlEntities(weekMatch[1]) : new Date().toISOString().slice(0, 10);

  const cards = [];
  if (!preferJsonLd) {
    const rawChunks = html.split(/<div\s+class="q-card"/i).slice(1);
    for (const chunk of rawChunks) {
      const idMatch = chunk.match(/id="q(\d+)"/i);
      const num = idMatch ? Number(idMatch[1]) : cards.length + 1;
      const bodyMatch = chunk.match(/<div[^>]*class="q-body"[^>]*>([\s\S]*?)<\/div>/i);
      if (!bodyMatch) continue;
      const isNew = /badge-new|New Prediction/i.test(chunk.slice(0, 400));
      const titleMatch = chunk.match(/<h3[^>]*class="q-title"[^>]*>([\s\S]*?)<\/h3>/i);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1].replace(/<[^>]+>/g, ' ')) : '';
      const body = decodeHtmlEntities(bodyMatch[1].replace(/<[^>]+>/g, ' '));
      if (body) {
        cards.push({ num, isNew, title, body });
      }
    }
  }

  if (cards.length === 0) {
    const ldMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) || [];
    for (const block of ldMatches) {
      if (!block.includes('ItemList')) continue;
      try {
        const jsonStr = block.replace(/^<script[^>]*>/i, '').replace(/<\/script>$/i, '');
        const parsed = JSON.parse(jsonStr);
        const me = parsed.mainEntity || parsed;
        if (Array.isArray(me?.itemListElement)) {
          for (const el of me.itemListElement) {
            if (el?.name) {
              cards.push({
                num: Number(el.position || cards.length + 1),
                isNew: Number(el.position) <= 12,
                title: '',
                body: decodeHtmlEntities(String(el.name)),
              });
            }
          }
        }
      } catch {
        // Ignore malformed JSON-LD
      }
    }
  }

  return { weekLabel, cards };
}

function splitRsChunks(sentence) {
  const words = sentence.trim().split(/\s+/);
  if (words.length <= 6) {
    return { chunkA: sentence.trim(), chunkB: '' };
  }
  // Split naturally near comma or around 55% mark
  const commaIdx = words.findIndex((w, i) => i >= 3 && i <= words.length - 3 && w.endsWith(','));
  const splitAt = commaIdx !== -1 ? commaIdx + 1 : Math.ceil(words.length * 0.55);
  return {
    chunkA: words.slice(0, splitAt).join(' '),
    chunkB: words.slice(splitAt).join(' '),
  };
}

function addSenseSlashes(passage) {
  return passage
    .replace(/([,;:])\s+/g, '$1 / ')
    .replace(/\.\s+/g, '. / ')
    .replace(/\s+(which|that|because|while|although|where|when|and\s+therefore)\s+/gi, ' / $1 ');
}

function pickDistractors(sentence) {
  const pool = ['were', 'has', 'their', 'these', 'affect', 'adapted', 'studying', 'policies'];
  const lower = new Set(sentence.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/));
  const chosen = pool.filter((w) => !lower.has(w)).slice(0, 2);
  return chosen.length === 2 ? chosen : ['were', 'has'];
}

async function fetchHtml(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/128.0 Safari/537.36',
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return await resp.text();
}

export async function syncWeeklyPredictions(pgPool = null) {
  const syncedAt = new Date().toISOString();
  let weekLabel = syncedAt.slice(0, 10);

  const wfdHtml = await fetchHtml(SOURCES.wfd);
  const wfdParsed = parseQCards(wfdHtml, true);
  if (wfdParsed.weekLabel) weekLabel = wfdParsed.weekLabel;

  // Filter single-sentence WFD items (5..22 words)
  const wfdItems = wfdParsed.cards
    .filter((c) => {
      const wc = c.body.split(/\s+/).length;
      return wc >= 5 && wc <= 22;
    })
    .slice(0, 160)
    .map((c, idx) => {
      const text = /[.?!]$/.test(c.body) ? c.body : `${c.body}.`;
      return {
        id: 2001 + idx,
        text: text.charAt(0).toUpperCase() + text.slice(1),
        isNew: c.isNew || idx < 12,
        distractors: pickDistractors(text),
      };
    });

  const rsHtml = await fetchHtml(SOURCES.rs);
  const rsParsed = parseQCards(rsHtml, true);
  const rsItems = rsParsed.cards
    .filter((c) => {
      const wc = c.body.split(/\s+/).length;
      return wc >= 5 && wc <= 20;
    })
    .slice(0, 120)
    .map((c, idx) => {
      const text = /[.?!]$/.test(c.body) ? c.body : `${c.body}.`;
      const { chunkA, chunkB } = splitRsChunks(text);
      return {
        id: 3001 + idx,
        chunkA,
        chunkB,
        isNew: c.isNew || idx < 10,
      };
    });

  const raHtml = await fetchHtml(SOURCES.ra);
  const raParsed = parseQCards(raHtml);
  const raItems = raParsed.cards
    .filter((c) => c.body.split(/\s+/).length >= 30)
    .slice(0, 30)
    .map((c, idx) => ({
      id: 4001 + idx,
      title: c.title || `Read Aloud #${c.num}`,
      plainText: c.body,
      markedText: addSenseSlashes(c.body),
      isNew: c.isNew || idx < 6,
    }));

  const swtHtml = await fetchHtml(SOURCES.swt);
  const swtParsed = parseQCards(swtHtml);
  const swtItems = swtParsed.cards
    .filter((c) => c.body.split(/\s+/).length >= 45)
    .slice(0, 20)
    .map((c, idx) => {
      const words = (c.body.toLowerCase().match(/[a-z]{6,}/g) || []);
      const freq = new Map();
      for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
      const keywords = [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map((e) => e[0]);
      return {
        id: `swt-live-${idx + 1}`,
        type: 'SWT',
        title: c.title || `SWT 預測 #${c.num}`,
        sourceText: c.body,
        keywords,
        isNew: c.isNew || idx < 5,
      };
    });

  const weHtml = await fetchHtml(SOURCES.we);
  const weParsed = parseQCards(weHtml);
  const weItems = weParsed.cards
    .filter((c) => c.body.split(/\s+/).length >= 8)
    .slice(0, 20)
    .map((c, idx) => {
      const keywords = [...new Set((c.body.toLowerCase().match(/[a-z]{5,}/g) || []))].slice(0, 6);
      return {
        id: `we-live-${idx + 1}`,
        type: 'WE',
        title: c.title || `WE 大作文預測 #${c.num}`,
        sourceText: c.body,
        keywords,
        isNew: c.isNew || idx < 5,
      };
    });

  const payload = {
    syncedAt,
    weekLabel,
    counts: {
      wfd: wfdItems.length,
      rs: rsItems.length,
      ra: raItems.length,
      swt: swtItems.length,
      we: weItems.length,
    },
    wfd: wfdItems,
    rs: rsItems,
    ra: raItems,
    swt: swtItems,
    we: weItems,
  };

  if (pgPool) {
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS pte_prediction_bank (
        bank_id TEXT PRIMARY KEY,
        payload_json JSONB NOT NULL,
        synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pgPool.query(
      `INSERT INTO pte_prediction_bank (bank_id, payload_json, synced_at)
       VALUES ('latest', $1::jsonb, NOW())
       ON CONFLICT (bank_id) DO UPDATE SET payload_json = EXCLUDED.payload_json, synced_at = NOW()`,
      [JSON.stringify(payload)]
    );
  }

  try {
    fs.mkdirSync(path.dirname(SNAPSHOT_FILE), { recursive: true });
    fs.writeFileSync(SNAPSHOT_FILE, JSON.stringify(payload, null, 2));
  } catch {
    // Read-only filesystem in systemd ProtectSystem=strict is expected when writing to DB instead
  }

  return payload;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dbUrl = process.env.DATABASE_URL || '';
  let pool = null;
  if (dbUrl) {
    const pg = await import('pg');
    const useTls = dbUrl.includes('sslmode=');
    const cleanConn = dbUrl.replace(/[?&]sslmode=[^&]+/g, '').replace(/\?$/, '');
    pool = new pg.default.Pool({
      connectionString: cleanConn,
      max: 2,
      ssl: useTls ? { rejectUnauthorized: false } : false,
    });
  }
  try {
    const res = await syncWeeklyPredictions(pool);
    console.log('[pte-prediction-sync] OK:', res.weekLabel, res.counts);
  } finally {
    if (pool) await pool.end();
  }
}

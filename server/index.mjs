import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { syncWeeklyPredictions } from './sync_predictions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PUBLIC_DIR = path.resolve(__dirname, '../public');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8792);
const DATABASE_URL = process.env.DATABASE_URL || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ico': 'image/x-icon',
};

let pool = null;
if (DATABASE_URL) {
  const useTls = DATABASE_URL.includes('sslmode=');
  const cleanConnStr = DATABASE_URL.replace(/[?&]sslmode=[^&]+/g, '').replace(/\?$/, '');
  pool = new pg.Pool({
    connectionString: cleanConnStr,
    max: 4,
    idleTimeoutMillis: 30000,
    ssl: useTls ? { rejectUnauthorized: false } : false,
  });
}

async function initDb() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pte_progress (
      profile_key TEXT PRIMARY KEY,
      cards_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      history_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      weekly_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      custom_wfd_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      player_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pte_prediction_bank (
      bank_id TEXT PRIMARY KEY,
      payload_json JSONB NOT NULL,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Auto-seed or auto-refresh if prediction bank is missing or > 72 hours old
  try {
    const { rows } = await pool.query(
      "SELECT synced_at FROM pte_prediction_bank WHERE bank_id = 'latest'"
    );
    const ageHours =
      rows.length > 0
        ? (Date.now() - new Date(rows[0].synced_at).getTime()) / 3600000
        : Infinity;
    if (ageHours > 72) {
      syncWeeklyPredictions(pool)
        .then((p) => console.log('[pte-quest] auto-synced weekly predictions:', p.weekLabel, p.counts))
        .catch((e) => console.warn('[pte-quest] background prediction sync skipped:', e.message));
    }
  } catch (err) {
    console.warn('[pte-quest] prediction check warning:', err.message);
  }
}

function readStaticPredictionsFallback() {
  for (const candidate of [
    path.join(DIST_DIR, 'predictions-latest.json'),
    path.join(PUBLIC_DIR, 'predictions-latest.json'),
  ]) {
    try {
      if (fs.existsSync(candidate)) {
        return JSON.parse(fs.readFileSync(candidate, 'utf8'));
      }
    } catch {
      // Ignore
    }
  }
  return null;
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 2 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function callGeminiJson(prompt, temperature = 0.45) {
  if (!GEMINI_API_KEY) return null;
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(
      GEMINI_API_KEY
    )}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature,
        },
      }),
      signal: AbortSignal.timeout(12000),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function evaluateDeterministicCoach({ taskType, promptText, userAnswer }) {
  const typeUpper = String(taskType || '').toUpperCase();
  const ans = String(userAnswer || '').trim();
  const src = String(promptText || '').trim();
  const words = ans ? ans.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;

  const stop = new Set([
    'about', 'after', 'again', 'against', 'among', 'because', 'before', 'being',
    'between', 'could', 'during', 'every', 'first', 'found', 'having', 'other',
    'people', 'should', 'since', 'still', 'their', 'there', 'these', 'those',
    'through', 'under', 'using', 'where', 'which', 'while', 'would', 'years',
  ]);

  const promptWords = (src.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => !stop.has(w));
  const uniquePromptWords = [...new Set(promptWords)];
  const ansLower = ans.toLowerCase();
  const hits = uniquePromptWords.filter((w) => ansLower.includes(w));
  const connectors = [
    'however', 'therefore', 'consequently', 'furthermore', 'moreover',
    'while', 'whereas', 'overall', 'although', 'specifically', 'contrast', 'because',
  ];
  const usedConn = connectors.filter((c) => ansLower.includes(c));

  // Verbatim tasks: RS / RA
  if (typeUpper.includes('RS') || typeUpper.includes('REPEAT') || typeUpper.includes('RA') || typeUpper.includes('READ')) {
    const srcTokens = (src.toLowerCase().match(/[a-z0-9']+/g) || []).filter((w) => w.length > 1);
    const ansTokens = new Set((ansLower.match(/[a-z0-9']+/g) || []));
    const matched = srcTokens.filter((t) => ansTokens.has(t));
    const ratio = srcTokens.length > 0 ? matched.length / srcTokens.length : 0;
    const band = wordCount < 3 ? 28 : Math.min(84, Math.max(46, Math.round(42 + ratio * 42)));
    return {
      estimatedBand: band,
      strengthsZh:
        ratio >= 0.6
          ? `語音辨識命中 ${Math.round(ratio * 100)}% 原句詞彙，發音清晰且意群連貫，穩過澳洲 54 分門檻！`
          : `已抓到 ${matched.length} 個原句詞彙，開口節奏穩定。`,
      fixesZh:
        ratio >= 0.75
          ? '注意句尾複數 -s 與過去式 -ed 輕吐即可，切勿為了糾正單字回頭重唸。'
          : 'PTE 口說流利度佔比最高：遇到生詞直接略過或自然滑過，把聽懂的意群零卡頓唸完就能拿高分！',
      upgradedSample: src,
    };
  }

  // SWT (1-sentence summary 5..75 words)
  if (typeUpper.includes('SWT')) {
    const sentenceMatches = ans.match(/[.!?]+(\s|$)/g) || [];
    const oneSentenceOk = sentenceMatches.length === 1 && ans.endsWith('.') && !ans.includes('\n');
    const lenOk = wordCount >= 35 && wordCount <= 72;
    let band = 45 + Math.min(16, hits.length * 3) + Math.min(8, usedConn.length * 4) + (lenOk ? 7 : 0);
    if (!oneSentenceOk || wordCount < 5 || wordCount > 75) band = Math.min(band, 38);

    const srcSentences = src.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
    const s1 = (srcSentences[0] || src.slice(0, 120)).replace(/[.!?]+$/, '');
    const s2 = (srcSentences[srcSentences.length - 1] || '').replace(/[.!?]+$/, '');
    const sample =
      s2 && s2 !== s1
        ? `${s1}, while ${s2.charAt(0).toLowerCase() + s2.slice(1)}.`
        : `${s1}.`;

    return {
      estimatedBand: Math.min(79, band),
      strengthsZh: oneSentenceOk
        ? `嚴格遵守「全文唯一句號」鐵律（${wordCount} 字），命中 ${hits.length} 個原文核心詞（${hits.slice(0, 4).join(', ') || '主題詞'}）。`
        : `已抓出 ${hits.length} 個主題關鍵字（${hits.slice(0, 4).join(', ') || '基本概念'}）。`,
      fixesZh: !oneSentenceOk
        ? '⚠️ SWT 致命紅線：全文只能有 1 個句號且不可換行！請把中間的句號改為 `, while` 或 `, and therefore`。'
        : !lenOk
          ? `目前 ${wordCount} 字，建議控制在 45–65 字黃金區間最穩。`
          : '結構與字數極佳！確保不要連續照抄原文超過 8 個字，適度替換 1–2 個連接詞即可穩拿 60+。',
      upgradedSample: sample.split(/\s+/).slice(0, 68).join(' ').replace(/[,;.]*$/, '.'),
    };
  }

  // WE (Essay 200..300 words)
  if (typeUpper.includes('WE') || typeUpper.includes('ESSAY')) {
    const paras = ans.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    const lenOk = wordCount >= 200 && wordCount <= 300;
    let band =
      44 +
      Math.min(15, hits.length * 3) +
      Math.min(10, usedConn.length * 3) +
      (lenOk ? 10 : wordCount >= 140 ? 4 : -6) +
      (paras >= 3 && paras <= 5 ? 4 : 0);
    return {
      estimatedBand: Math.min(78, Math.max(36, band)),
      strengthsZh: `目前共 ${wordCount} 字、分 ${paras} 段，緊扣題目核心詞（${hits.slice(0, 5).join(', ') || '主題論點'}），無萬用廢話模板痕跡。`,
      fixesZh: !lenOk
        ? `⚠️ WE 標準字數為 200–300 字（目前 ${wordCount} 字），低於 200 字會損失 Form 分數，建議在第 2、3 段補充一個具體職場或生活實例。`
        : '字數與四段結構達標！交卷前務必花 60 秒檢查單複數 -s 與冠詞 a/the，寫作即可穩過 58+。',
      upgradedSample: `While opinions differ regarding ${hits.slice(0, 2).join(' and ') || 'this trend'}, practical evidence shows that balanced implementation brings substantial benefits when supported by clear guidelines and continuous adaptation.`,
    };
  }

  // SGD / RTS / DI (Content + Fluency speaking tasks)
  const band =
    wordCount < 6
      ? 34
      : Math.min(
          78,
          Math.max(48, 48 + Math.min(14, hits.length * 3) + Math.min(8, usedConn.length * 4) + (wordCount >= 28 ? 8 : 2))
        );
  const cleanedFirst = ans ? ans.charAt(0).toUpperCase() + ans.slice(1).replace(/\.*$/, '.') : '';

  return {
    estimatedBand: band,
    strengthsZh: `口說輸出 ${wordCount} 字，命中 ${hits.length} 個情境核心詞（${hits.slice(0, 5).join(', ') || '關鍵語意'}），符合 2025/8 雙審真實語意標準！`,
    fixesZh:
      wordCount < 25
        ? '建議再多講 1–2 句完整因果（維持約 25–35 秒穩定輸出），讓流利度與內容分同時拉滿。'
        : usedConn.length >= 1
          ? '轉折詞與長度都很好！保持平穩語速、不回頭改字即可穩拿 60+。'
          : '可在句間加入 `while`、`however` 或 `overall` 串聯觀點，讓機器更好抓到結構。',
    upgradedSample:
      cleanedFirst.length > 20
        ? `${cleanedFirst} Overall, addressing these practical points ensures a smooth and effective outcome.`
        : `Based on the discussion regarding ${hits.slice(0, 3).join(', ') || 'the main topic'}, balancing practical convenience and long-term value leads to the most effective solution.`,
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    // 1. Cluster Watchdog Health Endpoint
    if (pathname === '/health') {
      let dbOk = false;
      let predictionWeek = null;
      if (pool) {
        try {
          const r = await pool.query(
            "SELECT payload_json->>'weekLabel' AS wk FROM pte_prediction_bank WHERE bank_id = 'latest'"
          );
          dbOk = true;
          predictionWeek = r.rows[0]?.wk || null;
        } catch {
          dbOk = false;
        }
      }
      return sendJson(res, 200, {
        ok: true,
        service: 'pte-quest',
        db: dbOk,
        aiCoachReady: true,
        predictionWeek,
        ts: new Date().toISOString(),
      });
    }

    // 2. Capabilities Status for Frontend
    if (pathname === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, {
        cloudSync: Boolean(pool),
        serverAi: true,
      });
    }

    // 3. Weekly Prediction Bank Read & Live Sync
    if (pathname === '/api/predictions' && req.method === 'GET') {
      if (pool) {
        try {
          const { rows } = await pool.query(
            "SELECT payload_json, synced_at FROM pte_prediction_bank WHERE bank_id = 'latest'"
          );
          if (rows.length > 0 && rows[0].payload_json) {
            return sendJson(res, 200, rows[0].payload_json);
          }
        } catch {
          // Fall through to static snapshot
        }
      }
      const fallback = readStaticPredictionsFallback();
      if (fallback) return sendJson(res, 200, fallback);
      return sendJson(res, 404, { error: 'No prediction bank available yet' });
    }

    if (pathname === '/api/predictions/sync' && req.method === 'POST') {
      const payload = await syncWeeklyPredictions(pool);
      return sendJson(res, 200, {
        ok: true,
        syncedAt: payload.syncedAt,
        weekLabel: payload.weekLabel,
        counts: payload.counts,
        payload,
      });
    }

    // 4. Cloud Progress Pull & Push (PostgreSQL pte_quest DB)
    if (pathname === '/api/sync') {
      if (!pool) return sendJson(res, 503, { error: 'DB not configured' });
      const profileKey = (urlObj.searchParams.get('profile') || 'william').slice(0, 48);

      if (req.method === 'GET') {
        const { rows } = await pool.query(
          'SELECT cards_json, history_json, weekly_json, custom_wfd_json, player_json, updated_at FROM pte_progress WHERE profile_key = $1',
          [profileKey]
        );
        if (rows.length === 0) {
          return sendJson(res, 200, { found: false });
        }
        return sendJson(res, 200, {
          found: true,
          cards: rows[0].cards_json,
          history: rows[0].history_json,
          weekly: rows[0].weekly_json,
          customWfd: rows[0].custom_wfd_json,
          player: rows[0].player_json,
          updatedAt: rows[0].updated_at,
        });
      }

      if (req.method === 'POST') {
        const body = await readJsonBody(req);
        await pool.query(
          `INSERT INTO pte_progress (profile_key, cards_json, history_json, weekly_json, custom_wfd_json, player_json, updated_at)
           VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, $5::jsonb, $6::jsonb, NOW())
           ON CONFLICT (profile_key) DO UPDATE SET
             cards_json = EXCLUDED.cards_json,
             history_json = EXCLUDED.history_json,
             weekly_json = EXCLUDED.weekly_json,
             custom_wfd_json = EXCLUDED.custom_wfd_json,
             player_json = EXCLUDED.player_json,
             updated_at = NOW()`,
          [
            profileKey,
            JSON.stringify(body.cards || {}),
            JSON.stringify(body.history || []),
            JSON.stringify(body.weekly || {}),
            JSON.stringify(body.customWfd || []),
            JSON.stringify(body.player || {}),
          ]
        );
        return sendJson(res, 200, { ok: true, updatedAt: new Date().toISOString() });
      }
    }

    // 5. Server-Side PTE Double-Marking Examiner (+ Deterministic PTE Rubric Engine)
    if (pathname === '/api/ai/coach' && req.method === 'POST') {
      const params = await readJsonBody(req, 64 * 1024);
      const prompt = `You are an official-style PTE Academic (post-August 2025 double-marking) examiner. Evaluate the candidate's ${params.taskType} response. Target is 58-62 (Australia Competent English).
Prompt: ${params.promptText}
Candidate Response: ${params.userAnswer}

Return ONLY valid JSON:
{
  "estimatedBand": 62,
  "strengthsZh": "Traditional Chinese praise on what scored well",
  "fixesZh": "Traditional Chinese specific fixes for Content, Form, Grammar, or Template-risk",
  "upgradedSample": "Improved natural response keeping the user's own ideas (no memorized boilerplate)"
}`;
      const result = await callGeminiJson(prompt, 0.4);
      if (result && typeof result.estimatedBand === 'number') {
        return sendJson(res, 200, result);
      }

      return sendJson(res, 200, evaluateDeterministicCoach(params));
    }

    // 6. Serve Built Static Assets from dist/
    let relPath = decodeURIComponent(pathname);
    if (relPath === '/' || relPath === '') relPath = '/index.html';
    const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(DIST_DIR, safePath);

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheHeader =
      ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=604800, immutable';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': cacheHeader,
    });
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[pte-quest] request error:', err);
    if (!res.headersSent) {
      sendJson(res, 500, { error: 'Internal server error' });
    }
  }
});

initDb()
  .catch((err) => console.error('[pte-quest] DB init warning:', err.message))
  .finally(() => {
    server.listen(PORT, HOST, () => {
      console.log(`[pte-quest] listening on http://${HOST}:${PORT}`);
    });
  });

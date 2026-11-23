import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

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

async function callGeminiJson(prompt, temperature = 0.55) {
  if (!GEMINI_API_KEY) return null;
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
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return raw ? JSON.parse(raw) : null;
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    // 1. Cluster Watchdog Health Endpoint
    if (pathname === '/health') {
      let dbOk = false;
      if (pool) {
        try {
          await pool.query('SELECT 1');
          dbOk = true;
        } catch {
          dbOk = false;
        }
      }
      return sendJson(res, 200, {
        ok: true,
        service: 'pte-quest',
        db: dbOk,
        serverAi: Boolean(GEMINI_API_KEY),
        ts: new Date().toISOString(),
      });
    }

    // 2. Capabilities Status for Frontend
    if (pathname === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, {
        cloudSync: Boolean(pool),
        serverAi: Boolean(GEMINI_API_KEY),
      });
    }

    // 3. Cloud Progress Pull & Push (PostgreSQL pte_quest DB)
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

    // 4. Server-Side Gemini Roleplay Partner
    if (pathname === '/api/ai/roleplay' && req.method === 'POST') {
      if (!GEMINI_API_KEY) return sendJson(res, 503, { error: 'Server AI not configured' });
      const params = await readJsonBody(req, 64 * 1024);
      const historyLines = Array.isArray(params.conversationHistory)
        ? params.conversationHistory.map((m) => `${String(m.speaker).toUpperCase()}: ${m.text}`).join('\n')
        : '';
      const prompt = `You are acting as BOTH an Australian English roleplay character (${params.rolePersona}) AND a friendly PTE Academic Speaking Coach for a Taiwanese software engineer targeting PTE 60 (Competent English).
Scenario: ${params.scenarioContext}
Conversation so far:
${historyLines}
USER JUST SAID: "${params.userLatestText}"

Return ONLY valid JSON with these exact keys:
{
  "npcReply": "${
    params.isFinalTurn
      ? 'A warm, natural 1-2 sentence closing resolution in character acknowledging what the user proposed.'
      : 'A natural, realistic 1-2 sentence spoken response in character that reacts specifically to what the user said and asks 1 concrete follow-up question.'
  }",
  "npcReplyZh": "Traditional Chinese translation of npcReply",
  "coachTipZh": "1 concise, encouraging Traditional Chinese tip on how well their response hits PTE Respond-to-a-Situation Content & tone",
  "polishedUserSentence": "A natural, idiomatic Australian/academic English version of what the user just tried to say (around 25-35 words)"
}`;
      const result = await callGeminiJson(prompt, 0.65);
      if (!result) return sendJson(res, 502, { error: 'AI upstream failed' });
      return sendJson(res, 200, result);
    }

    // 5. Server-Side Gemini PTE Double-Marking Examiner
    if (pathname === '/api/ai/coach' && req.method === 'POST') {
      if (!GEMINI_API_KEY) return sendJson(res, 503, { error: 'Server AI not configured' });
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
      if (!result) return sendJson(res, 502, { error: 'AI upstream failed' });
      return sendJson(res, 200, result);
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
      ext === '.html' ? 'no-cache' : 'public, max-age=604800, immutable';

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

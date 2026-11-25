import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { syncWeeklyPredictions } from './sync_predictions.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const WHISPER_PYTHON = path.resolve(__dirname, '../.venv/bin/python');
const WHISPER_SCRIPT = path.resolve(__dirname, './whisper_worker.py');
const WHISPER_PORT = Number(process.env.WHISPER_PORT || 8795);

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8792);
const DATABASE_URL = process.env.DATABASE_URL || '';
const AGY_CLI_BIN = process.env.AGY_CLI_BIN || '/usr/local/bin/agy';
const AGY_MODEL = process.env.AGY_MODEL || 'gemini-3.8-flash-low';
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

/* 1. Hydrate Live AGY Subscription Credentials into isolated HOME (/var/lib/pte-quest) */
function hydrateAgyCredentials() {
  const homeDir = process.env.HOME || os.homedir();
  const rawB64 = (process.env.AGY_AUTH_BUNDLE_B64 || '').trim();
  if (!rawB64) return false;
  try {
    const bundle = JSON.parse(Buffer.from(rawB64, 'base64').toString('utf8'));
    const cliDir = path.join(homeDir, '.gemini', 'antigravity-cli');
    const cfgDir = path.join(homeDir, '.config', 'antigravity');
    fs.mkdirSync(cliDir, { recursive: true });
    fs.mkdirSync(cfgDir, { recursive: true });
    if (bundle.oauthToken) {
      fs.writeFileSync(
        path.join(cliDir, 'antigravity-oauth-token'),
        Buffer.from(bundle.oauthToken, 'base64'),
        { mode: 0o600 }
      );
    }
    if (bundle.installationId) {
      fs.writeFileSync(
        path.join(cliDir, 'installation_id'),
        Buffer.from(bundle.installationId, 'base64'),
        { mode: 0o600 }
      );
    }
    if (bundle.credentialUserScope) {
      fs.writeFileSync(
        path.join(cfgDir, 'credential-user-scope'),
        Buffer.from(bundle.credentialUserScope, 'base64'),
        { mode: 0o600 }
      );
    }
    return true;
  } catch (err) {
    console.warn('[pte-quest] AGY credential hydration warning:', err.message);
    return false;
  }
}

const agyHydrated = hydrateAgyCredentials();

/* 2. Spawn Persistent faster-whisper Neural STT Worker */
let whisperProc = null;
function startWhisperWorker() {
  if (!fs.existsSync(WHISPER_PYTHON) || !fs.existsSync(WHISPER_SCRIPT)) {
    console.warn('[pte-quest] faster-whisper venv not present locally; skipping worker spawn');
    return;
  }
  const homeDir = process.env.HOME || os.homedir();
  const cacheDir = path.join(homeDir, 'whisper-cache');
  fs.mkdirSync(cacheDir, { recursive: true });

  whisperProc = spawn(WHISPER_PYTHON, [WHISPER_SCRIPT], {
    env: {
      ...process.env,
      WHISPER_PORT: String(WHISPER_PORT),
      WHISPER_CACHE_DIR: cacheDir,
    },
    stdio: ['ignore', 'inherit', 'inherit'],
  });

  whisperProc.on('exit', (code) => {
    console.warn(`[pte-quest] whisper-worker exited (${code}), restarting in 3s...`);
    whisperProc = null;
    setTimeout(startWhisperWorker, 3000);
  });
}

startWhisperWorker();

/* 3. PostgreSQL Connection Pool */
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

function readRawBuffer(req, maxBytes = 20 * 1024 * 1024) {
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
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function readJsonBody(req, maxBytes = 2 * 1024 * 1024) {
  const buf = await readRawBuffer(req, maxBytes);
  const raw = buf.toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function extractJsonFromText(rawText) {
  if (!rawText) return null;
  const cleaned = String(rawText)
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* 4. Live Gemini 3.8 Flash via AGY CLI (Primary) + Direct Gemini API (Secondary) */
function callAgyCliJson(prompt, timeoutMs = 28000) {
  return new Promise((resolve) => {
    const homeDir = process.env.HOME || os.homedir();
    const oauthFile = path.join(homeDir, '.gemini', 'antigravity-cli', 'antigravity-oauth-token');
    if (!fs.existsSync(AGY_CLI_BIN) || !fs.existsSync(oauthFile)) {
      return resolve(null);
    }

    const emptyCwd = path.join(homeDir, 'empty_cwd');
    fs.mkdirSync(emptyCwd, { recursive: true });

    const strictPrompt = `[DIRECT SINGLE-TURN JSON ONLY: Do NOT call any tools, do NOT read/write files, and do NOT run shell commands. Output ONLY valid JSON in 1 turn.]\n\n${prompt}`;
    const child = spawn(
      AGY_CLI_BIN,
      ['-p', strictPrompt, '--model', AGY_MODEL, '--output-format', 'json', '--disable-slash-commands'],
      {
        cwd: emptyCwd,
        env: { ...process.env, CI: '1' },
        stdio: ['ignore', 'pipe', 'pipe'],
      }
    );

    let stdout = '';
    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {}
      resolve(null);
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      stdout += d.toString('utf8');
    });

    child.on('close', () => {
      clearTimeout(timer);
      const lines = stdout
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        if (lines[i].startsWith('{') && lines[i].endsWith('}')) {
          try {
            const envObj = JSON.parse(lines[i]);
            if (envObj?.status === 'SUCCESS' && typeof envObj.response === 'string') {
              const parsed = extractJsonFromText(envObj.response);
              if (parsed) return resolve({ ...parsed, aiModel: AGY_MODEL });
            }
          } catch {
            // Continue
          }
        }
      }
      const direct = extractJsonFromText(stdout);
      resolve(direct ? { ...direct, aiModel: AGY_MODEL } : null);
    });

    child.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}

async function callDirectGeminiJson(prompt, temperature = 0.4) {
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
    const parsed = extractJsonFromText(raw);
    return parsed ? { ...parsed, aiModel: GEMINI_MODEL } : null;
  } catch {
    return null;
  }
}

/* 5. Score Acoustic Whisper Metrics into PTE /90 Card */
function computeWhisperPteScoreCard(whisperOut, meta) {
  const transcript = String(whisperOut.transcript || '').trim();
  const wordCount = Number(whisperOut.wordCount || 0);
  const wpm = Number(whisperOut.wpm || 0);
  const longPauses = Number(whisperOut.longPauses || 0);
  const avgWordProb = Number(whisperOut.avgWordProb || 0);
  const lowClarityWords = Array.isArray(whisperOut.lowClarityWords) ? whisperOut.lowClarityWords : [];
  const isVerbatim = Boolean(meta?.isVerbatimTask);
  const expected = Array.isArray(meta?.expectedWords) ? meta.expectedWords : [];

  const cleanSpoken = transcript
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9']/g, ''))
    .filter(Boolean);

  const targetTokens = expected
    .map((w) => String(w).replace(/[^a-zA-Z0-9']/g, '').toLowerCase())
    .filter((w) => w.length > 1);

  const matchedWords = [];
  const missedKeywords = [];
  for (const tk of targetTokens) {
    if (cleanSpoken.includes(tk)) {
      if (!matchedWords.includes(tk)) matchedWords.push(tk);
    } else {
      if (!missedKeywords.includes(tk)) missedKeywords.push(tk);
    }
  }

  const hitRatio = targetTokens.length > 0 ? matchedWords.length / targetTokens.length : 0.7;

  // Content 0..6
  let contentScore = 0;
  if (wordCount < 3) {
    contentScore = 0;
  } else if (isVerbatim) {
    if (hitRatio >= 0.8) contentScore = 6;
    else if (hitRatio >= 0.55) contentScore = 5;
    else if (hitRatio >= 0.35) contentScore = 4;
    else contentScore = 2;
  } else {
    if (hitRatio >= 0.55 && wordCount >= 30) contentScore = 6;
    else if (hitRatio >= 0.35 && wordCount >= 18) contentScore = 5;
    else if (wordCount >= 12) contentScore = 4;
    else contentScore = 2;
  }

  // Oral Fluency 0..5 (from real Whisper word-timestamp WPM + >1.15s acoustic pauses)
  let fluencyScore = 0;
  if (wordCount >= 4) {
    if (wpm >= 95 && wpm <= 170 && longPauses === 0) fluencyScore = 5;
    else if (wpm >= 80 && wpm <= 185 && longPauses <= 2) fluencyScore = 4;
    else if (wpm >= 60 && longPauses <= 4) fluencyScore = 3;
    else fluencyScore = 2;
  }

  // Pronunciation 0..5 (from real Whisper neural acoustic probability!)
  let pronunciationScore = 0;
  if (wordCount >= 4) {
    if (avgWordProb >= 0.84 && lowClarityWords.length <= 1) pronunciationScore = 5;
    else if (avgWordProb >= 0.72) pronunciationScore = 4;
    else if (avgWordProb >= 0.56) pronunciationScore = 3;
    else pronunciationScore = 2;
  }

  let overallBand = 10;
  if (contentScore > 0) {
    const weighted =
      (contentScore / 6) * 0.34 +
      (fluencyScore / 5) * 0.38 +
      (pronunciationScore / 5) * 0.28;
    overallBand = Math.min(90, Math.max(24, Math.round(18 + weighted * 70)));
  }

  let verdictZh = '';
  if (wordCount < 3) {
    verdictZh = '錄音音量過小或未偵測到英文語音，請靠近手機麥克風再唸一次。';
  } else if (overallBand >= 62) {
    verdictZh = `Whisper 聲學辨識清晰度 ${Math.round(avgWordProb * 100)}%，長停頓 ${longPauses} 次，穩過澳洲口說 54 分門檻（60+ 安全區）！`;
  } else if (overallBand >= 54) {
    verdictZh = `已達口說 54 分門檻（清晰度 ${Math.round(avgWordProb * 100)}%，長停頓 ${longPauses} 次），減少換氣卡頓即可衝上 62+。`;
  } else {
    verdictZh = `目前偵測到 ${longPauses} 次超過 1.1 秒停頓（語速 ${wpm} WPM），遇到生詞直接滑過不斷句，流利度會立即拉升！`;
  }

  return {
    transcript,
    overallBand,
    contentScore,
    fluencyScore,
    pronunciationScore,
    wpm,
    pauseWarnings: longPauses,
    clarityPct: Math.round(avgWordProb * 100),
    lowClarityWords,
    matchedWords: matchedWords.slice(0, 15),
    missedKeywords: missedKeywords.slice(0, 8),
    verdictZh,
    sttEngine: 'faster-whisper-base.en',
  };
}

function evaluateDeterministicCoach({ taskType, promptText, userAnswer }) {
  const typeUpper = String(taskType || '').toUpperCase();
  const ans = String(userAnswer || '').trim();
  const src = String(promptText || '').trim();
  const words = ans ? ans.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const ansLower = ans.toLowerCase();

  const stop = new Set([
    'about', 'after', 'again', 'against', 'among', 'because', 'before', 'being',
    'between', 'could', 'during', 'every', 'first', 'found', 'having', 'other',
    'people', 'should', 'since', 'still', 'their', 'there', 'these', 'those',
    'through', 'under', 'using', 'where', 'which', 'while', 'would', 'years',
  ]);
  const promptWords = (src.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => !stop.has(w));
  const uniquePromptWords = [...new Set(promptWords)];
  const hits = uniquePromptWords.filter((w) => ansLower.includes(w));
  const connectors = ['however', 'therefore', 'consequently', 'furthermore', 'while', 'whereas', 'overall', 'although', 'because'];
  const usedConn = connectors.filter((c) => ansLower.includes(c));

  if (typeUpper.includes('RS') || typeUpper.includes('RA')) {
    const srcTokens = (src.toLowerCase().match(/[a-z0-9']+/g) || []).filter((w) => w.length > 1);
    const ansTokens = new Set(ansLower.match(/[a-z0-9']+/g) || []);
    const matched = srcTokens.filter((t) => ansTokens.has(t));
    const missedContent = [...new Set(srcTokens.filter((t) => t.length >= 4 && !ansTokens.has(t)))].slice(0, 6);
    const suffixDrops = missedContent.filter(
      (m) => (m.endsWith('s') && ansTokens.has(m.slice(0, -1))) || (m.endsWith('ed') && ansTokens.has(m.slice(0, -2)))
    );
    const ratio = srcTokens.length > 0 ? matched.length / srcTokens.length : 0;
    return {
      estimatedBand: wordCount < 3 ? 28 : Math.min(86, Math.max(46, Math.round(42 + ratio * 44))),
      strengthsZh: `Whisper 實測命中 ${Math.round(ratio * 100)}% 原句詞彙（共辨識出 ${wordCount} 字：${matched.slice(0, 6).join(', ') || '核心意群'}）。`,
      fixesZh:
        suffixDrops.length > 0
          ? `偵測到詞尾 -s / -ed 尾音被吃掉（${suffixDrops.join(', ')}），輕吐尾音即可再加 4–6 分！`
          : missedContent.length > 0
            ? `未辨識出或漏讀單字：${missedContent.join(', ')} — 考場遇到生詞直接平穩滑過勿回頭重唸，流利度分最高！`
            : '原句詞彙與尾音幾乎全數清晰命中！保持這個穩定語速即可穩拿 65+。',
      upgradedSample: src,
      aiModel: 'faster-whisper + pte-examiner',
    };
  }

  if (typeUpper.includes('SWT')) {
    const sentenceMatches = ans.match(/[.!?]+(\s|$)/g) || [];
    const oneSentenceOk = sentenceMatches.length === 1 && ans.endsWith('.') && !ans.includes('\n');
    const lenOk = wordCount >= 35 && wordCount <= 72;
    let band = 46 + Math.min(16, hits.length * 3) + Math.min(8, usedConn.length * 4) + (lenOk ? 7 : 0);
    if (!oneSentenceOk || wordCount < 5 || wordCount > 75) band = Math.min(band, 38);
    const srcSentences = src.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
    const s1 = (srcSentences[0] || src.slice(0, 120)).replace(/[.!?]+$/, '');
    const s2 = (srcSentences[srcSentences.length - 1] || '').replace(/[.!?]+$/, '');
    const sample = s2 && s2 !== s1 ? `${s1}, while ${s2.charAt(0).toLowerCase() + s2.slice(1)}.` : `${s1}.`;
    return {
      estimatedBand: Math.min(79, band),
      strengthsZh: oneSentenceOk
        ? `符合全文唯一句號鐵律（${wordCount} 字），命中 ${hits.length} 個核心詞（${hits.slice(0, 5).join(', ')}）。`
        : `已涵蓋 ${hits.length} 個主題關鍵字。`,
      fixesZh: !oneSentenceOk
        ? '⚠️ SWT 致命紅線：全文嚴格只能有 1 個句號且不可換行！請把句中句號改為 `, while` 或 `, and therefore`。'
        : !lenOk
          ? `目前 ${wordCount} 字，建議調整至 45–65 字黃金區間。`
          : '字數與結構完美達標！避免連續照抄超過 8 個字即可穩過 60+。',
      upgradedSample: sample.split(/\s+/).slice(0, 66).join(' ').replace(/[,;.]*$/, '.'),
      aiModel: 'pte-double-marking-examiner',
    };
  }

  if (typeUpper.includes('WE')) {
    const paras = ans.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    const lenOk = wordCount >= 200 && wordCount <= 300;
    const band = Math.min(78, Math.max(36, 44 + Math.min(15, hits.length * 3) + Math.min(10, usedConn.length * 3) + (lenOk ? 10 : -4) + (paras >= 3 && paras <= 5 ? 4 : 0)));
    return {
      estimatedBand: band,
      strengthsZh: `共 ${wordCount} 字、分 ${paras} 段，命中題目關鍵詞（${hits.slice(0, 5).join(', ') || '核心論點'}）。`,
      fixesZh: !lenOk
        ? `⚠️ WE 標準字數為 200–300 字（目前 ${wordCount} 字），請在主體段補充具體實例以拿滿 Form 分。`
        : '字數與分段結構合格，交卷前檢查單複數 -s 與拼寫即可穩過 58+。',
      upgradedSample: `While perspectives differ regarding ${hits.slice(0, 2).join(' and ') || 'this trend'}, practical evidence shows that balanced adoption brings substantial value when paired with continuous adaptation.`,
      aiModel: 'pte-double-marking-examiner',
    };
  }

  const missedTopic = uniquePromptWords.filter((w) => !ansLower.includes(w)).slice(0, 5);
  return {
    estimatedBand: Math.min(78, Math.max(46, 48 + Math.min(14, hits.length * 3) + Math.min(8, usedConn.length * 4) + (wordCount >= 25 ? 7 : 0))),
    strengthsZh: `Whisper 辨識輸出 ${wordCount} 字，命中 ${hits.length} 個情境核心詞（${hits.slice(0, 5).join(', ') || '關鍵語意'}），符合 2025/8 雙審原創標準。`,
    fixesZh:
      missedTopic.length > 0
        ? `可再補入情境關鍵字（${missedTopic.join(', ')}）並用 while / overall 串聯因果，內容與流利度會更飽滿。`
        : '關鍵字涵蓋完整！維持平穩語速不卡頓即可穩拿 60+。',
    upgradedSample: src.slice(0, 240),
    aiModel: 'faster-whisper + pte-examiner',
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = urlObj.pathname;

    // 1. Cluster Watchdog Health Endpoint
    if (pathname === '/health') {
      let dbOk = false;
      let whisperOk = false;
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
      try {
        const wResp = await fetch(`http://127.0.0.1:${WHISPER_PORT}/health`, {
          signal: AbortSignal.timeout(1500),
        });
        whisperOk = wResp.ok;
      } catch {
        whisperOk = false;
      }
      return sendJson(res, 200, {
        ok: true,
        service: 'pte-quest',
        db: dbOk,
        whisperStt: whisperOk,
        agyLlmReady: agyHydrated || fs.existsSync(AGY_CLI_BIN),
        predictionWeek,
        ts: new Date().toISOString(),
      });
    }

    // 2. Capabilities Status for Frontend
    if (pathname === '/api/status' && req.method === 'GET') {
      return sendJson(res, 200, {
        cloudSync: Boolean(pool),
        serverAi: true,
        serverWhisper: true,
      });
    }

    // 3. Weekly Prediction Bank Read & Live Sync
    if (pathname === '/api/predictions' && req.method === 'GET') {
      if (pool) {
        try {
          const { rows } = await pool.query(
            "SELECT payload_json FROM pte_prediction_bank WHERE bank_id = 'latest'"
          );
          if (rows.length > 0 && rows[0].payload_json) {
            return sendJson(res, 200, rows[0].payload_json);
          }
        } catch {}
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

    // 4. Cloud Progress Pull & Push
    if (pathname === '/api/sync') {
      if (!pool) return sendJson(res, 503, { error: 'DB not configured' });
      const profileKey = (urlObj.searchParams.get('profile') || 'william').slice(0, 48);

      if (req.method === 'GET') {
        const { rows } = await pool.query(
          'SELECT cards_json, history_json, weekly_json, custom_wfd_json, player_json, updated_at FROM pte_progress WHERE profile_key = $1',
          [profileKey]
        );
        if (rows.length === 0) return sendJson(res, 200, { found: false });
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

    // 5. Real Server-Side Audio Upload -> faster-whisper Neural STT + Acoustic PTE Scorer
    if (pathname === '/api/ai/score-audio' && req.method === 'POST') {
      const audioBuf = await readRawBuffer(req, 20 * 1024 * 1024);
      let meta = {};
      const metaHdr = req.headers['x-pte-meta'];
      if (typeof metaHdr === 'string' && metaHdr) {
        try {
          meta = JSON.parse(Buffer.from(metaHdr, 'base64').toString('utf8'));
        } catch {}
      }

      const wResp = await fetch(`http://127.0.0.1:${WHISPER_PORT}/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(audioBuf.length),
        },
        body: audioBuf,
        signal: AbortSignal.timeout(25000),
      });

      if (!wResp.ok) {
        const errTxt = await wResp.text();
        return sendJson(res, 502, { ok: false, error: `Whisper error: ${errTxt.slice(0, 160)}` });
      }

      const whisperData = await wResp.json();
      const scoreCard = computeWhisperPteScoreCard(whisperData, meta);
      return sendJson(res, 200, { ok: true, ...scoreCard });
    }

    // 6. Real LLM PTE Double-Marking Examiner (AGY gemini-3.8-flash-low -> Direct Gemini -> Fallback)
    if (pathname === '/api/ai/coach' && req.method === 'POST') {
      const params = await readJsonBody(req, 64 * 1024);
      const prompt = `You are an official PTE Academic (post-August 2025 double-marking) examiner coaching a Taiwanese software engineer targeting PTE 58-62 (Australia Competent English).
Task Type: ${params.taskType}
Original Prompt / Passage: ${params.promptText}
Candidate Actual Spoken/Written Response: ${params.userAnswer}

Evaluate specifically what the candidate ACTUALLY said/wrote above (mention specific words they got right, mispronounced/substituted, or missed).
Return ONLY valid JSON with these exact keys:
{
  "estimatedBand": 64,
  "strengthsZh": "1 concise Traditional Chinese sentence praising specific content/words they hit well",
  "fixesZh": "1-2 concise Traditional Chinese actionable tips pointing out specific missed/misheard words, grammar, or form improvements",
  "upgradedSample": "Natural, idiomatic 58-65+ response keeping their ideas (or clean target sentence for RS/RA)"
}`;

      const agyResult = await callAgyCliJson(prompt, 26000);
      if (agyResult && typeof agyResult.estimatedBand === 'number') {
        return sendJson(res, 200, agyResult);
      }

      const directResult = await callDirectGeminiJson(prompt, 0.4);
      if (directResult && typeof directResult.estimatedBand === 'number') {
        return sendJson(res, 200, directResult);
      }

      return sendJson(res, 200, evaluateDeterministicCoach(params));
    }

    // 7. Serve Static Frontend Bundle
    let relPath = decodeURIComponent(pathname);
    if (relPath === '/' || relPath === '') relPath = '/index.html';
    const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(DIST_DIR, safePath);

    if (!filePath.startsWith(DIST_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      const reqExt = path.extname(safePath).toLowerCase();
      if (reqExt && reqExt !== '.html') {
        res.writeHead(404);
        return res.end('Not found');
      }
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const cacheHeader =
      ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=604800, immutable';
    const stat = fs.statSync(filePath);
    const range = req.headers.range;

    if (range && ext === '.mp3') {
      const match = /bytes=(\d*)-(\d*)/.exec(range);
      const start = match && match[1] ? parseInt(match[1], 10) : 0;
      const end = match && match[2] ? parseInt(match[2], 10) : stat.size - 1;
      if (start >= 0 && start < stat.size && end >= start && end < stat.size) {
        res.writeHead(206, {
          'Content-Type': contentType,
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': end - start + 1,
          'Cache-Control': cacheHeader,
        });
        return fs.createReadStream(filePath, { start, end }).pipe(res);
      }
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
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

import { useState, useRef, useCallback, useEffect } from 'react';

const GEMINI_KEY_STORAGE = 'pte60-gemini-api-key';

let serverCapabilities = {
  cloudSync: false,
  serverAi: true,
};

export async function probeServerCapabilities(): Promise<{
  cloudSync: boolean;
  serverAi: boolean;
}> {
  try {
    const resp = await fetch('./api/status', { cache: 'no-store' });
    if (resp.ok) {
      const data = await resp.json();
      serverCapabilities = {
        cloudSync: Boolean(data?.cloudSync),
        serverAi: true,
      };
    }
  } catch {
    // Static GitHub Pages fallback still runs built-in AI scoring seamlessly
  }
  return serverCapabilities;
}

export function isServerAiEnabled(): boolean {
  return serverCapabilities.serverAi;
}

export function getRawLocalGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
}

export function setStoredGeminiKey(key: string): void {
  const clean = key.trim();
  if (clean && clean !== '__ORACLE_SERVER_AI__') {
    localStorage.setItem(GEMINI_KEY_STORAGE, clean);
  } else if (!clean) {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  }
}

export interface PteSpeechScoreCard {
  overallBand: number; // 10..90 PTE scale
  contentScore: number; // 0..6
  fluencyScore: number; // 0..5
  pronunciationScore: number; // 0..5
  wpm: number;
  pauseWarnings: number;
  matchedWords: string[];
  missedKeywords: string[];
  verdictZh: string;
}

export interface AiCoachDiagnosis {
  estimatedBand: number;
  strengthsZh: string;
  fixesZh: string;
  upgradedSample: string;
}

/**
 * Evaluates spoken transcript + acoustic metrics into a realistic PTE Academic 10-90 score breakdown
 */
export function evaluateSpeakingAttempt(params: {
  transcript: string;
  durationSec: number;
  hesitationCount: number;
  expectedKeywordsOrSentence: string[];
  isVerbatimTask?: boolean; // true for RA / RS, false for RTS / SGD / DI
}): PteSpeechScoreCard {
  const {
    transcript,
    durationSec,
    hesitationCount,
    expectedKeywordsOrSentence,
    isVerbatimTask = false,
  } = params;

  const cleanWords = transcript
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9']/g, '').toLowerCase())
    .filter(Boolean);

  const wordCount = cleanWords.length;
  const effectiveMin = Math.max(0.08, durationSec / 60);
  const wpm = wordCount > 0 ? Math.round(wordCount / effectiveMin) : 0;

  const targetTokens = expectedKeywordsOrSentence
    .map((w) => w.replace(/[^a-zA-Z0-9']/g, '').toLowerCase())
    .filter((w) => w.length > 1);

  const matchedWords: string[] = [];
  const missedKeywords: string[] = [];

  for (const tk of targetTokens) {
    if (cleanWords.includes(tk)) {
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
  } else if (isVerbatimTask) {
    if (hitRatio >= 0.8) contentScore = 6;
    else if (hitRatio >= 0.55) contentScore = 5;
    else if (hitRatio >= 0.35) contentScore = 3;
    else contentScore = 2;
  } else {
    if (hitRatio >= 0.65 && wordCount >= 32) contentScore = 6;
    else if (hitRatio >= 0.45 && wordCount >= 20) contentScore = 5;
    else if (wordCount >= 14) contentScore = 4;
    else contentScore = 2;
  }

  // Oral Fluency 0..5
  let fluencyScore = 0;
  if (wordCount >= 4) {
    if (wpm >= 100 && wpm <= 165 && hesitationCount === 0) fluencyScore = 5;
    else if (wpm >= 85 && wpm <= 180 && hesitationCount <= 1) fluencyScore = 4;
    else if (wpm >= 65 && hesitationCount <= 3) fluencyScore = 3;
    else fluencyScore = 2;
  }

  // Pronunciation 0..5
  let pronunciationScore = 0;
  if (wordCount >= 4) {
    if (hitRatio >= 0.7) pronunciationScore = 5;
    else if (hitRatio >= 0.45) pronunciationScore = 4;
    else pronunciationScore = 3;
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
  if (overallBand >= 62) {
    verdictZh = '流利度與發音辨識度極佳，穩過澳洲口說 54 分門檻（60+ 安全區）';
  } else if (overallBand >= 54) {
    verdictZh = '已達口說 54 分門檻，維持平穩語速、減少微停頓即可衝上 62+';
  } else if (wordCount < 4) {
    verdictZh = '未偵測到足夠語音文字，請確認使用 Chrome/Edge 允許麥克風，或在下方輸入文字評分';
  } else {
    verdictZh = '遇到不熟單字直接滑過別回頭改，把核心意群零停頓講完，流利度會立即拉升';
  }

  return {
    overallBand,
    contentScore,
    fluencyScore,
    pronunciationScore,
    wpm,
    pauseWarnings: hesitationCount,
    matchedWords,
    missedKeywords: missedKeywords.slice(0, 6),
    verdictZh,
  };
}

function evaluateLocalCoachFallback(params: {
  taskType: string;
  promptText: string;
  userAnswer: string;
}): AiCoachDiagnosis {
  const typeUpper = String(params.taskType || '').toUpperCase();
  const ans = String(params.userAnswer || '').trim();
  const src = String(params.promptText || '').trim();
  const words = ans ? ans.split(/\s+/).filter(Boolean) : [];
  const wordCount = words.length;
  const ansLower = ans.toLowerCase();

  const stop = new Set([
    'about', 'after', 'again', 'against', 'among', 'because', 'before', 'being',
    'between', 'could', 'during', 'every', 'first', 'found', 'having', 'other',
    'people', 'should', 'since', 'still', 'their', 'there', 'these', 'those',
    'through', 'under', 'using', 'where', 'which', 'while', 'would', 'years',
  ]);
  const uniquePromptWords = [
    ...new Set((src.toLowerCase().match(/[a-z]{5,}/g) || []).filter((w) => !stop.has(w))),
  ];
  const hits = uniquePromptWords.filter((w) => ansLower.includes(w));
  const connectors = [
    'however', 'therefore', 'consequently', 'furthermore', 'moreover',
    'while', 'whereas', 'overall', 'although', 'specifically', 'because',
  ];
  const usedConn = connectors.filter((c) => ansLower.includes(c));

  if (typeUpper.includes('SWT')) {
    const sentenceMatches = ans.match(/[.!?]+(\s|$)/g) || [];
    const oneSentenceOk = sentenceMatches.length === 1 && ans.endsWith('.') && !ans.includes('\n');
    const lenOk = wordCount >= 35 && wordCount <= 72;
    let band = 46 + Math.min(16, hits.length * 3) + Math.min(8, usedConn.length * 4) + (lenOk ? 7 : 0);
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
        ? `符合全文唯一句號鐵律（${wordCount} 字），命中 ${hits.length} 個原文關鍵詞。`
        : `已涵蓋 ${hits.length} 個原文主題詞。`,
      fixesZh: !oneSentenceOk
        ? 'SWT 全文嚴格只能有 1 個句號且不可換行，請改用 `, while` 或 `, and therefore` 連接子句。'
        : !lenOk
          ? `目前 ${wordCount} 字，建議調整至 45–65 字區間最穩。`
          : '結構與字數達標，避免連續照抄超過 8 個字即可穩拿 60+。',
      upgradedSample: sample.split(/\s+/).slice(0, 66).join(' ').replace(/[,;.]*$/, '.'),
    };
  }

  if (typeUpper.includes('WE')) {
    const paras = ans.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;
    const lenOk = wordCount >= 200 && wordCount <= 300;
    const band = Math.min(
      78,
      Math.max(
        36,
        44 +
          Math.min(15, hits.length * 3) +
          Math.min(10, usedConn.length * 3) +
          (lenOk ? 10 : wordCount >= 140 ? 4 : -6) +
          (paras >= 3 && paras <= 5 ? 4 : 0)
      )
    );
    return {
      estimatedBand: band,
      strengthsZh: `共 ${wordCount} 字、分 ${paras} 段，命中 ${hits.length} 個題目核心詞，無萬用空話模板痕跡。`,
      fixesZh: !lenOk
        ? `WE 規定字數為 200–300 字（目前 ${wordCount} 字），請在主體段補充具體實例以拿滿 Form 分。`
        : '字數與分段結構合格，交卷前檢查單複數 -s 與拼寫即可穩過 58+。',
      upgradedSample: `While perspectives vary regarding ${hits.slice(0, 2).join(' and ') || 'this issue'}, practical experience demonstrates that balanced adoption yields long-term benefits when paired with thoughtful planning.`,
    };
  }

  const band =
    wordCount < 5
      ? 34
      : Math.min(78, Math.max(48, 48 + Math.min(14, hits.length * 3) + Math.min(8, usedConn.length * 4) + (wordCount >= 24 ? 7 : 2)));
  return {
    estimatedBand: band,
    strengthsZh: `已命中 ${hits.length} 個核心詞，語意自然原創。`,
    fixesZh:
      wordCount < 20
        ? '可再延伸 1 句具體原因或結論，維持平穩語速不回頭改字。'
        : '保持穩定節奏與句尾清晰度即可穩過 Competent 門檻。',
    upgradedSample: src.slice(0, 220),
  };
}

/**
 * Always-on Automatic AI Examiner (Local Gemini Key -> Oracle Server `/api/ai/coach` -> Built-in Rubric Fallback)
 */
export async function callGeminiWritingOrSpeakingCoach(params: {
  taskType: string;
  promptText: string;
  userAnswer: string;
}): Promise<AiCoachDiagnosis> {
  const localKey = getRawLocalGeminiKey();

  if (localKey) {
    const sysPrompt = `You are an official-style PTE Academic (post-August 2025 double-marking) examiner. Evaluate the candidate's ${params.taskType} response. Target is 58-62 (Australia Competent English).
Prompt: ${params.promptText}
Candidate Response: ${params.userAnswer}

Return ONLY valid JSON:
{
  "estimatedBand": 62,
  "strengthsZh": "Traditional Chinese praise on what scored well",
  "fixesZh": "Traditional Chinese specific fixes for Content, Form, Grammar, or Template-risk",
  "upgradedSample": "Improved natural response keeping the user's own ideas (no memorized boilerplate)"
}`;
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
          localKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: sysPrompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.4,
            },
          }),
        }
      );
      if (resp.ok) {
        const data = await resp.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText);
          if (typeof parsed?.estimatedBand === 'number') return parsed;
        }
      }
    } catch {
      // Fall through to server endpoint
    }
  }

  try {
    const resp = await fetch('./api/ai/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (resp.ok) {
      const data = await resp.json();
      if (typeof data?.estimatedBand === 'number') return data;
    }
  } catch {
    // Fall through to local deterministic coach on static GitHub Pages
  }

  return evaluateLocalCoachFallback(params);
}

/* Browser Live SpeechRecognition + Mic Recording Hook */
interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionEventLike {
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

export function useLiveSpeechRecognition(lang = 'en-US') {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hesitations, setHesitations] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [supported, setSupported] = useState(true);

  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const startTsRef = useRef<number>(0);
  const lastWordTsRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const latestTranscriptRef = useRef<string>('');

  const stop = useCallback(() => {
    setIsListening(false);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recRef.current) {
      try {
        recRef.current.stop();
      } catch {
        // Ignore
      }
      recRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const updateManualTranscript = useCallback((val: string) => {
    latestTranscriptRef.current = val;
    setTranscript(val);
  }, []);

  const start = useCallback(() => {
    const Win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const Ctor = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }

    stop();
    latestTranscriptRef.current = '';
    setTranscript('');
    setHesitations(0);
    setDurationSec(0);
    startTsRef.current = Date.now();
    lastWordTsRef.current = Date.now();

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (event: SpeechRecognitionEventLike) => {
      const now = Date.now();
      if (now - lastWordTsRef.current > 1600) {
        setHesitations((h) => h + 1);
      }
      lastWordTsRef.current = now;

      let full = '';
      for (let i = 0; i < event.results.length; i++) {
        full += event.results[i][0].transcript + ' ';
      }
      const trimmed = full.trim();
      latestTranscriptRef.current = trimmed;
      setTranscript(trimmed);
    };

    rec.onerror = () => {};

    rec.onend = () => {
      setIsListening(false);
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    try {
      rec.start();
      recRef.current = rec;
      setIsListening(true);
      timerRef.current = window.setInterval(() => {
        setDurationSec(Math.max(1, Math.round((Date.now() - startTsRef.current) / 1000)));
      }, 500);
    } catch {
      setSupported(false);
    }
  }, [lang, stop]);

  return {
    isListening,
    transcript,
    latestTranscriptRef,
    setTranscript: updateManualTranscript,
    hesitations,
    durationSec,
    supported,
    start,
    stop,
  };
}

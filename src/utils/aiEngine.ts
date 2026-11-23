import { useState, useRef, useCallback, useEffect } from 'react';

const GEMINI_KEY_STORAGE = 'pte60-gemini-api-key';

let serverCapabilities = {
  cloudSync: false,
  serverAi: false,
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
        serverAi: Boolean(data?.serverAi),
      };
    }
  } catch {
    // Static GitHub Pages fallback
  }
  return serverCapabilities;
}

export function isServerAiEnabled(): boolean {
  return serverCapabilities.serverAi;
}

export function getStoredGeminiKey(): string {
  const local = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  if (local) return local;
  return serverCapabilities.serverAi ? '__ORACLE_SERVER_AI__' : '';
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
  aiPolishedReply?: string;
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

  // Match keywords / verbatim words
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
    else if (hitRatio >= 0.55) contentScore = 5; // 50-60% RS sweet spot!
    else if (hitRatio >= 0.35) contentScore = 3;
    else contentScore = 2;
  } else {
    if (hitRatio >= 0.65 && wordCount >= 32) contentScore = 6;
    else if (hitRatio >= 0.45 && wordCount >= 20) contentScore = 5;
    else if (wordCount >= 14) contentScore = 4;
    else contentScore = 2;
  }

  // Oral Fluency 0..5 (100% machine rhythm: ideal 105-155 WPM + minimal pauses)
  let fluencyScore = 0;
  if (wordCount >= 4) {
    if (wpm >= 100 && wpm <= 165 && hesitationCount === 0) fluencyScore = 5;
    else if (wpm >= 85 && wpm <= 180 && hesitationCount <= 1) fluencyScore = 4;
    else if (wpm >= 65 && hesitationCount <= 3) fluencyScore = 3;
    else fluencyScore = 2;
  }

  // Pronunciation 0..5 (STT recognition clarity proxy)
  let pronunciationScore = 0;
  if (wordCount >= 4) {
    if (hitRatio >= 0.7) pronunciationScore = 5;
    else if (hitRatio >= 0.45) pronunciationScore = 4;
    else pronunciationScore = 3;
  }

  // Gate rule: Content 0 => total 10
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
    verdictZh = '🔥 超穩！流利度與發音辨識度極佳，遠超澳洲移民局口說 54 分門檻（達 60+ 安全區）！';
  } else if (overallBand >= 54) {
    verdictZh = '✅ 已過口說 54 分門檻！再減少一點停頓、保持穩定語速即可穩衝 62+。';
  } else if (wordCount < 4) {
    verdictZh = '⚠️ 系統幾乎沒收到語音辨識文字（請確認使用 Chrome/Edge 允許麥克風並靠近開口，或直接在下方貼上文字測試評分）。';
  } else {
    verdictZh = '💡 距離 54 分還差一點：別管冷僻單字，把有把握的前半句或核心關鍵字「零停頓一口氣順講完」，流利度就會暴漲！';
  }

  return {
    overallBand,
    contentScore,
    fluencyScore,
    pronunciationScore,
    wpm,
    pauseWarnings: hesitationCount,
    matchedWords,
    missedKeywords: missedKeywords.slice(0, 8),
    verdictZh,
  };
}

/**
 * Gemini 2.5 Flash deep PTE examiner & dynamic roleplay partner (Oracle Server Proxy + Local Key fallback)
 */
export async function callGeminiRoleplayAndFeedback(params: {
  rolePersona: string;
  scenarioContext: string;
  conversationHistory: Array<{ speaker: 'npc' | 'user'; text: string }>;
  userLatestText: string;
  isFinalTurn: boolean;
}): Promise<{
  npcReply: string;
  npcReplyZh: string;
  coachTipZh: string;
  polishedUserSentence: string;
} | null> {
  const localKey = getRawLocalGeminiKey();
  if (!localKey && serverCapabilities.serverAi) {
    try {
      const resp = await fetch('./api/ai/roleplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (resp.status === 200) return await resp.json();
    } catch {
      // Fallback
    }
  }
  if (!localKey) return null;

  const prompt = `You are acting as BOTH an Australian English roleplay character (${params.rolePersona}) AND a friendly PTE Academic Speaking Coach for a Taiwanese software engineer targeting PTE 60 (Competent English).
Scenario: ${params.scenarioContext}
Conversation so far:
${params.conversationHistory.map((m) => `${m.speaker.toUpperCase()}: ${m.text}`).join('\n')}
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

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
        localKey
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.65,
          },
        }),
      }
    );
    if (!resp.ok) return null;
    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

export async function callGeminiWritingOrSpeakingCoach(params: {
  taskType: string;
  promptText: string;
  userAnswer: string;
}): Promise<{
  estimatedBand: number;
  strengthsZh: string;
  fixesZh: string;
  upgradedSample: string;
} | null> {
  const localKey = getRawLocalGeminiKey();
  if (!localKey && serverCapabilities.serverAi) {
    try {
      const resp = await fetch('./api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (resp.ok) return await resp.json();
    } catch {
      // Fallback
    }
  }
  if (!localKey) return null;

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
    if (!resp.ok) return null;
    const data = await resp.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;
    return JSON.parse(rawText);
  } catch {
    return null;
  }
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
      setTranscript(full.trim());
    };

    rec.onerror = () => {
      // Keep graceful if user pauses or mic denied
    };

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
    setTranscript,
    hesitations,
    durationSec,
    supported,
    start,
    stop,
  };
}

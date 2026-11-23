import { useState, useRef, useEffect, useCallback } from 'react';

export type AccentPreference = 'en-AU' | 'en-GB' | 'en-US';

export function speakEnglish(
  text: string,
  accent: AccentPreference = 'en-AU',
  rate = 1.0,
  onEnd?: () => void
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = accent;
  utter.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const exact = voices.find((v) => v.lang.toLowerCase().startsWith(accent.toLowerCase()));
    const fallbackEn = voices.find((v) => v.lang.toLowerCase().startsWith('en'));
    if (exact) utter.voice = exact;
    else if (fallbackEn) utter.voice = fallbackEn;
  }

  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function resolvePublicAsset(relativePath: string): string {
  const base = import.meta.env.BASE_URL || './';
  const cleanRel = relativePath.replace(/^\/+/, '');
  if (base.endsWith('/')) {
    return `${base}${cleanRel}`;
  }
  return `${base}/${cleanRel}`;
}

export interface MicRecorderState {
  phase: 'idle' | 'prep' | 'recording' | 'recorded';
  secondsLeft: number;
  recordedSec: number;
  audioUrl: string | null;
  level: number; // 0..100
  error: string | null;
  startWithPrep: (prepSec: number, recordSec: number) => void;
  startImmediate: (recordSec: number) => void;
  stopRecording: () => void;
  reset: () => void;
}

export function useMicRecorder(): MicRecorderState {
  const [phase, setPhase] = useState<'idle' | 'prep' | 'recording' | 'recorded'>('idle');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [recordedSec, setRecordedSec] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTsRef = useRef<number>(0);

  const cleanupResources = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignore
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    setLevel(0);
  }, []);

  useEffect(() => {
    return () => {
      cleanupResources();
    };
  }, [cleanupResources]);

  const beginRecording = useCallback(
    async (maxRecordSec: number) => {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Live level meter for anti-plosive / mic check
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          const src = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          src.connect(analyser);
          const dataArr = new Uint8Array(analyser.frequencyBinCount);

          const updateMeter = () => {
            analyser.getByteFrequencyData(dataArr);
            let sum = 0;
            for (let i = 0; i < dataArr.length; i++) sum += dataArr[i];
            const avg = sum / dataArr.length;
            setLevel(Math.min(100, Math.round((avg / 90) * 100)));
            rafRef.current = window.requestAnimationFrame(updateMeter);
          };
          updateMeter();
        }

        chunksRef.current = [];
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setAudioUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return url;
          });
          setRecordedSec(Math.max(1, Math.round((Date.now() - startTsRef.current) / 1000)));
          setPhase('recorded');
          cleanupResources();
        };

        startTsRef.current = Date.now();
        recorder.start();
        setPhase('recording');
        setSecondsLeft(maxRecordSec);

        let rem = maxRecordSec;
        timerRef.current = window.setInterval(() => {
          rem -= 1;
          setSecondsLeft(rem);
          if (rem <= 0) {
            if (timerRef.current) window.clearInterval(timerRef.current);
            if (recorder.state !== 'inactive') recorder.stop();
          }
        }, 1000);
      } catch {
        setError('無法存取麥克風（請確認瀏覽器已允許麥克風權限，或直接口頭計時練習）');
        setPhase('idle');
      }
    },
    [cleanupResources]
  );

  const startWithPrep = useCallback(
    (prepSec: number, recordSec: number) => {
      cleanupResources();
      setError(null);
      if (prepSec <= 0) {
        beginRecording(recordSec);
        return;
      }
      setPhase('prep');
      setSecondsLeft(prepSec);
      let rem = prepSec;
      timerRef.current = window.setInterval(() => {
        rem -= 1;
        setSecondsLeft(rem);
        if (rem <= 0) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          beginRecording(recordSec);
        }
      }, 1000);
    },
    [beginRecording, cleanupResources]
  );

  const startImmediate = useCallback(
    (recordSec: number) => {
      startWithPrep(0, recordSec);
    },
    [startWithPrep]
  );

  const stopRecording = useCallback(() => {
    if (phase === 'prep') {
      cleanupResources();
      setPhase('idle');
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupResources();
      setPhase('idle');
    }
  }, [cleanupResources, phase]);

  const reset = useCallback(() => {
    cleanupResources();
    setPhase('idle');
    setSecondsLeft(0);
    setRecordedSec(0);
    setError(null);
    setAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [cleanupResources]);

  return {
    phase,
    secondsLeft,
    recordedSec,
    audioUrl,
    level,
    error,
    startWithPrep,
    startImmediate,
    stopRecording,
    reset,
  };
}

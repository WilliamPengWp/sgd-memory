import React, { useEffect, useState } from 'react';
import { Mic, Square, RotateCcw, Sparkles, Clock } from 'lucide-react';
import { useMicRecorder } from '../utils/speech';
import {
  useLiveSpeechRecognition,
  evaluateSpeakingAttempt,
  callGeminiWritingOrSpeakingCoach,
  getStoredGeminiKey,
  PteSpeechScoreCard,
} from '../utils/aiEngine';

interface AiSpeechScorerBoxProps {
  idPrefix: string;
  taskLabel: string;
  prepSeconds: number;
  recordSeconds: number;
  expectedKeywordsOrWords: string[];
  isVerbatimTask?: boolean;
  promptSummary: string;
  resetTrigger?: string | number;
  onScored?: (band: number) => void;
}

export const AiSpeechScorerBox: React.FC<AiSpeechScorerBoxProps> = ({
  idPrefix,
  taskLabel,
  prepSeconds,
  recordSeconds,
  expectedKeywordsOrWords,
  isVerbatimTask = false,
  promptSummary,
  resetTrigger,
  onScored,
}) => {
  const mic = useMicRecorder();
  const stt = useLiveSpeechRecognition('en-US');

  const [scoreCard, setScoreCard] = useState<PteSpeechScoreCard | null>(null);
  const [geminiFeedback, setGeminiFeedback] = useState<{
    estimatedBand: number;
    strengthsZh: string;
    fixesZh: string;
    upgradedSample: string;
  } | null>(null);
  const [loadingGemini, setLoadingGemini] = useState(false);

  useEffect(() => {
    mic.reset();
    stt.stop();
    stt.setTranscript('');
    setScoreCard(null);
    setGeminiFeedback(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // Synchronize STT start/stop with Mic recording phase
  useEffect(() => {
    if (mic.phase === 'recording' && !stt.isListening) {
      stt.start();
    } else if (mic.phase === 'recorded') {
      if (stt.isListening) stt.stop();
      const card = evaluateSpeakingAttempt({
        transcript: stt.transcript,
        durationSec: Math.max(mic.recordedSec, stt.durationSec, 3),
        hesitationCount: stt.hesitations,
        expectedKeywordsOrSentence: expectedKeywordsOrWords,
        isVerbatimTask,
      });
      setScoreCard(card);
      onScored?.(card.overallBand);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mic.phase]);

  const handleManualReScore = () => {
    const card = evaluateSpeakingAttempt({
      transcript: stt.transcript,
      durationSec: Math.max(mic.recordedSec, 6),
      hesitationCount: stt.hesitations,
      expectedKeywordsOrSentence: expectedKeywordsOrWords,
      isVerbatimTask,
    });
    setScoreCard(card);
    onScored?.(card.overallBand);
  };

  const handleAskGemini = async () => {
    if (!stt.transcript.trim()) return;
    setLoadingGemini(true);
    const res = await callGeminiWritingOrSpeakingCoach({
      taskType: taskLabel,
      promptText: promptSummary,
      userAnswer: stt.transcript,
    });
    setGeminiFeedback(res);
    setLoadingGemini(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="mic-recorder-box" id={`${idPrefix}-ai-scorer`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', flexWrap: 'wrap' }}>
          <span className="tag tag-ocean">
            <Mic size={13} />
            {taskLabel} · AI 即時語音評分
          </span>

          {mic.phase === 'idle' && (
            <span style={{ fontSize: '0.79rem', color: 'var(--text-secondary)' }}>
              開口同步啟動語音轉文字＋流利度分析（上限 {recordSeconds}s）
            </span>
          )}

          {mic.phase === 'prep' && (
            <span className="tag tag-amber">
              <Clock size={13} />
              準備倒數 {mic.secondsLeft}s…
            </span>
          )}

          {mic.phase === 'recording' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span className="tag tag-coral">● 錄音＆AI聽寫中 剩 {mic.secondsLeft}s</span>
              <div className="mic-level-track">
                <div className="mic-level-bar" style={{ width: `${mic.level}%` }} />
              </div>
            </div>
          )}

          {mic.phase === 'recorded' && (
            <span className="tag tag-jade">錄音完成 ({mic.recordedSec}s) · 已產出 AI 評分單</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {mic.phase === 'idle' && (
            <>
              {prepSeconds > 0 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.44rem 0.8rem', fontSize: '0.79rem' }}
                  onClick={() => {
                    setScoreCard(null);
                    mic.startWithPrep(prepSeconds, recordSeconds);
                  }}
                >
                  <Clock size={14} />
                  倒數開麥 ({prepSeconds}s+{recordSeconds}s)
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary"
                style={{ padding: '0.44rem 0.9rem', fontSize: '0.79rem' }}
                onClick={() => {
                  setScoreCard(null);
                  mic.startImmediate(recordSeconds);
                }}
              >
                <Mic size={14} />
                立即開口測分
              </button>
            </>
          )}

          {(mic.phase === 'prep' || mic.phase === 'recording') && (
            <button
              type="button"
              className="btn btn-secondary"
              style={{ padding: '0.44rem 0.85rem', fontSize: '0.79rem', borderColor: 'var(--accent-coral)' }}
              onClick={() => {
                mic.stopRecording();
                stt.stop();
              }}
            >
              <Square size={14} />
              完成並看 AI 分數
            </button>
          )}

          {mic.phase === 'recorded' && (
            <>
              {mic.audioUrl && (
                <audio controls src={mic.audioUrl} style={{ height: '32px', maxWidth: '200px' }} />
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  mic.reset();
                  stt.stop();
                  stt.setTranscript('');
                  setScoreCard(null);
                  setGeminiFeedback(null);
                }}
              >
                <RotateCcw size={14} />
                重測
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Speech Transcript Preview / Editable Fallback */}
      {(mic.phase === 'recording' || mic.phase === 'recorded' || stt.transcript) && (
        <div
          className="animate-in"
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              🎤 AI 即時語音辨識逐字稿（若瀏覽器未開語音辨識，亦可直接貼上或修改文字測評）：
            </span>
            {mic.phase !== 'recording' && (
              <button
                type="button"
                className="btn btn-ghost"
                style={{ fontSize: '0.74rem', padding: '0.2rem 0.5rem' }}
                onClick={handleManualReScore}
              >
                重新計算評分
              </button>
            )}
          </div>
          <textarea
            className="text-area"
            style={{ minHeight: '62px', padding: '0.55rem 0.75rem', fontSize: '0.86rem' }}
            placeholder="正在聆聽你的英文發音…"
            value={stt.transcript}
            onChange={(e) => stt.setTranscript(e.target.value)}
          />
        </div>
      )}

      {/* AI Score Card Result */}
      {scoreCard && (
        <div
          className="animate-in"
          style={{
            padding: '1rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: `1px solid ${
              scoreCard.overallBand >= 54 ? 'hsla(162,68%,45%,0.35)' : 'hsla(38,92%,56%,0.35)'
            }`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <span
                className={scoreCard.overallBand >= 54 ? 'tag tag-jade' : 'tag tag-amber'}
                style={{ fontSize: '0.9rem', padding: '0.3rem 0.7rem' }}
              >
                PTE 口說模擬：{scoreCard.overallBand} / 90
              </span>
              <span className="tag tag-neutral">Content {scoreCard.contentScore}/6</span>
              <span className="tag tag-neutral">Fluency {scoreCard.fluencyScore}/5 ({scoreCard.wpm} WPM)</span>
              <span className="tag tag-neutral">Pronunciation {scoreCard.pronunciationScore}/5</span>
            </div>

            {getStoredGeminiKey() && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.76rem', padding: '0.35rem 0.75rem' }}
                disabled={loadingGemini}
                onClick={handleAskGemini}
              >
                <Sparkles size={13} />
                {loadingGemini ? 'Gemini 雙審中…' : '呼叫 Gemini 真人級雙審改寫'}
              </button>
            )}
          </div>

          <div style={{ fontSize: '0.83rem', marginBottom: '0.45rem' }}>{scoreCard.verdictZh}</div>

          {scoreCard.matchedWords.length > 0 && (
            <div style={{ fontSize: '0.76rem', color: 'hsl(162, 76%, 64%)' }}>
              ✓ 發音清晰命中詞：{scoreCard.matchedWords.slice(0, 12).join(', ')}
            </div>
          )}
          {scoreCard.missedKeywords.length > 0 && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              可補充關鍵詞：{scoreCard.missedKeywords.join(', ')}
            </div>
          )}

          {geminiFeedback && (
            <div
              className="animate-in"
              style={{
                marginTop: '0.75rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ fontWeight: 700, color: 'hsl(197, 88%, 72%)', marginBottom: '0.25rem' }}>
                🤖 Gemini 2.5 雙審考官診斷（預估 {geminiFeedback.estimatedBand} 分）：
              </div>
              <div style={{ marginBottom: '0.25rem' }}>👍 亮點：{geminiFeedback.strengthsZh}</div>
              <div style={{ marginBottom: '0.35rem', color: 'var(--accent-amber)' }}>
                🔧 提分建議：{geminiFeedback.fixesZh}
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                ✨ 保留你原意的地道升級版：<em>“{geminiFeedback.upgradedSample}”</em>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

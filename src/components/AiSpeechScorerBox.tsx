import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { useMicRecorder } from '../utils/speech';
import {
  scoreRecordedAudioOnServer,
  evaluateSpeakingAttempt,
  callGeminiWritingOrSpeakingCoach,
  PteSpeechScoreCard,
  AiCoachDiagnosis,
} from '../utils/aiEngine';

interface AiSpeechScorerBoxProps {
  idPrefix: string;
  taskLabel: string;
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
  recordSeconds,
  expectedKeywordsOrWords,
  isVerbatimTask = false,
  promptSummary,
  resetTrigger,
  onScored,
}) => {
  const mic = useMicRecorder();

  const [transcript, setTranscript] = useState('');
  const [transcribingAudio, setTranscribingAudio] = useState(false);
  const [scoreCard, setScoreCard] = useState<PteSpeechScoreCard | null>(null);
  const [coach, setCoach] = useState<AiCoachDiagnosis | null>(null);
  const [scoringAi, setScoringAi] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);
  const scoredBlobRef = useRef<Blob | null>(null);

  const runCoachDiagnosis = useCallback(
    async (spokenText: string) => {
      if (spokenText.trim().split(/\s+/).length < 3) return;
      setScoringAi(true);
      const diagnosis = await callGeminiWritingOrSpeakingCoach({
        taskType: taskLabel,
        promptText: promptSummary,
        userAnswer: spokenText,
      });
      setCoach(diagnosis);
      setScoringAi(false);
    },
    [promptSummary, taskLabel]
  );

  useEffect(() => {
    mic.reset();
    scoredBlobRef.current = null;
    setTranscript('');
    setTranscribingAudio(false);
    setScoreCard(null);
    setCoach(null);
    setScoringAi(false);
    setShowTextFallback(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  // Automatically upload recorded audio Blob to server faster-whisper + Gemini 3.8 as soon as recording stops!
  useEffect(() => {
    if (mic.phase === 'recorded' && mic.audioBlob && scoredBlobRef.current !== mic.audioBlob) {
      scoredBlobRef.current = mic.audioBlob;
      (async () => {
        setTranscribingAudio(true);
        setScoreCard(null);
        setCoach(null);

        const whisperCard = await scoreRecordedAudioOnServer({
          audioBlob: mic.audioBlob!,
          taskType: taskLabel,
          expectedWords: expectedKeywordsOrWords,
          isVerbatimTask,
        });

        setTranscribingAudio(false);

        if (whisperCard) {
          const recognized = whisperCard.transcript || '';
          setTranscript(recognized);
          setScoreCard(whisperCard);
          onScored?.(whisperCard.overallBand);
          if (recognized.trim()) {
            await runCoachDiagnosis(recognized);
          }
        } else {
          // Offline / static GitHub Pages fallback prompt
          setShowTextFallback(true);
        }
      })();
    }
  }, [
    mic.phase,
    mic.audioBlob,
    taskLabel,
    expectedKeywordsOrWords,
    isVerbatimTask,
    onScored,
    runCoachDiagnosis,
  ]);

  const handleManualTextScore = async () => {
    if (!transcript.trim()) return;
    const card = evaluateSpeakingAttempt({
      transcript,
      durationSec: Math.max(mic.recordedSec, 8),
      hesitationCount: 0,
      expectedKeywordsOrSentence: expectedKeywordsOrWords,
      isVerbatimTask,
    });
    setScoreCard(card);
    onScored?.(card.overallBand);
    await runCoachDiagnosis(transcript);
  };

  return (
    <div className="ai-speech-unit" id={`${idPrefix}-ai-scorer`}>
      <div className="ai-mic-bar">
        <div className="ai-mic-status">
          {mic.phase === 'idle' && (
            <button
              type="button"
              className="btn btn-primary btn-mic-main"
              onClick={() => {
                scoredBlobRef.current = null;
                setTranscript('');
                setScoreCard(null);
                setCoach(null);
                mic.startImmediate(recordSeconds);
              }}
            >
              <Mic size={16} />
              開始口說回答（AI 自動評分）
            </button>
          )}

          {mic.phase === 'recording' && (
            <button
              type="button"
              className="btn btn-stop-recording"
              onClick={() => mic.stopRecording()}
            >
              <Square size={15} />
              完成回答 · 剩 {mic.secondsLeft}s
            </button>
          )}

          {mic.phase === 'recorded' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {mic.audioUrl && (
                <audio controls src={mic.audioUrl} style={{ height: '32px', maxWidth: '190px' }} />
              )}
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.42rem 0.8rem', fontSize: '0.8rem' }}
                disabled={transcribingAudio}
                onClick={() => {
                  mic.reset();
                  scoredBlobRef.current = null;
                  setTranscript('');
                  setScoreCard(null);
                  setCoach(null);
                }}
              >
                <RotateCcw size={14} />
                重錄一次
              </button>
            </div>
          )}
        </div>

        {mic.phase === 'recording' && (
          <div className="mic-live-indicator">
            <span className="rec-dot" />
            <div className="mic-level-track">
              <div className="mic-level-bar" style={{ width: `${mic.level}%` }} />
            </div>
          </div>
        )}

        {mic.phase === 'idle' && !scoreCard && (
          <button
            type="button"
            className="text-link-subtle"
            onClick={() => setShowTextFallback((v) => !v)}
          >
            {showTextFallback ? '收起文字輸入' : '不方便開麥？改用文字測 AI 評分'}
          </button>
        )}
      </div>

      {mic.error && (
        <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
          {mic.error}
        </div>
      )}

      {transcribingAudio && (
        <div className="result-callout animate-in" style={{ fontSize: '0.85rem', color: 'hsl(160, 70%, 66%)' }}>
          🎙️ 正在將你的 {mic.recordedSec} 秒真實錄音送入 Whisper 聲學模型轉寫並計算發音清晰度…
        </div>
      )}

      {/* Recognized Speech Transcript / Manual Text Input */}
      {(!transcribingAudio && (mic.phase === 'recorded' || showTextFallback || transcript)) && (
        <div className="transcript-box animate-in">
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
            {scoreCard?.sttEngine?.includes('whisper')
              ? '🎤 Whisper 實測聽寫出你剛才唸的內容（可直接對照漏讀或發音模糊處）：'
              : '英文回答內容：'}
          </div>
          <textarea
            className="text-area-clean"
            rows={2}
            placeholder="輸入英文回答測試 AI 評分…"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
          />
          {showTextFallback && mic.phase !== 'recorded' && transcript.trim().length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.32rem 0.75rem', fontSize: '0.78rem' }}
                onClick={handleManualTextScore}
              >
                送出 AI 評分
              </button>
            </div>
          )}
        </div>
      )}

      {/* Unified Real Acoustic + LLM Score Card */}
      {scoreCard && !transcribingAudio && (
        <div
          className={`ai-score-card animate-in ${
            scoreCard.overallBand >= 54 ? 'pass' : 'warn'
          }`}
        >
          <div className="ai-score-top">
            <div className="ai-band-badge">
              <span className="ai-band-num">{scoreCard.overallBand}</span>
              <span className="ai-band-max">/ 90</span>
            </div>
            <div className="ai-subscores">
              <span>內容 {scoreCard.contentScore}/6</span>
              <span>流利度 {scoreCard.fluencyScore}/5 ({scoreCard.wpm} WPM)</span>
              <span>
                發音 {scoreCard.pronunciationScore}/5
                {typeof scoreCard.clarityPct === 'number' ? ` (${scoreCard.clarityPct}%)` : ''}
              </span>
            </div>
          </div>

          <div className="ai-verdict-line">{scoreCard.verdictZh}</div>

          {scoreCard.lowClarityWords && scoreCard.lowClarityWords.length > 0 && (
            <div style={{ fontSize: '0.79rem', color: 'var(--accent-amber)', marginTop: '0.35rem' }}>
              ⚠️ 發音較模糊單字：{scoreCard.lowClarityWords.join(', ')}
            </div>
          )}

          {scoringAi && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
              🤖 Gemini 考官正在針對你的回答撰寫雙審診斷建議…
            </div>
          )}

          {coach && !scoringAi && (
            <div className="ai-coach-notes">
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>
                AI 考官引擎：{coach.aiModel || 'gemini-3.8-flash'}
              </div>
              <div>✓ {coach.strengthsZh}</div>
              <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                → {coach.fixesZh}
              </div>
              {!isVerbatimTask && coach.upgradedSample && (
                <div className="ai-sample-quote">
                  參考自然說法：“{coach.upgradedSample}”
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

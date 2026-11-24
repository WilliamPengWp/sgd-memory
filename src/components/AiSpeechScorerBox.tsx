import React, { useEffect, useState, useCallback } from 'react';
import { Mic, Square, RotateCcw } from 'lucide-react';
import { useMicRecorder } from '../utils/speech';
import {
  useLiveSpeechRecognition,
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
  const stt = useLiveSpeechRecognition('en-US');

  const [scoreCard, setScoreCard] = useState<PteSpeechScoreCard | null>(null);
  const [coach, setCoach] = useState<AiCoachDiagnosis | null>(null);
  const [scoringAi, setScoringAi] = useState(false);
  const [showTextFallback, setShowTextFallback] = useState(false);

  const runFullAutoScoring = useCallback(
    async (spokenText: string, durSec: number, hesitations: number) => {
      const card = evaluateSpeakingAttempt({
        transcript: spokenText,
        durationSec: Math.max(durSec, 3),
        hesitationCount: hesitations,
        expectedKeywordsOrSentence: expectedKeywordsOrWords,
        isVerbatimTask,
      });
      setScoreCard(card);
      onScored?.(card.overallBand);

      if (spokenText.trim().length >= 3) {
        setScoringAi(true);
        const diagnosis = await callGeminiWritingOrSpeakingCoach({
          taskType: taskLabel,
          promptText: promptSummary,
          userAnswer: spokenText,
        });
        setCoach(diagnosis);
        setScoringAi(false);
      }
    },
    [expectedKeywordsOrWords, isVerbatimTask, onScored, promptSummary, taskLabel]
  );

  useEffect(() => {
    mic.reset();
    stt.stop();
    stt.setTranscript('');
    setScoreCard(null);
    setCoach(null);
    setScoringAi(false);
    setShowTextFallback(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  useEffect(() => {
    if (mic.phase === 'recording' && !stt.isListening) {
      stt.start();
    } else if (mic.phase === 'recorded') {
      if (stt.isListening) stt.stop();
      // Give browser SpeechRecognition 250ms to flush final interim result
      const t = window.setTimeout(() => {
        const finalTranscript = stt.latestTranscriptRef.current;
        runFullAutoScoring(
          finalTranscript,
          Math.max(mic.recordedSec, stt.durationSec, 3),
          stt.hesitations
        );
      }, 250);
      return () => window.clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mic.phase]);

  return (
    <div className="ai-speech-unit" id={`${idPrefix}-ai-scorer`}>
      {/* Primary Action Bar */}
      <div className="ai-mic-bar">
        <div className="ai-mic-status">
          {mic.phase === 'idle' && (
            <button
              type="button"
              className="btn btn-primary btn-mic-main"
              onClick={() => {
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
              onClick={() => {
                mic.stopRecording();
                stt.stop();
              }}
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
                onClick={() => {
                  mic.reset();
                  stt.stop();
                  stt.setTranscript('');
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

      {/* Live Speech Transcript / Manual Text Input */}
      {(mic.phase === 'recording' || mic.phase === 'recorded' || showTextFallback || stt.transcript) && (
        <div className="transcript-box">
          <textarea
            className="text-area-clean"
            rows={2}
            placeholder={
              mic.phase === 'recording'
                ? '正在聆聽並即時轉寫你的英文發音…'
                : '輸入或修改你的英文回答，按右側按鈕立即重算 AI 分數…'
            }
            value={stt.transcript}
            onChange={(e) => stt.setTranscript(e.target.value)}
          />
          {mic.phase !== 'recording' && stt.transcript.trim().length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.32rem 0.75rem', fontSize: '0.78rem' }}
                onClick={() =>
                  runFullAutoScoring(stt.transcript, Math.max(mic.recordedSec, 8), stt.hesitations)
                }
              >
                更新 AI 評分
              </button>
            </div>
          )}
        </div>
      )}

      {/* Unified Automatic AI Score Card */}
      {scoreCard && (
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
              <span>發音 {scoreCard.pronunciationScore}/5</span>
            </div>
          </div>

          <div className="ai-verdict-line">{scoreCard.verdictZh}</div>

          {scoringAi && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              AI 考官正在雙審診斷語意與結構…
            </div>
          )}

          {coach && !scoringAi && (
            <div className="ai-coach-notes">
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

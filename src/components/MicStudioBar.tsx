import React, { useEffect } from 'react';
import { Mic, Square, RotateCcw, Clock } from 'lucide-react';
import { useMicRecorder } from '../utils/speech';

interface MicStudioBarProps {
  idPrefix: string;
  prepSeconds: number;
  recordSeconds: number;
  label?: string;
  resetTrigger?: string | number;
}

export const MicStudioBar: React.FC<MicStudioBarProps> = ({
  idPrefix,
  prepSeconds,
  recordSeconds,
  label = '考場實戰錄音自測',
  resetTrigger,
}) => {
  const mic = useMicRecorder();

  useEffect(() => {
    mic.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  return (
    <div className="mic-recorder-box" id={`${idPrefix}-mic-studio`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span className="tag tag-ocean">
          <Mic size={13} />
          {label}
        </span>

        {mic.phase === 'idle' && (
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            準備 {prepSeconds}s → 錄音上限 {recordSeconds}s（注意距離嘴角兩指寬防噴麥）
          </span>
        )}

        {mic.phase === 'prep' && (
          <span className="tag tag-amber" style={{ fontSize: '0.82rem' }}>
            <Clock size={13} />
            準備倒數：{mic.secondsLeft}s 後自動開麥…
          </span>
        )}

        {mic.phase === 'recording' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span className="tag tag-coral" style={{ fontSize: '0.82rem' }}>
              ● 錄音中 剩餘 {mic.secondsLeft}s（勿停頓超過 3 秒）
            </span>
            <div className="mic-level-track" title="麥克風音量強度">
              <div className="mic-level-bar" style={{ width: `${mic.level}%` }} />
            </div>
          </div>
        )}

        {mic.phase === 'recorded' && (
          <span className="tag tag-jade">已完成錄音 ({mic.recordedSec}s) · 請回放檢查流利度與尾音</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {mic.phase === 'idle' && (
          <>
            {prepSeconds > 0 && (
              <button
                id={`${idPrefix}-btn-prep-rec`}
                type="button"
                className="btn btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
                onClick={() => mic.startWithPrep(prepSeconds, recordSeconds)}
              >
                <Clock size={14} />
                模擬考場 ({prepSeconds}s+{recordSeconds}s)
              </button>
            )}
            <button
              id={`${idPrefix}-btn-direct-rec`}
              type="button"
              className="btn btn-primary"
              style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem' }}
              onClick={() => mic.startImmediate(recordSeconds)}
            >
              <Mic size={14} />
              立即錄音
            </button>
          </>
        )}

        {(mic.phase === 'prep' || mic.phase === 'recording') && (
          <button
            id={`${idPrefix}-btn-stop-rec`}
            type="button"
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', borderColor: 'var(--accent-coral)' }}
            onClick={mic.stopRecording}
          >
            <Square size={14} />
            結束錄音
          </button>
        )}

        {mic.phase === 'recorded' && mic.audioUrl && (
          <>
            <audio
              controls
              src={mic.audioUrl}
              style={{ height: '32px', maxWidth: '220px' }}
            />
            <button
              id={`${idPrefix}-btn-reset-rec`}
              type="button"
              className="btn btn-ghost"
              onClick={mic.reset}
              title="重新錄製"
            >
              <RotateCcw size={15} />
              重錄
            </button>
          </>
        )}
      </div>

      {mic.error && (
        <div style={{ width: '100%', fontSize: '0.78rem', color: 'var(--accent-amber)' }}>
          {mic.error}
        </div>
      )}
    </div>
  );
};

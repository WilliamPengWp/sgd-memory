import React, { useState, useEffect } from 'react';
import {
  Mic,
  Square,
  Send,
  Volume2,
  LifeBuoy,
  Sparkles,
  Trophy,
  RotateCcw,
  KeyRound,
} from 'lucide-react';
import { ROLEPLAY_SCENARIOS, RoleplayScenario } from '../data/roleplayData';
import { speakEnglish, stopSpeaking } from '../utils/speech';
import {
  useLiveSpeechRecognition,
  evaluateSpeakingAttempt,
  callGeminiRoleplayAndFeedback,
  getStoredGeminiKey,
} from '../utils/aiEngine';
import { playGameSfx } from '../utils/gamification';

interface ChatMessage {
  id: string;
  sender: 'npc' | 'user';
  text: string;
  textZh?: string;
  coachTip?: string;
  bandBadge?: number;
}

interface LiveRoleplayArenaProps {
  soundEnabled: boolean;
  onEarnXp: (xp: number, combo?: number) => void;
  onOpenAiSettings: () => void;
}

export const LiveRoleplayArena: React.FC<LiveRoleplayArenaProps> = ({
  soundEnabled,
  onEarnXp,
  onOpenAiSettings,
}) => {
  const [selectedId, setSelectedId] = useState<string>(ROLEPLAY_SCENARIOS[0].id);
  const [turnIdx, setTurnIdx] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputDraft, setInputDraft] = useState('');
  const [showRescue, setShowRescue] = useState(false);
  const [finished, setFinished] = useState(false);
  const [sessionBands, setSessionBands] = useState<number[]>([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const stt = useLiveSpeechRecognition('en-US');

  const scenario: RoleplayScenario =
    ROLEPLAY_SCENARIOS.find((s) => s.id === selectedId) ?? ROLEPLAY_SCENARIOS[0];

  const startScenario = (sc: RoleplayScenario) => {
    stopSpeaking();
    stt.stop();
    stt.setTranscript('');
    setTurnIdx(0);
    setInputDraft('');
    setShowRescue(false);
    setFinished(false);
    setSessionBands([]);
    const firstTurn = sc.turns[0];
    setMessages([
      {
        id: 'npc-0',
        sender: 'npc',
        text: firstTurn.npcLine,
        textZh: firstTurn.npcLineZh,
      },
    ]);
    speakEnglish(firstTurn.npcLine, sc.accent, 1.0);
  };

  useEffect(() => {
    startScenario(scenario);
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Sync live STT transcript into input box
  useEffect(() => {
    if (stt.transcript) {
      setInputDraft(stt.transcript);
    }
  }, [stt.transcript]);

  const currentScript = scenario.turns[Math.min(turnIdx, scenario.turns.length - 1)];

  const handleSubmitTurn = async () => {
    const reply = inputDraft.trim();
    if (!reply || loadingAi) return;
    if (stt.isListening) stt.stop();

    // 1. Score spoken / typed turn locally
    const evalCard = evaluateSpeakingAttempt({
      transcript: reply,
      durationSec: Math.max(stt.durationSec, Math.round(reply.split(/\s+/).length / 2.2), 4),
      hesitationCount: stt.hesitations,
      expectedKeywordsOrSentence: currentScript.expectedKeywords,
      isVerbatimTask: false,
    });

    const isFinal = turnIdx >= scenario.turns.length - 1;
    let coachTip = evalCard.verdictZh;
    let nextNpcEn = !isFinal ? scenario.turns[turnIdx + 1].npcLine : 'Awesome chatting with you—all sorted!';
    let nextNpcZh = !isFinal ? scenario.turns[turnIdx + 1].npcLineZh : '太棒了，事情完美解決！';

    setLoadingAi(true);
    if (getStoredGeminiKey()) {
      const geminiRes = await callGeminiRoleplayAndFeedback({
        rolePersona: `${scenario.npcName} (${scenario.npcRole})`,
        scenarioContext: scenario.contextZh,
        conversationHistory: messages.map((m) => ({ speaker: m.sender, text: m.text })),
        userLatestText: reply,
        isFinalTurn: isFinal,
      });
      if (geminiRes) {
        coachTip = `${geminiRes.coachTipZh} · ✨ 道地升級講法：“${geminiRes.polishedUserSentence}”`;
        nextNpcEn = geminiRes.npcReply;
        nextNpcZh = geminiRes.npcReplyZh;
      }
    }
    setLoadingAi(false);

    const userMsg: ChatMessage = {
      id: `user-${turnIdx}`,
      sender: 'user',
      text: reply,
      coachTip,
      bandBadge: evalCard.overallBand,
    };

    const nextBands = [...sessionBands, evalCard.overallBand];
    setSessionBands(nextBands);
    setInputDraft('');
    stt.setTranscript('');
    setShowRescue(false);

    if (isFinal) {
      const closingNpc: ChatMessage = {
        id: `npc-close`,
        sender: 'npc',
        text: nextNpcEn,
        textZh: nextNpcZh,
      };
      setMessages((prev) => [...prev, userMsg, closingNpc]);
      setFinished(true);
      playGameSfx('win', soundEnabled);
      onEarnXp(scenario.xpReward, 3);
      speakEnglish(nextNpcEn, scenario.accent, 1.0);
    } else {
      const nextIdx = turnIdx + 1;
      const npcMsg: ChatMessage = {
        id: `npc-${nextIdx}`,
        sender: 'npc',
        text: nextNpcEn,
        textZh: nextNpcZh,
      };
      setMessages((prev) => [...prev, userMsg, npcMsg]);
      setTurnIdx(nextIdx);
      playGameSfx('combo', soundEnabled);
      onEarnXp(15, nextIdx);
      speakEnglish(nextNpcEn, scenario.accent, 1.0);
    }
  };

  const avgBand =
    sessionBands.length > 0
      ? Math.round(sessionBands.reduce((a, b) => a + b, 0) / sessionBands.length)
      : 60;

  const hasGemini = Boolean(getStoredGeminiKey());

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="section-header">
        <div>
          <span className="eyebrow">ANTI-BOREDOM LIVE VOICE ROLEPLAY · 專治自言自語枯燥症</span>
          <h2 className="section-title">澳洲真人感情境對戲艙 ＆ AI 口說考官</h2>
        </div>

        <button
          id="btn-open-ai-key-modal"
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: '0.78rem', padding: '0.45rem 0.85rem' }}
          onClick={onOpenAiSettings}
        >
          <KeyRound size={14} color={hasGemini ? 'var(--accent-jade)' : 'var(--accent-amber)'} />
          {hasGemini ? 'Gemini 2.5 真人自由對談已啟用' : '綁定免費 Gemini Key 解鎖無限自由接話'}
        </button>
      </div>

      {/* Scenario Selector Cards */}
      <div className="grid-4">
        {ROLEPLAY_SCENARIOS.map((sc) => {
          const active = sc.id === scenario.id;
          return (
            <button
              key={sc.id}
              id={`btn-roleplay-sc-${sc.id}`}
              type="button"
              onClick={() => setSelectedId(sc.id)}
              style={{
                textAlign: 'left',
                padding: '0.95rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: active ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                border: `1px solid ${active ? 'var(--accent-jade)' : 'var(--border-subtle)'}`,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.55rem' }}>{sc.avatarEmoji}</span>
                <span className="tag tag-amber">+{sc.xpReward} XP</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', lineHeight: 1.35 }}>{sc.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {sc.examCode}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Chat Stage */}
      <div className="dashboard-split">
        <div className="surface-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '0.85rem',
              marginBottom: '0.85rem',
              borderBottom: '1px solid var(--border-subtle)',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span style={{ fontSize: '1.8rem' }}>{scenario.avatarEmoji}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.96rem' }}>{scenario.npcName}</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>{scenario.npcRole}</div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost"
              style={{ fontSize: '0.78rem' }}
              onClick={() => startScenario(scenario)}
            >
              <RotateCcw size={14} />
              重新開始對戲
            </button>
          </div>

          {/* Chat Messages */}
          <div className="chat-stream">
            {messages.map((m) =>
              m.sender === 'npc' ? (
                <div key={m.id} className="chat-bubble-npc animate-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 600, lineHeight: 1.55 }}>{m.text}</div>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ padding: '0.2rem 0.4rem', flexShrink: 0 }}
                      onClick={() => speakEnglish(m.text, scenario.accent, 1.0)}
                      title="重聽語音"
                    >
                      <Volume2 size={15} />
                    </button>
                  </div>
                  {m.textZh && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                      {m.textZh}
                    </div>
                  )}
                </div>
              ) : (
                <div key={m.id} className="chat-bubble-user animate-in">
                  <div style={{ fontSize: '0.92rem', lineHeight: 1.55 }}>{m.text}</div>
                  <div
                    style={{
                      marginTop: '0.45rem',
                      paddingTop: '0.4rem',
                      borderTop: '1px solid hsla(200,20%,90%,0.1)',
                      fontSize: '0.76rem',
                      color: 'hsl(162, 76%, 72%)',
                    }}
                  >
                    {m.bandBadge && (
                      <span className="tag tag-jade" style={{ marginRight: '0.45rem' }}>
                        本輪口說 {m.bandBadge} 分
                      </span>
                    )}
                    {m.coachTip}
                  </div>
                </div>
              )
            )}
          </div>

          {/* User Controls or Victory Banner */}
          {!finished ? (
            <div style={{ marginTop: '1rem', paddingTop: '0.9rem', borderTop: '1px solid var(--border-subtle)' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.55rem',
                  flexWrap: 'wrap',
                  gap: '0.4rem',
                }}
              >
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                  🎯 {currentScript.missionGoalZh}
                </span>

                <button
                  id="btn-roleplay-rescue"
                  type="button"
                  className="btn btn-secondary"
                  style={{ padding: '0.32rem 0.7rem', fontSize: '0.76rem' }}
                  onClick={() => setShowRescue((v) => !v)}
                >
                  <LifeBuoy size={13} />
                  {showRescue ? '收合救命錦囊' : '卡詞？點開 3 句救命錦囊'}
                </button>
              </div>

              {showRescue && (
                <div
                  className="animate-in"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.4rem',
                    marginBottom: '0.75rem',
                  }}
                >
                  {currentScript.rescueChips.map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setInputDraft(chip);
                        speakEnglish(chip, scenario.accent, 0.95);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '0.5rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        fontSize: '0.82rem',
                        color: 'hsl(197, 88%, 74%)',
                      }}
                    >
                      💡 點擊帶入並跟讀：“{chip}”
                    </button>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
                <button
                  id="btn-roleplay-mic"
                  type="button"
                  className={`btn ${stt.isListening ? 'btn-secondary' : 'btn-primary'}`}
                  style={{
                    borderColor: stt.isListening ? 'var(--accent-coral)' : undefined,
                    flexShrink: 0,
                  }}
                  onClick={() => {
                    if (stt.isListening) stt.stop();
                    else stt.start();
                  }}
                >
                  {stt.isListening ? <Square size={16} /> : <Mic size={16} />}
                  {stt.isListening ? '停止收音' : '開口回話'}
                </button>

                <input
                  id="input-roleplay-reply"
                  type="text"
                  className="text-input"
                  style={{ padding: '0.6rem 0.85rem', fontSize: '0.88rem' }}
                  placeholder="直接按左側麥克風開口講英文，或在此輸入／微調你的回答…"
                  value={inputDraft}
                  onChange={(e) => setInputDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmitTurn();
                    }
                  }}
                />

                <button
                  id="btn-roleplay-send"
                  type="button"
                  className="btn btn-primary"
                  disabled={!inputDraft.trim() || loadingAi}
                  onClick={handleSubmitTurn}
                >
                  <Send size={15} />
                  {loadingAi ? '思考中…' : '發送'}
                </button>
              </div>
            </div>
          ) : (
            <div
              className="animate-in"
              style={{
                marginTop: '1rem',
                padding: '1.15rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-jade-soft)',
                border: '1px solid hsla(162,68%,45%,0.35)',
                textAlign: 'center',
              }}
            >
              <Trophy size={26} color="var(--accent-amber)" style={{ marginBottom: '0.3rem' }} />
              <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.1rem' }}>
                情境闖關成功！獲得 +{scenario.xpReward} XP · 本局平均口說 {avgBand} 分
              </h3>
              <p style={{ margin: '0 0 0.8rem', fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                你在真實壓力下完成了 3 輪第一人稱溝通，考場遇到 40 秒 RTS 只會覺得更輕鬆！
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  const idx = ROLEPLAY_SCENARIOS.findIndex((s) => s.id === scenario.id);
                  const next = ROLEPLAY_SCENARIOS[(idx + 1) % ROLEPLAY_SCENARIOS.length];
                  setSelectedId(next.id);
                }}
              >
                <Sparkles size={15} />
                挑戰下一關澳洲情境
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Scenario Briefing & Register Cheat Sheet */}
        <div className="surface-card">
          <span className="eyebrow">SCENARIO BRIEFING · 劇情任務卡</span>
          <h3 style={{ margin: '0.25rem 0 0.6rem', fontSize: '1.05rem' }}>{scenario.title}</h3>
          <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {scenario.contextZh}
          </p>

          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.81rem',
              lineHeight: 1.65,
            }}
          >
            <div style={{ fontWeight: 700, color: 'hsl(162, 76%, 64%)', marginBottom: '0.35rem' }}>
              為什麼這樣練 RTS / SGD 完全不會無聊？
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.15rem', color: 'var(--text-secondary)' }}>
              <li>以前背死板模板枯燥又容易被 2025 新制真人審核判 0 分。</li>
              <li>透過「被室友偷吃便當」、「跟雪梨 Tech Lead 報修資料庫」有情緒的來回過招，大腦多巴胺與情境記憶會直接鎖住句型！</li>
              <li>若點擊右上角填入免費 <strong>Google AI Studio Gemini Key</strong>，NPC 還會脫稿針對你講的每個細節無限自由接話！</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

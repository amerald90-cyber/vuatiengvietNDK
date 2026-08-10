import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { QRCodeSVG } from 'qrcode.react';
import { Play, SkipForward, Users, Trophy, ShieldAlert, Cpu, Eye, Copy, Check, Sparkles, Clock, Music, Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function HostDashboard() {
  const {
    room,
    createRoom,
    questions,
    currentQuestionIndex,
    currentQuestion,
    startQuestion,
    isAnswerRevealed,
    revealAnswer,
    playersList,
    answersList,
    soundMuted,
    toggleSound
  } = useGameStore();

  const [timerSeconds, setTimerSeconds] = useState(60);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!room) {
      createRoom();
    }
  }, []);

  // Compute absolute join URL for QR Code & Copy link
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const joinUrl = room ? `${currentOrigin}/?code=${room.room_code}` : '';

  // 60s Timer countdown logic with automatic reveal on 0s
  useEffect(() => {
    let interval = null;
    if (room && room.status === 'playing' && room.started_at) {
      const updateTimer = () => {
        const start = new Date(room.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        const remaining = Math.max(0, 60 - elapsed);

        setTimerSeconds(remaining);

        // When 60s timer expires -> Automatically reveal answer!
        if (remaining === 0 && !isAnswerRevealed) {
          revealAnswer();
        }
      };

      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimerSeconds(60);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [room?.status, room?.started_at, isAnswerRevealed]);

  const handleCopyLink = () => {
    if (joinUrl) {
      navigator.clipboard.writeText(joinUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = room && room.status === 'playing' ? currentQuestionIndex + 1 : 0;
    startQuestion(nextIdx);
  };

  const activePlayersCount = playersList.filter(p => p.status === 'active').length;
  const currentQuestionAnswers = answersList.filter(a => a.question_id === currentQuestion?.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 space-y-6">

      {/* TOP HEADER CONTROLS BAR */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-lg md:text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-400">
              AI WORD CHALLENGE ✨
            </h1>
            <p className="text-[10px] text-cyan-400/70 font-mono tracking-widest uppercase -mt-0.5">
              GHÉP CHỮ - BỨT TỐC - CHINH PHỤC AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {room && (
            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-cyan-500/30 text-xs font-mono flex items-center gap-2">
              <span className="text-slate-400">PHÒNG:</span>
              <span className="font-extrabold text-cyan-300 text-sm tracking-widest">{room.room_code}</span>
              <button
                onClick={() => createRoom()}
                className="p-1 text-slate-400 hover:text-cyan-300 transition"
                title="Tạo mã phòng ngẫu nhiên mới"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <button
            onClick={toggleSound}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-purple-500/30 text-xs font-mono text-purple-300 hover:border-purple-400 transition flex items-center gap-1.5"
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
            <span>{soundMuted ? 'SFX OFF' : 'MUSIC ON'}</span>
          </button>
        </div>
      </div>

      {/* 1. WAITING ROOM CARD WITH QR CODE & LINK */}
      {(!room || room.status === 'waiting') && (
        <div className="space-y-6">
          <div className="text-center space-y-3 py-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>WORKSHOP AI ICEBREAKER GAME</span>
            </div>

            <div className="flex items-center justify-center gap-2 text-3xl sm:text-5xl font-black text-white tracking-tight">
              <span>🧠</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-white">
                AI WORD CHALLENGE
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-400 font-mono tracking-widest uppercase">
              GHÉP CHỮ – BỨT TỐC – CHINH PHỤC AI
            </p>
          </div>

          {/* MAIN GLOWING QR CODE & ROOM CODE CARD */}
          {room && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="cyber-card p-6 md:p-10 rounded-3xl max-w-3xl mx-auto border-2 border-cyan-400/60 shadow-2xl shadow-cyan-500/20 relative overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                
                {/* LEFT SIDE: ROOM CODE & COPY LINK */}
                <div className="space-y-6 text-center md:text-left">
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest mb-1">
                        MÃ PHÒNG THAM GIA:
                      </p>
                      <button
                        onClick={() => createRoom()}
                        className="text-xs text-slate-400 hover:text-cyan-300 transition flex items-center gap-1 font-mono mb-1"
                        title="Tạo mã phòng ngẫu nhiên mới"
                      >
                        <RefreshCw className="w-3 h-3" /> Đổi mã
                      </button>
                    </div>
                    <h2 className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-cyan-300 neon-glow-cyan">
                      {room.room_code}
                    </h2>
                  </div>

                  {/* LINK COPY BOX */}
                  <div className="flex items-center gap-2 bg-slate-950/90 border border-cyan-500/40 rounded-xl p-2 max-w-md">
                    <input
                      type="text"
                      readOnly
                      value={joinUrl}
                      className="bg-transparent text-xs text-cyan-200 font-mono w-full px-2 outline-none overflow-hidden text-ellipsis"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/60 transition"
                      title="Sao chép đường dẫn"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* RIGHT SIDE: LARGE QR CODE CONTAINER */}
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white p-4 rounded-2xl shadow-2xl border-4 border-cyan-400 flex flex-col items-center">
                    <QRCodeSVG
                      value={joinUrl}
                      size={200}
                      level="H"
                      includeMargin={false}
                    />
                    <div className="mt-3 flex items-center gap-1.5 text-slate-900 font-bold text-xs font-mono uppercase tracking-wider">
                      <span>📱 QUÉT ĐỂ THAM GIA NGAY</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* START GAME BUTTON */}
              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-center">
                <button
                  onClick={handleNextQuestion}
                  className="px-8 py-4 rounded-2xl neon-button text-slate-950 font-black text-base uppercase tracking-wider flex items-center gap-3 shadow-xl"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>BẮT ĐẦU GIẢI ĐẤU NGAY ({playersList.length} NGƯỜI CHƠI)</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* BOTTOM STATUS BAR */}
          <div className="flex items-center justify-center gap-4 text-xs font-mono">
            <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <span><strong className="text-white">{playersList.length}</strong> Người tham gia</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span><strong className="text-white">{activePlayersCount}</strong> Đang chơi</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. GAMEPLAY WALL DISPLAY */}
      {room && room.status === 'playing' && currentQuestion && (
        <div className="space-y-6">
          
          {/* WALL PROJECTOR QUESTION BOARD */}
          <div className="cyber-card p-6 md:p-10 rounded-3xl relative overflow-hidden border-2 border-cyan-500/40 shadow-2xl">
            
            {/* BOARD TOP BAR */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-purple-950 border border-purple-500/40 text-purple-300 text-xs font-bold">
                  CÂU {currentQuestionIndex + 1} / {questions.length} • {currentQuestion.difficulty} (+{currentQuestion.points} pts)
                </span>
              </div>

              {/* 60s Timer Badge */}
              <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950 border border-cyan-500/40">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-400 font-mono">Thời gian:</span>
                <span className={`font-mono font-black text-lg ${timerSeconds <= 5 ? 'text-red-400 animate-bounce' : 'text-cyan-300'}`}>
                  {timerSeconds}s
                </span>
              </div>
            </div>

            {/* SCRAMBLED LETTERS DISPLAY ON WALL */}
            <div className="text-center py-6 space-y-6">
              <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                KÝ TỰ CẦN SẮP XẾP (SCRAMBLED LETTERS)
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                {useGameStore.getState().availableTiles.map((tile, idx) => (
                  <motion.div
                    key={`wall_${idx}_${tile}`}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="letter-tile px-5 py-4 rounded-2xl font-black text-2xl sm:text-4xl text-white shadow-xl border-cyan-400"
                  >
                    {tile}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* REVEAL ANSWER SECTION */}
            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              {!isAnswerRevealed ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 text-sm font-mono flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400 animate-pulse" />
                    <span>ĐÁP ÁN ĐANG ĐƯỢC ẨN • ĐANG ĐỜI THÍ SINH NỘP BÀI ({currentQuestionAnswers.length}/{playersList.length})</span>
                  </div>

                  <button
                    onClick={revealAnswer}
                    className="px-6 py-2.5 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold hover:bg-purple-900/60 transition inline-flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>HIỆN ĐÁP ÁN NGAY (KHI HẾT GIỜ)</span>
                  </button>
                </div>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-purple-950/80 to-cyan-950/80 border-2 border-cyan-400 space-y-2 shadow-2xl"
                >
                  <p className="text-xs font-mono text-cyan-300 uppercase tracking-widest">
                    🎉 ĐÁP ÁN CHÍNH XÁC (OFFICIAL ANSWER)
                  </p>
                  <h3 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-200 to-pink-300 neon-glow-cyan tracking-wider">
                    {currentQuestion.answer}
                  </h3>
                </motion.div>
              )}
            </div>

            {/* NEXT QUESTION ACTION BUTTON */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-xl neon-button text-slate-950 font-black text-sm flex items-center gap-2"
              >
                <span>CÂU TIẾP THEO</span>
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* REALTIME LIVE LEADERBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PLAYERS LIST */}
            <div className="cyber-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-cyan-400">
                  <Users className="w-5 h-5" />
                  <h3 className="font-bold text-white text-base">Thí Sinh ({playersList.length})</h3>
                </div>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {playersList.map((p) => (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                      p.status === 'eliminated' ? 'bg-red-950/20 border-red-500/40 text-red-300' : 'bg-slate-900/80 border-slate-800 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{p.nickname}</span>
                      {p.violations > 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950 border border-amber-500/50 text-amber-300">
                          VP: {p.violations}/2
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-cyan-300">{p.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE SCOREBOARD RANKINGS */}
            <div className="cyber-card-purple p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 text-purple-400 border-b border-slate-800 pb-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Bảng Xếp Hạng Trực Tiếp</h3>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {[...playersList]
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-purple-500/20 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold font-mono text-[10px] ${
                          idx === 0 ? 'bg-amber-400 text-slate-950' : idx === 1 ? 'bg-slate-300 text-slate-950' : idx === 2 ? 'bg-amber-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-200">{p.nickname}</span>
                      </div>
                      <span className="font-mono font-bold text-cyan-300">{p.score} pts</span>
                    </div>
                  ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

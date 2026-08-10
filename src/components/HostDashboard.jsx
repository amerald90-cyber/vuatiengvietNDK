import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Play, SkipForward, Users, Trophy, ShieldAlert, Cpu, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HostDashboard() {
  const {
    room,
    createRoom,
    questions,
    currentQuestionIndex,
    currentQuestion,
    startQuestion,
    playersList,
    answersList
  } = useGameStore();

  const [timerSeconds, setTimerSeconds] = useState(60);

  useEffect(() => {
    if (!room) {
      createRoom();
    }
  }, []);

  // 60-Second Host Realtime Timer countdown display
  useEffect(() => {
    let interval = null;
    if (room && room.status === 'playing' && room.started_at) {
      const updateTimer = () => {
        const start = new Date(room.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        const remaining = Math.max(0, 60 - elapsed);
        setTimerSeconds(remaining);
      };
      updateTimer();
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimerSeconds(60);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [room?.status, room?.started_at]);

  const handleNextQuestion = () => {
    const nextIdx = room && room.status === 'playing' ? currentQuestionIndex + 1 : 0;
    startQuestion(nextIdx);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* ROOM HEADER & CODE BANNER */}
      <div className="cyber-card p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-cyan-500/30">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono mb-2">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>HOST CONTROL CENTER</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">
            Phòng Thi Đấu AI Word Challenge
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Server-Authoritative Realtime Control & Anti-Cheat Monitor
          </p>
        </div>

        {/* Big Neon Room Code Box */}
        {room && (
          <div className="flex items-center gap-4 bg-slate-900/90 border-2 border-cyan-400/50 p-4 rounded-xl shadow-lg shadow-cyan-500/10">
            <div>
              <p className="text-[10px] text-cyan-400 font-mono tracking-widest uppercase">
                MÃ PHÒNG (ROOM CODE)
              </p>
              <p className="text-3xl font-black font-mono tracking-wider text-cyan-300 neon-glow-cyan">
                {room.room_code}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(room.room_code)}
              className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/40 transition text-xs font-mono"
              title="Copy mã phòng"
            >
              Sao Chép
            </button>
          </div>
        )}
      </div>

      {/* MAIN GAME CONTROL PANEL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT 2 COLS: QUESTION CONTROLLER & GAME BOARD */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CURRENT QUESTION DISPLAY CARD */}
          <div className="cyber-card p-6 rounded-2xl relative overflow-hidden">
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                Câu Hỏi {currentQuestionIndex + 1} / {questions.length}
              </span>
              
              {room?.status === 'playing' && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-cyan-500/40 text-xs font-mono">
                  <span className="text-slate-400">Thời gian còn:</span>
                  <span className={`font-bold text-sm ${timerSeconds <= 5 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
                    {timerSeconds}s
                  </span>
                </div>
              )}
            </div>

            {currentQuestion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold">
                    Độ khó: {currentQuestion.difficulty} (+{currentQuestion.points} điểm)
                  </span>
                </div>

                <div className="py-6 text-center">
                  <p className="text-xs text-slate-400 uppercase tracking-widest font-mono mb-2">
                    TỪ CẦN GIẢI MÃ (ANSWER)
                  </p>
                  <h3 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300 tracking-wider">
                    {currentQuestion.answer}
                  </h3>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 space-y-2">
                <p className="text-sm">Chưa bắt đầu câu hỏi nào.</p>
                <p className="text-xs text-slate-500">Nhấn nút bên dưới để phát đề cho người chơi.</p>
              </div>
            )}

            {/* ACTION CONTROL BUTTON */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-xl neon-button text-slate-950 font-black text-sm flex items-center gap-2"
              >
                {room?.status === 'playing' ? (
                  <>
                    <span>CÂU TIẾP THEO</span>
                    <SkipForward className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>BẮT ĐẦU GIẢI ĐẤU</span>
                    <Play className="w-4 h-4 fill-current" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* REALTIME PLAYER LIST & ANTI-CHEAT STATUS */}
          <div className="cyber-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Users className="w-5 h-5" />
                <h3 className="font-bold text-white text-base">
                  Danh Sách Thí Sinh ({playersList.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Tab-Switch Anti-Cheat Active
              </span>
            </div>

            {playersList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-slate-900/40 rounded-xl border border-slate-800">
                Đang chờ thí sinh tham gia bằng mã phòng: <strong className="text-cyan-400 font-mono">{room?.room_code}</strong>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playersList.map((player) => {
                  const isEliminated = player.status === 'eliminated';
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-xl border transition flex items-center justify-between ${
                        isEliminated
                          ? 'bg-red-950/20 border-red-500/40 text-red-300'
                          : 'bg-slate-900/80 border-slate-800 text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          isEliminated ? 'bg-red-900/40 text-red-400' : 'bg-cyan-950 text-cyan-400 border border-cyan-500/30'
                        }`}>
                          {player.nickname.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm leading-none">{player.nickname}</p>
                          <p className="text-[11px] text-slate-400 font-mono mt-1">
                            Điểm: <span className="text-cyan-300 font-bold">{player.score}</span>
                          </p>
                        </div>
                      </div>

                      {/* Anti-Cheat Violations Badge */}
                      <div className="flex items-center gap-1.5">
                        {player.violations > 0 && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 border ${
                            isEliminated
                              ? 'bg-red-950 border-red-500 text-red-300 font-bold'
                              : 'bg-amber-950 border-amber-500/50 text-amber-300'
                          }`}>
                            <ShieldAlert className="w-3 h-3" />
                            {player.violations}/2 {isEliminated && '(BỊ LOẠI)'}
                          </span>
                        )}
                        {!isEliminated && player.violations === 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                            Hợp lệ
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COL: REALTIME LEADERBOARD & RECENT ANSWERS */}
        <div className="space-y-6">
          <div className="cyber-card-purple p-6 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-purple-400 border-b border-slate-800 pb-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">Bảng Xếp Hạng Trực Tiếp</h3>
            </div>

            {playersList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">Chưa có người chơi</p>
            ) : (
              <div className="space-y-2">
                {[...playersList]
                  .sort((a, b) => b.score - a.score)
                  .map((p, idx) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/90 border border-purple-500/20 text-xs"
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
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

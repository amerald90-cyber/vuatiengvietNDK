import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { initAntiCheatListener } from '../utils/GameLogic';
import { soundEngine } from '../utils/soundEngine';
import { Send, RotateCcw, AlertTriangle, ShieldAlert, Sparkles, Trophy, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PlayerScreen() {
  const {
    room,
    player,
    joinRoom,
    currentQuestion,
    availableTiles,
    selectedTiles,
    addTileToAnswer,
    removeTileFromAnswer,
    resetAnswerTiles,
    submitAnswer,
    hasSubmittedCurrentQuestion,
    lastAnswerResult,
    recordTabSwitchViolation
  } = useGameStore();

  // JOIN FORM STATE
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [nicknameInput, setNicknameInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [showAntiCheatWarning, setShowAntiCheatWarning] = useState(false);

  // TIMER STATE
  const [timerSeconds, setTimerSeconds] = useState(60);

  // ANTI-CHEAT VISIBILITY LISTENER
  useEffect(() => {
    if (!player || player.status === 'eliminated' || !room || room.status !== 'playing') return;

    const cleanup = initAntiCheatListener(() => {
      recordTabSwitchViolation().then((res) => {
        if (res) {
          setShowAntiCheatWarning(true);
        }
      });
    });

    return () => cleanup();
  }, [player?.id, room?.status]);

  // TIMER COUNTDOWN LOGIC
  useEffect(() => {
    let interval = null;
    if (room && room.status === 'playing' && room.started_at) {
      const updateTimer = () => {
        const start = new Date(room.started_at).getTime();
        const now = Date.now();
        const elapsed = Math.floor((now - start) / 1000);
        const remaining = Math.max(0, 60 - elapsed);

        setTimerSeconds(remaining);

        if (remaining <= 5 && remaining > 0) {
          soundEngine.playUrgentTick();
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
  }, [room?.status, room?.started_at]);

  // 1. JOIN ROOM FORM SCREEN
  if (!player || !room) {
    const handleJoinSubmit = async (e) => {
      e.preventDefault();
      setJoinError('');
      if (!roomCodeInput.trim() || !nicknameInput.trim()) {
        setJoinError('Vui lòng nhập đầy đủ Mã phòng và Biệt danh!');
        return;
      }

      const res = await joinRoom(roomCodeInput.trim(), nicknameInput.trim());
      if (!res.success) {
        setJoinError(res.message);
      }
    };

    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="cyber-card p-6 md:p-8 rounded-3xl space-y-6 shadow-2xl"
        >
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
              <Sparkles className="w-8 h-8 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400">
              THAM GIA GIẢI ĐẤU
            </h2>
            <p className="text-xs text-slate-400">
              Nhập mã phòng từ Host để bắt đầu thử thách AI Word Challenge
            </p>
          </div>

          {joinError && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{joinError}</span>
            </div>
          )}

          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                MÃ PHÒNG (6 CHỮ SỐ)
              </label>
              <input
                type="text"
                required
                maxLength={10}
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="VD: 123456"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-cyan-300 font-mono text-center text-lg tracking-widest uppercase focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-cyan-300 uppercase tracking-wider mb-1">
                BIỆT DANH (NICKNAME)
              </label>
              <input
                type="text"
                required
                maxLength={20}
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="VD: AI Master"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-cyan-500/30 text-white text-base focus:outline-none focus:border-cyan-400 transition"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-xl font-black text-sm neon-button text-slate-950 shadow-lg tracking-wider uppercase mt-2"
            >
              VÀO PHÒNG CHOI
            </button>
          </form>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Luật Chống Gian Lận:</strong> Không được rời màn hình/chuyển tab trong lúc làm bài. Chuyển tab 2 lần sẽ bị LOẠI!
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. ELIMINATED SCREEN
  if (player.status === 'eliminated') {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="cyber-card p-8 rounded-3xl border-red-500/40 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-950 border border-red-500/50 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-red-400">BẠN ĐÃ BỊ LOẠI!</h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Hệ thống Server-Authoritative Anti-Cheat phát hiện bạn đã <strong>chuyển tab 2 lần</strong> trong thời gian thi đấu.
          </p>
          <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs font-mono text-red-300">
            Số lần vi phạm: 2/2 (Hệ thống đã khóa quyền trả lời)
          </div>
        </div>
      </div>
    );
  }

  // 3. WAITING LOBBY SCREEN
  if (room.status === 'waiting' || !currentQuestion) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="cyber-card p-8 rounded-3xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 animate-pulse">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white">ĐANG CHỜ HOST BẮT ĐẦU...</h2>
          <p className="text-xs text-slate-400">
            Xin chào <strong className="text-cyan-300">{player.nickname}</strong>, hãy sẵn sàng!
          </p>
          <div className="inline-block px-4 py-2 rounded-xl bg-slate-900 border border-cyan-500/30 font-mono text-xs text-cyan-400">
            Mã phòng: {room.room_code}
          </div>
        </div>
      </div>
    );
  }

  // 4. ACTIVE GAMEPLAY SCREEN
  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      
      {/* ANTI-CHEAT WARNING MODAL POPUP */}
      <AnimatePresence>
        {showAntiCheatWarning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
          >
            <div className="cyber-card p-6 rounded-2xl max-w-sm border-amber-500/50 space-y-4 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-amber-400">CẢNH BÁO VI PHẠM (1/2)</h3>
              <p className="text-xs text-slate-300">
                Hệ thống Anti-Cheat phát hiện bạn vừa <strong>chuyển tab hoặc rời ứng dụng</strong>. Vi phạm thêm 1 lần nữa bạn sẽ bị LOẠI vĩnh viễn khỏi lượt chơi!
              </p>
              <button
                onClick={() => setShowAntiCheatWarning(false)}
                className="w-full py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
              >
                TÔI ĐÃ HỦY CHUYỂN TAB (TIẾP TỤC)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP STATS BAR */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-slate-400 font-mono">Điểm số:</span>
          <span className="font-mono font-black text-cyan-300 text-sm">{player.score}</span>
        </div>

        {/* 60s Countdown Timer */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-cyan-500/30">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className={`font-mono font-bold text-sm ${timerSeconds <= 5 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>
            {timerSeconds}s
          </span>
        </div>
      </div>

      {/* QUESTION DIFFICULTY BANNER */}
      <div className="cyber-card p-4 rounded-2xl flex items-center justify-between text-xs">
        <span className="font-mono text-slate-400 uppercase">CÂU HỎI THỬ THÁCH</span>
        <span className="px-2.5 py-1 rounded bg-purple-950 border border-purple-500/40 text-purple-300 font-bold">
          {currentQuestion.difficulty} (+{currentQuestion.points} pts)
        </span>
      </div>

      {/* ANSWER DISPLAY SLOTS */}
      <div className="cyber-card p-6 rounded-2xl space-y-4 text-center">
        <p className="text-[11px] text-cyan-400 font-mono tracking-wider uppercase">
          KẾT QUẢ ĐÃ GHÉP (TAP/DRAG ĐỂ CHỌN)
        </p>

        {/* Dynamic Letter Answer Slots */}
        <div className="flex flex-wrap items-center justify-center gap-2 min-h-[64px] p-3 rounded-xl bg-slate-950/80 border border-cyan-500/20">
          {selectedTiles.length === 0 ? (
            <span className="text-xs text-slate-600 italic">Chạm các ký tự bên dưới để ghép từ...</span>
          ) : (
            selectedTiles.map((tile, idx) => (
              <motion.button
                key={`sel_${idx}_${tile}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => !hasSubmittedCurrentQuestion && removeTileFromAnswer(idx)}
                disabled={hasSubmittedCurrentQuestion}
                className="letter-tile px-3.5 py-2.5 rounded-xl font-bold text-base md:text-lg text-cyan-300 shadow-md border-cyan-400"
              >
                {tile}
              </motion.button>
            ))
          )}
        </div>

        {/* SUBMISSION RESULT ALERT FEEDBACK */}
        {hasSubmittedCurrentQuestion && lastAnswerResult && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${
              lastAnswerResult.is_correct
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/80 border-red-500/50 text-red-300'
            }`}
          >
            {lastAnswerResult.is_correct ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{lastAnswerResult.message}</span>
          </motion.div>
        )}
      </div>

      {/* AVAILABLE SHUFFLED TILES */}
      {!hasSubmittedCurrentQuestion && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>KÝ TỰ KHẢ DỤNG:</span>
            <button
              onClick={resetAnswerTiles}
              className="text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Xóa Chọn
            </button>
          </div>

          {/* Letter / Syllable Grid */}
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {availableTiles.map((tile, idx) => (
              <motion.button
                key={`avail_${idx}_${tile}`}
                whileTap={{ scale: 0.9 }}
                onClick={() => addTileToAnswer(idx)}
                className="letter-tile px-4 py-3 rounded-xl font-black text-lg md:text-xl text-white shadow-lg"
              >
                {tile}
              </motion.button>
            ))}
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={submitAnswer}
            disabled={selectedTiles.length === 0}
            className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition ${
              selectedTiles.length > 0
                ? 'neon-button text-slate-950'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
            }`}
          >
            <span>GỬI KẾT QUẢ</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

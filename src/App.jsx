import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AdminLogin from './components/AdminLogin';
import HostDashboard from './components/HostDashboard';
import PlayerScreen from './components/PlayerScreen';
import { useGameStore } from './store/gameStore';
import { Cpu, Gamepad2, ShieldCheck, Sparkles, Trophy, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export default function App() {
  const { role, setRole, isAdminLoggedIn } = useGameStore();
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Auto-detect URL query parameter ?code=XXXX (e.g. from scanning QR code!)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlCode = params.get('code');
      if (urlCode && role === 'none') {
        setRole('player');
      }
    }
  }, [role]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 scanline-effect selection:bg-cyan-500 selection:text-slate-950">
      
      {/* NAVBAR HEADER */}
      <Navbar onOpenAdminLogin={() => setIsAdminModalOpen(true)} />

      {/* ADMIN LOGIN MODAL */}
      <AdminLogin
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 pb-12">
        {role === 'host' && <HostDashboard />}
        {role === 'player' && <PlayerScreen />}

        {/* ROLE SELECTION LANDING SCREEN (WHEN NO ROLE SELECTED YET) */}
        {role === 'none' && (
          <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
            
            {/* HERO TITLE BANNER */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>SERVER-AUTHORITATIVE AI SCRAMBLE GAME</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-400 neon-glow-cyan">
                AI WORD CHALLENGE
              </h1>

              <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
                Trí Tuệ Từ Vựng Tiếng Việt - Giải Đấu Trực Tuyến Đa Người Chơi Với Cơ Chế Chống Gian Lận Độc Quyền & Âm Thanh Sinh Động.
              </p>
            </div>

            {/* SELECTION CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              
              {/* PLAYER ENTRY CARD */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => setRole('player')}
                className="cyber-card p-8 rounded-3xl cursor-pointer hover:border-cyan-400 transition group space-y-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-110 transition">
                  <Gamepad2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition">
                    THÍ SINH THAM GIA
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Quét QR Code hoặc Nhập Mã Phòng để thi đấu cùng người chơi khác
                  </p>
                </div>
                <button className="w-full py-3 rounded-xl neon-button text-slate-950 font-extrabold text-xs uppercase tracking-wider">
                  VÀO THI ĐẤU
                </button>
              </motion.div>

              {/* HOST ENTRY CARD */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  if (isAdminLoggedIn) {
                    setRole('host');
                  } else {
                    setIsAdminModalOpen(true);
                  }
                }}
                className="cyber-card-purple p-8 rounded-3xl cursor-pointer hover:border-purple-400 transition group space-y-4 text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 group-hover:scale-110 transition">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white group-hover:text-purple-300 transition">
                    TẠO PHÒNG (HOST)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Đăng nhập tài khoản ngọc đại ka để tạo và quản lý giải đấu
                  </p>
                </div>
                <button className="w-full py-3 rounded-xl neon-button-purple text-white font-extrabold text-xs uppercase tracking-wider">
                  {isAdminLoggedIn ? 'QUẢN LÝ PHÒNG' : 'ĐĂNG NHẬP HOST'}
                </button>
              </motion.div>

            </div>

            {/* FEATURE HIGHLIGHTS */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800 text-center">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-cyan-400 font-mono font-bold text-xs">TIẾNG VIỆT CÓ DẤU</div>
                <p className="text-[11px] text-slate-400">Giữ nguyên các ký tự đặc trưng không bị tách dấu</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-purple-400 font-mono font-bold text-xs">ANTI-CHEAT 60S</div>
                <p className="text-[11px] text-slate-400">VisibilityState cấm chuyển tab & giới hạn 60s</p>
              </div>
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
                <div className="text-pink-400 font-mono font-bold text-xs">REALTIME SUPABASE</div>
                <p className="text-[11px] text-slate-400">Đồng bộ câu hỏi và bảng xếp hạng tức thì</p>
              </div>
            </div>

          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500 font-mono">
        AI WORD CHALLENGE &copy; 2026 • React + Vite + Supabase Realtime + Tailwind CSS + Framer Motion + Howler.js
      </footer>

    </div>
  );
}

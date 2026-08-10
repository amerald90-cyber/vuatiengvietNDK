import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Volume2, VolumeX, ShieldAlert, Cpu, LogOut, User } from 'lucide-react';

export default function Navbar({ onOpenAdminLogin }) {
  const { role, isAdminLoggedIn, adminUser, logoutAdmin, soundMuted, toggleSound, player, room } = useGameStore();

  return (
    <header className="w-full border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        
        {/* BRAND LOGO */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-300 text-lg md:text-xl">
              AI WORD CHALLENGE
            </h1>
            <p className="text-[10px] text-cyan-400/60 uppercase tracking-widest -mt-1 font-mono">
              Trí Tuệ Từ Vựng Server-Authoritative
            </p>
          </div>
        </div>

        {/* CONTROLS & USER STATUS */}
        <div className="flex items-center gap-3">
          {/* Mute Audio Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition"
            title={soundMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {soundMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* User / Host Status Badge */}
          {role === 'host' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/30 text-purple-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <span>HOST: {adminUser || 'ngọc đại ka'}</span>
              <button
                onClick={logoutAdmin}
                className="ml-1 text-slate-400 hover:text-red-400 transition"
                title="Đăng xuất Host"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {role === 'player' && player && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-cyan-300 text-xs">
              <User className="w-3.5 h-3.5" />
              <span className="font-bold">{player.nickname}</span>
              {player.violations > 0 && (
                <span className="flex items-center gap-0.5 text-amber-400 font-mono text-[10px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/40">
                  <ShieldAlert className="w-3 h-3" /> {player.violations}/2
                </span>
              )}
            </div>
          )}

          {/* Admin Login Trigger Button when not logged in */}
          {role !== 'host' && (
            <button
              onClick={onOpenAdminLogin}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 border border-purple-500/40 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 transition flex items-center gap-1.5"
            >
              <span>Host Login</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

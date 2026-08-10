import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { ShieldCheck, Lock, User, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminLogin({ isOpen, onClose }) {
  const { loginAdmin } = useGameStore();
  const [username, setUsername] = useState('ngọc đại ka');
  const [password, setPassword] = useState('chaodaika');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    const res = loginAdmin(username, password);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="cyber-card-purple w-full max-w-md p-6 rounded-2xl relative overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-3 text-purple-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-400 to-cyan-300">
              Host / Admin Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Đăng nhập để tạo phòng và điều hành giải đấu AI Word Challenge
            </p>
          </div>

          {/* Error Alert */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-purple-300 uppercase tracking-wider mb-1.5">
                Tài khoản Host
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ngọc đại ka"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/90 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-purple-300 uppercase tracking-wider mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="chaodaika"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-900/90 border border-purple-500/30 text-white text-sm focus:outline-none focus:border-purple-400 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg font-bold text-sm neon-button-purple text-white shadow-lg mt-2"
            >
              ĐĂNG NHẬP HOST
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-500 font-mono">
              Server-Authoritative Anti-Cheat Protection Enabled
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Sound Engine using Web Audio API + Howler.js for futuristic game sound FX
 */
import { Howl, Howler } from 'howler';

class SoundEngine {
  constructor() {
    this.muted = false;
    this.bgmOscillator = null;
    this.bgmGain = null;
    this.audioCtx = null;
    this.isBgmPlaying = false;
  }

  getAudioContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  toggleMute() {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    if (this.muted && this.isBgmPlaying) {
      this.stopBgm();
    }
    return this.muted;
  }

  // Correct Answer Sound Effect (Futuristic Uplifting Chime)
  playCorrect() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.15, now + index * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 0.35);
    });
  }

  // Incorrect Answer Sound Effect (Futuristic Error Buzzer)
  playIncorrect() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.4);
  }

  // 5-Second Warning Alarm Sound Effect
  playUrgentTick() {
    if (this.muted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now); // A5

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // Background Cyberpunk Pulse Music
  startBgm() {
    if (this.muted || this.isBgmPlaying) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      this.isBgmPlaying = true;
      const now = ctx.currentTime;

      // Create low ambient drone
      this.bgmOscillator = ctx.createOscillator();
      this.bgmGain = ctx.createGain();

      this.bgmOscillator.type = 'sine';
      this.bgmOscillator.frequency.setValueAtTime(110, now); // Low A2 drone

      this.bgmGain.gain.setValueAtTime(0.03, now);

      this.bgmOscillator.connect(this.bgmGain);
      this.bgmGain.connect(ctx.destination);

      this.bgmOscillator.start();
    } catch (e) {
      console.warn('BGM AutoPlay prevented by browser policies:', e);
    }
  }

  stopBgm() {
    if (this.bgmOscillator) {
      try {
        this.bgmOscillator.stop();
        this.bgmOscillator.disconnect();
      } catch (e) {}
      this.bgmOscillator = null;
    }
    this.isBgmPlaying = false;
  }
}

export const soundEngine = new SoundEngine();
export default soundEngine;

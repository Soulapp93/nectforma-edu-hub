import { useCallback, useRef, useState } from 'react';

// Web Audio API based sound generator - no external files needed
class SoundGenerator {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) this.ctx = new AudioContext();
    return this.ctx;
  }

  playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  playSequence(notes: { freq: number; dur: number; delay: number }[], type: OscillatorType = 'sine', volume = 0.3) {
    notes.forEach(n => {
      setTimeout(() => this.playTone(n.freq, n.dur, type, volume), n.delay);
    });
  }

  correctAnswer() {
    this.playSequence([
      { freq: 523, dur: 0.15, delay: 0 },
      { freq: 659, dur: 0.15, delay: 100 },
      { freq: 784, dur: 0.3, delay: 200 },
    ], 'sine', 0.25);
  }

  wrongAnswer() {
    this.playSequence([
      { freq: 300, dur: 0.2, delay: 0 },
      { freq: 250, dur: 0.3, delay: 150 },
    ], 'sawtooth', 0.15);
  }

  timerTick() {
    this.playTone(800, 0.05, 'sine', 0.1);
  }

  timerUrgent() {
    this.playSequence([
      { freq: 880, dur: 0.1, delay: 0 },
      { freq: 880, dur: 0.1, delay: 200 },
    ], 'square', 0.15);
  }

  countdown() {
    this.playSequence([
      { freq: 440, dur: 0.15, delay: 0 },
      { freq: 440, dur: 0.15, delay: 500 },
      { freq: 440, dur: 0.15, delay: 1000 },
      { freq: 880, dur: 0.4, delay: 1500 },
    ], 'sine', 0.2);
  }

  victory() {
    this.playSequence([
      { freq: 523, dur: 0.15, delay: 0 },
      { freq: 659, dur: 0.15, delay: 120 },
      { freq: 784, dur: 0.15, delay: 240 },
      { freq: 1047, dur: 0.4, delay: 400 },
      { freq: 784, dur: 0.15, delay: 600 },
      { freq: 1047, dur: 0.5, delay: 750 },
    ], 'sine', 0.25);
  }

  leaderboardReveal() {
    this.playSequence([
      { freq: 330, dur: 0.1, delay: 0 },
      { freq: 440, dur: 0.1, delay: 100 },
      { freq: 550, dur: 0.2, delay: 200 },
    ], 'triangle', 0.2);
  }

  podiumDrumroll() {
    const notes = [];
    for (let i = 0; i < 20; i++) {
      notes.push({ freq: 200 + Math.random() * 100, dur: 0.05, delay: i * 80 });
    }
    this.playSequence(notes, 'sawtooth', 0.08);
  }

  streakBonus() {
    this.playSequence([
      { freq: 660, dur: 0.08, delay: 0 },
      { freq: 880, dur: 0.08, delay: 70 },
      { freq: 1100, dur: 0.15, delay: 140 },
    ], 'sine', 0.2);
  }

  powerUp() {
    this.playSequence([
      { freq: 400, dur: 0.1, delay: 0 },
      { freq: 600, dur: 0.1, delay: 80 },
      { freq: 800, dur: 0.1, delay: 160 },
      { freq: 1200, dur: 0.2, delay: 240 },
    ], 'sine', 0.2);
  }

  waiting() {
    this.playSequence([
      { freq: 330, dur: 0.3, delay: 0 },
      { freq: 392, dur: 0.3, delay: 400 },
      { freq: 330, dur: 0.3, delay: 800 },
      { freq: 294, dur: 0.3, delay: 1200 },
    ], 'triangle', 0.08);
  }
}

const soundGen = new SoundGenerator();

export const useQuizAudio = () => {
  const [enabled, setEnabled] = useState(true);

  const play = useCallback((sound: keyof SoundGenerator) => {
    if (!enabled) return;
    try {
      (soundGen as any)[sound]?.();
    } catch {}
  }, [enabled]);

  return {
    enabled,
    setEnabled,
    play,
    sounds: {
      correctAnswer: () => play('correctAnswer'),
      wrongAnswer: () => play('wrongAnswer'),
      timerTick: () => play('timerTick'),
      timerUrgent: () => play('timerUrgent'),
      countdown: () => play('countdown'),
      victory: () => play('victory'),
      leaderboardReveal: () => play('leaderboardReveal'),
      podiumDrumroll: () => play('podiumDrumroll'),
      streakBonus: () => play('streakBonus'),
      powerUp: () => play('powerUp'),
      waiting: () => play('waiting'),
    },
  };
};

export { soundGen };

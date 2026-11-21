/**
 * Motor de Sonidos y Música procedural para el videojuego usando Web Audio API.
 * 100% autónomo, sin archivos externos, compatible con todos los navegadores y dispositivos.
 */
export class AudioManager {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;

    // Inicializar AudioContext al primer gesto del usuario
    this.initAudioContext();
  }

  initAudioContext() {
    const unlock = () => {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      // Iniciar música de fondo tropical una vez desbloqueado
      if (!this.bgmPlaying && !this.isMuted) {
        this.startBGM();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- EFECTOS DE SONIDO (SFX) ---

  /**
   * Sonido de salto clásico (barrido ascendente de frecuencia).
   */
  playJump() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.16);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  /**
   * Sonido de aterrizaje / pisada sobre studs.
   */
  playLand() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  /**
   * Sonido de recoger objeto (chime ascendente alegre).
   */
  playPickup() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.12);
    });
  }

  /**
   * Sonido de soltar objeto.
   */
  playDrop() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.14);

    gain.gain.setValueAtTime(0.22, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.14);
  }

  /**
   * Sonido de comer pupusa (munch crunch crujiente).
   */
  playEat() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const time = now + i * 0.08;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180 + Math.random() * 80, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.06);

      gain.gain.setValueAtTime(0.2, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.06);
    }
  }

  /**
   * Sonido de moneda (Colón salvadoreño recogido).
   */
  playCoin() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);

      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(987.77, now, 0.08);        // B5
    playTone(1318.51, now + 0.07, 0.25); // E6
  }

  /**
   * Sonido de daño / caída sintetizado.
   */
  playHurt() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  /**
   * Sonido de colocación de bloque.
   */
  playPlace() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(380, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Sonido de demolición de bloque.
   */
  playDestroy() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  /**
   * Fanfarria de victoria al completar un objetivo.
   */
  playVictory() {
    if (this.isMuted || !this.ensureContext()) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.12, t: 0 },    // C5
      { f: 659.25, d: 0.12, t: 0.12 }, // E5
      { f: 783.99, d: 0.12, t: 0.24 }, // G5
      { f: 1046.50, d: 0.45, t: 0.36 } // C6
    ];

    notes.forEach(({ f, d, t }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + t);

      gain.gain.setValueAtTime(0.28, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + d);
    });
  }

  // --- MÚSICA DE FONDO TROPICAL SALVADOREÑA (CUMBIA / MARIMBA PROCEDURAL) ---

  /**
   * Genera una nota de marimba tropical mediante síntesis sustractiva.
   */
  playMarimbaNote(freq, time, duration = 0.2, volume = 0.08) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Genera el bajo rítmico de cumbia (Tumbao).
   */
  playBassNote(freq, time, duration = 0.22) {
    if (!this.ctx) return;
    const ctx = this.ctx;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    gain.gain.setValueAtTime(0.12, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  /**
   * Inicia la melodía de cumbia/marimba tropical en bucle constante.
   */
  startBGM() {
    if (this.bgmPlaying || this.isMuted) return;
    if (!this.ensureContext()) return;

    this.bgmPlaying = true;

    // Escala de Do Mayor alegre (Marimba salvadoreña): C4, D4, E4, G4, A4, C5
    const melodyPattern = [
      523.25, 659.25, 783.99, 659.25,  // C5, E5, G5, E5
      587.33, 698.46, 880.00, 698.46,  // D5, F5, A5, F5
      523.25, 659.25, 783.99, 1046.50, // C5, E5, G5, C6
      783.99, 659.25, 587.33, 523.25   // G5, E5, D5, C5
    ];

    const bassPattern = [
      130.81, 196.00, 130.81, 196.00, // C3, G3, C3, G3
      146.83, 220.00, 146.83, 220.00, // D3, A3, D3, A3
      130.81, 196.00, 130.81, 196.00, // C3, G3, C3, G3
      196.00, 164.81, 146.83, 130.81  // G3, E3, D3, C3
    ];

    const tempo = 210; // ms por semicorchea
    this.bgmStep = 0;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // Nota de Marimba
      const noteFreq = melodyPattern[this.bgmStep % melodyPattern.length];
      if (this.bgmStep % 2 === 0) {
        this.playMarimbaNote(noteFreq, now, 0.22, 0.07);
      } else {
        this.playMarimbaNote(noteFreq * 0.75, now, 0.15, 0.04);
      }

      // Bajo cumbiero
      const bassFreq = bassPattern[this.bgmStep % bassPattern.length];
      if (this.bgmStep % 4 === 0 || this.bgmStep % 4 === 3) {
        this.playBassNote(bassFreq, now, 0.25);
      }

      this.bgmStep++;
    }, tempo);
  }

  /**
   * Pausa o silencia la música.
   */
  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  /**
   * Alterna entre sonido activado y silenciado.
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isMuted;
  }
}

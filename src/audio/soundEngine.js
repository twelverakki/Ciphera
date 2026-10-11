/**
 * Procedural Web Audio API Sound Engine for Cyberpunk SHA-3 Visualizer
 * Fully self-contained, no external MP3 dependencies, zero 404 risk.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.scrambleOscillator = null;
    this.scrambleGain = null;
    this.glitchInterval = null;
  }

  // Initialize or resume AudioContext on user interaction
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.isMuted) {
      this.stopScrambleHum();
    }
  }

  // 1. Subtle digital blip for typing
  playTypingBlip() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Random micro-pitch variation for realistic data-entry sound
      const baseFreq = 880 + (Math.random() * 200 - 100);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  // 2. Rising energy charge / whoosh for Absorb Phase
  playAbsorbCharge() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, this.ctx.currentTime + 1.2);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3500, this.ctx.currentTime + 1.2);

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.8);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 1.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.3);
    } catch {
      // Silently catch audio policy
    }
  }

  // 3. Low-frequency continuous hum + glitches for Scramble Phase
  startScrambleHum() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    if (this.scrambleOscillator) return; // already active

    try {
      // Low hum oscillator
      this.scrambleOscillator = this.ctx.createOscillator();
      this.scrambleGain = this.ctx.createGain();

      this.scrambleOscillator.type = 'triangle';
      this.scrambleOscillator.frequency.setValueAtTime(65, this.ctx.currentTime); // C2 hum

      this.scrambleGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      this.scrambleGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);

      this.scrambleOscillator.connect(this.scrambleGain);
      this.scrambleGain.connect(this.ctx.destination);
      this.scrambleOscillator.start();

      // Intermittent glitch ticking
      this.glitchInterval = setInterval(() => {
        if (this.isMuted || !this.ctx) return;
        this.playGlitchTick();
      }, 180);
    } catch {
      // Catch error
    }
  }

  playGlitchTick() {
    if (this.isMuted || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freqs = [350, 520, 780, 1040, 1500];
      const freq = freqs[Math.floor(Math.random() * freqs.length)];
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.02, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // Ignore
    }
  }

  stopScrambleHum() {
    if (this.glitchInterval) {
      clearInterval(this.glitchInterval);
      this.glitchInterval = null;
    }

    if (this.scrambleOscillator && this.ctx && this.scrambleGain) {
      try {
        this.scrambleGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.15);
        setTimeout(() => {
          if (this.scrambleOscillator) {
            this.scrambleOscillator.stop();
            this.scrambleOscillator.disconnect();
            this.scrambleOscillator = null;
            this.scrambleGain = null;
          }
        }, 160);
      } catch {
        this.scrambleOscillator = null;
        this.scrambleGain = null;
      }
    }
  }

  // 4. Heavy digital lock / chime for Squeeze Phase
  playDigitalLock() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    try {
      // Primary chime
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, this.ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(1046.50, this.ctx.currentTime + 0.08); // C6

      gain1.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1.2);

      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start();
      osc1.stop(this.ctx.currentTime + 1.2);

      // Low bass punch for lock impact
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(45, this.ctx.currentTime + 0.3);

      gain2.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start();
      osc2.stop(this.ctx.currentTime + 0.4);
    } catch {
      // Ignore
    }
  }

  // 4. Sound Potek / Bloop: Terlepas dari balok template di atas
  playClonePotek() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      
      // Pitch drop cepat khas "potek / bloop"
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(800 + Math.random() * 120, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.05);
    } catch {
      // Ignore
    }
  }

  // 5. Sound Whoosh Tipis: Saat meluncur turun
  playWhooshThin() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.1);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.value = 1.5;

      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.1);
    } catch {
      // Ignore
    }
  }

  // 6. Sound Klop: Mendarat presisi di dalam wadah kotak
  playLandingKlop() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      
      // Solid click/snap impact (Klop)
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(now + 0.04);
    } catch {
      // Ignore
    }
  }

  // Subtle button click UI sound
  playClick() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.03);
    } catch {
      // Ignore
    }
  }
}

export const soundEngine = new SoundEngine();

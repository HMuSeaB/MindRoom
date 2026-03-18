export function createAudioSystem() {
  let audioCtx = null;
  let noiseNode = null;
  let gainNode = null;
  let rippleTrigger = null;
  let stopTimeoutId = null;

  function teardownAmbientNodes() {
    if (noiseNode) {
      try {
        noiseNode.stop();
      } catch (err) {
        // Ignore repeated stop attempts during teardown.
      }
    }

    noiseNode = null;
    gainNode = null;
  }

  function ensureAudioContext() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }

    return audioCtx;
  }

  function playAmbientSound() {
    try {
      const ctx = ensureAudioContext();
      if (noiseNode) return;

      const bufferSize = 2 * ctx.sampleRate;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      noiseNode = ctx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2);

      noiseNode.connect(gainNode);
      gainNode.connect(ctx.destination);
      noiseNode.start();
    } catch (err) {
      console.log('Audio not supported:', err);
    }
  }

  function stopAmbientSound() {
    try {
      if (!gainNode || !noiseNode || !audioCtx) return;

      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
      window.clearTimeout(stopTimeoutId);
      stopTimeoutId = window.setTimeout(() => {
        if (!noiseNode) return;
        teardownAmbientNodes();
      }, 1000);
    } catch (err) {
      console.log('Error stopping audio:', err);
    }
  }

  function playZenBell() {
    try {
      const ctx = ensureAudioContext();
      if (ctx.state === 'suspended') ctx.resume();

      const t = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.frequency.value = 220;
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      gain1.gain.setValueAtTime(0, t);
      gain1.gain.linearRampToValueAtTime(0.5, t + 0.1);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 4);
      osc1.start(t);
      osc1.stop(t + 4);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.value = 660;
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.1, t + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 3);
      osc2.start(t);
      osc2.stop(t + 3);
    } catch (err) {
      console.warn('ZenBell failed:', err);
    }
  }

  const typeSound = {
    ctx: null,
    convolver: null,
    tapHistory: [],
    compressor: null,
    analyser: null,

    init() {
      try {
        if (!this.ctx) {
          this.ctx = ensureAudioContext();
          audioCtx = this.ctx;
        }

        if (!this.compressor) {
          this.compressor = this.ctx.createDynamicsCompressor();
          this.compressor.threshold.value = -10;
          this.compressor.knee.value = 40;
          this.compressor.ratio.value = 8;
          this.compressor.attack.value = 0.05;
          this.compressor.release.value = 0.25;
        }

        if (!this.analyser) {
          this.analyser = this.ctx.createAnalyser();
          this.analyser.fftSize = 256;
          this.compressor.connect(this.analyser);
          this.analyser.connect(this.ctx.destination);
        }

        this.generateReverb();
      } catch (err) {
        console.warn('TypeSound init failed:', err);
      }
    },

    generateReverb() {
      const rate = this.ctx.sampleRate;
      const length = rate * 2.5;
      const decay = 2.0;
      const buffer = this.ctx.createBuffer(2, length, rate);

      for (let channelIndex = 0; channelIndex < 2; channelIndex++) {
        const channel = buffer.getChannelData(channelIndex);
        for (let i = 0; i < length; i++) {
          channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        }
      }

      this.convolver = this.ctx.createConvolver();
      this.convolver.buffer = buffer;
      this.convolver.connect(this.compressor);
    },

    getAnalysis() {
      if (!this.analyser) return { volume: 0 };

      const len = this.analyser.frequencyBinCount;
      const data = new Uint8Array(len);
      this.analyser.getByteFrequencyData(data);

      let sum = 0;
      for (let i = 0; i < len; i++) {
        sum += data[i];
      }

      return { volume: sum / len };
    },

    getBPM() {
      const now = Date.now();
      this.tapHistory.push(now);
      this.tapHistory = this.tapHistory.filter(time => now - time < 5000);

      if (this.tapHistory.length < 2) return 0;
      return this.tapHistory.length * 12;
    },

    play() {
      if (!this.ctx) this.init();
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const bpm = this.getBPM();
      const t = this.ctx.currentTime;
      const isFlowState = bpm > 300;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.compressor);

      if (isFlowState) {
        const notes = [523.25, 587.33, 659.25, 783.99, 880.0];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.4);
      } else {
        const notes = [130.81, 146.83, 164.81, 196.0, 220.0];
        osc.type = 'sine';
        osc.frequency.setValueAtTime(notes[Math.floor(Math.random() * notes.length)], t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(250, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        osc.start(t);
        osc.stop(t + 1.5);
      }

      rippleTrigger?.(isFlowState);
    }
  };

  return {
    playAmbientSound,
    stopAmbientSound,
    playZenBell,
    typeSound,
    setRippleTrigger(trigger) {
      rippleTrigger = trigger;
    },
    destroy() {
      window.clearTimeout(stopTimeoutId);
      teardownAmbientNodes();
    }
  };
}

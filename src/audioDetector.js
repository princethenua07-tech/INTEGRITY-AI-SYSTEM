// Audio Analysis & Anomaly Detection using Web Audio API
export class AudioDetector {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.18; // Normalized threshold
    this.audioContext = null;
    this.analyser = null;
    this.microphone = null;
    this.dataArray = null;
    this.isRunning = false;
    this.noiseHistory = [];
    this.speechViolationCallback = null;
    this.onLevelUpdate = null;
    this.sustainedHighCount = 0;
    this.isBeepEnabled = true;
  }

  async start(stream, onViolation, onLevelUpdate) {
    this.speechViolationCallback = onViolation;
    this.onLevelUpdate = onLevelUpdate;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.7;

      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.isRunning = true;

      this.analyzeLoop();
      return true;
    } catch (err) {
      console.warn('Audio detection initialization failed:', err);
      return false;
    }
  }

  analyzeLoop = () => {
    if (!this.isRunning || !this.analyser) return;

    this.analyser.getByteFrequencyData(this.dataArray);

    // Calculate Average Volume / RMS
    let sum = 0;
    let peak = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const val = this.dataArray[i];
      sum += val;
      if (val > peak) peak = val;
    }
    const avg = sum / this.dataArray.length;
    const normalizedLevel = Math.min(1.0, avg / 128.0); // 0.0 to 1.0

    if (this.onLevelUpdate) {
      this.onLevelUpdate(normalizedLevel, peak);
    }

    // Voice & speech anomaly detection
    // Human voice typically sits between 100Hz - 3000Hz (first 60 bins of 256)
    let voiceBandSum = 0;
    const voiceBins = Math.min(60, this.dataArray.length);
    for (let i = 2; i < voiceBins; i++) {
      voiceBandSum += this.dataArray[i];
    }
    const voiceBandAvg = voiceBandSum / (voiceBins - 2);

    if (normalizedLevel > this.threshold || voiceBandAvg > 75) {
      this.sustainedHighCount++;
      // If noise is sustained for ~1.2s (about 25 frames at 50ms)
      if (this.sustainedHighCount === 25) {
        if (this.speechViolationCallback) {
          this.speechViolationCallback({
            type: 'AUDIO_ANOMALY',
            level: Math.round(normalizedLevel * 100),
            message: 'Suspicious acoustic activity / voice detected'
          });
        }
      }
    } else {
      if (this.sustainedHighCount > 0) {
        this.sustainedHighCount = Math.max(0, this.sustainedHighCount - 2);
      }
    }

    requestAnimationFrame(this.analyzeLoop);
  };

  playWarningBeep() {
    if (!this.isBeepEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = this.audioContext || new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18); // drop to A4

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.22);
    } catch (e) {
      // Audio not permitted yet or muted
    }
  }

  stop() {
    this.isRunning = false;
    if (this.microphone) {
      try { this.microphone.disconnect(); } catch (e) {}
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try { this.audioContext.close(); } catch (e) {}
    }
  }
}

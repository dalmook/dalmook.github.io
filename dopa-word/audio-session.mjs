// Vocabulary-session adapter; original audio.js and its synth/music stay intact.
// Silent long sessions must not build inaudible oscillator/convolver graphs.
import {AudioEngine} from './vendor/audio.js';
export class SessionAudio extends AudioEngine {
  unlock() {
    if (!this.capture && (this.muted || this.volume <= 0)) return;
    const existed = !!this.ctx;
    super.unlock();
    if (!existed && this.ctx && this.playing) {
      // The fallback clock and AudioContext clock have different origins.
      this.nextTime = this.now() + .06;
      this.kicks.length = 0;
      this.beats.length = 0;
    }
  }
  play(name, when, parameters = {}) {
    if (!this.capture && (this.muted || this.volume <= 0)) return;
    super.play(name, when, parameters);
  }
  setMuted(muted) {
    super.setMuted(muted);
    if (!muted && this.volume > 0 && this.playing && !this.ctx) this.unlock();
  }
  dispose() {
    this.stopMusic();
    const context = this.ctx;
    this.ctx = null;
    this.g = null;
    this.kicks.length = 0;
    this.beats.length = 0;
    if (context && context.state !== 'closed') {
      try { context.close().catch(() => {}); } catch {}
    }
  }
}

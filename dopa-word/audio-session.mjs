// Keep original instruments, melodies and unlockable songs; bound their lifetime.
import {AudioEngine} from './vendor/audio.js';
import {VoicePool} from './voice-pool.mjs';
const automation = new Set(['duck','filter','musicGain','delayTime']);
export class SessionAudio extends AudioEngine {
  constructor(options = {}) {
    super(options); this.pool = null; this.timer = null; this.inMusic = false;
    this.horizon = .32; this.lastPump = -Infinity;
    this.stats = {ticks:0, skippedSteps:0, recoveries:0};
  }
  unlock() {
    if (!this.capture && (this.muted || this.volume <= 0)) return;
    const existed = !!this.ctx;
    super.unlock();
    if (!existed && this.ctx) {
      if (this.playing) {
        this.nextTime = this.now() + .06; this.kicks.length = this.beats.length = 0;
      }
      this.pool = new VoicePool(this.ctx); this.lastPump = -Infinity;
    }
    this.ensureTimer();
  }
  ensureTimer() {
    if (this.capture || this.timer || (!this.playing && !this.pool?.voices.size)) return;
    this.timer = setInterval(() => this.update(), 25);
    this.timer.unref?.(); // Let Node unit tests exit; browser handles are numbers.
  }
  startMusic() { super.startMusic(); this.lastPump = -Infinity; this.ensureTimer(); this.update(); }
  stopMusic() {
    super.stopMusic();
    this.pool?.clear(true); // Prevent already-scheduled backing notes on next screen.
    if (!this.pool?.voices.size) this.clearTimer();
  }
  clearTimer() { if (this.timer) clearInterval(this.timer); this.timer = null; }
  scheduleStep(step, when) {
    this.inMusic = true;
    try { super.scheduleStep(step, when); } finally { this.inMusic = false; }
  }
  update() {
    if (this.capture) { super.update(); return; }
    const wall = performance.now();
    if (wall - this.lastPump < 12) return;
    this.lastPump = wall; this.pool?.sweep();
    if (!this.playing) { if (!this.pool?.voices.size) this.clearTimer(); return; }
    if (this.muted || this.volume <= 0 || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.now();
    // Never replay a backlog of overdue notes at once after an interrupted frame.
    if (this.nextTime < now + .008) {
      const skipped = Math.max(0, Math.ceil((now + .02 - this.nextTime) / this.stepDur));
      this.step += skipped; this.nextTime += skipped * this.stepDur;
      this.stats.skippedSteps += skipped; this.stats.recoveries++;
    }
    let count = 0;
    while (this.nextTime < now + this.horizon && count++ < 12) {
      this.scheduleStep(this.step++, this.nextTime); this.nextTime += this.stepDur;
    }
    this.stats.ticks++;
  }
  play(name, when, parameters = {}) {
    if (this.capture) { super.play(name, when, parameters); return; }
    if (this.muted || this.volume <= 0) return;
    if (!this.ctx || !this.g || !this.pool || automation.has(name)) {
      super.play(name, when, parameters); return;
    }
    const lease = this.pool.begin(this.inMusic); if (!lease) return;
    const graph = this.g;
    this.g = {...graph,ctx:lease.ctx};
    try { super.play(name, when, parameters); }
    finally { this.g = graph; lease.commit(); this.ensureTimer(); }
  }
  setMuted(muted) {
    const changed = muted !== this.muted;
    super.setMuted(muted);
    if (muted) this.pool?.clear();
    if (!muted && this.volume > 0 && this.playing && !this.ctx) this.unlock();
    if (changed && !muted && this.playing) { this.nextTime = this.now() + .06; this.lastPump = -Infinity; }
  }
  dispose() {
    this.stopMusic(); this.clearTimer(); this.pool?.clear(); this.pool = null;
    const context = this.ctx; this.ctx = null; this.g = null;
    this.kicks.length = this.beats.length = 0;
    if (context && context.state !== 'closed') {
      try { context.close().catch(() => {}); } catch {}
    }
  }
}

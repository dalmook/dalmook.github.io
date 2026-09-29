// Scoped lifetime tracking for the unmodified original synth. No prototype edits.
// Only transient per-note nodes are owned here; shared reverb/delay buses remain.
export class VoicePool {
  constructor(ctx, {maxVoices = 80, maxNodes = 640} = {}) {
    this.ctx = ctx; this.maxVoices = maxVoices; this.maxNodes = maxNodes;
    this.voices = new Set(); this.nodes = 0;
    this.stats = {created:0, released:0, dropped:0, peakNodes:0, peakVoices:0};
  }
  sweep(now = this.ctx.currentTime) {
    for (const voice of this.voices) if (now >= voice.until + .06) this.release(voice);
  }
  release(voice, stop = false) {
    if (!this.voices.delete(voice)) return;
    if (stop) for (const node of voice.sources) { try { node.stop(); } catch {} }
    for (const node of voice.nodes) { try { node.disconnect(); } catch {} }
    this.nodes -= voice.nodes.length; this.stats.released++;
    voice.nodes.length = voice.sources.length = 0;
  }
  clear(musicOnly = false) {
    for (const voice of this.voices) if (!musicOnly || voice.music) this.release(voice, true);
  }
  begin(music = false) {
    this.sweep();
    // Reserve space for the original instrument's largest graph (~40 nodes).
    if (this.voices.size >= this.maxVoices || this.nodes > this.maxNodes - 48) {
      this.stats.dropped++; return null;
    }
    const voice = {nodes:[],sources:[],until:this.ctx.currentTime,music};
    const methods = new Map(), ctx = this.ctx;
    const proxy = new Proxy(ctx, {get(target, key) {
      if (methods.has(key)) return methods.get(key);
      const value = Reflect.get(target, key, target);
      if (typeof value !== 'function') return value;
      const fn = String(key).startsWith('create') ? (...args) => {
        const node = value.apply(ctx, args);
        if (typeof node.disconnect !== 'function') return node; // AudioBuffer
        voice.nodes.push(node);
        if (typeof node.start === 'function' && typeof node.stop === 'function') {
          voice.sources.push(node);
          const stop = node.stop.bind(node);
          node.stop = (when, ...rest) => {
            voice.until = Math.max(voice.until, when ?? ctx.currentTime);
            return stop(when, ...rest);
          };
        }
        return node;
      } : value.bind(ctx);
      methods.set(key, fn); return fn;
    }});
    return {ctx:proxy, commit:() => {
      if (!voice.nodes.length) return;
      this.voices.add(voice); this.nodes += voice.nodes.length; this.stats.created++;
      this.stats.peakNodes = Math.max(this.stats.peakNodes, this.nodes);
      this.stats.peakVoices = Math.max(this.stats.peakVoices, this.voices.size);
      // A failed instrument with no stop call must not retain a permanent graph.
      if (!voice.sources.length) this.release(voice);
    }};
  }
}

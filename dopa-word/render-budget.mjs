// Decorative work adapts to sustained frame delays. Main mascot/choice arms stay live.
// A separate setting never mutates the vocabulary/score v1 save.
export const PERFORMANCE_VERSION = 'smooth-1';
export class RenderBudget {
  constructor(scene) {
    this.scene = scene; this.mode = 'auto'; this.tier = 1; this.last = 0;
    this.windowStart = 0; this.samples = 0; this.slow = 0;
    this.lastDecor = -Infinity; this.lastBackground = -Infinity;
    this.stats = {frames:0,backgrounds:0,decorations:0,adjustments:0};
    try { const m = localStorage.getItem('dopa-word-performance-v1'); if (['auto','full','light'].includes(m)) this.mode = m; } catch {}
    const label = document.createElement('label'); label.textContent = '성능 설정';
    const select = document.createElement('select'); select.id = 'set-performance';
    for (const [v,t] of [['auto','자동 조절 (권장)'],['full','고화질'],['light','가볍게']]) {
      const o = document.createElement('option'); o.value=v; o.textContent=t; select.append(o);
    }
    select.value=this.mode; label.append(select);
    document.getElementById('set-motion').closest('label').after(label);
    select.onchange = () => {
      this.mode=select.value;
      try { localStorage.setItem('dopa-word-performance-v1',this.mode); } catch {}
      this.apply();
    };
    this.apply();
  }
  get level() { return this.mode==='full'?0:this.mode==='light'?2:this.tier; }
  apply() {
    const n=this.level, s=this.scene;
    document.body.classList.toggle('perf-light',n===2);
    document.documentElement.dataset.performanceMode=this.mode;
    // No replacement of source assets or character art. Only decorative density.
    for (const [fx,maximum] of [[s.fx,[270,150,70][n]],[s.back,[330,180,95][n]]]) {
      fx.max=maximum;
      if(fx.parts.length>maximum)fx.parts.splice(0,fx.parts.length-maximum);
      fx.resize=()=>{
        const dpr=Math.min([2,1.25,1][this.level],window.devicePixelRatio||1);
        const w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
        if(fx.canvas.width!==w||fx.canvas.height!==h){fx.canvas.width=w;fx.canvas.height=h;}
        fx.dpr=dpr;
      };
    }
    s.bg.resize=()=>{
      const dpr=Math.min([1.25,1,.7][this.level],window.devicePixelRatio||1);
      const w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);
      if(s.bg.canvas.width!==w||s.bg.canvas.height!==h){s.bg.canvas.width=w;s.bg.canvas.height=h;}
      s.bg.dpr=dpr;
    };
    this.lastBackground=-Infinity;
  }
  frame(t) {
    const gap=this.last?t-this.last:0;this.last=t;this.stats.frames++;
    // Ignore tab wake-up; lowering decoration cannot fix a backgrounded timer.
    if(gap>0&&gap<300){this.samples++;if(gap>28)this.slow++;}
    if(!this.windowStart)this.windowStart=t;
    if(t-this.windowStart>2500){
      if(this.mode==='auto'&&this.samples>=12&&this.slow/this.samples>.25&&this.tier<2){this.tier++;this.stats.adjustments++;this.apply();}
      this.samples=this.slow=0;this.windowStart=t;
    }
  }
  decorDue(t) { const interval=[0,32,49][this.level];if(t-this.lastDecor<interval)return false;this.lastDecor=t;this.stats.decorations++;return true; }
  backgroundDue(t) { const interval=[16,33,66][this.level];if(t-this.lastBackground<interval)return false;this.lastBackground=t;this.stats.backgrounds++;return true; }
  get density() { return [1,.7,.4][this.level]; }
  get dancers() { return [6,4,2][this.level]; }
}

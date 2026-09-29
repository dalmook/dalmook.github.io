// Meaning-choice choreography uses the original mascot's stretchy arms.
// The game commits a choice only after this operation returns true.
import {centerOf, onFrame} from './vendor/core.js';

export const CHOICE_MOTION_VERSION = 'choice-arm-1';
export class ChoiceMotion {
  constructor(scene) {
    this.scene = scene;
    this.pending = null;
    this.stage = 'idle';
    const style = document.createElement('link');
    style.rel = 'stylesheet';
    style.href = new URL('./choice-motion.css', import.meta.url).href;
    document.head.append(style);
    this.target = document.createElement('div');
    this.target.id = 'choice-target';
    this.target.hidden = true;
    this.target.setAttribute('aria-live', 'polite');
    this.badge = document.createElement('b');
    this.label = document.createElement('span');
    this.target.append(this.badge, this.label);
    document.getElementById('question-note').after(this.target);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.cancel();
    });
    window.addEventListener('pagehide', () => this.cancel());
  }

  reset(mode = '') {
    this.cancel();
    this.target.hidden = mode !== 'choice';
    this.target.className = '';
    this.target.dataset.phase = 'idle';
    this.badge.textContent = '?';
    this.label.textContent = '팔을 쭉 뻗어 뜻을 골라요!';
    this.stage = 'idle';
  }

  cancel() { this.pending?.cancel(); }

  outcome(correct) {
    this.target.classList.toggle('right', correct);
    this.target.classList.toggle('wrong', !correct);
  }

  play(button, index, label, isCurrent) {
    this.cancel();
    if (!button?.isConnected || !this.target.isConnected || !isCurrent()) {
      return Promise.resolve(false);
    }
    this.outcome(false);
    this.target.className = '';
    this.badge.textContent = '?';
    this.label.textContent = '선택한 뜻을 가져오는 중…';
    if (!this.scene.opts.motion) {
      this.badge.textContent = String(index + 1);
      this.label.textContent = label;
      this.target.dataset.phase = this.stage = 'placed';
      return Promise.resolve(isCurrent());
    }
    const scene = this.scene;
    scene.hero.begin(); // Stop a preceding body reaction, not the original arm engine.
    scene.hero.rot = 0;
    scene.hero.lift = 0;
    scene.hero.stretchX = scene.hero.stretchY = 1;
    scene.layout();
    const from = centerOf(button);
    const to = centerOf(this.badge);
    const hand = scene.hero.freeHand(from);
    const bubble = document.createElement('div');
    bubble.className = 'choice-carry-label';
    bubble.textContent = label; // User text is never parsed as HTML.
    bubble.setAttribute('aria-hidden', 'true');
    bubble.hidden = true;
    document.body.append(bubble);
    button.classList.add('picking');
    this.target.dataset.phase = this.stage = 'reach';

    return new Promise((resolve, reject) => {
      let done = false;
      let grabbed = false;
      let placed = false;
      let off = () => {};
      const operation = { cancel: () => finish(false) };
      const finish = (accepted, error = null) => {
        if (done) return;
        // Cancel before invoking h.cancel: the original cancel calls onPlace.
        done = true;
        off();
        bubble.remove();
        button.classList.remove('picking', 'grabbed');
        if (!accepted) {
          const cancel = hand.cancel;
          hand.cancel = null;
          hand.job = 0;
          hand.carry = null;
          hand.mode = 'rest';
          cancel?.();
          scene.hero.lean.target = 0;
          this.stage = this.target.dataset.phase = 'cancelled';
        }
        if (this.pending === operation) this.pending = null;
        if (error) reject(error); else resolve(accepted);
      };
      this.pending = operation;
      off = onFrame(() => {
        if (done) return;
        if (!isCurrent() || document.hidden || !button.isConnected) {
          finish(false);
          return;
        }
        // Original carry accepts point objects. Update those objects as the
        // viewport/scroll changes so hands still hit the actual selected card.
        Object.assign(from, centerOf(button));
        Object.assign(to, centerOf(this.badge));
        scene.hero.visible = true;
        if (grabbed && !placed) {
          const x = Math.max(16, Math.min(innerWidth - 16, hand.x));
          const y = Math.max(20, Math.min(innerHeight - 20, hand.y - 46));
          bubble.style.left = x + 'px';
          bubble.style.top = y + 'px';
        }
      });
      try {
        Promise.resolve(scene.hero.carry(from, to, String(index + 1), {
          E: Math.min(1, scene.E),
          onGrab: () => {
            if (done || !isCurrent()) { finish(false); return; }
            grabbed = true;
            bubble.hidden = false;
            button.classList.add('grabbed');
            this.stage = this.target.dataset.phase = 'carry';
            scene.audio.grab();
          },
          onPlace: () => {
            if (done || !isCurrent()) { finish(false); return; }
            placed = true;
            bubble.hidden = true;
            this.badge.textContent = String(index + 1);
            this.label.textContent = label;
            this.stage = this.target.dataset.phase = 'placed';
            scene.audio.place();
          }
        })).then(() => finish(placed && isCurrent()), error => finish(false, error));
      } catch (error) { finish(false, error); }
    });
  }
}

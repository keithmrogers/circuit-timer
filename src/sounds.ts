// Beeps (Web Audio) and the spoken move names (speech synthesis). Both fail quietly:
// the timer must work on a tablet with no sound.

export class Sounds {
  enabled = true;
  private ctx: AudioContext | null = null;

  /** Call from a tap: browsers only allow audio that a user gesture started. */
  unlock() {
    if (!this.enabled) return;
    try {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      this.ctx ??= Ctx ? new Ctx() : null;
      void this.ctx?.resume();
    } catch {
      this.ctx = null;
    }
  }

  private beep(freq: number, ms: number, at = 0) {
    if (!this.enabled || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + at;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + ms / 1000 + 0.02);
    } catch {
      /* no sound */
    }
  }

  tick() {
    this.beep(660, 120);
  }

  go() {
    this.beep(990, 350);
  }

  done() {
    this.beep(660, 150);
    this.beep(880, 150, 0.18);
    this.beep(1180, 400, 0.36);
  }

  say(text: string) {
    if (!this.enabled || !("speechSynthesis" in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1;
      speechSynthesis.speak(u);
    } catch {
      /* no voice */
    }
  }

  quiet() {
    try {
      if ("speechSynthesis" in window) speechSynthesis.cancel();
    } catch {
      /* nothing to stop */
    }
  }
}

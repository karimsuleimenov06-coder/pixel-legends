// Core math/helper utilities shared across all modules.
window.PL = window.PL || {};

PL.VIEW_W = 480;
PL.VIEW_H = 270;

PL.U = {
  rand(min, max) { return min + Math.random() * (max - min); },
  randInt(min, max) { return Math.floor(this.rand(min, max + 1)); },
  choose(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  clamp(v, min, max) { return v < min ? min : (v > max ? max : v); },
  lerp(a, b, t) { return a + (b - a) * t; },
  approach(cur, target, maxDelta) {
    if (Math.abs(target - cur) <= maxDelta) return target;
    return cur + Math.sign(target - cur) * maxDelta;
  },
  dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); },
  aabbOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  },
  now() { return performance.now(); },
  mitigate(dmg, def) { return Math.max(1, dmg * (60 / (60 + (def || 0)))); },
  rollCrit(chancePercent) { return Math.random() * 100 < chancePercent; },
  uid() { return Math.random().toString(36).slice(2, 10); },
  // Lightens (amt>0) or darkens (amt<0) a "#rrggbb" color by amt in [-1,1]. Used for pixel-art bevels/shading.
  shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) & 0xff, g = (n >> 8) & 0xff, b = n & 0xff;
    const f = (c) => PL.U.clamp(Math.round(amt >= 0 ? c + (255 - c) * amt : c + c * amt), 0, 255);
    r = f(r); g = f(g); b = f(b);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },
  // Deterministic pseudo-random in [0,1) from integer coordinates — stable per-tile "noise" with no stored state.
  hashNoise(ix, iy, seed) {
    let h = (ix * 374761393 + iy * 668265263 + (seed || 0) * 2246822519) | 0;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = (h ^ (h >>> 16)) >>> 0;
    return (h % 1000) / 1000;
  },
  formatTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  },
  // Simple deep-ish merge for save-data defaults.
  mergeDefaults(target, defaults) {
    if (typeof defaults !== 'object' || defaults === null) return target;
    if (typeof target !== 'object' || target === null) target = Array.isArray(defaults) ? [] : {};
    for (const k in defaults) {
      if (!(k in target)) {
        target[k] = (typeof defaults[k] === 'object' && defaults[k] !== null) ?
          this.mergeDefaults(Array.isArray(defaults[k]) ? [] : {}, defaults[k]) : defaults[k];
      } else if (typeof defaults[k] === 'object' && defaults[k] !== null && !Array.isArray(defaults[k])) {
        target[k] = this.mergeDefaults(target[k], defaults[k]);
      }
    }
    return target;
  }
};

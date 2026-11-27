// Pixel-art primitives: an integer pixel buffer, selective outlines, nearest-neighbour rotation,
// bitmap digits and crisp (alpha-thresholded) text. Everything here produces hard-edged pixels only.
window.PL = window.PL || {};

PL.Pixel = (function () {
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function rng(seed) {
    let a = (seed * 2654435761) >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.px = new Array(w * h).fill(null); }
    put(x, y, c) {
      x = Math.round(x); y = Math.round(y);
      if (c && x >= 0 && y >= 0 && x < this.w && y < this.h) this.px[y * this.w + x] = c;
    }
    get(x, y) { return (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : this.px[y * this.w + x]; }
    rect(x, y, w, h, c) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(x + i, y + j, c); }
    grid(rows, pal, ox, oy) {
      for (let j = 0; j < rows.length; j++) {
        const row = rows[j];
        for (let i = 0; i < row.length; i++) {
          const ch = row[i];
          if (ch !== '.' && ch !== ' ') this.put(ox + i, oy + j, pal[ch]);
        }
      }
    }
    line(x0, y0, x1, y1, c, thick) {
      thick = thick || 1;
      x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
      const lo = -Math.floor((thick - 1) / 2), hi = Math.ceil((thick - 1) / 2);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        for (let j = lo; j <= hi; j++) for (let i = lo; i <= hi; i++) this.put(x0 + i, y0 + j, c);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
      }
    }
    // Scanline polygon fill on integer pixels (no anti-aliasing).
    polygon(pts, c) {
      let minY = Infinity, maxY = -Infinity;
      for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
      for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
          if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) xs.push(x0 + (y - y0) / (y1 - y0) * (x1 - x0));
        }
        xs.sort((a, b) => a - b);
        for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x <= Math.round(xs[k + 1]); x++) this.put(x, y, c);
      }
    }
    upscale(k) {
      const o = new Buf(this.w * k, this.h * k);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        const c = this.px[y * this.w + x];
        if (c) for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) o.px[(y * k + j) * o.w + x * k + i] = c;
      }
      return o;
    }
    bbox() {
      let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (this.px[y * this.w + x]) {
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
      return { x0, y0, x1, y1 };
    }
    stamp(src, ox, oy) {
      for (let j = 0; j < src.h; j++) for (let i = 0; i < src.w; i++) {
        const c = src.px[j * src.w + i];
        if (c) this.put(ox + i, oy + j, c);
      }
    }
    // Fake top-down lighting: brighten pixels on upper edges, darken pixels on lower edges.
    volume(hi, lo) {
      const src = this.px.slice(), w = this.w;
      for (let y = 0; y < this.h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, c = src[i];
        if (!c) continue;
        if (y === 0 || !src[i - w]) this.px[i] = PL.U.shade(c, hi);
        else if (y === this.h - 1 || !src[i + w]) this.px[i] = PL.U.shade(c, -lo);
        else if ((y > 1 && !src[i - 2 * w])) this.px[i] = PL.U.shade(c, hi * 0.4);
      }
      return this;
    }
    // Dark outline on transparent pixels touching opaque ones, tinted from the neighbour colour.
    outline(strength) {
      const s = strength == null ? -0.72 : strength;
      const src = this.px.slice();
      const at = (x, y) => (x < 0 || y < 0 || x >= this.w || y >= this.h) ? null : src[y * this.w + x];
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x]) continue;
        const n = at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1);
        if (n) this.px[y * this.w + x] = PL.U.shade(n, s);
      }
      return this;
    }
    flipped() {
      const b = new Buf(this.w, this.h);
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) b.px[y * this.w + (this.w - 1 - x)] = this.px[y * this.w + x];
      return b;
    }
    silhouette(color) {
      const b = new Buf(this.w, this.h);
      for (let i = 0; i < this.px.length; i++) if (this.px[i]) b.px[i] = color;
      return b;
    }
    toCanvas() {
      const c = document.createElement('canvas');
      c.width = this.w; c.height = this.h;
      const g = c.getContext('2d');
      const img = g.createImageData(this.w, this.h);
      const memo = {};
      for (let i = 0; i < this.px.length; i++) {
        const col = this.px[i];
        if (!col) continue;
        const rgb = memo[col] || (memo[col] = hexToRgb(col));
        img.data[i * 4] = rgb[0]; img.data[i * 4 + 1] = rgb[1]; img.data[i * 4 + 2] = rgb[2]; img.data[i * 4 + 3] = 255;
      }
      g.putImageData(img, 0, 0);
      return c;
    }
  }

  // Nearest-neighbour rotation around (px,py). Returns the rotated buffer and where the pivot landed.
  function rotate(src, angle, px, py) {
    let r = 0;
    for (const [cx, cy] of [[0, 0], [src.w, 0], [0, src.h], [src.w, src.h]]) r = Math.max(r, Math.hypot(cx - px, cy - py));
    const c = Math.ceil(r) + 1, size = c * 2 + 1;
    const out = new Buf(size, size);
    const cos = Math.cos(angle), sin = Math.sin(angle);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = x - c, dy = y - c;
      const sx = Math.round(dx * cos + dy * sin + px);
      const sy = Math.round(-dx * sin + dy * cos + py);
      const col = src.get(sx, sy);
      if (col) out.px[y * size + x] = col;
    }
    return { buf: out, cx: c, cy: c };
  }

  // ---------------- Bitmap digits for damage numbers ----------------
  const DIGITS = {
    '0': ['111', '101', '101', '101', '111'], '1': ['010', '110', '010', '010', '111'],
    '2': ['111', '001', '111', '100', '111'], '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'], '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'], '7': ['111', '001', '010', '010', '010'],
    '8': ['111', '101', '111', '101', '111'], '9': ['111', '101', '111', '001', '111'],
    '!': ['1', '1', '1', '0', '1'], '+': ['000', '010', '111', '010', '000']
  };
  const textCache = {};

  function digits(str, color) {
    const key = 'd|' + str + '|' + color;
    if (textCache[key]) return textCache[key];
    let w = 2;
    for (const ch of str) w += (DIGITS[ch] ? DIGITS[ch][0].length : 2) + 1;
    const b = new Buf(w + 1, 8);
    let x = 1;
    for (const ch of str) {
      const g = DIGITS[ch];
      if (!g) { x += 3; continue; }
      for (let j = 0; j < 5; j++) for (let i = 0; i < g[j].length; i++) if (g[j][i] === '1') b.put(x + i, 1 + j, j < 2 ? PL.U.shade(color, 0.25) : color);
      x += g[0].length + 1;
    }
    b.outline(-0.85);
    return (textCache[key] = b.toCanvas());
  }

  // System font rendered small, then thresholded so it has no soft edges, plus a dark outline.
  const FONT = '8px Tiny5, Arial, sans-serif';
  function text(str, color) {
    const key = 't|' + str + '|' + color;
    if (textCache[key]) return textCache[key];
    const c = document.createElement('canvas');
    const g = c.getContext('2d');
    g.font = FONT;
    const w = Math.ceil(g.measureText(str).width) + 4, h = 14;
    c.width = w; c.height = h;
    g.font = FONT;
    g.textBaseline = 'top';
    g.fillStyle = '#fff';
    g.fillText(str, 2, 2);
    const data = g.getImageData(0, 0, w, h).data;
    const b = new Buf(w, h);
    for (let i = 0; i < w * h; i++) if (data[i * 4 + 3] > 110) b.px[i] = color;
    b.outline(-0.85);
    const out = b.toCanvas();
    // Don't cache a fallback-font rendering made before the pixel font finished loading.
    if (!document.fonts || document.fonts.check(FONT)) textCache[key] = out;
    return out;
  }

  // Animated dashed ground marker with end brackets (attack telegraphs, hazard zones).
  function marker(ctx, cx, y, halfW, color, t) {
    const x0 = Math.round(cx - halfW), x1 = Math.round(cx + halfW);
    const shift = Math.floor(t * 20) % 5;
    ctx.fillStyle = color;
    for (let x = x0 + shift; x < x1; x += 5) ctx.fillRect(x, y, Math.min(3, x1 - x), 1);
    ctx.fillRect(x0, y - 3, 1, 4); ctx.fillRect(x1, y - 3, 1, 4);
    ctx.fillRect(x0, y - 3, 2, 1); ctx.fillRect(x1 - 1, y - 3, 2, 1);
  }

  return { Buf, rotate, rng, digits, text, hexToRgb, marker };
})();

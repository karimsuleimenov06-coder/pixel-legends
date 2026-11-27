// Coloured light map. Each frame lights are accumulated into a low-res RGB map (one texel per 4x4
// screen pixels) which is multiplied over the scene with bilinear filtering for soft falloff, plus an
// additive glow map that blooms around strong light sources (torches, crystals, magic).
window.PL = window.PL || {};

PL.Lighting = (function () {
  const CELL = 4;
  const lights = [];
  const colorCache = {};
  let mapC, mapG, mapImg, glowC, glowG, glowImg, cols = 0, rows = 0;

  const WARM = [1.0, 0.62, 0.3], COOL = [0.62, 0.76, 1.0];

  function rgb(hex) {
    if (colorCache[hex]) return colorCache[hex];
    const c = PL.Pixel.hexToRgb(hex);
    return (colorCache[hex] = [c[0] / 255, c[1] / 255, c[2] / 255]);
  }

  function ensure(c, r) {
    if (c === cols && r === rows) return;
    cols = c; rows = r;
    mapC = document.createElement('canvas'); mapC.width = c; mapC.height = r;
    glowC = document.createElement('canvas'); glowC.width = c; glowC.height = r;
    mapG = mapC.getContext('2d'); glowG = glowC.getContext('2d');
    mapImg = mapG.createImageData(c, r); glowImg = glowG.createImageData(c, r);
  }

  function begin() { lights.length = 0; }

  // color: '#rrggbb' or omitted (warm=true -> firelight, otherwise cool neutral light).
  function add(x, y, radius, intensity, warm, color) {
    lights.push({ x, y, r: radius, i: intensity, c: color ? rgb(color) : warm ? WARM : COOL, glow: !!(warm || color) });
  }

  function render(ctx, camX, offY, ambient) {
    const c = Math.ceil(PL.VIEW_W / CELL) + 1, r = Math.ceil(PL.VIEW_H / CELL) + 1;
    ensure(c, r);
    const minX = camX - 200, maxX = camX + PL.VIEW_W + 200;
    const vis = lights.filter(l => l.x + l.r > minX && l.x - l.r < maxX);
    const md = mapImg.data, gd = glowImg.data;
    const [ar, ag, ab] = ambient;
    for (let y = 0; y < r; y++) {
      const wy = y * CELL - offY;
      for (let x = 0; x < c; x++) {
        const wx = x * CELL + camX;
        let lr = ar, lg = ag, lb = ab, gr = 0, gg = 0, gb = 0;
        for (let n = 0; n < vis.length; n++) {
          const l = vis[n];
          const dx = wx - l.x, dy = wy - l.y, d2 = dx * dx + dy * dy, r2 = l.r * l.r;
          if (d2 >= r2) continue;
          const f = 1 - Math.sqrt(d2) / l.r;
          const s = f * f * (3 - 2 * f) * l.i;
          lr += l.c[0] * s; lg += l.c[1] * s; lb += l.c[2] * s;
          if (l.glow) { const q = s * f; gr += l.c[0] * q; gg += l.c[1] * q; gb += l.c[2] * q; }
        }
        const k = (y * c + x) * 4;
        md[k] = Math.min(255, lr * 255); md[k + 1] = Math.min(255, lg * 255); md[k + 2] = Math.min(255, lb * 255); md[k + 3] = 255;
        gd[k] = Math.min(255, gr * 255); gd[k + 1] = Math.min(255, gg * 255); gd[k + 2] = Math.min(255, gb * 255); gd[k + 3] = 255;
      }
    }
    mapG.putImageData(mapImg, 0, 0);
    glowG.putImageData(glowImg, 0, 0);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(mapC, 0, 0, c * CELL, r * CELL);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.42;
    ctx.drawImage(glowC, 0, 0, c * CELL, r * CELL);
    ctx.restore();
  }

  return { begin, add, render };
})();

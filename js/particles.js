// Particle/VFX system: hit sparks, slashes, magic bursts, explosions, floating damage text.
window.PL = window.PL || {};

PL.Particles = (function () {
  let list = [];
  let texts = [];

  function spawnSpark(x, y, color, count, opts) {
    opts = opts || {};
    for (let i = 0; i < count; i++) {
      const a = PL.U.rand(0, Math.PI * 2);
      const spd = PL.U.rand(opts.minSpeed || 40, opts.maxSpeed || 160);
      list.push({
        x, y, vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - (opts.upBias || 0),
        life: 0, maxLife: PL.U.rand(0.2, opts.maxLifeTime || 0.45),
        size: PL.U.rand(2, opts.size || 4), color, gravity: opts.gravity ?? 260, shape: opts.shape || 'rect'
      });
    }
  }

  function spawnSlash(x, y, facing, color, size) {
    list.push({
      x, y, vx: 0, vy: 0, life: 0, maxLife: 0.14, size: size || 22, color,
      gravity: 0, shape: 'slash', facing, rot: 0
    });
  }

  // Directed stream of fire pixels (dragon breath).
  function spawnJet(x, y, dir, count) {
    const cols = ['#fff4b0', '#ffd04a', '#ff8a2a', '#d8481a'];
    for (let i = 0; i < count; i++) {
      list.push({
        x, y, vx: dir * PL.U.rand(160, 280), vy: PL.U.rand(-60, 50), life: 0, maxLife: PL.U.rand(0.35, 0.6),
        size: PL.U.rand(3, 6), color: cols[Math.floor(Math.random() * cols.length)], gravity: -40, shape: 'rect'
      });
    }
  }

  // Sprite shatters into its own pixels, which fly away from the hit and bounce on the floor.
  function shatter(x, y, pix, awayDir, big) {
    for (const q of pix.list) {
      list.push({
        x: x + q.dx, y: y + q.dy, vx: q.dx * PL.U.rand(2, 6) + awayDir * PL.U.rand(30, 150) * (big ? 1.4 : 1),
        vy: -PL.U.rand(60, 240) + q.dy * 1.5, life: 0, maxLife: PL.U.rand(1.0, 1.8), size: pix.size, color: q.c,
        gravity: 700, shape: 'px', floor: true
      });
    }
  }

  function spawnBurst(x, y, color, count, speed) {
    spawnSpark(x, y, color, count, { minSpeed: speed * 0.4, maxSpeed: speed, maxLifeTime: 0.5, size: 5 });
  }

  function spawnExplosion(x, y, radius, color) {
    list.push({ x, y, vx: 0, vy: 0, life: 0, maxLife: 0.4, size: radius, color, gravity: 0, shape: 'ring' });
    spawnSpark(x, y, color, 22, { minSpeed: 60, maxSpeed: 320, maxLifeTime: 0.6, size: 5, gravity: 100 });
    spawnSpark(x, y, '#fff8dc', 10, { minSpeed: 20, maxSpeed: 120, maxLifeTime: 0.3, size: 3, gravity: 60 });
  }

  function spawnDust(x, y, facing) {
    for (let i = 0; i < 5; i++) {
      list.push({
        x, y, vx: -((facing || 1) * PL.U.rand(20, 60)), vy: -PL.U.rand(10, 40),
        life: 0, maxLife: PL.U.rand(0.25, 0.4), size: PL.U.rand(2, 4), color: '#cfc3a8', gravity: 120, shape: 'rect'
      });
    }
  }

  function spawnFloatText(x, y, text, color, big) {
    texts.push({ x, y, text, color, life: 0, maxLife: 0.9, big: !!big, vy: -40 });
  }

  function hitNumber(x, y, dmg, isCrit) {
    spawnFloatText(x, y, Math.round(dmg).toString() + (isCrit ? '!' : ''), isCrit ? '#ff5a2a' : '#ffb040', isCrit);
    spawnSpark(x, y - 6, isCrit ? '#ffd24a' : '#ffe6b0', isCrit ? 14 : 7, { maxLifeTime: 0.35, minSpeed: 30, maxSpeed: isCrit ? 220 : 140 });
    if (isCrit) PL.Audio.sfx.crit(); else PL.Audio.sfx.hit();
  }

  function update(dt) {
    dt = Math.min(dt, 0.05);
    list = list.filter(p => {
      p.life += dt;
      if (p.life >= p.maxLife) return false;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= 0.96;
      if (p.floor && p.y > PL.World.groundY - 1) { p.y = PL.World.groundY - 1; p.vy *= -0.3; p.vx *= 0.6; }
      return true;
    });
    texts = texts.filter(t => {
      t.life += dt;
      t.y += t.vy * dt; t.vy += 90 * dt * 0.0; t.vy *= 0.98;
      return t.life < t.maxLife;
    });
  }

  // ---- Pixel sprites for effects (cached) ----
  const fxCache = {};
  function arcSprite(R, color, frame, facing) {
    const key = 'arc|' + R + '|' + color + '|' + frame + '|' + facing;
    if (fxCache[key]) return fxCache[key];
    const c = R + 2, size = c * 2 + 1;
    let b = new PL.Pixel.Buf(size, size);
    const a0 = -1.9, a1 = 0.9, th = [4, 3, 2][frame];
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const dx = x - c, dy = y - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      if (d > R || d <= R - th || a < a0 || a > a1) continue;
      const u = (a - a0) / (a1 - a0);
      if (u < 0.15 || (u < 0.4 && (x + y) % 2)) continue;
      b.put(x, y, d > R - 1 ? '#ffffff' : d > R - 2 ? color : PL.U.shade(color, -0.25));
    }
    if (facing < 0) b = b.flipped();
    return (fxCache[key] = { img: b.toCanvas(), c });
  }
  function ringSprite(R, color) {
    const key = 'ring|' + R + '|' + color;
    if (fxCache[key]) return fxCache[key];
    const c = R + 1, size = c * 2 + 1;
    const b = new PL.Pixel.Buf(size, size);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - c, y - c);
      if (Math.abs(d - R) <= 0.6) b.put(x, y, color);
      else if (Math.abs(d - (R - 1)) <= 0.5) b.put(x, y, PL.U.shade(color, 0.35));
    }
    return (fxCache[key] = { img: b.toCanvas(), c });
  }

  function render(ctx, camX) {
    ctx.save();
    for (const p of list) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = Math.max(0, 1 - t * t);
      const sx = Math.round(p.x - camX), sy = Math.round(p.y);
      if (p.shape === 'rect') {
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size * 0.6 * (1 - t * 0.5)));
        ctx.fillRect(sx - (s >> 1), sy - (s >> 1), s, s);
      } else if (p.shape === 'px') {
        ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx, sy, p.size, p.size);
      } else if (p.shape === 'slash') {
        ctx.globalAlpha = 1;
        const spr = arcSprite(Math.round(p.size), p.color, Math.min(2, Math.floor(t * 3)), p.facing);
        const cx = p.facing < 0 ? spr.img.width - 1 - spr.c : spr.c;
        ctx.drawImage(spr.img, sx - cx, sy - spr.c);
      } else if (p.shape === 'ring') {
        const R = Math.max(2, Math.round(p.size * t));
        const spr = ringSprite(R, p.color);
        ctx.drawImage(spr.img, sx - spr.c, sy - spr.c);
      }
    }
    ctx.globalAlpha = 1;
    for (const t of texts) {
      const a = 1 - (t.life / t.maxLife);
      ctx.globalAlpha = a > 0.35 ? 1 : a / 0.35;
      const img = /^[0-9!+]+$/.test(t.text) ? PL.Pixel.digits(t.text, t.color) : PL.Pixel.text(t.text, t.color);
      ctx.drawImage(img, Math.round(t.x - camX - img.width / 2), Math.round(t.y - img.height / 2));
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function clear() { list = []; texts = []; }

  return { spawnSpark, spawnSlash, spawnJet, shatter, spawnBurst, spawnExplosion, spawnDust, spawnFloatText, hitNumber, update, render, clear };
})();

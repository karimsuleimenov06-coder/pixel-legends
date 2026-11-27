// Generic projectile system shared by player ranged attacks/abilities and enemy/boss ranged attacks.
window.PL = window.PL || {};

PL.Projectiles = (function () {
  let list = [];

  function spawn(opts) {
    list.push(Object.assign({
      x: 0, y: 0, vx: 0, vy: 0, gravity: 0, w: 8, h: 6, hitH: 34, color: '#fff',
      owner: 'enemy', pierce: false, damage: 0, isCrit: false, knockback: 100,
      facing: 1, life: 0, maxLife: 3, hitSet: new Set(), dead: false, statusEffect: null
    }, opts));
  }

  function update(dt, player, enemies) {
    const world = PL.World;
    list = list.filter(p => {
      p.life += dt;
      p.vy += (p.gravity || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life >= p.maxLife) return false;
      if (p.x < -40 || p.x > world.width + 40) return false;
      if (p.y > world.groundY + 10) {
        PL.Particles.spawnSpark(p.x, world.groundY, p.color, 5, { maxLifeTime: 0.25 });
        return false;
      }

      // Collision uses a taller vertical band than the visual sprite so fast-traveling
      // bolts reliably connect with short targets (e.g. the slime) regardless of exact spawn height.
      const pr = { x: p.x - p.w / 2, y: p.y - p.hitH / 2, w: p.w, h: p.hitH };

      if (p.owner === 'player') {
        for (const e of enemies) {
          if (!e.alive || p.hitSet.has(e)) continue;
          if (PL.U.aabbOverlap(pr, e.rect())) {
            const final = PL.U.mitigate(p.damage, e.def || 0);
            e.takeDamage(final, { knockback: p.knockback, knockUp: -160, fromRight: p.vx < 0 });
            PL.Particles.hitNumber(e.x, e.y - e.h - 6, final, p.isCrit);
            PL.Particles.spawnBurst(p.x, p.y, p.color, 6, 90);
            if (PL.Game && PL.Game.player) PL.Game.player.registerCombo();
            p.hitSet.add(e);
            if (!p.pierce) return false;
          }
        }
      } else if (p.owner === 'enemy') {
        if (player.alive && !player.isInvuln() && PL.U.aabbOverlap(pr, player.rect())) {
          const final = PL.U.mitigate(p.damage, player.def || 0);
          player.takeDamage(final, { knockback: p.knockback, knockUp: -160, fromRight: p.vx < 0 });
          PL.Particles.hitNumber(player.x, player.y - player.h - 6, final, false);
          PL.Particles.spawnBurst(p.x, p.y, p.color, 6, 90);
          if (p.statusEffect && p.statusEffect.type === 'slow' && player.applySlow) {
            player.applySlow(p.statusEffect.mult, p.statusEffect.duration);
          }
          return false;
        }
      }
      return true;
    });
  }

  function render(ctx, camX) {
    for (const p of list) {
      const sx = Math.round(p.x - camX), sy = Math.round(p.y);
      if (p.kind === 'arrow') {
        const spr = arrowSprite(p.color, Math.atan2(p.vy, p.vx));
        ctx.drawImage(spr.img, sx - spr.c, sy - spr.c);
      } else {
        const spr = orbSprite(p.color, p.w >= 10 ? 4 : 3);
        const dir = p.vx >= 0 ? 1 : -1;
        ctx.globalAlpha = 0.45;
        ctx.fillStyle = p.color;
        ctx.fillRect(sx - dir * (spr.c + 3), sy - 1, 2, 2);
        ctx.fillRect(sx - dir * (spr.c + 6), sy, 1, 1);
        ctx.globalAlpha = 1;
        ctx.drawImage(spr.img, sx - spr.c, sy - spr.c);
        PL.Lighting.add(p.x, p.y, 44, 0.5, false, p.color);
      }
    }
  }

  const sprCache = {};
  function arrowSprite(fletch, angle) {
    const steps = 32;
    const idx = ((Math.round(angle / (Math.PI * 2 / steps)) % steps) + steps) % steps;
    const key = 'a|' + fletch + '|' + idx;
    if (sprCache[key]) return sprCache[key];
    const b = new PL.Pixel.Buf(13, 3);
    b.grid(['F.........W..', 'FFIIIIIIIIWWW', 'F.........W..'], { F: fletch, I: '#a8723e', W: '#e6eaf0' }, 0, 0);
    const r = PL.Pixel.rotate(b, idx * Math.PI * 2 / steps, 6, 1);
    r.buf.outline(-0.75);
    return (sprCache[key] = { img: r.buf.toCanvas(), c: r.cx });
  }
  function orbSprite(color, R) {
    const key = 'o|' + color + '|' + R;
    if (sprCache[key]) return sprCache[key];
    const c = R + 1, b = new PL.Pixel.Buf(c * 2 + 1, c * 2 + 1);
    for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
      const d = Math.hypot(x - c, y - c);
      if (d <= R) b.put(x, y, d < R * 0.4 ? '#ffffff' : d < R * 0.75 ? PL.U.shade(color, 0.35) : color);
    }
    b.outline(-0.5);
    return (sprCache[key] = { img: b.toCanvas(), c });
  }

  function clear() { list = []; }
  function count() { return list.length; }

  return { spawn, update, render, clear, count };
})();

// Loot pickups dropped by defeated enemies: hearts restore health, mana stars restore energy.
window.PL = window.PL || {};

PL.Pickups = (function () {
  const HEART = ['.RR.RR.', 'RLRRRRR', 'RLRRRRR', 'RRRRRRr', '.RRRRr.', '..RRr..', '...r...'];
  const STAR = ['...Y...', '...Y...', 'YYYLYYY', '.YYLYY.', '..YYY..', '.YY.YY.', '.Y...Y.'];
  const PAL = { R: '#e8304a', r: '#9a1a2e', L: '#ffb0b8' };
  const MANA_PAL = { Y: '#6ab8ff', L: '#e0f4ff' };
  const LIFE = 14;
  let list = [];
  const cache = {};

  function sprite(kind) {
    if (cache[kind]) return cache[kind];
    const b = new PL.Pixel.Buf(9, 9);
    if (kind === 'heart') b.grid(HEART, PAL, 1, 1);
    else b.grid(STAR, MANA_PAL, 1, 1);
    b.volume(0.25, 0.2).outline(-0.75);
    cache[kind] = b.toCanvas();
    return cache[kind];
  }

  function spawn(kind, x, y) {
    list.push({
      kind, x, y, vx: PL.U.rand(-70, 70), vy: PL.U.rand(-260, -160),
      t: 0, grounded: false, bob: PL.U.rand(0, 6)
    });
  }

  // Drops for one defeated enemy. Bosses rain loot, elites drop a handful, normal enemies sometimes.
  function drop(e, player) {
    const x = e.x, y = e.y - e.h * 0.5;
    let n = 0;
    if (e.isBoss) n = 6;
    else if (e.isElite) n = 3;
    else if (Math.random() < 0.45) n = 1;
    for (let i = 0; i < n; i++) {
      let kind = Math.random() < 0.5 ? 'heart' : 'star';
      // Favour what the player is missing more of.
      if (player && n === 1) {
        const hpMiss = 1 - player.hp / player.maxHp, enMiss = 1 - player.energy / player.energyMax;
        kind = hpMiss + 0.1 >= enMiss ? 'heart' : 'star';
      }
      spawn(kind, x, y);
    }
  }

  function collect(p, player) {
    if (p.kind === 'heart') {
      const amt = Math.max(10, Math.round(player.maxHp * 0.1));
      const before = player.hp;
      player.hp = Math.min(player.maxHp, player.hp + amt);
      PL.Particles.spawnFloatText(player.x, player.y - player.h - 8, '+' + Math.round(player.hp - before || amt), '#ff7088');
      PL.Particles.spawnSpark(p.x, p.y, '#ff7088', 8, { maxLifeTime: 0.35, minSpeed: 30, maxSpeed: 110 });
    } else {
      const amt = 25;
      player.energy = Math.min(player.energyMax, player.energy + amt);
      PL.Particles.spawnFloatText(player.x, player.y - player.h - 8, '+' + amt, '#6ab8ff');
      PL.Particles.spawnSpark(p.x, p.y, '#8ad0ff', 8, { maxLifeTime: 0.35, minSpeed: 30, maxSpeed: 110 });
    }
    PL.Audio.sfx.pickup();
  }

  function update(dt, player) {
    const gy = PL.World.groundY;
    for (const p of list) {
      p.t += dt;
      const canPull = player && player.alive && p.t > 0.45;
      const dx = canPull ? player.x - p.x : 0, dy = canPull ? (player.y - player.h * 0.5) - p.y : 0;
      const d = Math.hypot(dx, dy);
      if (canPull && d < 12) { p.dead = true; collect(p, player); continue; }
      if (canPull && d < 90) {
        const pull = 520 * (1 - d / 110);
        p.vx = PL.U.approach(p.vx, dx / d * pull, 1600 * dt);
        p.vy = PL.U.approach(p.vy, dy / d * pull, 1600 * dt);
        p.grounded = false;
      } else if (!p.grounded) {
        p.vy += 900 * dt;
      }
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.x = PL.U.clamp(p.x, 12, PL.World.width - 12);
      if (p.y > gy - 5) {
        p.y = gy - 5;
        if (Math.abs(p.vy) > 80) { p.vy *= -0.4; p.vx *= 0.6; }
        else { p.vy = 0; p.vx = 0; p.grounded = true; }
      }
      if (p.t > LIFE) p.dead = true;
    }
    list = list.filter(p => !p.dead);
  }

  function render(ctx, camX) {
    for (const p of list) {
      if (p.t > LIFE - 3 && Math.floor(p.t * 8) % 2) continue; // blink before despawn
      const bob = p.grounded ? Math.round(Math.sin(p.t * 4 + p.bob) * 1.5) - 1 : 0;
      const img = sprite(p.kind);
      ctx.drawImage(img, Math.round(p.x - camX - 4.5), Math.round(p.y - 4.5 + bob));
      PL.Lighting.add(p.x, p.y, 18, 0.22, p.kind === 'heart', p.kind === 'heart' ? '#ff5070' : '#5ab0ff');
    }
  }

  function clear() { list = []; }
  function count() { return list.length; }

  return { drop, update, render, clear, count, spawn };
})();

// Summoned allies (the Necromancer's death knights): follow the player, fight nearby enemies,
// can be hit by enemies, and crumble when their time runs out.
window.PL = window.PL || {};

PL.Ally = class Ally extends PL.Entity {
  constructor(owner, x, opts) {
    const id = 'death_knight';
    super(x, PL.World.groundY, PL.CharSprites.width(id), PL.CharSprites.height(id));
    this.spriteId = id;
    this.owner = owner;
    this.slot = opts.slot || 0;
    this.power = opts.power || 1;
    this.maxHp = Math.round(owner.maxHp * 0.7 * this.power);
    this.hp = this.maxHp;
    this.def = owner.def;
    this.spd = 150;
    this.range = 30;
    this.lifeMax = opts.duration || 20;
    this.life = this.lifeMax;
    this.rise = 0.55;          // summoning animation: rises out of the ground, cannot act or be hit
    this.atkTimer = 0.2;
    this.action = null;
    this.target = null;
    this.retarget = 0;
    this.animTime = 0;
    this.walkPhase = 0;
    this.hurtTimer = 0;
    this.facing = owner.facing;
  }

  isInvuln() { return this.rise > 0 || super.isInvuln(); }

  takeDamage(amount, opts) {
    const applied = super.takeDamage(amount, opts);
    if (applied && this.alive) { this.hurtTimer = 0.15; this.action = null; }
    return applied;
  }

  die() { this.crumble(true); }

  // Shatter into pixels (killed) or dissolve into green motes (timer ran out / dismissed).
  crumble(killed) {
    this.alive = false;
    const pix = PL.CharSprites.pixels(this.spriteId, PL.CharSprites.poseFor(this.spriteId, this.animState()), this.facing, 220);
    PL.Particles.shatter(this.x, this.y, pix, -this.facing, false);
    PL.Particles.spawnBurst(this.x, this.y - this.h * 0.5, '#6aff8a', killed ? 10 : 16, 140);
    if (!killed) PL.Audio.sfx.magic();
  }

  damageMult() { return this.owner.empowerTimer > 0 ? 2 : 1; }

  pickTarget(enemies) {
    let best = null, bestD = 330;
    for (const e of enemies) {
      if (!e.alive) continue;
      const d = Math.abs(e.x - this.x) + Math.max(0, (this.y - e.y) - 30) * 2;
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  update(dt, enemies) {
    this.animTime += dt;
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) { this.crumble(false); return; }
    if (this.rise > 0) { this.rise -= dt; this.vx = 0; this.applyPhysics(dt, PL.World); return; }
    if (this.atkTimer > 0) this.atkTimer -= dt;
    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      this.vx = PL.U.approach(this.vx, 0, 900 * dt);
      this.applyPhysics(dt, PL.World);
      return;
    }
    if (this.owner.empowerTimer > 0 && Math.random() < dt * 10) {
      PL.Particles.spawnSpark(this.x + PL.U.rand(-6, 6), this.y - PL.U.rand(4, this.h), '#b06aff', 1, { maxLifeTime: 0.5, minSpeed: 10, maxSpeed: 30, gravity: -60 });
    }

    if (this.action) { this.updateAction(dt); this.applyPhysics(dt, PL.World); return; }

    this.retarget -= dt;
    if (this.retarget <= 0 || !this.target || !this.target.alive) { this.target = this.pickTarget(enemies); this.retarget = 0.4; }

    const t = this.target;
    if (t) {
      const dx = t.x - this.x, reach = this.range + t.w / 2;
      this.facing = dx >= 0 ? 1 : -1;
      if (Math.abs(dx) > reach * 0.8) this.vx = this.facing * this.spd;
      else this.vx = 0;
      if (Math.abs(dx) <= reach && this.atkTimer <= 0) {
        this.action = { phase: 'windup', t: 0, windup: 0.2, active: 0.1, recovery: 0.3, hit: false };
        this.atkTimer = 0.85;
      }
    } else {
      // Guard position just behind the player; several knights spread out.
      const p = this.owner;
      const want = p.x - p.facing * (26 + this.slot * 22);
      const dx = want - this.x;
      if (Math.abs(dx) > 10) { this.vx = Math.sign(dx) * this.spd * (Math.abs(dx) > 90 ? 1.25 : 1); this.facing = Math.sign(dx); }
      else { this.vx = 0; this.facing = p.facing; }
    }
    if (this.onGround && Math.abs(this.vx) > 5) this.walkPhase += dt * 10;
    this.applyPhysics(dt, PL.World);
  }

  updateAction(dt) {
    const a = this.action;
    a.t += dt;
    this.vx = PL.U.approach(this.vx, 0, 900 * dt);
    if (a.phase === 'windup' && a.t >= a.windup) { a.phase = 'active'; a.t = 0; }
    else if (a.phase === 'active') {
      if (!a.hit) { a.hit = true; this.strike(); }
      if (a.t >= a.active) { a.phase = 'recovery'; a.t = 0; }
    } else if (a.phase === 'recovery' && a.t >= a.recovery) this.action = null;
  }

  strike() {
    const w = this.range + 6, h = this.h;
    const hb = { x: this.facing > 0 ? this.x : this.x - w, y: this.y - h, w, h };
    const enemies = (PL.Game && PL.Game.enemies) || [];
    let any = false;
    for (const e of enemies) {
      if (!e.alive || !PL.U.aabbOverlap(hb, e.rect())) continue;
      const isCrit = PL.U.rollCrit(this.owner.crit * 0.5);
      let dmg = this.owner.str * 0.9 * this.power * this.damageMult();
      if (isCrit) dmg *= 1.8;
      const final = PL.U.mitigate(dmg, e.def || 0);
      e.takeDamage(final, { knockback: 120, knockUp: -140, fromRight: this.facing < 0 });
      this.owner.totalDamageDealt += final;
      PL.Particles.hitNumber(e.x, e.y - e.h - 6, final, isCrit);
      any = true;
    }
    PL.Particles.spawnSlash(this.x + this.facing * 3, this.y - this.h * 0.62, this.facing, this.damageMult() > 1 ? '#c88aff' : '#8affa8', 20);
    (any ? PL.Audio.sfx.hit : PL.Audio.sfx.swingLight)();
  }

  animState() {
    const st = { time: this.animTime, phase: this.walkPhase, hurt: this.hurtTimer > 0 };
    st.move = !this.onGround ? 'fall' : Math.abs(this.vx) > 5 ? 'run' : 'idle';
    const a = this.action;
    if (a) {
      const dur = a.phase === 'windup' ? a.windup : a.phase === 'active' ? a.active : a.recovery;
      st.attack = { style: 'swing', from: 3.3, to: 0.4, stage: a.phase === 'recovery' ? 'recover' : a.phase, u: a.t / Math.max(0.001, dur) };
    }
    return st;
  }

  render(ctx, camX) {
    if (!this.alive) return;
    const cx = this.x - camX, id = this.spriteId;
    const pose = PL.CharSprites.poseFor(id, this.animState());
    PL.CharSprites.drawShadow(ctx, cx, this.y, this.w + 6);
    const fading = this.life < 2.5 && Math.floor(this.life * 8) % 2;
    if (this.rise > 0) {
      // Rising out of the floor: clip everything below the ground line.
      const k = 1 - this.rise / 0.55, sink = Math.round((1 - k) * this.h);
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - 40, this.y - 120, 80, 120); ctx.clip();
      PL.CharSprites.draw(ctx, id, cx, this.y + sink, this.facing, pose, '#6aff8a');
      ctx.restore();
      if (Math.random() < 0.5) PL.Particles.spawnSpark(cx + camX + PL.U.rand(-8, 8), this.y - 2, '#6aff8a', 1, { maxLifeTime: 0.4, minSpeed: 20, maxSpeed: 60 });
    } else {
      if (fading) ctx.globalAlpha = 0.55;
      const flash = this.hitFlash > 0 ? true : (this.owner.empowerTimer > 0 && Math.floor(this.animTime * 6) % 3 === 0 ? '#b06aff' : false);
      PL.CharSprites.draw(ctx, id, cx, this.y, this.facing, pose, flash);
      ctx.globalAlpha = 1;
    }
    // HP (green) and remaining time (thin) bars above the head.
    const bw = 18, bx = Math.round(cx - bw / 2), by = Math.round(this.y - this.h - 6);
    ctx.fillStyle = '#0a0a10'; ctx.fillRect(bx - 1, by - 1, bw + 2, 5);
    ctx.fillStyle = '#1e3a24'; ctx.fillRect(bx, by, bw, 2);
    ctx.fillStyle = '#5aff7a'; ctx.fillRect(bx, by, Math.round(bw * this.hp / this.maxHp), 2);
    ctx.fillStyle = '#8a7aa8'; ctx.fillRect(bx, by + 3, Math.round(bw * Math.max(0, this.life) / this.lifeMax), 1);
    PL.Lighting.add(this.x, this.y - this.h * 0.5, 34, 0.25, false, this.owner.empowerTimer > 0 ? '#b06aff' : '#6aff8a');
  }
};

PL.Allies = (function () {
  let list = [];

  function summon(owner, count, opts) {
    for (const a of list) if (a.alive) a.crumble(false);   // re-casting replaces the old guard
    list = [];
    for (let i = 0; i < count; i++) {
      const x = PL.U.clamp(owner.x + owner.facing * (30 + i * 24), 20, PL.World.width - 20);
      const a = new PL.Ally(owner, x, Object.assign({ slot: i }, opts));
      list.push(a);
      PL.Particles.spawnBurst(x, PL.World.groundY - 4, '#6aff8a', 16, 150);
    }
  }

  function update(dt, enemies) {
    for (const a of list) a.update(dt, enemies);
    list = list.filter(a => a.alive);
  }

  function render(ctx, camX) { for (const a of list) a.render(ctx, camX); }
  function clear() { list = []; }
  function alive() { return list.filter(a => a.alive && a.rise <= 0); }
  function count() { return list.length; }

  return { summon, update, render, clear, alive, count };
})();

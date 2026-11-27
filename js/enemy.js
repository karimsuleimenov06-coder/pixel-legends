// Enemy + Boss AI, shared attack-pattern library, hazard zones (ground spikes / fire pools), rendering.
window.PL = window.PL || {};

// ---------------- Hazard zones (telegraphed AOE patches that later deal damage) ----------------
PL.Hazards = (function () {
  let list = [];
  function spawn(opts) {
    list.push(Object.assign({
      x: 0, radius: 50, delay: 0, duration: 2, tickInterval: 0.4, timer: 0, dmg: 10, color: '#ff5a2a', elapsed: 0, hitPlayerTicks: 0
    }, opts));
  }
  function update(dt, player) {
    list = list.filter(h => {
      h.elapsed += dt;
      if (h.delay > 0) { h.delay -= dt; return true; }
      h.timer -= dt;
      if (h.timer <= 0) {
        h.timer = h.tickInterval;
        const dx = player.x - h.x;
        if (Math.abs(dx) < h.radius / 2 + player.w / 2 && player.alive) {
          const final = PL.U.mitigate(h.dmg, player.def || 0);
          player.takeDamage(final, { knockback: 60, knockUp: -90, fromRight: dx < 0 });
          PL.Particles.hitNumber(player.x, player.y - player.h - 6, final, false);
        }
        PL.Particles.spawnBurst(h.x, player.y - 10, h.color, 5, 70);
      }
      return h.elapsed < h.delay + h.duration || h.delay > 0;
    });
    list = list.filter(h => h.elapsed < h.totalLife);
  }
  function render(ctx, camX) {
    const gy = PL.World.groundY;
    for (const h of list) {
      const sx = Math.round(h.x - camX);
      if (h.delay > 0) {
        PL.Pixel.marker(ctx, sx, gy - 1, h.radius / 2, Math.floor(h.elapsed * 10) % 2 ? '#ff4a2a' : '#ffb03a', h.elapsed);
      } else {
        const half = Math.round(h.radius / 2), fr = Math.floor(h.elapsed * 12);
        for (let x = -half; x < half; x += 2) {
          const n = PL.U.hashNoise(x, fr, 5);
          const ht = 2 + Math.floor(n * 6);
          ctx.fillStyle = PL.U.shade(h.color, -0.2); ctx.fillRect(sx + x, gy - ht, 2, ht);
          ctx.fillStyle = '#ffe08a'; ctx.fillRect(sx + x, gy - Math.max(1, ht - 2), 2, 1);
        }
        PL.Lighting.add(h.x, gy - 4, h.radius, 0.35, true);
      }
    }
  }
  function clear() { list = []; }
  function spawnTelegraphed(x, radius, delay, dmg, duration, color) {
    spawn({ x, radius, delay, dmg, duration, color, totalLife: delay + duration + 0.1 });
  }
  return { spawn, spawnTelegraphed, update, render, clear };
})();

// ---------------- Shared boss attack pattern parameters ----------------
PL.ATTACK_PATTERNS = {
  meleeSwing: { telegraph: 0.35, active: 0.15, recovery: 0.55, range: 70, dmgMult: 1.0, knockback: 220, knockUp: -220 },
  aoeSlam: { telegraph: 0.55, active: 0.18, recovery: 0.75, radius: 110, dmgMult: 1.4, knockback: 340, knockUp: -300, warning: true },
  dashCharge: { telegraph: 0.42, active: 0.32, recovery: 0.6, range: 90, speed: 480, dmgMult: 1.2, knockback: 280, knockUp: -220, warning: true },
  groundSpikes: { telegraph: 0.75, active: 0.1, recovery: 0.5, count: 3, radius: 58, dmgMult: 1.25, warning: true },
  projectileBarrage: { telegraph: 0.3, active: 0.5, recovery: 0.5, count: 5, dmgMult: 0.5, speed: 280, knockback: 90, knockUp: -100 },
  summonAdds: { telegraph: 0.5, active: 0.1, recovery: 0.8, count: 2 },
  coneBreath: { telegraph: 0.5, active: 0.7, recovery: 0.6, range: 160, dmgMult: 0.3, ticks: 4, knockback: 50, knockUp: -60, warning: true },
  cloneSwap: { telegraph: 0.3, active: 0.1, recovery: 0.4, dmgMult: 1.15, knockback: 240, knockUp: -220 },
  beamJudgment: { telegraph: 1.15, active: 0.15, recovery: 0.9, range: 999, dmgMult: 2.5, knockback: 320, knockUp: -260, warning: true, ultimate: true }
};

// ---------------- Enemy ----------------
PL.Enemy = class Enemy extends PL.Entity {
  constructor(def, x, mult) {
    mult = mult || { hp: 1, dmg: 1 };
    super(x, 0, PL.CharSprites.width(def.id), Math.min(PL.SPRITE_SPECS[def.id].hitH || 999, PL.CharSprites.height(def.id)));
    this.cfg = def;
    this.animTime = PL.U.rand(0, 5);
    this.name = def.name;
    this.maxHp = Math.round(def.hp * mult.hp);
    this.hp = this.maxHp;
    this.dmg = def.dmg * mult.dmg;
    this.def = def.def || 0; // armor stat (numeric), mirrors Player.def for shared mitigation code
    this.spd = def.spd;
    this.xp = def.xp;
    this.behavior = def.behavior;
    this.atkTimer = PL.U.rand(0.5, def.atkCd || 1.5);
    this.spawnGrace = 0.35;
    this.action = null;
    this.hurtTimer = 0;
    this.deadTimer = 0;
    this.enraged = false;
    this.shielding = false;
    this.shieldTimer = PL.U.rand(2, 4);
    this.teleTimer = PL.U.rand(2.5, 4);
    this.walkPhase = 0;
    this.isElite = !!def.elite;
    this.isBoss = false;
    this._enemiesList = [];
    this.summonTimer = PL.U.rand(3, 5);
  }

  takeDamage(amount, opts) {
    if (this.shielding) {
      amount *= 0.2;
      PL.Audio.sfx.block();
      PL.Particles.spawnSpark(this.x, this.y - this.h * 0.7, '#8ab4ff', 6, { maxLifeTime: 0.25 });
      this.hp -= amount;
      if (this.hp <= 0) { this.hp = 0; this.alive = false; this.die(); }
      return true;
    }
    const applied = super.takeDamage(amount, opts);
    if (applied && this.alive) {
      this.hurtTimer = 0.18;
      if (this.action && !this.action.lockedThroughHurt) this.action = null;
    }
    return applied;
  }

  die(opts) {
    this.alive = false;
    this.deadTimer = 0;
    PL.Audio.sfx.death();
    const id = this.cfg.id;
    const pix = PL.CharSprites.pixels(id, PL.CharSprites.poseFor(id, this.animState()), this.facing, this.isBoss ? 700 : 260);
    PL.Particles.shatter(this.x, this.y, pix, opts && opts.fromRight ? -1 : 1, this.isBoss);
    if (this.cfg.special === 'lavaDeath') PL.Hazards.spawnTelegraphed(this.x, 34, 0.45, this.dmg * 0.6, 2.2, '#ff5a1a');
    PL.Particles.spawnBurst(this.x, this.y - this.h * 0.5, '#fff8dc', this.isBoss ? 30 : 12, this.isBoss ? 320 : 200);
    if (this.isBoss) {
      PL.Particles.spawnExplosion(this.x, this.y - this.h * 0.5, 120, '#ffb13b');
      PL.World.camera.shake(16, 0.6);
      PL.Audio.sfx.explosion();
    }
  }

  checkEliteSpecials(dt, player) {
    const sp = this.cfg.special;
    if (!sp) return;
    if (sp === 'enrage') {
      if (!this.enraged && this.hp / this.maxHp < 0.4) {
        this.enraged = true; this.spd *= 1.35; this.dmg *= 1.25;
        PL.Particles.spawnBurst(this.x, this.y - this.h * 0.5, '#ff3b3b', 18, 180);
        PL.Audio.sfx.bossRoar();
      }
    } else if (sp === 'shield') {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) {
        this.shielding = !this.shielding;
        this.shieldTimer = this.shielding ? 1.1 : PL.U.rand(3, 5);
        if (this.shielding) PL.Particles.spawnBurst(this.x, this.y - this.h * 0.6, '#8ab4ff', 10, 90);
      }
    } else if (sp === 'summon') {
      this.summonTimer -= dt;
      if (this.summonTimer <= 0 && !this.action) {
        this.summonTimer = PL.U.rand(6, 8);
        const list = this._enemiesList || [];
        const alive = list.filter(e => e.alive && e.summoned).length;
        const zdef = PL.ENEMY_DEFS.find(d => d.id === 'zombie');
        for (let i = 0; i < Math.min(2, 3 - alive); i++) {
          const ex = PL.U.clamp(this.x + (i ? 1 : -1) * PL.U.rand(40, 70), 30, PL.World.width - 30);
          const z = PL.createEnemy(zdef, ex);
          z.summoned = true; z.xp = Math.round(z.xp * 0.3);
          list.push(z);
          PL.Particles.spawnBurst(ex, PL.World.groundY - 8, '#6aff8a', 14, 120);
        }
        if (alive < 3) { PL.Audio.sfx.magicCast(); PL.Particles.spawnBurst(this.x, this.y - this.h * 0.7, '#6aff8a', 10, 90); }
      }
    } else if (sp === 'teleport') {
      this.teleTimer -= dt;
      if (this.teleTimer <= 0 && !this.action) {
        this.teleTimer = PL.U.rand(3.5, 5.5);
        this.x = PL.U.clamp(player.x - player.facing * 55, 30, PL.World.width - 30);
        this.facing = player.x > this.x ? 1 : -1;
        PL.Particles.spawnBurst(this.x, this.y - this.h * 0.5, '#d02fff', 16, 160);
        PL.Audio.sfx.dash();
      }
    }
  }

  update(dt, player, enemiesList) {
    this._enemiesList = enemiesList;
    this.animTime += dt;
    if (!this.alive) { this.deadTimer += dt; this.vx = PL.U.approach(this.vx, 0, 600 * dt); this.applyPhysics(dt, PL.World); return; }
    if (this.spawnGrace > 0) { this.spawnGrace -= dt; this.applyPhysics(dt, PL.World); return; }

    if (this.atkTimer > 0) this.atkTimer -= dt;
    this.checkEliteSpecials(dt, player);

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      this.vx = PL.U.approach(this.vx, 0, this.spd * 6 * dt);
      this.applyPhysics(dt, PL.World);
      return;
    }

    if (this.action) {
      this.updateAction(dt, player);
      this.applyPhysics(dt, PL.World);
      return;
    }

    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;
    const range = this.cfg.range || 40;

    if (this.behavior === 'ranged') {
      if (dist < range * 0.55) this.vx = -this.facing * this.spd * 0.6;
      else if (dist > range * 1.05) this.vx = this.facing * this.spd;
      else this.vx = 0;
      if (dist <= range * 1.1 && this.atkTimer <= 0) this.startAttack('rangedShot');
    } else if (this.behavior === 'dash' || this.behavior === 'flyer') {
      if (dist > 46) this.vx = this.facing * this.spd * 0.75;
      else this.vx = 0;
      if (dist < 230 && dist > 50 && this.atkTimer <= 0) this.startAttack(this.behavior === 'flyer' ? 'flyerDive' : 'dashAttack');
    } else {
      if (dist > range * 0.85) this.vx = this.facing * this.spd;
      else this.vx = 0;
      if (dist <= range && this.atkTimer <= 0) this.startAttack('meleeHit');
    }

    if (this.onGround && Math.abs(this.vx) > 5) this.walkPhase += dt * 9;
    this.applyPhysics(dt, PL.World);
  }

  startAttack(kind) {
    this.action = { kind, phase: 'windup', t: 0, hasHit: false };
    const cd = this.cfg.atkCd || 1.4;
    this.atkTimer = cd * PL.U.rand(0.85, 1.25);
    if (kind === 'meleeHit') Object.assign(this.action, { windup: 0.3, active: 0.14, recovery: 0.4 });
    else if (kind === 'rangedShot') Object.assign(this.action, { windup: 0.32, active: 0.1, recovery: 0.45 });
    else if (kind === 'dashAttack') Object.assign(this.action, { windup: 0.26, active: 0.3, recovery: 0.5, speed: this.spd * 2.6 });
    else if (kind === 'flyerDive') Object.assign(this.action, { windup: 0.3, active: 0.32, recovery: 0.55, speed: this.spd * 2.3 });
  }

  updateAction(dt, player) {
    const a = this.action;
    a.t += dt;
    if (a.phase === 'windup') {
      this.vx = PL.U.approach(this.vx, 0, this.spd * 8 * dt);
      if (a.t >= a.windup) { a.phase = 'active'; a.t = 0; }
    } else if (a.phase === 'active') {
      if (a.kind === 'meleeHit') {
        if (!a.hasHit) { this.meleeAttackHit(player, this.cfg.range || 40, this.dmg); a.hasHit = true; }
      } else if (a.kind === 'rangedShot') {
        if (!a.hasHit) { this.fireAtPlayer(player); a.hasHit = true; }
      } else if (a.kind === 'dashAttack' || a.kind === 'flyerDive') {
        this.vx = this.facing * a.speed;
        if (!a.hasHit && this.meleeAttackHit(player, (this.cfg.range || 40) + 10, this.dmg * 1.1)) a.hasHit = true;
      }
      if (a.t >= a.active) { a.phase = 'recovery'; a.t = 0; }
    } else if (a.phase === 'recovery') {
      this.vx = PL.U.approach(this.vx, 0, this.spd * 5 * dt);
      if (a.t >= a.recovery) this.action = null;
    }
  }

  meleeAttackHit(player, range, dmg) {
    const w = range, h = this.h;
    const x = this.facing > 0 ? this.x : this.x - w;
    const hb = { x, y: this.y - h, w, h };
    if (PL.U.aabbOverlap(hb, player.rect())) {
      const isCrit = false;
      const final = PL.U.mitigate(dmg, player.def || 0);
      player.takeDamage(final, { knockback: 180, knockUp: -200, fromRight: this.facing < 0 });
      PL.Particles.hitNumber(player.x, player.y - player.h - 6, final, isCrit);
      PL.Particles.spawnSlash(this.x + this.facing * 3, this.y - this.h * 0.62, this.facing, '#ff6b6b', Math.max(14, Math.round(this.h * 0.55)));
      if (this.cfg.special === 'frostSlow' && player.applySlow) {
        player.applySlow(0.6, 1.6);
        PL.Particles.spawnBurst(player.x, player.y - player.h * 0.5, '#8dd9ff', 8, 80);
      }
      PL.Audio.sfx.hit();
      return true;
    }
    return false;
  }

  fireAtPlayer(player) {
    const dx = player.x - this.x;
    const dist = Math.max(1, Math.abs(dx));
    const speed = 260;
    const vx = (dx / dist) * speed;
    const opts = {
      x: this.x + this.facing * 18, y: this.y - this.h * 0.6, vx, vy: 0, gravity: 0,
      w: 9, h: 5, color: this.cfg.projColor || '#ff6b6b', owner: 'enemy', damage: this.dmg, knockback: 90, facing: this.facing,
      kind: PL.SPRITE_SPECS[this.cfg.id].weapon === 'bow' ? 'arrow' : 'orb'
    };
    if (this.cfg.special === 'frostSlow') opts.statusEffect = { type: 'slow', mult: 0.6, duration: 2.2 };
    PL.Projectiles.spawn(opts);
    if (this.cfg.special === 'firePools') {
      PL.Hazards.spawnTelegraphed(player.x, 60, 0.7, this.dmg * 0.6, 2.4, '#ff5a1a');
    }
    PL.Audio.sfx.magic();
  }

  // ---------------- Rendering ----------------
  attackAnim() {
    const a = this.action;
    const weapon = PL.SPRITE_SPECS[this.cfg.id].weapon;
    let style;
    if (a.kind === 'rangedShot') style = weapon === 'bow' ? 'shoot' : 'cast';
    else if (a.kind === 'meleeHit') style = (weapon === 'dagger' || !weapon) ? 'thrust' : 'swing';
    else style = 'thrust';
    const dur = a.phase === 'windup' ? a.windup : a.phase === 'active' ? a.active : a.recovery;
    return { style, from: 3.1, to: 0.5, stage: a.phase === 'recovery' ? 'recover' : a.phase, u: a.t / Math.max(0.001, dur) };
  }

  animState() {
    const st = { time: this.animTime, phase: this.walkPhase, hurt: this.hurtTimer > 0 };
    st.move = !this.onGround ? (this.vy < 0 ? 'jump' : 'fall') : Math.abs(this.vx) > 5 ? 'run' : 'idle';
    if (this.action) st.attack = this.attackAnim();
    return st;
  }

  flashColor() {
    if (this.hitFlash > 0) return true;
    if (this.shielding && Math.floor(this.animTime * 8) % 2) return '#8ab4ff';
    if (this.enraged && Math.floor(this.animTime * 3) % 4 === 0) return '#ff5040';
    return false;
  }

  render(ctx, camX) {
    const id = this.cfg.id;
    const cx = this.x - camX;
    const hover = this.cfg.hover ? -this.cfg.hover + Math.round(Math.sin(this.animTime * 6) * 2) : 0;
    const groundY = this.y + hover;
    if (!this.alive) return;
    PL.CharSprites.drawShadow(ctx, cx, this.y, this.w + 6);
    PL.CharSprites.draw(ctx, id, cx, groundY, this.facing, PL.CharSprites.poseFor(id, this.animState()), this.flashColor());
    const glow = PL.SPRITE_SPECS[id].glow;
    if (glow) PL.Lighting.add(this.x, groundY - this.h * 0.5, glow.r, glow.i, true, glow.color);

    if (this.isElite || this.isBoss) {
      PL.Rig.drawNameTag(ctx, cx, groundY, this.h + 3, this.name, this.isBoss ? '#ff8a3b' : '#d04fff');
    }
    const windup = this.action && (this.action.phase === 'windup' || this.action.phase === 'telegraph');
    if (windup && (this.isElite || this.isBoss)) {
      PL.Pixel.marker(ctx, cx, this.y - 1, this.w * 0.8 + 4, '#ff4040', this.action.t);
    }
  }
};

// ---------------- Boss ----------------
PL.Boss = class Boss extends PL.Enemy {
  constructor(def, x, mult) {
    super(def, x, mult || { hp: 1, dmg: 1 });
    this.isBoss = true;
    this.baseSpd = this.spd;
    this.baseDmg = this.dmg;
    this.phaseIndex = 0;
    this.phases = def.phases;
    this.atkCooldowns = {};
    for (const atkId of new Set(this.phases.flatMap(p => p.attacks))) this.atkCooldowns[atkId] = PL.U.rand(1.5, 3.5);
    this.decisionTimer = 1.2;
    this.lastAttackId = null;
    this.invulnAfterPhase = 0;
    this.spawnGrace = 0.8;
    this.phaseFlashTimer = 0;
  }

  currentPhase() { return this.phases[this.phaseIndex]; }

  checkPhase() {
    const hpFrac = this.hp / this.maxHp;
    let idx = 0;
    for (let i = 1; i < this.phases.length; i++) if (hpFrac <= this.phases[i].hpFrac) idx = i;
    if (idx !== this.phaseIndex) {
      this.phaseIndex = idx;
      this.spd = this.baseSpd * this.phases[idx].spdMult;
      this.dmg = this.baseDmg * this.phases[idx].dmgMult;
      this.invulnTimer = Math.max(this.invulnTimer, 0.5);
      this.phaseFlashTimer = 1.2;
      PL.Audio.sfx.bossRoar();
      PL.World.camera.shake(14, 0.4);
      PL.Particles.spawnExplosion(this.x, this.y - this.h * 0.5, 90, '#ff3b3b');
      if (this.onPhaseChange) this.onPhaseChange(idx);
    }
  }

  update(dt, player, enemiesList) {
    this._enemiesList = enemiesList;
    this.animTime += dt;
    if (!this.alive) { this.deadTimer += dt; this.vx = PL.U.approach(this.vx, 0, 500 * dt); this.applyPhysics(dt, PL.World); return; }
    if (this.phaseFlashTimer > 0) this.phaseFlashTimer -= dt;
    if (this.spawnGrace > 0) { this.spawnGrace -= dt; this.applyPhysics(dt, PL.World); return; }
    this.checkPhase();
    for (const k in this.atkCooldowns) if (this.atkCooldowns[k] > 0) this.atkCooldowns[k] -= dt;

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      this.vx = PL.U.approach(this.vx, 0, this.spd * 6 * dt);
      this.applyPhysics(dt, PL.World);
      return;
    }

    if (this.action) {
      this.updateBossAction(dt, player);
      this.applyPhysics(dt, PL.World);
      return;
    }

    const dx = player.x - this.x;
    const dist = Math.abs(dx);
    this.facing = dx >= 0 ? 1 : -1;

    this.decisionTimer -= dt;
    if (this.decisionTimer <= 0) {
      this.decisionTimer = 0.4;
      const ready = this.currentPhase().attacks.filter(id => this.atkCooldowns[id] <= 0 && id !== this.lastAttackId);
      const pool = ready.length ? ready : this.currentPhase().attacks.filter(id => this.atkCooldowns[id] <= 0);
      if (pool.length && dist < 420) {
        const id = PL.U.choose(pool);
        this.startBossAttack(id);
      }
    }

    if (!this.action) {
      if (dist > 95) this.vx = this.facing * this.spd * 0.6;
      else this.vx = 0;
    }
    if (this.onGround && Math.abs(this.vx) > 5) this.walkPhase += dt * 7;
    this.applyPhysics(dt, PL.World);
  }

  startBossAttack(id) {
    const pattern = PL.ATTACK_PATTERNS[id];
    this.lastAttackId = id;
    this.atkCooldowns[id] = pattern.ultimate ? PL.U.rand(9, 11) : PL.U.rand(3.5, 6);
    this.action = { kind: id, pattern, phase: 'telegraph', t: 0, hasHit: false, tickCount: 0 };
    if (this.onAttackStart) this.onAttackStart(id, pattern);
  }

  updateBossAction(dt, player) {
    const a = this.action;
    a.t += dt;
    if (a.phase === 'telegraph') {
      this.vx = PL.U.approach(this.vx, 0, this.spd * 8 * dt);
      if (a.kind === 'groundSpikes' && a.t > 0.05 && !a.spikesPlaced) {
        a.spikesPlaced = true;
        for (let i = 0; i < a.pattern.count; i++) {
          const ox = player.x + PL.U.rand(-70, 70);
          PL.Hazards.spawnTelegraphed(ox, a.pattern.radius, a.pattern.telegraph * 0.8, this.dmg * a.pattern.dmgMult, 1.0, '#ff5a1a');
        }
      }
      if (a.t >= a.pattern.telegraph) { a.phase = 'active'; a.t = 0; }
    } else if (a.phase === 'active') {
      this.executeBossAttackTick(a, player);
      if (a.t >= a.pattern.active) { a.phase = 'recovery'; a.t = 0; }
    } else if (a.phase === 'recovery') {
      this.vx = PL.U.approach(this.vx, 0, this.spd * 5 * dt);
      if (a.t >= a.pattern.recovery) this.action = null;
    }
  }

  bossHitbox(radius) {
    const w = radius, h = this.h + 20;
    const x = this.facing > 0 ? this.x : this.x - w;
    return { x, y: this.y - h, w, h };
  }

  dealBossDamage(player, dmgMult, opts) {
    const final = PL.U.mitigate(this.dmg * dmgMult, player.def || 0);
    player.takeDamage(final, opts);
    PL.Particles.hitNumber(player.x, player.y - player.h - 6, final, false);
  }

  executeBossAttackTick(a, player) {
    const p = a.pattern;
    const fromRight = this.facing < 0;
    switch (a.kind) {
      case 'meleeSwing': {
        if (a.hasHit) return;
        const hb = this.bossHitbox(p.range);
        if (PL.U.aabbOverlap(hb, player.rect())) {
          this.dealBossDamage(player, p.dmgMult, { knockback: p.knockback, knockUp: p.knockUp, fromRight });
          PL.Audio.sfx.hitHeavy();
        }
        PL.Particles.spawnSlash(this.x + this.facing * 4, this.y - this.h * 0.62, this.facing, '#ff8a3b', Math.round(this.h * 0.6));
        a.hasHit = true;
        break;
      }
      case 'aoeSlam': case 'cloneSwap': {
        if (a.hasHit) return;
        const hb = this.bossHitbox(p.radius || 90);
        if (PL.U.aabbOverlap(hb, player.rect())) this.dealBossDamage(player, p.dmgMult, { knockback: p.knockback, knockUp: p.knockUp, fromRight });
        PL.Particles.spawnExplosion(this.x, this.y - 20, p.radius || 90, '#ff8a3b');
        PL.World.camera.shake(10, 0.25);
        PL.Audio.sfx.hitHeavy();
        a.hasHit = true;
        break;
      }
      case 'dashCharge': {
        this.vx = this.facing * p.speed;
        if (!a.hasHit) {
          const hb = this.bossHitbox(this.w + 20);
          if (PL.U.aabbOverlap(hb, player.rect())) { this.dealBossDamage(player, p.dmgMult, { knockback: p.knockback, knockUp: p.knockUp, fromRight }); a.hasHit = true; PL.Audio.sfx.hitHeavy(); }
        }
        break;
      }
      case 'groundSpikes': {
        a.hasHit = true;
        break;
      }
      case 'projectileBarrage': {
        if (a.hasHit) return;
        for (let i = 0; i < p.count; i++) {
          const spread = (i - (p.count - 1) / 2) * 0.18;
          const dx = player.x - this.x, dy = -40;
          const base = Math.atan2(dy, dx);
          const ang = base + spread;
          PL.Projectiles.spawn({
            x: this.x + this.facing * 20, y: this.y - this.h * 0.6,
            vx: Math.cos(ang) * p.speed, vy: Math.sin(ang) * p.speed * 0.4, gravity: 160,
            w: 10, h: 10, color: this.cfg.projColor || '#ff6b6b', owner: 'enemy', kind: 'orb',
            damage: this.dmg * p.dmgMult, knockback: p.knockback, facing: this.facing
          });
        }
        PL.Audio.sfx.magic();
        a.hasHit = true;
        break;
      }
      case 'summonAdds': {
        if (a.hasHit) return;
        for (let i = 0; i < p.count; i++) {
          const spawnDef = PL.U.choose(PL.ENEMY_DEFS.slice(0, 5));
          const ex = PL.U.clamp(this.x + PL.U.rand(-80, 80), 40, PL.World.width - 40);
          const e = PL.createEnemy(spawnDef, ex);
          this._enemiesList.push(e);
        }
        PL.Particles.spawnBurst(this.x, this.y - this.h * 0.5, '#ffd76b', 14, 150);
        PL.Audio.sfx.magicCast();
        a.hasHit = true;
        break;
      }
      case 'coneBreath': {
        PL.Particles.spawnJet(this.x + this.facing * this.w * 0.55, this.y - this.h * 0.62, this.facing, 4);
        a.tickCount = a.tickCount || 0;
        const tickDur = p.active / p.ticks;
        if (a.t >= tickDur * (a.tickCount + 1)) {
          a.tickCount++;
          const hb = this.bossHitbox(p.range);
          if (PL.U.aabbOverlap(hb, player.rect())) this.dealBossDamage(player, p.dmgMult, { knockback: p.knockback, knockUp: p.knockUp, fromRight });
          PL.Particles.spawnBurst(this.x + this.facing * 60, this.y - 30, '#ff8a3b', 6, 100);
        }
        break;
      }
      case 'beamJudgment': {
        if (a.hasHit) return;
        PL.World.camera.shake(20, 0.5);
        const hb = this.bossHitbox(9999);
        if (PL.U.aabbOverlap(hb, player.rect())) this.dealBossDamage(player, p.dmgMult, { knockback: p.knockback, knockUp: p.knockUp, fromRight });
        PL.Particles.spawnExplosion(this.x + this.facing * 150, this.y - 30, 200, '#ffe070');
        PL.Audio.sfx.explosion();
        a.hasHit = true;
        break;
      }
    }
  }

  attackAnim() {
    const a = this.action, p = a.pattern;
    const weapon = PL.SPRITE_SPECS[this.cfg.id].weapon;
    const STYLE = {
      meleeSwing: weapon ? 'swing' : 'punch', aoeSlam: 'slam', dashCharge: 'thrust', groundSpikes: 'raise',
      projectileBarrage: weapon === 'staff' ? 'cast' : 'raise', summonAdds: 'raise', coneBreath: 'breath', cloneSwap: 'swing',
      beamJudgment: a.phase === 'telegraph' ? 'raise' : 'slam'
    };
    const stage = a.phase === 'telegraph' ? 'windup' : a.phase === 'recovery' ? 'recover' : 'active';
    const dur = a.phase === 'telegraph' ? p.telegraph : a.phase === 'active' ? p.active : p.recovery;
    return { style: STYLE[a.kind] || 'swing', from: 3.4, to: 0.3, stage, u: a.t / Math.max(0.001, dur) };
  }

  isWarning() {
    return !!(this.action && this.action.pattern && this.action.pattern.warning && this.action.phase === 'telegraph');
  }
  warningText() {
    if (!this.action) return '';
    const names = {
      aoeSlam: 'МОЩНЫЙ УДАР!', dashCharge: 'РЫВОК!', groundSpikes: 'ШИПЫ ИЗ ЗЕМЛИ!',
      coneBreath: 'ДЫХАНИЕ ОГНЯ!', beamJudgment: 'СУД НАЧИНАЕТСЯ!'
    };
    return names[this.action.kind] || 'ОПАСНАЯ АТАКА!';
  }
};

// ---------------- Factories ----------------
PL.createEnemy = function (def, x, mult) { return new PL.Enemy(def, x, mult); };
PL.createBoss = function (def, x, mult) { return new PL.Boss(def, x, mult); };

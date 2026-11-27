// Player entity: movement, combo attacks, heavy attacks, dodge, class abilities, rendering.
window.PL = window.PL || {};

// How each class's attacks animate (see charsprites.poseFor). Light attacks list one entry per combo hit.
const PLAYER_ATTACK_ANIM = {
  warrior: {
    light: [{ style: 'swing', from: 3.3, to: 0.45 }, { style: 'swing', from: 0.4, to: 3.1 }, { style: 'swing', from: 3.6, to: 0.25 }],
    heavy: { style: 'swing', from: 3.95, to: 0.2 }, q: { style: 'slam' }, e: { style: 'slam' }
  },
  assassin: {
    light: [{ style: 'thrust' }, { style: 'swing', from: 2.6, to: 0.6 }, { style: 'thrust' }, { style: 'swing', from: 3.3, to: 0.3 }],
    heavy: { style: 'thrust' }, q: { style: 'thrust' }, e: { style: 'swing', from: 3.6, to: -2.4 }
  },
  mage: { light: [{ style: 'cast' }], heavy: { style: 'cast' }, q: { style: 'raise' }, e: { style: 'raise' } },
  archer: { light: [{ style: 'shoot' }], heavy: { style: 'shoot' }, q: { style: 'shootUp' }, e: { style: 'shoot' } },
  necromancer: { light: [{ style: 'cast' }], heavy: { style: 'cast' }, q: { style: 'raise' }, e: { style: 'slam' } },
  cleric: { light: [{ style: 'cast' }], heavy: { style: 'cast' }, q: { style: 'raise' }, e: { style: 'slam' } },
  guardian: {
    light: [{ style: 'swing', from: 3.0, to: 0.6 }, { style: 'thrust' }, { style: 'swing', from: 3.4, to: 0.3 }],
    heavy: { style: 'bash' }, q: { style: 'guard' }, e: { style: 'bash' }
  }
};

PL.Player = class Player extends PL.Entity {
  constructor(classId, profile) {
    super(160, 0, 20, 46);
    this.classId = classId;
    this.classDef = PL.CLASSES[classId];
    this.w = 16;
    this.h = PL.CharSprites.height(classId);
    this.animTime = 0;
    this.profile = profile;
    this.level = profile.level;
    const computed = PL.Progression.computeStats(classId, profile);
    this.computed = computed;
    this.maxHp = computed.maxHp; this.hp = this.maxHp;
    this.str = computed.str; this.def = computed.def; this.spd = computed.spd; this.crit = computed.crit;
    this.energyMax = computed.energyMax; this.energy = this.energyMax; this.energyRegen = computed.energyRegen;

    this.state = 'idle';
    this.action = null;
    this.queuedAction = null;
    this.comboIndex = 0;
    this.comboResetTimer = 0;
    this.comboDisplay = { count: 0, timer: 0 };
    this.dodgeCooldown = 0;
    this.dodgeTimer = 0;
    this.hurtTimer = 0;
    this.deadTimer = 0;
    this.cooldowns = { q: 0, e: 0 };
    this.runCyclePhase = 0;
    this.zones = [];
    this._enemies = [];
    this.totalDamageDealt = 0;
    this.totalDamageTaken = 0;
    this.slowMult = 1;
    this.slowTimer = 0;
    this.empowerTimer = 0; // Necromancer's Dark Pact: double damage for the player and summoned allies
    this.regenTimer = 0; this.regenRate = 0; this.regenAcc = 0; // Cleric's Healing Light heal-over-time
    this.guardTimer = 0; this.guardReduction = 0;                // Guardian's Shield Wall
    this.chargeTimer = 0; this.chargeHit = null;                // Guardian's Shield Charge
  }

  applySlow(mult, duration) {
    this.slowMult = mult;
    this.slowTimer = duration;
    PL.Particles.spawnSpark(this.x, this.y - this.h * 0.5, '#8dd9ff', 6, { maxLifeTime: 0.3 });
  }

  // ---------------- Main update ----------------
  update(dt, enemies) {
    this._enemies = enemies;
    this.animTime += dt;
    if (!this.alive) { this.deadTimer += dt; this.vx = PL.U.approach(this.vx, 0, 900 * dt); this.applyPhysics(dt, PL.World); return; }

    this.energy = Math.min(this.energyMax, this.energy + this.energyRegen * dt);
    if (this.cooldowns.q > 0) this.cooldowns.q = Math.max(0, this.cooldowns.q - dt);
    if (this.cooldowns.e > 0) this.cooldowns.e = Math.max(0, this.cooldowns.e - dt);
    if (this.dodgeCooldown > 0) this.dodgeCooldown -= dt;
    if (this.comboResetTimer > 0) { this.comboResetTimer -= dt; if (this.comboResetTimer <= 0) this.comboIndex = 0; }
    if (this.comboDisplay.timer > 0) { this.comboDisplay.timer -= dt; if (this.comboDisplay.timer <= 0) this.comboDisplay.count = 0; }
    if (this.slowTimer > 0) { this.slowTimer -= dt; if (this.slowTimer <= 0) this.slowMult = 1; }
    if (this.regenTimer > 0) {
      this.regenTimer -= dt;
      const amt = Math.min(this.regenRate * dt, this.maxHp - this.hp);
      this.hp += amt; this.regenAcc += amt;
      if (this.regenAcc >= 4 || (this.regenTimer <= 0 && this.regenAcc >= 1)) { PL.Particles.spawnFloatText(this.x + PL.U.rand(-6, 6), this.y - this.h - 10, '+' + Math.round(this.regenAcc), '#ffe070'); this.regenAcc = 0; }
      if (Math.random() < dt * 8) PL.Particles.spawnSpark(this.x + PL.U.rand(-7, 7), this.y - PL.U.rand(2, this.h), '#ffe070', 1, { maxLifeTime: 0.6, minSpeed: 8, maxSpeed: 24, gravity: -50 });
    }
    if (this.guardTimer > 0) {
      this.guardTimer = Math.max(0, this.guardTimer - dt);
      if (Math.random() < dt * 6) PL.Particles.spawnSpark(this.x + this.facing * 8, this.y - PL.U.rand(8, this.h - 6), '#8ab0ff', 1, { maxLifeTime: 0.35, minSpeed: 6, maxSpeed: 20 });
    }
    if (this.empowerTimer > 0) {
      this.empowerTimer = Math.max(0, this.empowerTimer - dt);
      if (Math.random() < dt * 14) PL.Particles.spawnSpark(this.x + PL.U.rand(-6, 6), this.y - PL.U.rand(4, this.h), '#b06aff', 1, { maxLifeTime: 0.5, minSpeed: 10, maxSpeed: 30, gravity: -60 });
    }

    if (this.state === 'hurt') {
      this.hurtTimer -= dt;
      if (this.hurtTimer <= 0) this.state = 'idle';
    }
    if (this.state === 'dodge') {
      this.dodgeTimer -= dt;
      if (this.dodgeTimer <= 0) this.state = 'idle';
    }

    const locked = this.state === 'hurt' || this.state === 'dodge' || (this.action && this.action.locked);

    const moveAxis = PL.Input.getMoveAxis();
    if (!locked) {
      this.vx = moveAxis * this.spd * this.slowMult;
      if (moveAxis !== 0) this.facing = moveAxis > 0 ? 1 : -1;
    } else if (this.state !== 'dodge') {
      this.vx = PL.U.approach(this.vx, 0, this.spd * 7 * dt);
    }
    if (this.onGround && Math.abs(this.vx) > 5 && this.state !== 'dodge') this.runCyclePhase += dt * 11;
    else if (Math.abs(this.vx) <= 5) this.runCyclePhase = 0;

    if (!locked && this.onGround && PL.Input.actionJustPressed('jump')) {
      this.vy = -500; this.onGround = false;
      PL.Particles.spawnDust(this.x, this.y, this.facing);
    }

    if (!locked && this.dodgeCooldown <= 0 && PL.Input.actionJustPressed('dodge')) {
      this.startDodge();
    } else if (!locked) {
      if (PL.Input.actionJustPressed('light')) this.queueOrStart('light');
      else if (PL.Input.actionJustPressed('heavy')) this.queueOrStart('heavy');
      else if (PL.Input.actionJustPressed('ability1')) this.tryAbility('q');
      else if (PL.Input.actionJustPressed('ability2')) this.tryAbility('e');
    } else if (this.action && !this.action.locked) {
      if (PL.Input.actionJustPressed('light')) this.queuedAction = 'light';
      else if (PL.Input.actionJustPressed('heavy')) this.queuedAction = 'heavy';
    }

    if (this.chargeTimer > 0) this.updateCharge(dt);
    this.updateAction(dt);
    this.updateZones(dt);
    this.applyPhysics(dt, PL.World);
  }

  // Shield Charge: a short unstoppable rush that hits each enemy once, knocks it away and stuns it.
  updateCharge(dt) {
    this.chargeTimer -= dt;
    this.vx = this.facing * 620;
    this.invulnTimer = Math.max(this.invulnTimer, 0.05);
    if (Math.random() < 0.6) PL.Particles.spawnDust(this.x, this.y, -this.facing);
    const c = this.chargeHit;
    const hb = this.meleeHitbox(26);
    for (const e of this._enemies) {
      if (!e.alive || c.hit.has(e) || !PL.U.aabbOverlap(hb, e.rect())) continue;
      c.hit.add(e);
      const { dmg, isCrit } = this.computeDamage(c.mult, null);
      const final = PL.U.mitigate(dmg, e.def || 0);
      e.takeDamage(final, { knockback: 380, knockUp: -260, fromRight: this.facing < 0 });
      this.totalDamageDealt += final;
      PL.Particles.hitNumber(e.x, e.y - e.h - 6, final, isCrit);
      PL.Particles.spawnBurst(e.x, e.y - e.h * 0.5, '#8ab0ff', 10, 160);
      this.stunEnemy(e, c.stun);
      PL.Audio.sfx.hitHeavy();
      PL.World.camera.shake(6, 0.15);
      this.registerCombo();
    }
    if (this.chargeTimer <= 0) { this.vx = this.facing * 120; this.chargeHit = null; }
  }

  stunEnemy(e, dur) {
    if (!e.alive || !dur || e.isBoss) return; // bosses only feel it through their poise
    e.hurtTimer = Math.max(e.hurtTimer || 0, dur);
    e.action = null;
    PL.Particles.spawnFloatText(e.x, e.y - e.h - 14, 'ОГЛУШЁН', '#ffd04a');
  }

  queueOrStart(type) {
    if (!this.action) this.startAction(type);
    else this.queuedAction = type;
  }

  // Aim assist: attacking without a movement input turns toward the closest enemy in reach.
  faceNearestEnemy() {
    if (PL.Input.getMoveAxis() !== 0) return;
    let best = null, bestD = 240;
    for (const e of this._enemies) {
      if (!e.alive) continue;
      const d = Math.abs(e.x - this.x);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best && Math.abs(best.x - this.x) > 2) this.facing = best.x > this.x ? 1 : -1;
  }

  startAction(type) {
    this.queuedAction = null;
    this.faceNearestEnemy();
    if (type === 'light') {
      const def = this.classDef.light;
      const idx = this.comboIndex % def.hits;
      this.action = { type: 'light', idx, startup: def.startup[idx], active: def.active, recovery: def.recovery[idx], t: 0, phase: 'startup', locked: true, hasHit: false, def };
      this.comboIndex++;
      this.comboResetTimer = 0.9;
    } else if (type === 'heavy') {
      const def = this.classDef.heavy;
      this.action = { type: 'heavy', startup: def.startup, active: def.active, recovery: def.recovery, t: 0, phase: 'startup', locked: true, hasHit: false, def };
      this.comboIndex = 0;
    }
  }

  startDodge() {
    this.state = 'dodge';
    this.action = null; this.queuedAction = null;
    const axis = PL.Input.getMoveAxis();
    const dir = axis !== 0 ? Math.sign(axis) : this.facing;
    this.facing = dir;
    this.vx = dir * 560;
    this.dodgeTimer = 0.26;
    this.invulnTimer = Math.max(this.invulnTimer, 0.22);
    this.dodgeCooldown = 0.85;
    PL.Audio.sfx.dash();
    PL.Particles.spawnDust(this.x, this.y, -dir);
  }

  updateAction(dt) {
    if (!this.action) {
      if (this.queuedAction) { const q = this.queuedAction; this.queuedAction = null; this.startAction(q); }
      return;
    }
    const a = this.action;
    a.t += dt;
    if (a.type === 'ability') {
      if (a.phase === 'telegraph') {
        if (a.t >= a.telegraphDur) { a.phase = 'active'; a.t = 0; }
      } else if (a.phase === 'active') {
        if (!a.hasHit) { this.executeAbilityEffect(a); a.hasHit = true; }
        if (a.t >= a.active) { a.phase = 'recovery'; a.t = 0; a.locked = false; }
      } else if (a.phase === 'recovery') {
        if (a.t >= a.recovery) {
          this.action = null;
          if (this.queuedAction) { const q = this.queuedAction; this.queuedAction = null; this.startAction(q); }
        }
      }
      return;
    }
    if (a.phase === 'startup') {
      if (a.t >= a.startup) { a.phase = 'active'; a.t = 0; }
    } else if (a.phase === 'active') {
      if (!a.hasHit) { this.performAttackHit(a); a.hasHit = true; }
      if (a.t >= a.active) { a.phase = 'recovery'; a.t = 0; a.locked = false; }
    } else if (a.phase === 'recovery') {
      if (a.t >= a.recovery) {
        this.action = null;
        if (this.queuedAction) { const q = this.queuedAction; this.queuedAction = null; this.startAction(q); }
        else if (this.comboResetTimer <= 0) this.comboIndex = 0;
      }
    }
  }

  registerCombo() {
    this.comboDisplay.count++;
    this.comboDisplay.timer = 1.4;
  }

  computeDamage(mult, slot) {
    let base = this.str * mult;
    if (slot === 'light') base *= this.computed.lightDmgMult;
    else if (slot === 'heavy') base *= this.computed.heavyDmgMult;
    if (this.empowerTimer > 0) base *= 2;
    const isCrit = PL.U.rollCrit(this.crit);
    if (isCrit) base *= 1.8;
    return { dmg: base, isCrit };
  }

  meleeHitbox(range) {
    const w = range, h = this.h * 0.95;
    const x = this.facing > 0 ? this.x : this.x - w;
    return { x, y: this.y - h, w, h };
  }

  zoneHitbox(cx, radius) {
    return { x: cx - radius / 2, y: this.y - this.h - radius / 2, w: radius, h: radius + this.h };
  }

  // Returns the total damage dealt (0 when nothing was hit).
  hitAllIn(hb, mult, slot, opts) {
    let total = 0;
    for (const e of this._enemies) {
      if (!e.alive) continue;
      if (PL.U.aabbOverlap(hb, e.rect())) {
        const { dmg, isCrit } = this.computeDamage(mult, slot);
        const final = PL.U.mitigate(dmg, e.def || 0);
        e.takeDamage(final, opts);
        this.totalDamageDealt += final;
        PL.Particles.hitNumber(e.x, e.y - e.h - 6, final, isCrit);
        if (opts && opts.stun) this.stunEnemy(e, opts.stun);
        total += final;
      }
    }
    return total;
  }

  performAttackHit(a) {
    const def = a.def;
    const isLight = a.type === 'light';
    const mult = isLight ? def.dmgMult[a.idx] : def.dmgMult;
    const kb = isLight ? def.knockback[a.idx] : def.knockback;
    const slot = isLight ? 'light' : 'heavy';
    const fromRight = this.facing < 0;
    if (def.projectile) {
      const { dmg, isCrit } = this.computeDamage(mult, slot);
      const speed = isLight ? 380 : 460;
      PL.Projectiles.spawn({
        x: this.x + this.facing * 22, y: this.y - this.h * 0.58, vx: this.facing * speed, vy: 0, gravity: 0,
        w: 10, h: 6, color: def.projColor || '#fff', owner: 'player', pierce: !!def.pierce, kind: this.classDef.weaponKind === 'bow' ? 'arrow' : 'orb',
        damage: dmg, isCrit, knockback: kb, facing: this.facing,
        onHit: def.lifesteal ? (final) => this.heal(final * (def.lifesteal + (this.computed.lifestealBonus || 0))) : null
      });
      (this.classDef.weaponKind === 'bow' ? PL.Audio.sfx.bow : PL.Audio.sfx.magicCast)();
      this.registerCombo();
      return;
    }
    const hb = this.meleeHitbox(def.range);
    const any = this.hitAllIn(hb, mult, slot, { knockback: kb, knockUp: isLight ? -120 : -240, fromRight, stun: isLight ? 0 : def.stun });
    if (any && def.lifesteal) this.heal(any * (def.lifesteal + (this.computed.lifestealBonus || 0)));
    if (any) { (isLight ? PL.Audio.sfx.hit : PL.Audio.sfx.hitHeavy)(); this.registerCombo(); }
    else (isLight ? PL.Audio.sfx.swingLight : PL.Audio.sfx.swingHeavy)();
    PL.Particles.spawnSlash(this.x + this.facing * 3, this.y - this.h * 0.62, this.facing, isLight ? '#c8d4e4' : '#ffb13b', isLight ? 20 : 25);
  }

  heal(amount, silent) {
    if (!this.alive || amount <= 0) return;
    const before = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    const got = Math.round(this.hp - before);
    if (got > 0 && !silent) {
      PL.Particles.spawnFloatText(this.x + PL.U.rand(-6, 6), this.y - this.h - 10, '+' + got, '#6aff8a');
      PL.Particles.spawnSpark(this.x, this.y - this.h * 0.5, '#6aff8a', 5, { maxLifeTime: 0.4, minSpeed: 20, maxSpeed: 70 });
    }
  }

  tryAbility(slot) {
    const abilityDef = this.classDef.abilities.find(ab => ab.key === slot);
    if (!abilityDef) return;
    if (this.cooldowns[slot] > 0 || this.energy < abilityDef.energyCost) {
      PL.Audio.sfx.uiHover();
      return;
    }
    this.energy -= abilityDef.energyCost;
    this.faceNearestEnemy();
    const mods = this.computed.abilityMods[slot];
    this.cooldowns[slot] = abilityDef.cooldown * mods.cdMult;
    const preview = this.computeAbilityPreview(abilityDef);
    this.action = {
      type: 'ability', slot, abilityDef, preview, t: 0,
      phase: abilityDef.telegraph > 0 ? 'telegraph' : 'active',
      telegraphDur: abilityDef.telegraph || 0, active: 0.12, recovery: 0.24,
      locked: true, hasHit: false
    };
  }

  computeAbilityPreview(def) {
    const mods = this.computed.abilityMods[def.key];
    const radius = (def.radius || 60) * (mods.radiusMult || 1);
    switch (def.id) {
      case 'shockwave': return { x: this.x + this.facing * radius * 0.4, y: this.y, radius };
      case 'fireStorm': return { x: this.x + this.facing * 90, y: this.y, radius };
      case 'arrowRain': return { x: this.x + this.facing * 160, y: this.y, radius };
      case 'raiseKnight': return { x: this.x + this.facing * 30, y: this.y, radius };
      case 'sanctuary': return { x: this.x + this.facing * 30, y: this.y, radius };
      case 'shieldCharge': return { x: this.x + this.facing * 60, y: this.y, radius: 40 };
      default: return { x: this.x, y: this.y, radius };
    }
  }

  spawnZone(x, radius, mult, ticks, color, aroundSelf) {
    this.zones.push({ x, radius, mult, ticksLeft: ticks, timer: 0.05, interval: 0.28, color, aroundSelf });
  }

  updateZones(dt) {
    if (!this.zones.length) return;
    this.zones = this.zones.filter(z => {
      z.timer -= dt;
      if (z.timer <= 0) {
        z.timer = z.interval;
        if (z.aroundSelf) z.x = this.x;
        const hb = this.zoneHitbox(z.x, z.radius);
        if (z.sanctuary) {
          // Holy ground: burns enemies standing in the circle (no knockback) and heals the player inside it.
          const rr = { x: z.x - z.radius / 2, y: this.y - 200, w: z.radius, h: 220 };
          this.hitAllIn(rr, z.mult, null, { knockback: 0, fromRight: this.facing < 0 });
          if (Math.abs(this.x - z.x) < z.radius / 2 + 4) this.heal(this.maxHp * z.heal, true);
          for (let k = 0; k < 8; k++) PL.Particles.spawnSpark(z.x + PL.U.rand(-z.radius / 2, z.radius / 2), PL.World.groundY - 2, PL.U.choose(['#ffe070', '#fff8d8']), 1, { maxLifeTime: 0.9, minSpeed: 10, maxSpeed: 40, gravity: -90 });
        } else {
          this.hitAllIn(hb, z.mult, null, { knockback: 50, knockUp: -70, fromRight: this.facing < 0 });
          PL.Particles.spawnBurst(z.x, this.y - 30, z.color, 7, 130);
        }
        z.ticksLeft--;
      }
      return z.ticksLeft > 0;
    });
  }

  executeAbilityEffect(a) {
    const def = a.abilityDef, slot = a.slot;
    const mods = this.computed.abilityMods[slot];
    const dmgMultFinal = def.dmgMult * mods.dmgMult;
    const preview = a.preview;
    const fromRight = this.facing < 0;
    switch (def.id) {
      case 'shockwave': {
        const hb = this.zoneHitbox(preview.x, preview.radius);
        this.hitAllIn(hb, dmgMultFinal, null, { knockback: 340, knockUp: -300, fromRight });
        PL.Particles.spawnExplosion(preview.x, this.y - 25, preview.radius, '#ffb13b');
        PL.World.camera.shake(8, 0.25); PL.Audio.sfx.hitHeavy();
        break;
      }
      case 'leapSlam': {
        const hb = this.zoneHitbox(preview.x, preview.radius);
        this.hitAllIn(hb, dmgMultFinal, null, { knockback: 220, knockUp: -260, fromRight });
        PL.Particles.spawnExplosion(preview.x, this.y, preview.radius, '#ff8a3b');
        PL.World.camera.shake(12, 0.3); PL.Audio.sfx.hitHeavy();
        break;
      }
      case 'arcaneNova': {
        const hb = this.zoneHitbox(preview.x, preview.radius);
        this.hitAllIn(hb, dmgMultFinal, null, { knockback: 280, knockUp: -220, fromRight });
        this.invulnTimer = Math.max(this.invulnTimer, 0.4);
        PL.Particles.spawnExplosion(preview.x, this.y, preview.radius, '#8ddcff');
        PL.World.camera.shake(6, 0.2); PL.Audio.sfx.magic();
        break;
      }
      case 'shadowDash': {
        this.vx = this.facing * 640;
        this.invulnTimer = Math.max(this.invulnTimer, def.invuln || 0.25);
        const hb = this.meleeHitbox(def.range || 150);
        this.hitAllIn(hb, dmgMultFinal, null, { knockback: 140, knockUp: -140, fromRight });
        PL.Audio.sfx.dash();
        PL.Particles.spawnBurst(this.x, this.y - 25, '#9a2fd0', 16, 240);
        break;
      }
      case 'bloodWhirl': {
        this.spawnZone(this.x, preview.radius, dmgMultFinal, def.ticks, '#c72a4a', true);
        PL.Audio.sfx.swingHeavy();
        break;
      }
      case 'fireStorm': {
        this.spawnZone(preview.x, preview.radius, dmgMultFinal, def.ticks, '#ff5c2a', false);
        PL.Audio.sfx.magicCast();
        break;
      }
      case 'arrowRain': {
        this.spawnZone(preview.x, preview.radius, dmgMultFinal, def.ticks, '#ffd76b', false);
        PL.Audio.sfx.bow();
        break;
      }
      case 'darkPact': {
        this.empowerTimer = def.duration || 5;
        PL.Particles.spawnExplosion(this.x, this.y - this.h * 0.5, 50, '#b06aff');
        for (const al of PL.Allies.alive()) PL.Particles.spawnBurst(al.x, al.y - al.h * 0.5, '#b06aff', 12, 120);
        PL.Particles.spawnFloatText(this.x, this.y - this.h - 14, 'УРОН x2', '#d08aff', true);
        PL.Audio.sfx.magicCast();
        break;
      }
      case 'raiseKnight': {
        PL.Allies.summon(this, this.computed.allyCount || 1, { duration: def.duration || 15, power: this.computed.allyPower || 1 });
        PL.Particles.spawnExplosion(preview.x, this.y - 4, 40, '#6aff8a');
        PL.World.camera.shake(6, 0.25);
        PL.Audio.sfx.bossRoar();
        break;
      }
      case 'healingLight': {
        const hm = this.computed.healMult || 1;
        this.heal(this.maxHp * def.heal * hm);
        this.regenTimer = def.regenTime; this.regenRate = this.maxHp * def.regen * hm; this.regenAcc = 0;
        PL.Particles.spawnExplosion(this.x, this.y - this.h * 0.5, 40, '#ffe070');
        PL.Lighting.add(this.x, this.y - 20, 90, 0.8, true);
        PL.Audio.sfx.pickup();
        break;
      }
      case 'sanctuary': {
        this.zones.push({ x: preview.x, radius: preview.radius, mult: dmgMultFinal, ticksLeft: def.ticks, timer: 0.05, interval: 0.5, color: '#ffd860', sanctuary: true, heal: def.heal * (this.computed.healMult || 1), t: 0 });
        PL.Particles.spawnExplosion(preview.x, this.y - 6, preview.radius * 0.5, '#ffe070');
        PL.World.camera.shake(5, 0.2);
        PL.Audio.sfx.magicCast();
        break;
      }
      case 'shieldWall': {
        this.guardTimer = def.duration + (this.computed.shieldBonusTime || 0);
        this.guardReduction = def.reduction;
        PL.Particles.spawnBurst(this.x + this.facing * 8, this.y - this.h * 0.5, '#8ab0ff', 14, 120);
        PL.Particles.spawnFloatText(this.x, this.y - this.h - 14, 'СТЕНА ЩИТОВ', '#8ab0ff', true);
        PL.Audio.sfx.block();
        break;
      }
      case 'shieldCharge': {
        this.chargeTimer = (def.range || 170) / 620;
        this.chargeHit = { hit: new Set(), mult: dmgMultFinal, stun: def.stun };
        PL.Audio.sfx.dash();
        break;
      }
      case 'aimedShot': {
        const base = this.str * dmgMultFinal;
        const isCrit = PL.U.rollCrit(this.crit + 35);
        const dmg = isCrit ? base * 1.8 : base;
        PL.Projectiles.spawn({
          x: this.x + this.facing * 24, y: this.y - this.h * 0.55, vx: this.facing * 680, vy: 0, gravity: 0,
          w: 14, h: 6, color: '#ffd76b', owner: 'player', pierce: true, damage: dmg, isCrit, knockback: 240, facing: this.facing, kind: 'arrow'
        });
        PL.Audio.sfx.bow();
        break;
      }
    }
  }

  takeDamage(amount, opts) {
    const guarding = this.guardTimer > 0 && this.alive && !this.isInvuln();
    if (guarding) {
      amount *= 1 - this.guardReduction;
      opts = Object.assign({}, opts, { knockback: 0 });
      PL.Particles.spawnSpark(this.x + this.facing * 10, this.y - this.h * 0.55, '#c8dcff', 6, { maxLifeTime: 0.25 });
      PL.Audio.sfx.block();
    }
    const applied = super.takeDamage(amount, opts);
    if (applied && guarding && this.alive) {
      // Shield Wall: no flinch, keep attacking.
      this.totalDamageTaken += amount;
      this.invulnTimer = Math.max(this.invulnTimer, 0.35);
      PL.Particles.spawnFloatText(this.x, this.y - this.h - 6, 'БЛОК', '#8ab0ff');
      return applied;
    }
    if (applied) {
      this.totalDamageTaken += amount;
      if (this.alive) {
        this.state = 'hurt'; this.hurtTimer = 0.26; this.action = null; this.queuedAction = null; this.comboIndex = 0;
        this.invulnTimer = Math.max(this.invulnTimer, 0.5); // brief mercy invulnerability (blinks) so bursts can't chain-hit
        PL.Audio.sfx.hurt();
        PL.Particles.spawnSpark(this.x, this.y - this.h * 0.6, '#ff5050', 8, { maxLifeTime: 0.3 });
      } else {
        PL.Particles.shatter(this.x, this.y, PL.CharSprites.pixels(this.classId, PL.CharSprites.poseFor(this.classId, this.animState()), this.facing, 260), opts && opts.fromRight ? -1 : 1, false);
        this.state = 'dead';
        PL.Audio.sfx.death();
      }
    }
    return applied;
  }

  // ---------------- Rendering ----------------
  // Sprite pose: arm/weapon angles (0 = down, +PI/2 = forward, PI = up) and leg frame.
  // Animation state for the shared sprite animator (charsprites.poseFor).
  animState() {
    const st = { time: this.animTime, phase: this.runCyclePhase, hurt: this.state === 'hurt' };
    st.move = !this.onGround ? (this.vy < 0 ? 'jump' : 'fall') : this.state === 'dodge' ? 'crouch' : Math.abs(this.vx) > 5 ? 'run' : 'idle';
    const a = this.action;
    if (!a && this.guardTimer > 0) st.attack = { style: 'guard', stage: 'active', u: 1 };
    if (!a && this.chargeTimer > 0) st.attack = { style: 'bash', stage: 'active', u: 0.5 };
    if (a) {
      const styles = PLAYER_ATTACK_ANIM[this.classId];
      const key = a.type === 'ability' ? a.slot : a.type === 'heavy' ? 'heavy' : 'light';
      const st0 = styles[key];
      const style = Array.isArray(st0) ? st0[a.idx % st0.length] : st0;
      let stage, u;
      if (a.phase === 'startup' || a.phase === 'telegraph') { stage = 'windup'; u = a.t / Math.max(0.001, a.phase === 'telegraph' ? a.telegraphDur : a.startup); }
      else if (a.phase === 'active') { stage = 'active'; u = a.t / Math.max(0.001, a.active); }
      else { stage = 'recover'; u = a.t / Math.max(0.001, a.recovery); }
      st.attack = Object.assign({ stage, u }, style);
    }
    return st;
  }

  render(ctx, camX) {
    const cx = this.x - camX;
    const groundY = this.y;
    if (this.state === 'dead') {
      const drop = Math.max(0, 0.3 - this.deadTimer) * 300;
      const img = PL.Tiles.tombstone();
      ctx.drawImage(img, Math.round(cx - img.width / 2), Math.round(groundY - img.height - drop));
      return;
    }
    const pose = PL.CharSprites.poseFor(this.classId, this.animState());
    PL.CharSprites.drawShadow(ctx, cx, groundY, this.w + 6);
    const blink = this.invulnTimer > 0 && this.state !== 'dodge' && Math.floor(this.invulnTimer * 20) % 2;
    if (this.state === 'dodge') {
      ctx.globalAlpha = 0.35;
      PL.CharSprites.draw(ctx, this.classId, cx - this.facing * 8, groundY, this.facing, pose, false);
      ctx.globalAlpha = 1;
    }
    const pactFlash = this.empowerTimer > 0 && Math.floor(this.animTime * 6) % 3 === 0 ? '#b06aff' : false;
    if (!blink) PL.CharSprites.draw(ctx, this.classId, cx, groundY, this.facing, pose, this.hitFlash > 0 || pactFlash);
    if (this.empowerTimer > 0) PL.Lighting.add(this.x, this.y - this.h * 0.5, 50, 0.35, false, '#b06aff');
    if (this.guardTimer > 0) PL.Lighting.add(this.x + this.facing * 8, this.y - this.h * 0.5, 40, 0.3, false, '#8ab0ff');
    PL.Rig.drawNameTag(ctx, cx, groundY, PL.CharSprites.height(this.classId) + 3, this.classDef.name, this.classDef.palette.accent);
    this.renderTelegraph(ctx, camX, groundY);
  }

  renderZones(ctx, camX) {
    for (const z of this.zones) {
      if (!z.sanctuary) continue;
      const gy = PL.World.groundY, x0 = Math.round(z.x - z.radius / 2 - camX), w = Math.round(z.radius);
      const fade = Math.min(1, z.ticksLeft / 3);
      const pulse = 0.85 + Math.sin(this.animTime * 6) * 0.15;
      // glowing rune band on the floor
      ctx.globalAlpha = 0.8 * fade;
      ctx.fillStyle = '#ffd860'; ctx.fillRect(x0, gy - 1, w, 3);
      ctx.fillStyle = '#fff8d8'; ctx.fillRect(x0 + 3, gy - 2, w - 6, 1);
      ctx.fillStyle = '#ffffff';
      for (let x = x0 + 4 + Math.floor(this.animTime * 20) % 8; x < x0 + w - 3; x += 8) ctx.fillRect(x, gy, 2, 1);
      // soft column of light rising from the circle
      for (let h = 0; h < 70; h++) {
        ctx.globalAlpha = 0.14 * fade * pulse * (1 - h / 70);
        ctx.fillStyle = '#ffe070'; ctx.fillRect(x0 + 2, gy - 2 - h, w - 4, 1);
      }
      // bright edge pillars
      ctx.fillStyle = '#fff4c0';
      for (let h = 0; h < 56; h += 2) { ctx.globalAlpha = 0.7 * fade * (1 - h / 56); ctx.fillRect(x0, gy - h, 2, 1); ctx.fillRect(x0 + w - 2, gy - h, 2, 1); }
      ctx.globalAlpha = 1;
      PL.Lighting.add(z.x, gy - 20, z.radius * 0.9, 0.7 * fade, true, '#ffe070');
    }
  }

  renderTelegraph(ctx, camX, groundY) {
    this.renderZones(ctx, camX);
    if (this.action && this.action.type === 'ability' && this.action.phase === 'telegraph') {
      const prev = this.action.preview;
      PL.Pixel.marker(ctx, prev.x - camX, groundY - 1, Math.max(10, prev.radius / 2), '#ff9a3a', this.action.t);
    }
  }

  abilityReadyFrac(slot) {
    const def = this.classDef.abilities.find(ab => ab.key === slot);
    if (!def) return 1;
    const mods = this.computed.abilityMods[slot];
    const total = def.cooldown * mods.cdMult;
    return total > 0 ? PL.U.clamp(this.cooldowns[slot] / total, 0, 1) : 0;
  }
};

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
  archer: { light: [{ style: 'shoot' }], heavy: { style: 'shoot' }, q: { style: 'shootUp' }, e: { style: 'shoot' } }
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

    this.updateAction(dt);
    this.updateZones(dt);
    this.applyPhysics(dt, PL.World);
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

  hitAllIn(hb, mult, slot, opts) {
    let any = false;
    for (const e of this._enemies) {
      if (!e.alive) continue;
      if (PL.U.aabbOverlap(hb, e.rect())) {
        const { dmg, isCrit } = this.computeDamage(mult, slot);
        const final = PL.U.mitigate(dmg, e.def || 0);
        e.takeDamage(final, opts);
        this.totalDamageDealt += final;
        PL.Particles.hitNumber(e.x, e.y - e.h - 6, final, isCrit);
        any = true;
      }
    }
    return any;
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
        damage: dmg, isCrit, knockback: kb, facing: this.facing
      });
      (this.classDef.weaponKind === 'bow' ? PL.Audio.sfx.bow : PL.Audio.sfx.magicCast)();
      this.registerCombo();
      return;
    }
    const hb = this.meleeHitbox(def.range);
    const any = this.hitAllIn(hb, mult, slot, { knockback: kb, knockUp: isLight ? -120 : -240, fromRight });
    if (any) { (isLight ? PL.Audio.sfx.hit : PL.Audio.sfx.hitHeavy)(); this.registerCombo(); }
    else (isLight ? PL.Audio.sfx.swingLight : PL.Audio.sfx.swingHeavy)();
    PL.Particles.spawnSlash(this.x + this.facing * 3, this.y - this.h * 0.62, this.facing, isLight ? '#c8d4e4' : '#ffb13b', isLight ? 20 : 25);
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
        this.hitAllIn(hb, z.mult, null, { knockback: 50, knockUp: -70, fromRight: this.facing < 0 });
        PL.Particles.spawnBurst(z.x, this.y - 30, z.color, 7, 130);
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
    const applied = super.takeDamage(amount, opts);
    if (applied) {
      this.totalDamageTaken += amount;
      if (this.alive) {
        this.state = 'hurt'; this.hurtTimer = 0.26; this.action = null; this.queuedAction = null; this.comboIndex = 0;
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
    if (!blink) PL.CharSprites.draw(ctx, this.classId, cx, groundY, this.facing, pose, this.hitFlash > 0);
    PL.Rig.drawNameTag(ctx, cx, groundY, PL.CharSprites.height(this.classId) + 3, this.classDef.name, this.classDef.palette.accent);
    this.renderTelegraph(ctx, camX, groundY);
  }

  renderTelegraph(ctx, camX, groundY) {
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

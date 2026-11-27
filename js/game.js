// Main game orchestration singleton: owns player/enemies/mode, runs the update+render loop.
window.PL = window.PL || {};

PL.Game = (function () {
  let canvas, ctx;
  let player = null, enemies = [], mode = null, profile = null, classId = null;
  let running = false, paused = false;
  let sessionStats = { kills: 0, xp: 0 };
  let clearTriggered = false, defeatHandled = false;
  let ending = null; // slow-motion beat between the final blow and the result screen

  function init(c) {
    canvas = c;
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
  }

  function startRun(cId, modeInstance) {
    classId = cId;
    profile = PL.Save.getClassProfile(cId);
    player = new PL.Player(cId, profile);
    mode = modeInstance;
    enemies = [];
    sessionStats = { kills: 0, xp: 0 };
    clearTriggered = false; defeatHandled = false; ending = null;
    PL.Particles.clear(); PL.Projectiles.clear(); PL.Hazards.clear(); PL.Pickups.clear();
    mode.init(exposed);
    player.y = PL.World.groundY;
    PL.World.camera.x = Math.max(0, player.x - PL.VIEW_W / 2);
    running = true; paused = false;
    PL.UI.showScreen(null);
    PL.UI.showHud(true);
    PL.Audio.startMusic();
    PL.Audio.setMusicIntensity(1);
  }

  function spawnPlayerAt(x) {
    player.x = x; player.y = PL.World.groundY;
    player.hp = player.maxHp; player.energy = player.energyMax;
    player.vx = 0; player.vy = 0; player.alive = true; player.state = 'idle';
    player.action = null; player.queuedAction = null;
  }
  function repositionPlayer(x) {
    player.x = x; player.y = PL.World.groundY;
    player.vx = 0; player.vy = 0; player.action = null; player.queuedAction = null;
    if (player.state === 'hurt') player.state = 'idle';
  }
  function setEnemyFocus(e) { exposed.focusEnemy = e; }

  function healPlayer(frac) {
    player.hp = Math.min(player.maxHp, player.hp + player.maxHp * frac);
    player.energy = Math.min(player.energyMax, player.energy + player.energyMax * 0.3);
  }

  function announceBoss(name) {
    PL.UI.showToast(name.toUpperCase());
    PL.Audio.sfx.bossRoar();
    PL.Audio.setMusicIntensity(2);
  }
  function toast(text) { PL.UI.showToast(text); }

  function pause() { paused = true; PL.Audio.stopMusic(); }
  function resume() { paused = false; PL.Audio.startMusic(); }
  function stop() {
    running = false; paused = false;
    PL.Audio.stopMusic();
  }

  function finishRun(victory, info) {
    running = false;
    PL.Audio.stopMusic();
    const bonusMult = info.bonusMult || 1;
    const partial = victory ? 1 : 0.5;
    const xpGained = Math.round(sessionStats.xp * bonusMult * partial);
    const levelResult = PL.Progression.applyXP(profile, xpGained);
    profile.stats.kills += sessionStats.kills;
    profile.stats.damageDealt += player.totalDamageDealt;
    profile.stats.damageTaken += player.totalDamageTaken;
    if (!victory) profile.stats.deaths++;
    PL.Save.setClassProfile(classId, profile);

    const g = PL.Save.getGlobal();
    g.totals.kills += sessionStats.kills;
    g.totals.runs++;
    if (!victory) g.totals.deaths++;
    PL.Save.setGlobal(g);

    const resultInfo = {
      label: info.label, xpGained, levelsGained: levelResult.levelsGained,
      kills: sessionStats.kills, damageDealt: player.totalDamageDealt
    };
    if (levelResult.leveledUp) setTimeout(() => PL.UI.showLevelUp(levelResult.newLevel), 300);
    if (victory) PL.UI.showVictory(resultInfo); else PL.UI.showDefeat(resultInfo);
  }

  function finishVictory(info) { if (!ending) ending = { victory: true, info, t: 1.4 }; }
  function finishDefeat(info) { if (!ending) ending = { victory: false, info, t: 1.6 }; }

  function update(dt) {
    if (!running || paused || !player) return;
    dt = Math.min(dt, 0.033);
    const realDt = dt;
    if (ending) dt *= 0.35;

    player.update(dt, enemies);
    for (const e of enemies) e.update(dt, player, enemies);
    PL.Projectiles.update(dt, player, enemies);
    PL.Hazards.update(dt, player);
    PL.Pickups.update(dt, player);
    PL.Particles.update(dt);
    PL.World.camera.update(dt, player.x);

    for (const e of enemies) {
      if (!e.alive && !e._counted) {
        e._counted = true;
        sessionStats.kills++;
        sessionStats.xp += e.xp;
        if (!ending) PL.Pickups.drop(e, player);
        if (e.isBoss) PL.Audio.setMusicIntensity(1);
        mode.onEnemyDefeated(e, exposed);
      }
    }
    enemies = enemies.filter(e => e.alive || e.deadTimer < 1.4);

    const anyAlive = enemies.some(e => e.alive);
    if (anyAlive) clearTriggered = false;
    else if (enemies.length > 0 && !clearTriggered) {
      clearTriggered = true;
      mode.onAllEnemiesCleared(exposed);
    }

    if (!player.alive && !defeatHandled) {
      defeatHandled = true;
      mode.onPlayerDefeated(exposed);
    }

    if (mode.onUpdate) mode.onUpdate(dt, exposed);

    if (ending) {
      ending.t -= realDt;
      if (ending.t <= 0) { const e = ending; ending = null; finishRun(e.victory, e.info); }
    }

    if (running) PL.UI.updateHUD(exposed);
  }

  function render(dt) {
    if (!canvas) return;
    ctx.imageSmoothingEnabled = false;
    // One integer camera position per frame keeps every layer on the same pixel grid.
    const camX = Math.round(PL.World.camera.offsetX());
    const offY = PL.World.offsetY();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, PL.VIEW_W, PL.VIEW_H);
    PL.Lighting.begin();
    ctx.save();
    ctx.translate(0, offY);
    PL.World.renderScene(ctx, camX, dt);
    PL.Hazards.render(ctx, camX);
    if (player) {
      for (const e of enemies) e.render(ctx, camX);
      player.render(ctx, camX);
      if (player.alive) PL.Lighting.add(player.x, player.y - 18, 72, 0.32, false);
    }
    PL.Projectiles.render(ctx, camX);
    PL.Pickups.render(ctx, camX);
    ctx.restore();
    PL.Lighting.render(ctx, camX, offY, PL.World.ambient());
    ctx.save();
    ctx.translate(0, offY);
    PL.World.renderAmbientFx(ctx, camX, dt);
    PL.Particles.render(ctx, camX);
    ctx.restore();
    PL.World.renderVignette(ctx);
  }

  const exposed = {
    get player() { return player; },
    get enemies() { return enemies; },
    set enemies(v) { enemies = v; },
    get mode() { return mode; },
    get world() { return PL.World; },
    focusEnemy: null,
    spawnPlayerAt, repositionPlayer, setEnemyFocus, healPlayer, announceBoss, toast,
    finishVictory, finishDefeat
  };

  return {
    init, startRun, update, render, pause, resume, stop,
    get player() { return player; },
    get enemies() { return enemies; },
    get running() { return running; },
    get paused() { return paused; }
  };
})();

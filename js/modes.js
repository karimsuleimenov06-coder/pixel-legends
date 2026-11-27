// Game mode managers: Single Battle, Boss Rush, Survival, Tournament, Duel.
window.PL = window.PL || {};

class SequentialMode {
  constructor() { this.waiting = false; this.pendingTimer = 0; }
  onUpdate(dt, game) {
    if (this.waiting) {
      this.pendingTimer -= dt;
      if (this.pendingTimer <= 0) { this.waiting = false; this.spawnNext(game); }
    }
  }
  scheduleNext(game, delay) { this.waiting = true; this.pendingTimer = delay; }
}

PL.Modes = {};

PL.Modes.SingleBattle = class SingleBattle {
  constructor(def, isElite) { this.def = def; this.isElite = isElite; this.bonusMult = 1.0; }
  init(game) {
    game.world.setArena('arena', 820);
    game.enemies = [PL.createEnemy(this.def, 600)];
    game.spawnPlayerAt(200);
    game.setEnemyFocus(game.enemies[0]);
  }
  onUpdate() {}
  onEnemyDefeated() {}
  onAllEnemiesCleared(game) {
    const g = PL.Save.getGlobal();
    g.modeProgress.singleBattlesWon++;
    PL.Save.setGlobal(g);
    game.finishVictory({ label: this.isElite ? 'Элитный враг побеждён!' : 'Враг побеждён!', bonusMult: this.bonusMult });
  }
  onPlayerDefeated(game) { game.finishDefeat({ label: 'Вы потерпели поражение' }); }
  getHudInfo() { return `Одиночная битва: ${this.def.name}`; }
};

PL.Modes.Duel = class Duel {
  constructor(def) { this.def = def; }
  init(game) {
    game.world.setArena('arena', 700);
    game.enemies = [PL.createEnemy(this.def, 520)];
    game.spawnPlayerAt(180);
    game.setEnemyFocus(game.enemies[0]);
  }
  onUpdate() {}
  onEnemyDefeated() {}
  onAllEnemiesCleared(game) {
    const g = PL.Save.getGlobal();
    g.modeProgress.duelsWon++;
    PL.Save.setGlobal(g);
    game.finishVictory({ label: `Дуэль выиграна: ${this.def.name}`, bonusMult: 1.15 });
  }
  onPlayerDefeated(game) { game.finishDefeat({ label: 'Дуэль проиграна' }); }
  getHudInfo() { return `Дуэль: ${this.def.name}`; }
};

PL.Modes.BossRush = class BossRush extends SequentialMode {
  constructor() { super(); this.index = 0; this.cleared = 0; }
  init(game) { this.spawnNext(game, true); }
  spawnNext(game, first) {
    const def = PL.BOSS_DEFS[this.index];
    game.world.setArena(def.arena, 1000);
    game.enemies = [PL.createBoss(def, 720)];
    if (first) game.spawnPlayerAt(180); else game.repositionPlayer(180);
    game.setEnemyFocus(game.enemies[0]);
    game.announceBoss(def.name);
  }
  onEnemyDefeated() {}
  onAllEnemiesCleared(game) {
    this.cleared++;
    this.index++;
    const g = PL.Save.getGlobal();
    g.modeProgress.bossRushBestCleared = Math.max(g.modeProgress.bossRushBestCleared, this.cleared);
    if (!g.modeProgress.bossesDefeated.includes(PL.BOSS_DEFS[this.index - 1].id)) g.modeProgress.bossesDefeated.push(PL.BOSS_DEFS[this.index - 1].id);
    PL.Save.setGlobal(g);
    if (this.index >= PL.BOSS_DEFS.length) {
      game.finishVictory({ label: 'Все боссы повержены! Легенда создана.', bonusMult: 2.2 });
    } else {
      game.healPlayer(0.45);
      game.toast('Босс побеждён!');
      this.scheduleNext(game, 2.4);
    }
  }
  onPlayerDefeated(game) { game.finishDefeat({ label: `Повержено боссов: ${this.cleared}/${PL.BOSS_DEFS.length}` }); }
  getHudInfo() { return this.waiting ? `Следующий босс через ${Math.ceil(this.pendingTimer)}с` : `Босс-раш: ${this.index + 1}/${PL.BOSS_DEFS.length}`; }
};

PL.Modes.Tournament = class Tournament extends SequentialMode {
  constructor() {
    super();
    this.round = 0;
    this.plan = [
      { pool: 'normal', mult: { hp: 1, dmg: 1 } },
      { pool: 'normal', mult: { hp: 1.25, dmg: 1.15 } },
      { pool: 'elite', mult: { hp: 1, dmg: 1 } },
      { pool: 'duo', mult: { hp: 1.1, dmg: 1.1 } },
      { pool: 'elite', mult: { hp: 1.35, dmg: 1.3 } },
      { pool: 'boss', mult: { hp: 0.85, dmg: 0.9 } }
    ];
  }
  init(game) { this.spawnNext(game, true); }
  spawnNext(game, first) {
    const plan = this.plan[this.round];
    game.world.setArena('arena', 1000);
    if (first) game.spawnPlayerAt(180); else game.repositionPlayer(180);
    if (plan.pool === 'boss') {
      const def = PL.U.choose(PL.BOSS_DEFS);
      game.enemies = [PL.createBoss(def, 720, plan.mult)];
      game.announceBoss(def.name);
    } else if (plan.pool === 'duo') {
      const d1 = PL.U.choose(PL.ENEMY_DEFS), d2 = PL.U.choose(PL.ENEMY_DEFS);
      game.enemies = [PL.createEnemy(d1, 480, plan.mult), PL.createEnemy(d2, 720, plan.mult)];
    } else {
      const pool = plan.pool === 'elite' ? PL.ELITE_DEFS : PL.ENEMY_DEFS;
      const def = PL.U.choose(pool);
      game.enemies = [PL.createEnemy(def, 600, plan.mult)];
    }
    game.setEnemyFocus(game.enemies[0]);
    game.toast(`Раунд ${this.round + 1}`);
  }
  onEnemyDefeated() {}
  onAllEnemiesCleared(game) {
    this.round++;
    const g = PL.Save.getGlobal();
    g.modeProgress.tournamentBestRound = Math.max(g.modeProgress.tournamentBestRound, this.round);
    PL.Save.setGlobal(g);
    if (this.round >= this.plan.length) {
      game.finishVictory({ label: 'Чемпион турнира!', bonusMult: 1.8 });
    } else {
      game.healPlayer(0.25);
      this.scheduleNext(game, 2.2);
    }
  }
  onPlayerDefeated(game) { game.finishDefeat({ label: `Раунд ${this.round + 1}/${this.plan.length}` }); }
  getHudInfo() { return this.waiting ? `Следующий раунд через ${Math.ceil(this.pendingTimer)}с` : `Турнир: раунд ${this.round + 1}/${this.plan.length}`; }
};

PL.Modes.Survival = class Survival extends SequentialMode {
  constructor() { super(); this.wave = 0; }
  init(game) { game.world.setArena('survival', 1300); game.spawnPlayerAt(220); this.spawnNext(game); }
  spawnNext(game) {
    this.wave++;
    const n = Math.min(2 + Math.floor(this.wave / 2), 9);
    const mult = { hp: 1 + this.wave * 0.09, dmg: 1 + this.wave * 0.06 };
    const useElite = this.wave % 5 === 0;
    const pool = useElite ? PL.ELITE_DEFS : PL.ENEMY_DEFS;
    game.enemies = [];
    for (let i = 0; i < n; i++) {
      const def = PL.U.choose(pool);
      const x = PL.U.rand(260, game.world.width - 80);
      game.enemies.push(PL.createEnemy(def, x, mult));
    }
    game.setEnemyFocus(null);
    game.toast(`Волна ${this.wave}`);
  }
  onEnemyDefeated() {}
  onAllEnemiesCleared(game) {
    game.healPlayer(0.12);
    this.scheduleNext(game, 2.6);
  }
  onPlayerDefeated(game) {
    const g = PL.Save.getGlobal();
    g.modeProgress.survivalBestWave = Math.max(g.modeProgress.survivalBestWave, this.wave);
    PL.Save.setGlobal(g);
    game.finishDefeat({ label: `Волн пройдено: ${this.wave - (this.waiting ? 0 : 0)}`, wave: this.wave });
  }
  getHudInfo() { return this.waiting ? `Волна ${this.wave + 1} через ${Math.ceil(this.pendingTimer)}с` : `Волна ${this.wave}`; }
};

// All DOM-driven screens: menu, class/mode select, skill tree, stats, HUD, pause/victory/defeat.
window.PL = window.PL || {};

PL.UI = (function () {
  const el = (id) => document.getElementById(id);
  const state = { selectedClassId: null, submodeContext: null, lastModeFactory: null };

  function spriteArt(id) {
    const c = PL.CharSprites.portrait(id);
    c.className = 'sprite';
    return c;
  }

  // ---------------- Pixel icons ----------------
  const ICON_PAL = {
    O: '#ff8a2a', Y: '#ffd04a', W: '#ffffff', G: '#6a5a48', g: '#4a3e30', R: '#e8302a', C: '#6ad9ff',
    P: '#b04aff', I: '#a8723e', H: '#ffb0a0', B: '#3a8ae8', b: '#c8ecff', M: '#9aa4b2', h: '#8a5a30', w: '#e8e4d8', L: '#6aff8a', d: '#2a2030'
  };
  const ICONS = {
    heart: ['.RR...RR.', 'RHRR.RRRR', 'RHRRRRRRR', 'RRRRRRRRR', '.RRRRRRR.', '..RRRRR..', '...RRR...', '....R....'],
    star: ['....B....', '...BBB...', 'BBBBbBBBB', '.BBBBBBB.', '..BBBBB..', '.BBB.BBB.', 'BB.....BB'],
    shockwave: ['............', '.....OO.....', '...OO..OO...', '..O..YY..O..', '.O..Y..Y..O.', '.O.Y.WW.Y.O.', '.O.Y.WW.Y.O.', '.O..Y..Y..O.', '..O..YY..O..', '...OO..OO...', '.....OO.....', '............'],
    leapSlam: ['.....WW.....', '.....WW.....', '.....WW.....', '...WWWWWW...', '....WWWW....', '.....WW.....', '............', '.O..O..O..O.', '..OYOYYOYO..', '.OYYYYYYYYO.', 'GGGGGGGGGGGG', 'gggggggggggg'],
    fireStorm: ['.....R......', '....RR..R...', '...RRR.RR...', '...RORRRR...', '..RROORRRR..', '..ROOYYORR..', '.RROYYYYORR.', '.ROYYWWYYOR.', '.ROYWWWWYOR.', '.RROYWWYORR.', '..RRROORRR..', '....RRRR....'],
    arcaneNova: ['.....C......', '.....C......', '.C...C...C..', '..C..C..C...', '...CCWCC....', 'CCCCWWWCCCC.', '...CCWCC....', '..C..C..C...', '.C...C...C..', '.....C......', '.....C......', '............'],
    shadowDash: ['............', '.......PP...', '.......PPP..', 'PP.PPPPPPPP.', '...PPPPPPPPP', 'PP.PPPPPPPP.', '.......PPP..', '.......PP...', '............', '.P.P........', '............', '............'],
    bloodWhirl: ['....RRRR....', '..RR....RR..', '.R..RRRR..R.', '.R.R....R.R.', 'R.R..WW..R.R', 'R.R.W..W.R.R', 'R.R.W..W.R.R', 'R.R..WW..R.R', '.R.R....R.R.', '.R..RRRR..R.', '..RR....RR..', '....RRRR....'],
    arrowRain: ['.W...W...W..', '.W...W...W..', '.I...I...I..', '.I...I...I..', '.I...I...I..', '.I...I...I..', '.I...I...I..', 'WWW.WWW.WWW.', '.W...W...W..', '............', 'GGGGGGGGGGGG', 'gggggggggggg'],
    atkSword: ['..........WW', '.........WMW', '........WMW.', '.......WMW..', '......WMW...', '.....WMW....', '.G..WMW.....', '..GWMW......', '...GW.......', '..hhG.......', '.hh..G......', 'hh..........'],
    atkStaff: ['.........CC.', '........CWWC', '........CWWC', '.........CC.', '........h...', '.......h....', '......h.....', '.....h......', '....h.......', '...h........', '..h.........', '.h..........'],
    atkDagger: ['............', '............', '........WW..', '.......WMW..', '......WMW...', '.....WMW....', '...GWMW.....', '....GW......', '...hhG......', '..hh........', '............', '............'],
    atkBow: ['...hh.......', '..h..w......', '.h....w.....', '.h.....w....', 'h......w....', 'h...IIIIIIWW', 'h......w....', '.h.....w....', '.h....w.....', '..h..w......', '...hh.......', '............'],
    heavy: ['.....WW.....', '.....MW.....', '.....MW.....', '.....MW.....', '.....MW.....', '...GGGGGG...', '.....hh.....', '.....hh.....', '............', '.Y.O.YY.O.Y.', '..OYOYYOYO..', 'GGGGGGGGGGGG'],
    jump: ['.....WW.....', '....WWWW....', '...WWWWWW...', '..WWWWWWWW..', '.WWWWWWWWWW.', '....WWWW....', '....WWWW....', '....WWWW....', '....WWWW....', '............', '.GGGGGGGGGG.', '.gggggggggg.'],
    dodge: ['............', '.......W....', '.......WW...', 'C.CC.WWWWW..', '.....WWWWWW.', 'C.CC.WWWWW..', '.......WW...', '.......W....', '............', '..C.C.CC....', '............', '............'],
    darkPact: ['....PPPP....', '..PP....PP..', '.P..P..P..P.', '.P...PP...P.', 'P..P.WW.P..P', 'P...WLLW...P', 'P...WLLW...P', 'P..P.WW.P..P', '.P...PP...P.', '.P..P..P..P.', '..PP....PP..', '....PPPP....'],
    raiseKnight: ['....MMMM....', '...MMMMMM...', '...MLMMLM...', '...MMMMMM...', '....MMMM....', '..MMMMMMMM..', '.MM.MMMM.MM.', '....MMMM....', '....M..M....', '.L.LM.LM.L..', 'LLLLLLLLLLLL', 'gggggggggggg'],
    atkSkull: ['........wwww', '.......wwwww', '.......wLwLw', '.......wwwww', '........wdw.', '.......h....', '......h.....', '.....h......', '....h.......', '...h........', '..h.........', '.h..........'],
    healingLight: ['.....Y......', '.....Y......', '..Y..Y..Y...', '...YYWYY....', '..YYWWWYY...', 'YYYWWWWWYYY.', '..YYWWWYY...', '...YYWYY....', '..Y..Y..Y...', '.....Y......', '.....Y......', '............'],
    sanctuary: ['............', '..Y......Y..', '..Y......Y..', '..Y..WW..Y..', '..Y.WWWW.Y..', '..Y..WW..Y..', '..Y..WW..Y..', '..Y..WW..Y..', '..Y......Y..', 'YYYYYYYYYYYY', 'GGGGGGGGGGGG', 'gggggggggggg'],
    shieldWall: ['..MMMMMMMM..', '.MBBBBBBBBM.', '.MbBBYYBBBM.', '.MBBYYYYBBM.', '.MBBBYYBBBM.', '.MBBBYYBBBM.', '..MBBBBBBM..', '..MBBBBBBM..', '...MBBBBM...', '....MBBM....', '.....MM.....', '............'],
    shieldCharge: ['............', '.....MMMM...', '....MBBBBM..', 'C.C.MBYYBM..', '....MBYYBM..', 'CC.CMBBBBM..', '....MBYYBM..', 'C.C.MBBBBM..', '.....MBBM...', '......MM....', '............', '............'],
    atkHoly: ['.........YY.', '........YWWY', '........YWWY', '.........YY.', '........w...', '.......w....', '......w.....', '.....w......', '....w.......', '...w........', '..w.........', '.w..........'],
    aimedShot: ['.....RR.....', '.....RR.....', '...RRRRRR...', '..R..RR..R..', '.R...RR...R.', 'RRRRRWWRRRRR', 'RRRRRWWRRRRR', '.R...RR...R.', '..R..RR..R..', '...RRRRRR...', '.....RR.....', '.....RR.....']
  };
  function icon(name) {
    const rows = ICONS[name];
    const b = new PL.Pixel.Buf(rows[0].length + 2, rows.length + 2);
    b.grid(rows, ICON_PAL, 1, 1);
    b.outline(-0.75);
    const c = b.toCanvas();
    c.className = 'icon';
    return c;
  }

  let hudClass = null;
  function setupHudForClass(classId) {
    if (hudClass === classId) return;
    hudClass = classId;
    const port = el('hud-portrait');
    port.innerHTML = '';
    const full = PL.CharSprites.portrait(classId);
    const head = document.createElement('canvas');
    head.width = 22; head.height = 22; head.className = 'sprite';
    head.getContext('2d').drawImage(full, Math.round(full.width / 2 - 11), 0, 22, 22, 0, 0, 22, 22);
    port.appendChild(head);
    for (const ab of PL.CLASSES[classId].abilities) {
      const slot = el('ability-slot-' + ab.key);
      slot.querySelectorAll('.icon').forEach(n => n.remove());
      slot.insertBefore(icon(ab.id), slot.firstChild);
      slot.title = ab.name;
      setTouchIcon(ab.key, ab.id);
    }
    const ATTACK_ICON = { greatsword: 'atkSword', staff: 'atkStaff', dagger: 'atkDagger', bow: 'atkBow', skullStaff: 'atkSkull', holyStaff: 'atkHoly' };
    setTouchIcon('light', ATTACK_ICON[PL.CLASSES[classId].weaponKind] || 'atkSword');
    setTouchIcon('heavy', 'heavy');
    setTouchIcon('jump', 'jump');
    setTouchIcon('dodge', 'dodge');
  }

  function touchBtn(name) { return document.querySelector(`.tbtn[data-btn="${name}"]`); }
  function setTouchIcon(name, iconName) {
    const b = touchBtn(name);
    b.querySelectorAll('.icon').forEach(n => n.remove());
    b.insertBefore(icon(iconName), b.firstChild);
  }

  const MODE_DEFS = [
    { id: 'single', art: 'orc_brute', title: 'Одиночные битвы', desc: 'Сразись с одним сильным противником — обычным или элитным.' },
    { id: 'bossrush', art: 'bone_king', title: 'Босс-раш', desc: 'Пройди всех пятерых боссов подряд без возврата в меню.' },
    { id: 'survival', art: 'shadow_wolf', title: 'Выживание', desc: 'Бесконечные волны врагов. Как долго ты продержишься?' },
    { id: 'tournament', art: 'rival_captain', title: 'Турнир', desc: '6 раундов нарастающей сложности: враги, элиты и финальный босс.' },
    { id: 'duel', art: 'rival_blade', title: 'Дуэли', desc: 'Честный бой один на один против именитого соперника.' }
  ];

  function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    if (name) el('screen-' + name).classList.remove('hidden');
  }

  function showHud(show) {
    el('hud').classList.toggle('hidden', !show);
    el('mobile-controls').classList.toggle('hidden', !show);
    if (show) PL.Input.layoutTouch();
  }

  // ---------------- Class select ----------------
  function buildClassCards() {
    const wrap = el('class-cards');
    wrap.innerHTML = '';
    for (const id of PL.CLASS_LIST) {
      const cls = PL.CLASSES[id];
      const card = document.createElement('div');
      card.className = 'class-card';
      card.dataset.classId = id;
      card.innerHTML = `
        <div class="class-icon"></div>
        <div class="class-name">${cls.name}</div>
        <div class="class-desc">${cls.desc}</div>
        <div class="class-stats-mini">
          <span>HP ${cls.base.hp}</span><span>СИЛ ${cls.base.str}</span>
          <span>ЗАЩ ${cls.base.def}</span><span>СКОР ${cls.base.spd}</span><span>КРИТ ${cls.base.crit}%</span>
        </div>`;
      card.querySelector('.class-icon').appendChild(spriteArt(id));
      card.addEventListener('click', () => {
        wrap.querySelectorAll('.class-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        state.selectedClassId = id;
        el('btn-confirm-class').disabled = false;
        PL.Audio.sfx.uiClick();
      });
      wrap.appendChild(card);
    }
    const last = PL.Save.getLastClass();
    if (last) {
      const c = wrap.querySelector(`[data-class-id="${last}"]`);
      if (c) c.click();
    }
  }

  // ---------------- Mode select ----------------
  function buildModeCards() {
    const wrap = el('mode-cards');
    wrap.innerHTML = '';
    const g = PL.Save.getGlobal();
    for (const m of MODE_DEFS) {
      const card = document.createElement('div');
      card.className = 'mode-card';
      let progress = '';
      if (m.id === 'survival') progress = `Лучшая волна: ${g.modeProgress.survivalBestWave}`;
      else if (m.id === 'tournament') progress = `Лучший раунд: ${g.modeProgress.tournamentBestRound}/6`;
      else if (m.id === 'bossrush') progress = `Боссов пройдено подряд: ${g.modeProgress.bossRushBestCleared}/5`;
      else if (m.id === 'duel') progress = `Побед в дуэлях: ${g.modeProgress.duelsWon}`;
      else if (m.id === 'single') progress = `Побед: ${g.modeProgress.singleBattlesWon}`;
      card.innerHTML = `<div class="mode-art"></div><div class="mode-title">${m.title}</div><div class="mode-desc">${m.desc}</div><div class="mode-progress">${progress}</div>`;
      card.querySelector('.mode-art').appendChild(spriteArt(m.art));
      card.addEventListener('click', () => { PL.Audio.sfx.uiClick(); selectMode(m.id); });
      wrap.appendChild(card);
    }
  }

  function selectMode(modeId) {
    PL.Save.setLastClass(state.selectedClassId);
    if (modeId === 'single') {
      state.submodeContext = 'single';
      buildSubmodeCards();
      showScreen('submode');
    } else if (modeId === 'duel') {
      state.submodeContext = 'duel';
      buildSubmodeCards();
      showScreen('submode');
    } else if (modeId === 'bossrush') {
      startRun(() => new PL.Modes.BossRush());
    } else if (modeId === 'survival') {
      startRun(() => new PL.Modes.Survival());
    } else if (modeId === 'tournament') {
      startRun(() => new PL.Modes.Tournament());
    }
  }

  function buildSubmodeCards() {
    const wrap = el('submode-cards');
    wrap.innerHTML = '';
    if (state.submodeContext === 'single') {
      el('submode-title').textContent = 'Выбери противника';
      PL.ENEMY_DEFS.forEach(def => addSubmodeCard(wrap, def, 'Обычный враг', () => startRun(() => new PL.Modes.SingleBattle(def, false))));
      PL.ELITE_DEFS.forEach(def => addSubmodeCard(wrap, def, 'Элитный враг', () => startRun(() => new PL.Modes.SingleBattle(def, true)), 'elite'));
    } else if (state.submodeContext === 'duel') {
      el('submode-title').textContent = 'Выбери соперника';
      PL.RIVAL_DEFS.forEach(def => addSubmodeCard(wrap, def, 'Дуэлянт', () => startRun(() => new PL.Modes.Duel(def))));
    }
  }

  function addSubmodeCard(wrap, def, sub, onClick, extraClass) {
    const card = document.createElement('div');
    card.className = 'submode-card' + (extraClass ? ' ' + extraClass : '');
    card.innerHTML = `<div class="sub-art"></div><div class="submode-name">${def.name}</div><div class="submode-sub">${sub}</div>`;
    card.querySelector('.sub-art').appendChild(spriteArt(def.id));
    card.addEventListener('click', () => { PL.Audio.sfx.uiClick(); onClick(); });
    wrap.appendChild(card);
  }

  // ---------------- Fullscreen ----------------
  function isStandalone() {
    return window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches || navigator.standalone === true;
  }
  function fullscreenApi() {
    const d = document.documentElement;
    return d.requestFullscreen || d.webkitRequestFullscreen || null;
  }
  function enterFullscreen() {
    const req = fullscreenApi();
    if (!req || document.fullscreenElement || document.webkitFullscreenElement) return;
    try {
      Promise.resolve(req.call(document.documentElement, { navigationUI: 'hide' }))
        .then(() => { if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape'); })
        .catch(() => { /* refused by the browser or embedding frame */ });
    } catch (e) { /* not allowed here */ }
  }
  function setupFullscreenButton() {
    if (isStandalone() || !fullscreenApi()) el('btn-fullscreen').classList.add('hidden');
    // iPhone Safari has no page fullscreen: a home-screen shortcut is the way to get it.
    if (!isStandalone() && !fullscreenApi() && PL.Input.isTouchDevice()) el('fs-hint').classList.remove('hidden');
  }

  function startRun(modeFactory) {
    state.lastModeFactory = modeFactory;
    PL.Audio.unlock();
    if (PL.Input.isTouchDevice()) enterFullscreen();
    PL.Game.startRun(state.selectedClassId, modeFactory());
  }

  // ---------------- Skill tree / character screen ----------------
  function renderSkillTree() {
    const classId = state.selectedClassId || PL.CLASS_LIST[0];
    const cls = PL.CLASSES[classId];
    const profile = PL.Save.getClassProfile(classId);

    el('st-level').textContent = profile.level;
    const need = PL.Progression.xpToNext(profile.level);
    el('st-xp').textContent = `${profile.xp}/${need}`;
    el('st-xp-bar').style.width = Math.min(100, (profile.xp / need) * 100) + '%';
    el('st-points').textContent = profile.unspentStatPoints;
    el('skill-points').textContent = profile.unspentSkillPoints;

    for (const attr of ['str', 'vit', 'def', 'spd', 'crit']) {
      el('attr-' + attr).textContent = profile.points[attr];
    }
    document.querySelectorAll('[data-attr-add]').forEach(btn => {
      btn.disabled = profile.unspentStatPoints <= 0;
      btn.onclick = () => {
        if (PL.Progression.allocateStat(profile, btn.dataset.attrAdd)) {
          PL.Save.setClassProfile(classId, profile);
          PL.Audio.sfx.uiClick();
          renderSkillTree();
        }
      };
    });

    const grid = el('skill-tree-grid');
    grid.innerHTML = '';
    for (const node of cls.skillTree) {
      const unlocked = profile.skills.includes(node.id);
      const canUnlock = !unlocked && PL.Progression.canUnlockSkill(classId, profile, node.id);
      const div = document.createElement('div');
      div.className = 'skill-node ' + (unlocked ? 'unlocked' : (canUnlock ? 'available' : 'locked'));
      div.innerHTML = `<div class="skill-node-name">${node.name}${unlocked ? ' ✓' : ''}</div><div class="skill-node-desc">${node.desc}</div>`;
      if (canUnlock) {
        div.addEventListener('click', () => {
          if (PL.Progression.unlockSkill(classId, profile, node.id)) {
            PL.Save.setClassProfile(classId, profile);
            PL.Audio.sfx.levelUp();
            renderSkillTree();
          }
        });
      }
      grid.appendChild(div);
    }
  }

  // ---------------- Stats screen ----------------
  function renderStats() {
    const body = el('stats-body');
    body.innerHTML = '';
    const g = PL.Save.getGlobal();
    const rows = [
      ['Побед боссов подряд (рекорд)', `${g.modeProgress.bossRushBestCleared}/5`],
      ['Лучшая волна выживания', g.modeProgress.survivalBestWave],
      ['Лучший раунд турнира', `${g.modeProgress.tournamentBestRound}/6`],
      ['Побед в дуэлях', g.modeProgress.duelsWon],
      ['Побед в одиночных битвах', g.modeProgress.singleBattlesWon],
      ['Боссов повержено (всего видов)', `${g.modeProgress.bossesDefeated.length}/5`]
    ];
    for (const id of PL.CLASS_LIST) {
      const p = PL.Save.getClassProfile(id);
      rows.push([`${PL.CLASSES[id].name}: уровень`, p.level]);
      rows.push([`${PL.CLASSES[id].name}: убийств`, p.stats.kills]);
    }
    for (const [label, val] of rows) {
      const row = document.createElement('div');
      row.className = 'stats-row';
      row.innerHTML = `<span>${label}</span><b>${val}</b>`;
      body.appendChild(row);
    }
  }

  // ---------------- HUD ----------------
  function updateHUD(game) {
    const p = game.player;
    el('hud-level').textContent = `Ур. ${p.level}`;
    const hpPct = Math.max(0, p.hp / p.maxHp) * 100;
    el('hud-hp-fill').style.width = hpPct + '%';
    el('hud-hp-text').textContent = `${Math.ceil(Math.max(0, p.hp))}/${Math.round(p.maxHp)}`;
    el('hud-nrg-fill').style.width = Math.max(0, p.energy / p.energyMax) * 100 + '%';
    setupHudForClass(p.classId);
    el('hud-mode-info').textContent = game.mode.getHudInfo();

    const comboEl = el('combo-counter');
    if (p.comboDisplay.count >= 2) {
      comboEl.classList.remove('hidden');
      comboEl.textContent = `${p.comboDisplay.count}x КОМБО!`;
    } else comboEl.classList.add('hidden');

    for (const slot of ['q', 'e']) {
      const frac = p.abilityReadyFrac(slot);
      el(`ability-slot-${slot}`).querySelector('.cooldown-mask').style.height = (frac * 100) + '%';
      const tb = touchBtn(slot);
      tb.querySelector('.cd').style.height = (frac * 100) + '%';
      const ab = p.classDef.abilities.find(x => x.key === slot);
      tb.classList.toggle('noenergy', p.energy < ab.energyCost);
    }
    touchBtn('dodge').querySelector('.cd').style.height = (PL.U.clamp(p.dodgeCooldown / 0.85, 0, 1) * 100) + '%';

    const boss = game.enemies.find(e => e.isBoss && e.alive);
    const wrap = el('boss-bar-wrap');
    if (boss) {
      wrap.classList.remove('hidden');
      el('boss-name').textContent = boss.name;
      el('boss-hp-fill').style.width = Math.max(0, boss.hp / boss.maxHp) * 100 + '%';
      el('boss-phase').textContent = `Фаза ${boss.phaseIndex + 1}/${boss.phases.length}`;
      updateBossWarning(boss);
    } else {
      wrap.classList.add('hidden');
      el('boss-warning').classList.add('hidden');
    }
  }

  function updateBossWarning(boss) {
    const w = el('boss-warning');
    if (boss.isWarning()) { w.textContent = boss.warningText(); w.classList.remove('hidden'); }
    else w.classList.add('hidden');
  }

  function showToast(text) {
    const t = el('level-up-toast');
    t.textContent = text;
    t.classList.remove('hidden');
    t.style.animation = 'none';
    requestAnimationFrame(() => { t.style.animation = ''; });
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.add('hidden'), 1600);
  }

  function showLevelUp(newLevel) { showToast(`УРОВЕНЬ ${newLevel}!`); PL.Audio.sfx.levelUp(); }

  // ---------------- Result screens ----------------
  function showVictory(info) {
    showHud(false);
    const body = el('victory-body');
    body.innerHTML = `
      <div class="r-row"><span>${info.label}</span></div>
      <div class="r-row"><span>Опыт получен</span><b>+${Math.round(info.xpGained)}</b></div>
      <div class="r-row"><span>Повышений уровня</span><b>${info.levelsGained}</b></div>
      <div class="r-row"><span>Убийств за бой</span><b>${info.kills}</b></div>
      <div class="r-row"><span>Нанесено урона</span><b>${Math.round(info.damageDealt)}</b></div>`;
    showScreen('victory');
  }

  function showDefeat(info) {
    showHud(false);
    const body = el('defeat-body');
    body.innerHTML = `
      <div class="r-row"><span>${info.label}</span></div>
      <div class="r-row"><span>Опыт получен</span><b>+${Math.round(info.xpGained)}</b></div>
      <div class="r-row"><span>Убийств за бой</span><b>${info.kills}</b></div>`;
    showScreen('defeat');
  }

  // ---------------- Confirmation dialog ----------------
  // In-page modal (browser confirm() is blocked in embedded viewers and looks out of place).
  // The dangerous button stays disabled for a moment so a double tap cannot confirm by accident.
  let confirmState = null;
  function openConfirm(opts) {
    const modal = el('confirm-modal'), ok = el('confirm-ok'), cancel = el('confirm-cancel');
    el('confirm-title').textContent = opts.title || 'Вы уверены?';
    el('confirm-text').innerHTML = opts.html || '';
    ok.textContent = opts.okLabel || 'Да';
    cancel.textContent = opts.cancelLabel || 'Отмена';
    ok.disabled = true;
    confirmState = { onConfirm: opts.onConfirm, armTimer: setTimeout(() => { ok.disabled = false; }, opts.armDelay == null ? 700 : opts.armDelay) };
    modal.classList.remove('hidden');
    cancel.focus();
  }
  function closeConfirm(confirmed) {
    if (!confirmState) return;
    const st = confirmState;
    confirmState = null;
    clearTimeout(st.armTimer);
    el('confirm-modal').classList.add('hidden');
    if (confirmed && st.onConfirm) st.onConfirm();
  }
  function setupConfirm() {
    el('confirm-ok').addEventListener('click', () => { if (!el('confirm-ok').disabled) { PL.Audio.sfx.uiClick(); closeConfirm(true); } });
    el('confirm-cancel').addEventListener('click', () => { PL.Audio.sfx.uiClick(); closeConfirm(false); });
    el('confirm-modal').addEventListener('click', (e) => { if (e.target.id === 'confirm-modal') closeConfirm(false); });
    window.addEventListener('keydown', (e) => {
      if (!confirmState) return;
      if (e.key === 'Escape') { e.preventDefault(); closeConfirm(false); }
      e.stopPropagation();
    }, true);
  }

  function progressSummary() {
    const parts = [];
    for (const id of PL.CLASS_LIST) {
      const p = PL.Save.getClassProfile(id);
      if (p && (p.level > 1 || p.xp > 0)) parts.push(`${PL.CLASSES[id].name} — ур. ${p.level}`);
    }
    return parts;
  }

  function confirmWipe() {
    const parts = progressSummary();
    const what = parts.length ? `<br><br>Сейчас сохранено: <b>${parts.join(', ')}</b>.` : '';
    openConfirm({
      title: 'Вы уверены?',
      html: `Будет удалён <b>весь прогресс</b>: уровни, опыт, очки характеристик, навыки и статистика всех классов.${what}<br><br>Отменить это будет нельзя.`,
      okLabel: 'Да, удалить',
      cancelLabel: 'Отмена',
      onConfirm: () => { PL.Save.wipe(); location.reload(); }
    });
  }

  // ---------------- Action delegation ----------------
  function bindActions() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      PL.Audio.unlock();
      switch (action) {
        case 'go-menu': showScreen('menu'); break;
        case 'go-class-select': showScreen('class'); break;
        case 'go-mode-select': buildModeCards(); showScreen('mode'); break;
        case 'go-stats': renderStats(); showScreen('stats'); break;
        case 'fullscreen': enterFullscreen(); break;
        case 'go-skilltree': renderSkillTree(); showScreen('skilltree'); break;
        case 'go-back-from-skilltree': showScreen('mode'); break;
        case 'wipe-save': confirmWipe(); break;
        case 'pause-game': PL.Game.pause(); showScreen('pause'); break;
        case 'resume-game': showScreen(null); showHud(true); PL.Game.resume(); break;
        case 'quit-to-menu': PL.Game.stop(); showHud(false); showScreen('menu'); break;
        case 'victory-continue': showScreen('mode'); buildModeCards(); break;
        case 'retry-run': if (state.lastModeFactory) startRun(state.lastModeFactory); break;
      }
      if (action && action !== 'pause-game') PL.Audio.sfx.uiClick();
    });
  }

  function init() {
    document.querySelector('.hp-bar').insertBefore(icon('heart'), document.querySelector('.hp-bar').firstChild);
    document.querySelector('.nrg-bar').insertBefore(icon('star'), document.querySelector('.nrg-bar').firstChild);
    buildClassCards();
    setupFullscreenButton();
    setupConfirm();
    bindActions();
    PL.Input.initTouch();
  }

  return {
    init, showScreen, showHud, updateHUD, updateBossWarning, showToast, showLevelUp,
    showVictory, showDefeat, renderSkillTree, renderStats, state
  };
})();

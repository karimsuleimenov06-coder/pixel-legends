// LocalStorage persistence: per-class progress (level/xp/stats/skills) + global stats & mode progress.
window.PL = window.PL || {};

PL.Save = (function () {
  const KEY = 'pixelLegendsSave_v1';
  let data = null;

  function defaultProfile() {
    return {
      level: 1, xp: 0,
      points: { str: 0, vit: 0, def: 0, spd: 0, crit: 0 },
      unspentStatPoints: 0, unspentSkillPoints: 0,
      skills: [],
      stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 }
    };
  }

  function defaultData() {
    const classes = {};
    for (const id of PL.CLASS_LIST) classes[id] = defaultProfile();
    return {
      version: 1,
      lastClass: null,
      classes,
      global: {
        modeProgress: {
          survivalBestWave: 0,
          tournamentBestRound: 0,
          bossRushBestCleared: 0,
          duelsWon: 0,
          singleBattlesWon: 0,
          bossesDefeated: []
        },
        totals: { kills: 0, bossKills: 0, deaths: 0, runs: 0 }
      }
    };
  }

  function load() {
    if (data) return data;
    try {
      const raw = localStorage.getItem(KEY);
      data = raw ? JSON.parse(raw) : defaultData();
      data = PL.U.mergeDefaults(data, defaultData());
      for (const id of PL.CLASS_LIST) {
        data.classes[id] = PL.U.mergeDefaults(data.classes[id] || {}, defaultProfile());
      }
    } catch (e) {
      data = defaultData();
    }
    return data;
  }

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* storage unavailable */ }
  }

  function getClassProfile(classId) { load(); return data.classes[classId]; }
  function setClassProfile(classId, profile) { load(); data.classes[classId] = profile; persist(); }
  function touchClassProfile(classId) { load(); persist(); }
  function getGlobal() { load(); return data.global; }
  function setGlobal(partial) { load(); Object.assign(data.global, partial); persist(); }
  function setLastClass(classId) { load(); data.lastClass = classId; persist(); }
  function getLastClass() { load(); return data.lastClass; }

  function wipe() {
    data = defaultData();
    persist();
  }

  return { load, persist, getClassProfile, setClassProfile, touchClassProfile, getGlobal, setGlobal, setLastClass, getLastClass, wipe, KEY };
})();

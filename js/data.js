// Enemy / Elite / Boss / Rival (duel) stats. Behavior lives in enemy.js; pixel art in spritedata.js.
window.PL = window.PL || {};

PL.ENEMY_DEFS = [
  { id: 'goblin_grunt', name: 'Гоблин-налётчик', hp: 42, dmg: 8, def: 2, spd: 108, xp: 12, behavior: 'rush', range: 26, atkCd: 1.1 },
  { id: 'skeleton_warrior', name: 'Скелет-воин', hp: 58, dmg: 10, def: 4, spd: 88, xp: 15, behavior: 'rush', range: 34, atkCd: 1.3 },
  { id: 'shadow_wolf', name: 'Теневой волк', hp: 36, dmg: 9, def: 1, spd: 195, xp: 14, behavior: 'dash', range: 40, atkCd: 1.6 },
  { id: 'orc_brute', name: 'Орк-громила', hp: 95, dmg: 17, def: 6, spd: 68, xp: 22, behavior: 'rush', range: 40, atkCd: 1.8 },
  { id: 'bandit_rogue', name: 'Бандит-разбойник', hp: 52, dmg: 11, def: 3, spd: 150, xp: 16, behavior: 'dash', range: 36, atkCd: 1.4 },
  { id: 'slime', name: 'Слизень', hp: 28, dmg: 6, def: 0, spd: 58, xp: 10, behavior: 'rush', range: 26, atkCd: 1.0 },
  { id: 'dark_acolyte', name: 'Тёмный послушник', hp: 40, dmg: 9, def: 2, spd: 92, xp: 15, behavior: 'ranged', range: 220, atkCd: 1.9, projColor: '#a94fff' },
  { id: 'goblin_archer', name: 'Гоблин-стрелок', hp: 34, dmg: 8, def: 1, spd: 98, xp: 14, behavior: 'ranged', range: 240, atkCd: 1.6, projColor: '#c7a22a' },
  { id: 'skeleton_mage', name: 'Скелет-маг', hp: 44, dmg: 10, def: 3, spd: 88, xp: 18, behavior: 'ranged', range: 230, atkCd: 2.0, projColor: '#6ad9ff', teleports: true },
  { id: 'harpy', name: 'Гарпия', hp: 46, dmg: 10, def: 2, spd: 135, xp: 17, behavior: 'flyer', range: 38, atkCd: 1.8, hover: 6, flies: true },
  { id: 'zombie', name: 'Зомби', hp: 60, dmg: 11, def: 3, spd: 62, xp: 14, behavior: 'rush', range: 28, atkCd: 1.4 },
  { id: 'mummy', name: 'Мумия', hp: 85, dmg: 13, def: 5, spd: 58, xp: 20, behavior: 'rush', range: 30, atkCd: 1.6 },
  { id: 'dark_imp', name: 'Бесёнок', hp: 34, dmg: 10, def: 1, spd: 120, xp: 17, behavior: 'ranged', range: 210, atkCd: 1.7, projColor: '#ff7a1a', hover: 10, flies: true },
  { id: 'mushroom_man', name: 'Грибник', hp: 48, dmg: 9, def: 3, spd: 80, xp: 13, behavior: 'rush', range: 24, atkCd: 1.2 },
  { id: 'ice_slime', name: 'Ледяной слизень', hp: 40, dmg: 8, def: 2, spd: 64, xp: 13, behavior: 'rush', range: 26, atkCd: 1.0, special: 'frostSlow' },
  { id: 'lava_slime', name: 'Лавовый слизень', hp: 50, dmg: 12, def: 3, spd: 60, xp: 18, behavior: 'rush', range: 26, atkCd: 1.1, special: 'lavaDeath' },
  { id: 'cave_bat', name: 'Пещерная мышь', hp: 22, dmg: 7, def: 0, spd: 170, xp: 11, behavior: 'flyer', range: 30, atkCd: 1.3, hover: 16, flies: true },
  { id: 'demon_eye', name: 'Демонический глаз', hp: 38, dmg: 10, def: 2, spd: 120, xp: 16, behavior: 'flyer', range: 34, atkCd: 1.6, hover: 18, flies: true },
  { id: 'skeleton_archer', name: 'Скелет-лучник', hp: 44, dmg: 10, def: 3, spd: 88, xp: 17, behavior: 'ranged', range: 250, atkCd: 1.8, projColor: '#e8e2d0' }
];

PL.ELITE_DEFS = [
  { id: 'elite_orc_berserker', name: 'Элитный Берсерк', hp: 240, dmg: 21, def: 8, spd: 82, xp: 70, behavior: 'rush', range: 44, atkCd: 1.5, elite: true, special: 'enrage' },
  { id: 'elite_dark_knight', name: 'Тёмный Рыцарь', hp: 280, dmg: 19, def: 12, spd: 78, xp: 80, behavior: 'rush', range: 42, atkCd: 1.7, elite: true, special: 'shield' },
  { id: 'elite_shadow_assassin', name: 'Теневой Убийца', hp: 160, dmg: 18, def: 5, spd: 175, xp: 75, behavior: 'dash', range: 40, atkCd: 1.3, elite: true, special: 'teleport' },
  { id: 'elite_flame_shaman', name: 'Огненный Шаман', hp: 190, dmg: 15, def: 4, spd: 90, xp: 85, behavior: 'ranged', range: 230, atkCd: 2.1, projColor: '#ff5a1a', elite: true, special: 'firePools' },
  { id: 'elite_frost_archer', name: 'Ледяной Лучник', hp: 180, dmg: 16, def: 5, spd: 96, xp: 80, behavior: 'ranged', range: 250, atkCd: 1.8, projColor: '#8dd9ff', elite: true, special: 'frostSlow' },
  { id: 'elite_necromancer', name: 'Некромант', hp: 190, dmg: 15, def: 5, spd: 85, xp: 90, behavior: 'ranged', range: 220, atkCd: 2.0, projColor: '#6aff8a', elite: true, special: 'summon' },
  { id: 'elite_pharaoh', name: 'Проклятый Фараон', hp: 300, dmg: 20, def: 10, spd: 70, xp: 95, behavior: 'rush', range: 40, atkCd: 1.6, elite: true, special: 'enrage' }
];

PL.BOSS_DEFS = [
  {
    id: 'bone_king', name: 'Король Костей', projColor: '#e8e2d0', hp: 950, dmg: 12, def: 8, spd: 68, xp: 400, arena: 'crypt',
    phases: [
      { hpFrac: 1.0, spdMult: 1, dmgMult: 1, attacks: ['meleeSwing', 'groundSpikes'] },
      { hpFrac: 0.5, spdMult: 1.12, dmgMult: 1.15, attacks: ['meleeSwing', 'groundSpikes', 'summonAdds'] }
    ]
  },
  {
    id: 'fire_golem', name: 'Огненный Голем', projColor: '#ff6a1a', hp: 1150, dmg: 15, def: 10, spd: 52, xp: 460, arena: 'volcanic',
    phases: [
      { hpFrac: 1.0, spdMult: 1, dmgMult: 1, attacks: ['aoeSlam', 'dashCharge'] },
      { hpFrac: 0.4, spdMult: 1.3, dmgMult: 1.2, attacks: ['aoeSlam', 'dashCharge', 'groundSpikes'] }
    ]
  },
  {
    id: 'shadow_queen', name: 'Королева Теней', hp: 820, dmg: 13, def: 6, spd: 105, xp: 440, arena: 'voidrealm',
    projColor: '#d02fff',
    phases: [
      { hpFrac: 1.0, spdMult: 1, dmgMult: 1, attacks: ['meleeSwing', 'projectileBarrage'] },
      { hpFrac: 0.55, spdMult: 1.15, dmgMult: 1.1, attacks: ['meleeSwing', 'projectileBarrage', 'cloneSwap'] }
    ]
  },
  {
    id: 'ancient_dragon', name: 'Древний Дракон', projColor: '#ff8a2a', hp: 1350, dmg: 17, def: 10, spd: 95, xp: 520, arena: 'skyruins',
    flies: true,
    phases: [
      { hpFrac: 1.0, spdMult: 1, dmgMult: 1, attacks: ['coneBreath', 'dashCharge'] },
      { hpFrac: 0.5, spdMult: 1.1, dmgMult: 1.15, attacks: ['coneBreath', 'dashCharge', 'projectileBarrage'] },
      { hpFrac: 0.2, spdMult: 1.3, dmgMult: 1.3, attacks: ['coneBreath', 'dashCharge', 'projectileBarrage', 'groundSpikes'] }
    ]
  },
  {
    id: 'fallen_paladin', name: 'Падший Паладин', hp: 1080, dmg: 15, def: 11, spd: 92, xp: 500, arena: 'cathedral',
    phases: [
      { hpFrac: 1.0, spdMult: 1, dmgMult: 1, attacks: ['meleeSwing', 'dashCharge'] },
      { hpFrac: 0.6, spdMult: 1.05, dmgMult: 1.1, attacks: ['meleeSwing', 'dashCharge', 'groundSpikes'] },
      { hpFrac: 0.25, spdMult: 1.15, dmgMult: 1.25, attacks: ['meleeSwing', 'dashCharge', 'groundSpikes', 'beamJudgment'] }
    ]
  }
];

PL.RIVAL_DEFS = [
  { id: 'rival_captain', name: 'Капитан Гарда', hp: 180, dmg: 13, def: 7, spd: 115, xp: 90, behavior: 'rush', range: 36, atkCd: 1.2 },
  { id: 'rival_mystic', name: 'Мистик Теней', hp: 150, dmg: 12, def: 4, spd: 120, xp: 90, behavior: 'ranged', range: 220, atkCd: 1.6, projColor: '#a94fff' },
  { id: 'rival_blade', name: 'Клинок Пустыни', hp: 140, dmg: 14, def: 3, spd: 185, xp: 90, behavior: 'dash', range: 34, atkCd: 1.1 },
  { id: 'rival_guardian', name: 'Страж Руин', hp: 240, dmg: 16, def: 11, spd: 76, xp: 95, behavior: 'rush', range: 42, atkCd: 1.6 }
];

// Class definitions: stats, attacks, abilities (metadata; behavior lives in player.js), skill trees.
window.PL = window.PL || {};

PL.CLASSES = {
  warrior: {
    id: 'warrior', name: 'Воин', weaponKind: 'greatsword',
    desc: 'Мощные удары мечом, высокая живучесть, сокрушительные способности.',
    palette: { skin: '#d9b88a', outfit: '#5a4a3a', outfitDark: '#3a2e22', accent: '#c77a2a', hair: '#2a2018', weapon: '#d8dee6' },
    base: { hp: 130, str: 15, def: 11, spd: 148, crit: 5, energyMax: 80, energyRegen: 9 },
    growth: { hp: 10, str: 1.4, def: 1.0, spd: 0.6, crit: 0.15 },
    light: { hits: 3, dmgMult: [1.0, 1.05, 1.35], range: 36, knockback: [60, 60, 140], startup: [0.09, 0.09, 0.12], active: 0.09, recovery: [0.16, 0.16, 0.32], staminaFree: true },
    heavy: { dmgMult: 2.3, range: 40, knockback: 220, startup: 0.26, active: 0.14, recovery: 0.4, crowdControl: true },
    abilities: [
      { key: 'q', id: 'shockwave', name: 'Ударная волна', cooldown: 6.5, energyCost: 25, dmgMult: 1.9, radius: 78, knockback: 260, telegraph: 0.18, desc: 'АоЕ-взрыв перед собой, отбрасывает врагов.' },
      { key: 'e', id: 'leapSlam', name: 'Прыжковый удар', cooldown: 10, energyCost: 32, dmgMult: 2.6, radius: 64, telegraph: 0.3, desc: 'Прыжок и мощный удар об землю.' }
    ],
    skillTree: [
      { id: 'w1', name: 'Сила удара', desc: '+15% урон обычных атак', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'w2', name: 'Тяжёлая рука', desc: '+20% урон тяжёлой атаки', cost: 1, requires: [], effect: { heavyDmg: 0.2 } },
      { id: 'w3', name: 'Закалка', desc: '+15% максимального здоровья', cost: 1, requires: ['w1'], effect: { maxHp: 0.15 } },
      { id: 'w4', name: 'Резонанс волны', desc: 'Ударная волна: -30% перезарядки, +25% урона', cost: 1, requires: ['w2'], effect: { abilityCdQ: -0.3, abilityDmgQ: 0.25 } },
      { id: 'w5', name: 'Сокрушитель', desc: 'Прыжковый удар: +35% урона и радиуса', cost: 1, requires: ['w3'], effect: { abilityDmgE: 0.35, abilityRadiusE: 0.35 } },
      { id: 'w6', name: 'Боевая ярость', desc: '+10% крит. шанс, +8% скорость', cost: 1, requires: ['w4', 'w5'], effect: { crit: 0.10, moveSpeed: 0.08 } }
    ]
  },

  mage: {
    id: 'mage', name: 'Маг', weaponKind: 'staff',
    desc: 'Магические снаряды и разрушительные заклинания по площади.',
    palette: { skin: '#e0c9a6', outfit: '#2a3a6a', outfitDark: '#1a2448', accent: '#6ad9ff', hair: '#e8e4d8', weapon: '#8a6a3a' },
    base: { hp: 85, str: 17, def: 5, spd: 140, crit: 8, energyMax: 115, energyRegen: 15 },
    growth: { hp: 6, str: 1.7, def: 0.5, spd: 0.4, crit: 0.2 },
    light: { hits: 3, dmgMult: [0.85, 0.85, 1.0], range: 230, knockback: [20, 20, 40], startup: [0.14, 0.14, 0.16], active: 0.06, recovery: [0.14, 0.14, 0.22], projectile: true, projColor: '#6ad9ff' },
    heavy: { dmgMult: 2.1, range: 260, knockback: 60, startup: 0.32, active: 0.08, recovery: 0.3, projectile: true, pierce: true, projColor: '#b06bff' },
    abilities: [
      { key: 'q', id: 'fireStorm', name: 'Огненный шторм', cooldown: 11, energyCost: 48, dmgMult: 0.55, ticks: 6, radius: 86, telegraph: 0.5, desc: 'Огненная буря в зоне перед магом, несколько тиков урона.' },
      { key: 'e', id: 'arcaneNova', name: 'Арканный взрыв', cooldown: 9, energyCost: 36, dmgMult: 1.7, radius: 80, telegraph: 0.15, desc: 'Взрыв вокруг себя + короткая неуязвимость.' }
    ],
    skillTree: [
      { id: 'm1', name: 'Поток энергии', desc: '+20% максимум энергии', cost: 1, requires: [], effect: { energyMax: 0.2 } },
      { id: 'm2', name: 'Разрушение', desc: '+15% урон обычных заклинаний', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'm3', name: 'Пиромантия', desc: 'Огненный шторм: +30% урона, +20% радиуса', cost: 1, requires: ['m2'], effect: { abilityDmgQ: 0.3, abilityRadiusQ: 0.2 } },
      { id: 'm4', name: 'Арканная связь', desc: 'Арканный взрыв: -30% перезарядки', cost: 1, requires: ['m1'], effect: { abilityCdE: -0.3 } },
      { id: 'm5', name: 'Магический резерв', desc: '+20% регенерация энергии, +10% здоровье', cost: 1, requires: ['m3', 'm4'], effect: { energyRegen: 0.2, maxHp: 0.1 } },
      { id: 'm6', name: 'Критическая мана', desc: '+12% крит. шанс', cost: 1, requires: ['m5'], effect: { crit: 0.12 } }
    ]
  },

  assassin: {
    id: 'assassin', name: 'Убийца', weaponKind: 'dagger',
    desc: 'Молниеносные атаки, теневой рывок и высочайшая скорость.',
    palette: { skin: '#caa883', outfit: '#1e1e26', outfitDark: '#101014', accent: '#9a2fd0', hair: '#141414', weapon: '#dfe6ee' },
    base: { hp: 95, str: 13, def: 6, spd: 205, crit: 22, energyMax: 95, energyRegen: 13 },
    growth: { hp: 7, str: 1.3, def: 0.6, spd: 0.9, crit: 0.3 },
    light: { hits: 4, dmgMult: [0.6, 0.6, 0.7, 0.95], range: 30, knockback: [20, 20, 20, 90], startup: [0.05, 0.05, 0.06, 0.08], active: 0.06, recovery: [0.09, 0.09, 0.1, 0.22] },
    heavy: { dmgMult: 1.95, range: 48, knockback: 160, startup: 0.14, active: 0.1, recovery: 0.26, dashStrike: true },
    abilities: [
      { key: 'q', id: 'shadowDash', name: 'Теневой рывок', cooldown: 5.5, energyCost: 20, dmgMult: 1.3, range: 150, telegraph: 0, invuln: 0.25, desc: 'Рывок сквозь врагов с урезанной уязвимостью.' },
      { key: 'e', id: 'bloodWhirl', name: 'Кровавый вихрь', cooldown: 9.5, energyCost: 34, dmgMult: 0.75, ticks: 3, radius: 55, telegraph: 0.1, desc: 'Серия быстрых ударов вокруг себя.' }
    ],
    skillTree: [
      { id: 'a1', name: 'Быстрые клинки', desc: '+15% урон обычных атак', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'a2', name: 'Смертельный удар', desc: '+15% крит. шанс', cost: 1, requires: [], effect: { crit: 0.15 } },
      { id: 'a3', name: 'Из тени', desc: 'Теневой рывок: -35% перезарядки', cost: 1, requires: ['a2'], effect: { abilityCdQ: -0.35 } },
      { id: 'a4', name: 'Кровавый пир', desc: 'Кровавый вихрь: +30% урона', cost: 1, requires: ['a1'], effect: { abilityDmgE: 0.3 } },
      { id: 'a5', name: 'Проворство', desc: '+10% скорость передвижения', cost: 1, requires: ['a3'], effect: { moveSpeed: 0.10 } },
      { id: 'a6', name: 'Жажда крови', desc: '+15% максимум здоровья', cost: 1, requires: ['a4', 'a5'], effect: { maxHp: 0.15 } }
    ]
  },

  archer: {
    id: 'archer', name: 'Лучник', weaponKind: 'bow',
    desc: 'Точная стрельба на дальней дистанции и ливень стрел.',
    palette: { skin: '#dcc19a', outfit: '#2e4a2e', outfitDark: '#1c2e1c', accent: '#8ddc6a', hair: '#5a3a1e', weapon: '#8a6a3a' },
    base: { hp: 92, str: 13, def: 7, spd: 165, crit: 16, energyMax: 95, energyRegen: 11 },
    growth: { hp: 7, str: 1.3, def: 0.7, spd: 0.6, crit: 0.25 },
    light: { hits: 3, dmgMult: [0.85, 0.85, 1.05], range: 260, knockback: [30, 30, 50], startup: [0.1, 0.1, 0.12], active: 0.06, recovery: [0.16, 0.16, 0.24], projectile: true, projColor: '#e8dca0' },
    heavy: { dmgMult: 2.2, range: 300, knockback: 70, startup: 0.3, active: 0.08, recovery: 0.32, projectile: true, pierce: true, projColor: '#ffd76b' },
    abilities: [
      { key: 'q', id: 'arrowRain', name: 'Град стрел', cooldown: 10, energyCost: 36, dmgMult: 0.5, ticks: 6, radius: 70, telegraph: 0.45, desc: 'Множество стрел падает в выбранной зоне.' },
      { key: 'e', id: 'aimedShot', name: 'Прицельный выстрел', cooldown: 7.5, energyCost: 28, dmgMult: 3.1, range: 340, telegraph: 0.35, pierce: true, desc: 'Один мощный пробивающий выстрел с высоким шансом крита.' }
    ],
    skillTree: [
      { id: 'r1', name: 'Твёрдая рука', desc: '+15% урон обычных атак', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'r2', name: 'Снайпер', desc: '+15% крит. шанс', cost: 1, requires: [], effect: { crit: 0.15 } },
      { id: 'r3', name: 'Ливень', desc: 'Град стрел: +30% урона', cost: 1, requires: ['r1'], effect: { abilityDmgQ: 0.3 } },
      { id: 'r4', name: 'Пробивной выстрел', desc: 'Прицельный выстрел: -30% перезарядки', cost: 1, requires: ['r2'], effect: { abilityCdE: -0.3 } },
      { id: 'r5', name: 'Выносливость', desc: '+15% максимум здоровья', cost: 1, requires: ['r3'], effect: { maxHp: 0.15 } },
      { id: 'r6', name: 'Охотник', desc: '+10% скорость, +10% энергия', cost: 1, requires: ['r4', 'r5'], effect: { moveSpeed: 0.1, energyMax: 0.1 } }
    ]
  },

  necromancer: {
    id: 'necromancer', name: 'Некромант', weaponKind: 'skullStaff',
    desc: 'Повелитель мёртвых: призывает рыцаря-нежить и усиливает себя и союзников.',
    palette: { skin: '#d8d4c8', outfit: '#2e2240', outfitDark: '#1a1228', accent: '#6aff8a', hair: '#3a2a4e', weapon: '#ece6d4' },
    base: { hp: 100, str: 15, def: 7, spd: 145, crit: 8, energyMax: 110, energyRegen: 13 },
    growth: { hp: 7, str: 1.5, def: 0.7, spd: 0.4, crit: 0.18 },
    light: { hits: 3, dmgMult: [0.8, 0.8, 1.0], range: 210, knockback: [20, 20, 40], startup: [0.13, 0.13, 0.15], active: 0.06, recovery: [0.14, 0.14, 0.22], projectile: true, projColor: '#6aff8a' },
    heavy: { dmgMult: 1.9, range: 240, knockback: 60, startup: 0.3, active: 0.08, recovery: 0.3, projectile: true, pierce: true, projColor: '#c06aff', lifesteal: 0.15 },
    abilities: [
      { key: 'q', id: 'darkPact', name: 'Тёмная печать', cooldown: 14, energyCost: 30, duration: 5, telegraph: 0.12, desc: 'На 5 секунд ты и твои рыцари наносите двойной урон.' },
      { key: 'e', id: 'raiseKnight', name: 'Призыв рыцаря', cooldown: 22, energyCost: 45, duration: 20, radius: 30, telegraph: 0.4, desc: 'Ульта: поднимает из земли рыцаря-нежить, который сражается за тебя 20 секунд.' }
    ],
    skillTree: [
      { id: 'n1', name: 'Тёмная энергия', desc: '+15% урон обычных атак', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'n2', name: 'Костяной доспех', desc: '+15% максимального здоровья', cost: 1, requires: [], effect: { maxHp: 0.15 } },
      { id: 'n3', name: 'Жажда душ', desc: 'Тяжёлая атака лечит вдвое сильнее', cost: 1, requires: ['n1'], effect: { lifesteal: 0.15 } },
      { id: 'n4', name: 'Вечная печать', desc: 'Тёмная печать: -30% перезарядки', cost: 1, requires: ['n2'], effect: { abilityCdQ: -0.3 } },
      { id: 'n5', name: 'Верный страж', desc: 'Рыцарь: +40% здоровья и урона', cost: 1, requires: ['n4'], effect: { allyPower: 0.4 } },
      { id: 'n6', name: 'Легион', desc: 'Призыв рыцаря поднимает двух рыцарей', cost: 1, requires: ['n3', 'n5'], effect: { allyCount: 1 } }
    ]
  }
};

PL.CLASS_LIST = ['warrior', 'mage', 'assassin', 'archer', 'necromancer'];

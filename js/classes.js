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
    light: { hits: 3, dmgMult: [0.85, 0.85, 1.0], range: 230, knockback: [20, 20, 40], startup: [0.14, 0.14, 0.16], active: 0.06, recovery: [0.14, 0.14, 0.22], projectile: true, projColor: '#6ad9ff', comboCooldown: 0.3 },
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
    base: { hp: 100, str: 13, def: 8, spd: 165, crit: 16, energyMax: 95, energyRegen: 11 },
    growth: { hp: 7, str: 1.3, def: 0.7, spd: 0.6, crit: 0.25 },
    light: { hits: 3, dmgMult: [0.85, 0.85, 1.05], range: 260, knockback: [30, 30, 50], startup: [0.1, 0.1, 0.12], active: 0.06, recovery: [0.16, 0.16, 0.24], projectile: true, projColor: '#e8dca0', comboCooldown: 0.3 },
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
    heavy: { dmgMult: 1.9, range: 240, knockback: 60, startup: 0.3, active: 0.08, recovery: 0.3, projectile: true, pierce: true, projColor: '#c06aff', lifesteal: 0.08 },
    abilities: [
      { key: 'q', id: 'darkPact', name: 'Тёмная печать', cooldown: 20, energyCost: 35, duration: 5, telegraph: 0.12, desc: 'На 5 секунд ты и твои рыцари наносите двойной урон.' },
      { key: 'e', id: 'raiseKnight', name: 'Призыв рыцаря', cooldown: 30, energyCost: 50, duration: 15, radius: 30, telegraph: 0.4, desc: 'Ульта: поднимает из земли рыцаря-нежить, который сражается за тебя 15 секунд.' }
    ],
    skillTree: [
      { id: 'n1', name: 'Тёмная энергия', desc: '+15% урон обычных атак', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'n2', name: 'Костяной доспех', desc: '+15% максимального здоровья', cost: 1, requires: [], effect: { maxHp: 0.15 } },
      { id: 'n3', name: 'Жажда душ', desc: 'Тяжёлая атака лечит вдвое сильнее', cost: 1, requires: ['n1'], effect: { lifesteal: 0.08 } },
      { id: 'n4', name: 'Вечная печать', desc: 'Тёмная печать: -30% перезарядки', cost: 1, requires: ['n2'], effect: { abilityCdQ: -0.3 } },
      { id: 'n5', name: 'Верный страж', desc: 'Рыцарь: +30% здоровья и урона', cost: 1, requires: ['n4'], effect: { allyPower: 0.3 } },
      { id: 'n6', name: 'Легион', desc: 'Призыв рыцаря поднимает двух рыцарей', cost: 1, requires: ['n3', 'n5'], effect: { allyCount: 1 } }
    ]
  },

  cleric: {
    id: 'cleric', name: 'Целитель', weaponKind: 'holyStaff',
    desc: 'Святой свет издалека, мощное лечение и освящённая земля, что жжёт врагов.',
    palette: { skin: '#e6c29a', outfit: '#ece8e0', outfitDark: '#b8b0a0', accent: '#ffd860', hair: '#f0ece4', weapon: '#e8d070' },
    base: { hp: 95, str: 15, def: 7, spd: 145, crit: 6, energyMax: 120, energyRegen: 15 },
    growth: { hp: 8, str: 1.3, def: 0.8, spd: 0.4, crit: 0.15 },
    light: { hits: 3, dmgMult: [0.9, 0.9, 1.1], range: 220, knockback: [20, 20, 40], startup: [0.14, 0.14, 0.16], active: 0.06, recovery: [0.14, 0.14, 0.22], projectile: true, projColor: '#ffe070' },
    heavy: { dmgMult: 1.9, range: 250, knockback: 60, startup: 0.3, active: 0.08, recovery: 0.3, projectile: true, pierce: true, projColor: '#fff8d8', lifesteal: 0.2 },
    abilities: [
      { key: 'q', id: 'healingLight', name: 'Исцеляющий свет', cooldown: 12, energyCost: 35, heal: 0.25, regen: 0.04, regenTime: 4, telegraph: 0.15, desc: 'Сразу лечит 25% здоровья и ещё 4% в секунду в течение 4 секунд.' },
      { key: 'e', id: 'sanctuary', name: 'Святая земля', cooldown: 22, energyCost: 50, dmgMult: 0.35, ticks: 12, radius: 110, heal: 0.03, telegraph: 0.3, desc: 'Ульта: освящает землю на 6 секунд. Внутри круга ты лечишься, а враги горят.' }
    ],
    skillTree: [
      { id: 'c1', name: 'Благословение', desc: '+15% урон обычных атак', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'c2', name: 'Святая стойкость', desc: '+15% максимального здоровья', cost: 1, requires: [], effect: { maxHp: 0.15 } },
      { id: 'c3', name: 'Щедрый свет', desc: 'Исцеляющий свет: +40% лечения', cost: 1, requires: ['c2'], effect: { healPower: 0.4 } },
      { id: 'c4', name: 'Освящение', desc: 'Святая земля: +30% радиуса и урона', cost: 1, requires: ['c1'], effect: { abilityRadiusE: 0.3, abilityDmgE: 0.3 } },
      { id: 'c5', name: 'Поток веры', desc: '+25% регенерации энергии', cost: 1, requires: ['c3'], effect: { energyRegen: 0.25 } },
      { id: 'c6', name: 'Ангел-хранитель', desc: 'Святая земля: -30% перезарядки', cost: 1, requires: ['c4', 'c5'], effect: { abilityCdE: -0.3 } }
    ]
  },

  guardian: {
    id: 'guardian', name: 'Щитоносец', weaponKind: 'sword',
    desc: 'Живая крепость: блокирует удары щитом и сбивает врагов тараном.',
    palette: { skin: '#e0b48a', outfit: '#b8c0cc', outfitDark: '#7a8290', accent: '#6a9aff', hair: '#3a2a1a', weapon: '#eef2f6' },
    base: { hp: 150, str: 13, def: 15, spd: 135, crit: 4, energyMax: 85, energyRegen: 10 },
    growth: { hp: 12, str: 1.2, def: 1.2, spd: 0.4, crit: 0.1 },
    light: { hits: 3, dmgMult: [0.9, 0.95, 1.3], range: 32, knockback: [50, 50, 130], startup: [0.09, 0.09, 0.12], active: 0.09, recovery: [0.16, 0.16, 0.3] },
    heavy: { dmgMult: 1.6, range: 38, knockback: 300, startup: 0.2, active: 0.12, recovery: 0.34, stun: 0.9 },
    abilities: [
      { key: 'q', id: 'shieldWall', name: 'Стена щитов', cooldown: 12, energyCost: 30, duration: 4, reduction: 0.7, telegraph: 0.08, desc: 'На 4 секунды: -70% получаемого урона, удары не сбивают и не отбрасывают.' },
      { key: 'e', id: 'shieldCharge', name: 'Таран', cooldown: 14, energyCost: 40, dmgMult: 2.2, range: 170, stun: 1.5, telegraph: 0.2, desc: 'Ульта: рывок со щитом сквозь врагов — урон, отбрасывание и оглушение на 1,5 с.' }
    ],
    skillTree: [
      { id: 'g1', name: 'Закалённый клинок', desc: '+15% урон обычных атак', cost: 1, requires: [], effect: { lightDmg: 0.15 } },
      { id: 'g2', name: 'Тяжёлые латы', desc: '+15% максимального здоровья', cost: 1, requires: [], effect: { maxHp: 0.15 } },
      { id: 'g3', name: 'Крепкий щит', desc: 'Стена щитов: +1,5 с длительности', cost: 1, requires: ['g2'], effect: { shieldTime: 1.5 } },
      { id: 'g4', name: 'Сокрушающий таран', desc: 'Таран: +30% урона', cost: 1, requires: ['g1'], effect: { abilityDmgE: 0.3 } },
      { id: 'g5', name: 'Бастион', desc: '+20% защиты', cost: 1, requires: ['g3'], effect: { defense: 0.2 } },
      { id: 'g6', name: 'Несокрушимый', desc: 'Таран: -30% перезарядки', cost: 1, requires: ['g4', 'g5'], effect: { abilityCdE: -0.3 } }
    ]
  }
};

PL.CLASS_LIST = ['warrior', 'mage', 'assassin', 'archer', 'necromancer', 'cleric', 'guardian'];

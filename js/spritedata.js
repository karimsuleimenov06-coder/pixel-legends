// Pixel-art data for every character: reusable head/torso grids + per-character palettes.
// Grids face right. '.' is transparent; every other letter is looked up in the character's palette.
window.PL = window.PL || {};

(function () {
  // ---------------- Heads ----------------
  const HEAD_HELM = [
    '...rRR......', '..rRRMMMMm..', '..RMWWMMMMm.', '.rMWMMMMMMMm', '.rMMMMMMMMMm', '..dmmmmmmmMm',
    '..mMSSSSSSm.', '..mMSSSSeEm.', '..mMSSSSSSSs', '..mMsSSSSSs.', '...m.sssss..', '............'
  ];
  const HEAD_BARE = [
    '............', '...HHHHHH...', '..HYYHHHHHH.', '.hHHHHHHHHHH', '.hHHHHSSSSSH', '.hHHHSSSSSS.',
    '.hHHSSSSeES.', '..hHSSSSSSSS', '..hHsSSSSSs.', '...hsSSSSs..', '....sssss...', '............'
  ];
  const HEAD_HOOD = [
    '....HHHH....', '...HYHHHH...', '..HYHHHHHH..', '.hHHHHHHHHH.', '.hHHHHHHHHHH', '.hHHHddSSSHH',
    '.hHHdSSSeEH.', '.hHHdSSSSSS.', '.hHHHsSSSSH.', '..hHHHsssH..', '...hHHHHh...', '............'
  ];
  const HEAD_WIZARD = [
    '....aA........', '.....aAA......', '......aAA.....', '.....aAAAA....', '....aAALAAA...', '...aAAAALAAA..',
    '...aRRRRRRRR..', '.aAAAAAAAAAAAa', '...hHSSSSSSS..', '...hHSSSSeES..', '...hHSSSSSSSS.', '...hHHSSSSSs..',
    '....hHHHHHHH..', '.....hHHHHH...', '......hHHh....', '..............'
  ];
  const HEAD_SKULL = [
    '............', '...TTTTTT...', '..TTWTTTTTT.', '.tTWTTTTTTTT', '.tTTTTTTTTTT', '.tTTTddTTddT',
    '.tTTTdETTdET', '..tTTTTTdTT.', '..tTTTTTTTT.', '...tTdTdTdT.', '...tTTTTTT..', '............'
  ];
  const HEAD_ORC = [
    '............', '....HHHH....', '...SHHHHSS..', '..SSSSSSSSS.', '.sSSSSSSSSSS', 'ssSdddSSddS.',
    '.sSSSSSeESS.', '.sSSSSSSSSSS', '.sSSSSTSSTS.', '..sSSSTSSTs.', '...sssssss..', '............'
  ];
  const HEAD_HELM_CLOSED = [
    '....MMMM....', '..MMWWMMMM..', '.MMWMMMMMMm.', '.MWMMMMMMMMm', '.MMMMMMMMMMm', '.mMMMdddddEm',
    '.mMMMMMMMMMm', '.mMMMMMdMdMm', '.mmMMMMMMMm.', '..mmMMMMMm..', '....mmmm....', '............'
  ];
  const HEAD_GOLEM = [
    '............', '..AAAAAAAA..', '.ALAAAaAAAA.', 'ALAAAAAAAAAa', 'AAAaAAAAAAAa', 'AAAAAAEEAAAa',
    'aAAAAAEEAAa.', 'aAAaAAAAAAa.', '.aAAARRRAAa.', '..aaAAAAaa..', '....aaaa....', '............'
  ];
  const HEAD_GOBLIN = [
    '............', '....gGGGg...', '...gGGGGGGg.', 'dg.gGGGGGGGg', '.dggGGGGGGGg', '..dgGGGGeEGg',
    '...gGGGGGGGG', '...gGGGGGGG.', '...gGGGTgTg.', '....gGGGGg..', '.....dggg...', '............'
  ];

  // ---------------- Head overlays ----------------
  const MASK_HOOD = { dx: 5, dy: 7, rows: ['BBBBBB', 'BBBBB.', '.BBB..'] };
  const MASK_BARE = { dx: 4, dy: 7, rows: ['BBBBBBBB', '.BBBBBB.', '..BBBB..'] };
  const LONG_HAIR = { dx: 0, dy: 5, rows: ['.hH.', 'hHH.', 'hHH.', 'hHh.', 'hH..', 'hH..', 'h...'] };
  const CROWN = { dx: 3, dy: -2, rows: ['G.G.G.G', 'GRGGGRG', 'GGGGGGG'] };
  const HORNS = { dx: 0, dy: -3, rows: ['k..........k', 'kk........kk', '.kk......kk.'] };
  const FEATHERS = { dx: 2, dy: -4, rows: ['..R.R...', '.RrRrR..', 'RrRrRrR.', '.GGGGG..'] };
  const BERSERK_HELM = { dx: 0, dy: -2, rows: ['k..........k', 'kk........kk', '.kMMMMMMMMk.', '.MWMMMMMMMm.', '.mMMMMMMMMm.'] };

  // ---------------- Torsos ----------------
  const TORSO_ARMOR = [
    '.mMMMMMMm.', 'mMWMRRMMMm', 'mMMMRRMMMm', '.dMMRRMMd.', '.mMMRRMMm.', '.mMMRrMMm.',
    '.mMMRRMMm.', '.BBBbbBBB.', '.rRRRRRRr.', '.rRRrRRRr.', '.rRRRRrRr.', '..r....r..'
  ];
  const TORSO_ROBE = [
    '.aAAAAAAa.', 'aALAAAAAAa', 'aAAAAGAAAa', '.aAABBAAa.', '.aALBBAAa.', '.aAABBAAa.', '.aAABBAAa.', '.GGGGGGGG.',
    '.aAABBAAa.', '.aAABBAAa.', 'aAALBBAAAa', 'aAAABBAAAa', 'aAAABBAAAa', 'aAAABBAAAa', 'aAAaBBaAAa', 'aaaaBBaaaa'
  ];
  const TORSO_LEATHER = [
    '.aAAAAAAa.', 'aALABAAAAa', 'aAAAABAAAa', '.aAAAABAa.', '.aLAAAABa.', '.aAAAAAAa.',
    '.aAAAAAAa.', '.bBBGBBBb.', '.aAAAAAAa.', '.aAaAAaAa.', '.aAAAAAAa.', '.a.aAAa.a.'
  ];
  const TORSO_RIBS = [
    '.tTTTTTTt.', 'tTTTTTTTTt', '.T.TTTT.T.', '.TT.TT.TT.', '.T.TTTT.T.', '.TT.TT.TT.',
    '..T.TT.T..', '....TT....', '....TT....', '..tTTTTt..', '.tTTddTTt.', '.TT....TT.'
  ];
  const TORSO_RAGS = [
    '.gGGGGGGg.', '.cCCCCCCc.', '.cCCCCCCc.', '.cCCcCCCc.', '.cCCCCCCc.',
    '.kkkkkkkk.', '.cCCCCCCc.', '.cCcCCcCc.', '.c.cC.cC..'
  ];
  const TORSO_ORC = [
    '.sSSSSSSSSs.', 'sSSSSSSSSSSs', 'sSSLSSSSSSSs', 'sSSSSBSSSSSs', '.sSSSSBSSSs.', '.sSSSSSBSSs.',
    '.sSSSSSSBSs.', '.sSSSSSSSSs.', '.bBBBGBBBBb.', '.cCCCCCCCCc.', '.cCCcCCcCCc.', '.c.cC..Cc.c.'
  ];
  const TORSO_PLATE = [
    '.mMMMMMMMMm.', 'mMWMMMMMMMMm', 'mMMWMRRMMMMm', 'dMMMMRRMMMMd', '.mMMMRRMMMm.', '.mMMMRRMMMm.',
    '.mMMMRRMMMm.', '.mMMMRRMMMm.', '.BBBBbbBBBB.', '.mMMrRRrMMm.', '.mMMrRRrMMm.', '.mm.rRRr.mm.'
  ];
  const TORSO_ROCK = [
    '..aAAAAAAAAa..', '.aALAAAAARAAa.', 'aALAAAaAARAAAa', 'aAAAARRAAAAAAa', 'aAAAAARAAaARAa', 'aAaAAAARRAARAa',
    '.aAARAAAARAAa.', '.aAARRAAAAAAa.', '.aAAAAAARaAAa.', '..aAAAAAARAa..', '..aAAaAAAAAa..', '...aaa..aaa...'
  ];

  // ---------------- Non-humanoid parts ----------------
  const WOLF_BODY = [
    '...aaAAAAAAAAa....', '.aAAALLAAAAAAAAa..', 'aAAAAAAAAAAAAAAAa.', 'aAAAAAAAAAAAAAAAAa',
    'aAAAAAAAAAAAAAAAAa', '.aAAAAAAAAAAAAAAa.', '..aaaAAAAAAAaaa...'
  ];
  const WOLF_HEAD = ['..a..a.....', '.aAaaA.....', '.aAAAAAa...', '.aAAAEAAAAa', 'aAAAAAAAAAd', 'aAAAAATaTa.', '.aAAAa.....'];
  const WOLF_HEAD_OPEN = ['..a..a.....', '.aAaaA.....', '.aAAAAAa...', '.aAAAEAAAAa', 'aAAAAAAAAAd', 'aAAAATdTdT.', 'aAAAd......', '.aAAATTTa..'];
  const DRAGON_HEAD = ['..hh..........', '...hhAAAA.....', '..AAAAAAAAA...', '.AAALAAAEAAA..', 'AAAAAAAAAAAAAd', 'aAAAAATaTaTaa.', '.aaAAAAAAAa...', '...aaaaaa.....'];
  const DRAGON_HEAD_OPEN = ['..hh..........', '...hhAAAA.....', '..AAAAAAAAA...', '.AAALAAAEAAA..', 'AAAAAAAAAAAAAd', 'aAAAATTTTTTT..', 'aAAAOOOOOOO...', '.aAATTTTTTT...', '..aaAAAAAAAa..', '....aaaaaa....'];

  const quiver = (F, w, Q, q) => ({ type: 'grid', dx: -4, dy: -3, rows: ['.F.F..', '.wFwF.', '.QQQQ.', '.QqqQ.', '.QQQQ.', '.QqqQ.', '.QQQQ.', '..QQ..'], pal: { F, w, Q, q } });
  const limbs = (sleeve, hand, pants, boot) => ({ sleeve, hand, pants, boot });
  const SKIN = { S: '#e6c29a', s: '#b9946c', e: '#ffffff', E: '#20182a' };

  PL.SPRITE_SPECS = {
    // ======== Player classes ========
    warrior: {
      head: HEAD_HELM, torso: TORSO_ARMOR, weapon: 'greatsword',
      pal: { M: '#aab2be', m: '#6c7482', W: '#e6eaf0', d: '#4a505c', R: '#e0661c', r: '#9e3e0c', S: '#e6b88e', s: '#b9875e', e: '#ffffff', E: '#20182a', B: '#6a4424', b: '#e8c050' },
      limbs: limbs('#9aa2ae', '#7c8490', '#8a909c', '#6a4424')
    },
    mage: {
      head: HEAD_WIZARD, torso: TORSO_ROBE, torsoAbove: 12, weapon: 'staff', weaponPal: { B: '#6ad9ff' },
      pal: Object.assign({ A: '#2a3a8a', a: '#1a2458', L: '#4a6ac8', R: '#e0b040', H: '#e8e4d8', h: '#b8b0a0', B: '#7a3ab0', G: '#e0b040' }, SKIN),
      limbs: limbs('#2a3a8a', '#e6c29a', '#1a2458', '#4a2e16')
    },
    assassin: {
      head: HEAD_HOOD, headOver: [MASK_HOOD], torso: TORSO_LEATHER, weapon: 'dagger', backWeapon: 'dagger',
      weaponPal: { W: '#f0e8ff', M: '#c8b8e0', m: '#6a5a8a' },
      pal: { H: '#2a2a36', h: '#18181f', Y: '#40404e', d: '#0a0a10', S: '#caa883', s: '#9a7a58', e: '#e8c8ff', E: '#b04aff', A: '#2a2a36', a: '#18181f', L: '#40404e', B: '#5a2a6a', b: '#3a1a4a', G: '#c0c0d0' },
      limbs: limbs('#2a2a36', '#1e1e26', '#202028', '#141418')
    },
    archer: {
      head: HEAD_HOOD, torso: TORSO_LEATHER, weapon: 'bow', back: quiver('#d03030', '#e8e4d8', '#7a4e2a', '#5a3a1e'),
      pal: Object.assign({ H: '#3a6a2e', h: '#24461c', Y: '#4e8a3e', d: '#1a2a14', A: '#6a4a2a', a: '#4a3018', L: '#8a6a3e', B: '#a8723e', b: '#5a3a1e', G: '#c8a040' }, SKIN, { E: '#2a4a1a' }),
      limbs: limbs('#3a6a2e', '#e6c29a', '#4a3a26', '#5a3a1e')
    },

    // ======== Normal enemies ========
    goblin_grunt: {
      head: HEAD_GOBLIN, torso: TORSO_RAGS, weapon: 'dagger', legScale: 0.64, legThick: 3,
      pal: { G: '#86b552', g: '#5e8a34', d: '#3e6022', e: '#ffd84a', E: '#c81e1e', T: '#f2ead0', C: '#7a5a36', c: '#57401f', k: '#c8a868' },
      limbs: limbs('#86b552', '#7aa64a', '#57401f', '#5e8a34')
    },
    skeleton_warrior: {
      head: HEAD_SKULL, torso: TORSO_RIBS, weapon: 'sword', armThick: 2, legThick: 2,
      weaponPal: { M: '#9a8a7a', m: '#5a4a3a', W: '#c8b8a8' },
      pal: { T: '#e8e2d0', t: '#a89e88', W: '#ffffff', d: '#2a2026', E: '#ff4030' },
      limbs: limbs('#e8e2d0', '#d0c8b4', '#e8e2d0', '#a89e88')
    },
    shadow_wolf: {
      kind: 'quad', body: WOLF_BODY, head: WOLF_HEAD, headOpen: WOLF_HEAD_OPEN, hitW: 26,
      pal: { A: '#3a3448', a: '#221e2e', L: '#5a5070', E: '#d04aff', T: '#e8e8f0', d: '#0e0c14' }
    },
    orc_brute: {
      head: HEAD_ORC, torso: TORSO_ORC, weapon: 'axe', legScale: 1.15, legThick: 5, armThick: 4, hipSpread: 3,
      pal: { S: '#6a9a4a', s: '#4a7232', L: '#86b45e', H: '#2a1e10', d: '#2e4a1e', e: '#ffd040', E: '#c82020', T: '#f0e8d0', B: '#5a3a1e', b: '#3a2410', G: '#a8a8b0', c: '#5a4024', C: '#7a5a34' },
      limbs: limbs('#6a9a4a', '#5a8a3e', '#5a4024', '#3a2410')
    },
    bandit_rogue: {
      head: HEAD_BARE, headOver: [MASK_BARE], torso: TORSO_LEATHER, weapon: 'dagger',
      pal: { H: '#8a2a2a', h: '#5a1a1a', Y: '#a83a3a', S: '#caa883', s: '#9a7a58', e: '#ffffff', E: '#2a1a10', B: '#3a2a2a', A: '#5a3a2a', a: '#3a2418', L: '#7a5a3a', b: '#1a100a', G: '#c8a040' },
      limbs: limbs('#7a5a3a', '#caa883', '#3a2a20', '#2a1a10')
    },
    slime: { kind: 'blob', hitW: 16, pal: { A: '#5ad972', a: '#2a9a44', L: '#aef5bb', d: '#1a6e2e', E: '#0e2a14' } },
    dark_acolyte: {
      head: HEAD_HOOD, torso: TORSO_ROBE, torsoAbove: 12, weapon: 'staff', weaponPal: { B: '#a94fff' },
      pal: { H: '#2a1e3a', h: '#180e24', Y: '#3e2c56', d: '#0a0612', S: '#c9a98a', s: '#9a7a5e', e: '#e8c8ff', E: '#a94fff', A: '#2a1e3a', a: '#180e24', L: '#3e2c56', B: '#a94fff', G: '#8a6a3a' },
      limbs: limbs('#2a1e3a', '#c9a98a', '#180e24', '#0e0a14')
    },
    goblin_archer: {
      head: HEAD_GOBLIN, torso: TORSO_RAGS, weapon: 'bow', legScale: 0.64, legThick: 3, back: quiver('#c7a22a', '#e8e4d8', '#5a3e22', '#3a2814'),
      pal: { G: '#86b552', g: '#5e8a34', d: '#3e6022', e: '#ffd84a', E: '#c81e1e', T: '#f2ead0', C: '#4a5a2a', c: '#2e3a18', k: '#c8a868' },
      limbs: limbs('#86b552', '#7aa64a', '#2e3a18', '#5e8a34')
    },
    skeleton_mage: {
      head: HEAD_HOOD, torso: TORSO_ROBE, torsoAbove: 12, weapon: 'staff', weaponPal: { B: '#6ad9ff', H: '#a89e88', h: '#7a705e' },
      pal: { H: '#2a3a5a', h: '#182438', Y: '#3a4e74', d: '#0a0e18', S: '#e8e2d0', s: '#a89e88', e: '#6ad9ff', E: '#6ad9ff', A: '#2a3a5a', a: '#182438', L: '#3a4e74', B: '#6ad9ff', G: '#a89e88' },
      limbs: limbs('#2a3a5a', '#e8e2d0', '#182438', '#a89e88')
    },
    harpy: {
      head: HEAD_BARE, headOver: [LONG_HAIR], torso: TORSO_LEATHER, legThick: 3,
      back: { type: 'wings', color: '#8a3a4a', light: '#e8d070' },
      pal: { H: '#7a2e3a', h: '#4a1420', Y: '#a8485a', S: '#e0cfa0', s: '#b0a070', e: '#ffe060', E: '#3a1a10', A: '#8a3a4a', a: '#5a1e2a', L: '#a85a6a', B: '#e8d070', b: '#a89040', G: '#e8d070' },
      limbs: limbs('#8a3a4a', '#e0cfa0', '#e0cfa0', '#e8b030')
    },

    // ======== Elites ========
    elite_orc_berserker: {
      head: HEAD_ORC, headOver: [BERSERK_HELM], torso: TORSO_ORC, weapon: 'greataxe', legScale: 1.25, legThick: 5, armThick: 5, hipSpread: 3,
      pal: { S: '#5a8a3e', s: '#3e6428', L: '#76a452', H: '#1a1208', d: '#243c16', e: '#ffd040', E: '#ff2020', T: '#f0e8d0', B: '#8a2a1a', b: '#5a1a0e', G: '#c8c8d0', c: '#4a3420', C: '#6a4a2c', M: '#8a8e98', m: '#5a5e68', W: '#c8ccd6', k: '#e8dcc0' },
      limbs: limbs('#5a8a3e', '#4a7a32', '#4a3420', '#2a1a0e')
    },
    elite_dark_knight: {
      head: HEAD_HELM_CLOSED, headOver: [HORNS], torso: TORSO_PLATE, weapon: 'greatsword', legScale: 1.15, legThick: 5, armThick: 4, hipSpread: 3,
      back: { type: 'cape', color: '#3e1854', len: 6 },
      weaponPal: { W: '#9a8ab0', M: '#6a6080', m: '#3a3450', G: '#8a2fd0', g: '#4a1a70' },
      pal: { M: '#3a3440', m: '#221e28', W: '#5a5266', d: '#0a080e', E: '#d04aff', k: '#4a3a5a', R: '#6a2a8a', r: '#3e1854', B: '#1a1420', b: '#8a2fd0' },
      limbs: limbs('#3a3440', '#221e28', '#2e2a36', '#1a1620')
    },
    elite_shadow_assassin: {
      head: HEAD_HOOD, headOver: [MASK_HOOD], torso: TORSO_LEATHER, weapon: 'dagger', backWeapon: 'dagger',
      weaponPal: { W: '#ffb0ff', M: '#d070ff', m: '#7a2aa8' },
      pal: { H: '#1e1426', h: '#0e0814', Y: '#2e2038', d: '#05030a', S: '#5a4a6a', s: '#3a2e4a', e: '#ff7aff', E: '#ff2aff', A: '#1e1426', a: '#0e0814', L: '#2e2038', B: '#6a1a8a', b: '#3a0e4a', G: '#d02fff' },
      limbs: limbs('#1e1426', '#0e0814', '#140c1c', '#0a0610')
    },
    elite_flame_shaman: {
      head: HEAD_HOOD, headOver: [FEATHERS], torso: TORSO_ROBE, torsoAbove: 12, weapon: 'staff', weaponPal: { B: '#ff6a1a' },
      pal: { H: '#8a2a18', h: '#5a1a0c', Y: '#b84a2a', d: '#2a0a04', S: '#c9a98a', s: '#9a7a5e', e: '#ffe060', E: '#ff6a1a', R: '#ff8a2a', r: '#d84a1a', G: '#e0b040', A: '#8a2a18', a: '#5a1a0c', L: '#b84a2a', B: '#ff8a2a' },
      limbs: limbs('#8a2a18', '#c9a98a', '#5a1a0c', '#2a0a04')
    },
    elite_frost_archer: {
      head: HEAD_HOOD, torso: TORSO_LEATHER, weapon: 'bow', back: quiver('#8dd9ff', '#ffffff', '#4a6a80', '#2a4a60'),
      weaponPal: { h: '#4a6a80', H: '#8dd9ff', G: '#ffffff', w: '#e8f8ff' },
      pal: { H: '#8aaac4', h: '#5a7a96', Y: '#e8f4ff', d: '#2a4a60', S: '#e8c8a8', s: '#b89878', e: '#ffffff', E: '#3a8ad0', A: '#2a4a6a', a: '#182e44', L: '#3e6a92', B: '#d8e8f0', b: '#a8c0d0', G: '#8dd9ff' },
      limbs: limbs('#2a4a6a', '#cfe0ea', '#182e44', '#d8e8f0')
    },

    // ======== Bosses (authored at 1x, displayed at 2x) ========
    bone_king: {
      head: HEAD_SKULL, headOver: [CROWN], torso: TORSO_PLATE, weapon: 'greatsword', legScale: 1.1, legThick: 3, armThick: 3, pixelScale: 2,
      back: { type: 'cape', color: '#6a1a2a', len: 8 },
      weaponPal: { W: '#fff4e0', M: '#e8dcc0', m: '#a89e88', G: '#e0b040', g: '#8a6a20' },
      pal: { T: '#f0eadc', t: '#b0a690', W: '#fff4c8', d: '#2a1a20', E: '#ff3020', G: '#e0b040', R: '#c02040', M: '#c8a040', m: '#8a6a20', r: '#3a1854', B: '#2a1a10', b: '#e0b040' },
      limbs: limbs('#f0eadc', '#d8d0bc', '#f0eadc', '#c8a040')
    },
    fire_golem: {
      head: HEAD_GOLEM, torso: TORSO_ROCK, armThick: 6, legThick: 6, hipSpread: 4, armLen: 9, pixelScale: 2,
      glow: { r: 70, i: 0.28 },
      pal: { A: '#6e5648', a: '#3e2e26', L: '#9a7c64', R: '#ff8a1a', E: '#fff060' },
      limbs: limbs('#6e5648', '#52402e', '#52402e', '#3e2e26')
    },
    shadow_queen: {
      head: HEAD_BARE, headOver: [LONG_HAIR, CROWN], torso: TORSO_ROBE, torsoAbove: 12, weapon: 'dagger', backWeapon: 'dagger', pixelScale: 2,
      back: { type: 'cape', color: '#2a0e44', len: 10 },
      weaponPal: { W: '#ffb0ff', M: '#d070ff', m: '#7a2aa8', G: '#c8a0ff' },
      pal: { H: '#2a0e44', h: '#14061e', Y: '#4a1e6a', S: '#ece0ee', s: '#bca8c4', e: '#ff6aff', E: '#ff2aff', G: '#c8a0ff', R: '#ff2aff', A: '#3a1a5a', a: '#1e0c34', L: '#5a2e86', B: '#d02fff' },
      limbs: limbs('#3a1a5a', '#ece0ee', '#1e0c34', '#0a0614')
    },
    ancient_dragon: {
      kind: 'dragon', frame: 80, pixelScale: 2, hitW: 64, hitH: 60, head: DRAGON_HEAD, headOpen: DRAGON_HEAD_OPEN,
      pal: { A: '#8a2a2a', L: '#b84a3a', B: '#e0a050', M: '#a83a2a', h: '#e8d8b0', a: '#5a1414', E: '#ffe040', T: '#ffffff', d: '#2a0a0a', O: '#ff8a2a' }
    },
    fallen_paladin: {
      head: HEAD_HELM_CLOSED, headOver: [HORNS], torso: TORSO_PLATE, weapon: 'greatsword', legScale: 1.1, legThick: 4, armThick: 4, pixelScale: 2,
      back: { type: 'cape', color: '#3a1a4a', len: 9 },
      weaponPal: { W: '#e0c8ff', M: '#a888d8', m: '#5a3a8a', G: '#c8a040' },
      pal: { M: '#8a8e9c', m: '#5a5e6a', W: '#c8ccd6', d: '#1a1420', E: '#c84aff', k: '#3a2a4a', R: '#4a2a6a', r: '#2a1440', B: '#3a2a1e', b: '#c8a040' },
      limbs: limbs('#8a8e9c', '#5a5e6a', '#6a6e7a', '#3a3e48')
    },

    // ======== Duel rivals ========
    rival_captain: {
      head: HEAD_HELM, torso: TORSO_ARMOR, weapon: 'sword', back: { type: 'cape', color: '#2a4a9a', len: 6 },
      pal: { M: '#b8c0cc', m: '#7a8290', W: '#eef2f6', d: '#4a505c', R: '#3a6ad0', r: '#24407a', S: '#e0b48a', s: '#b4845a', e: '#ffffff', E: '#20182a', B: '#4a3020', b: '#e8c050' },
      limbs: limbs('#a8b0bc', '#7c8490', '#2a3a6a', '#4a3020')
    },
    rival_mystic: {
      head: HEAD_HOOD, torso: TORSO_ROBE, torsoAbove: 12, weapon: 'staff', weaponPal: { B: '#ff7aff' },
      pal: { H: '#4a2a6a', h: '#2a1440', Y: '#6a3e8e', d: '#12081e', S: '#d9b99a', s: '#aa8a6a', e: '#ffffff', E: '#ff7aff', A: '#4a2a6a', a: '#2a1440', L: '#6a3e8e', B: '#e0b040', G: '#e0b040' },
      limbs: limbs('#4a2a6a', '#d9b99a', '#2a1440', '#1a0e28')
    },
    rival_blade: {
      head: HEAD_BARE, headOver: [MASK_BARE], torso: TORSO_LEATHER, weapon: 'dagger', backWeapon: 'dagger',
      pal: { H: '#d8c080', h: '#a89050', Y: '#f0dca0', B: '#6a2a1a', S: '#b08860', s: '#8a6a44', e: '#ffffff', E: '#2a1a10', A: '#c8a868', a: '#9a7e48', L: '#e0c888', b: '#4a1a10', G: '#e0b040' },
      limbs: limbs('#c8a868', '#b08860', '#6a5a3a', '#4a3a20')
    },
    rival_guardian: {
      head: HEAD_HELM_CLOSED, torso: TORSO_PLATE, weapon: 'axe', legScale: 1.15, legThick: 5, armThick: 4, hipSpread: 3,
      pal: { M: '#aab4c0', m: '#6c7482', W: '#e6eaf0', d: '#1a1e24', E: '#6ad9ff', R: '#2a7a8a', r: '#1a4a5a', B: '#3a3a3a', b: '#6ad9ff' },
      limbs: limbs('#aab4c0', '#6c7482', '#5a626e', '#3a3e48')
    }
  };
})();

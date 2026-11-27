// Procedural pixel-art tiles (16x16) and decoration sprites. All generated pixel-by-pixel with a
// seeded RNG, so they are deterministic and cached as canvases.
window.PL = window.PL || {};

PL.Tiles = (function () {
  const Buf = () => PL.Pixel.Buf;
  const cache = {};
  const sh = (c, a) => PL.U.shade(c, a);

  function memo(key, fn) { return cache[key] || (cache[key] = fn()); }

  // ---------------- 16x16 tiles ----------------
  function brick(pal, seed, bw, bh) {
    bw = bw || 8; bh = bh || 4;
    const r = PL.Pixel.rng(seed);
    const b = new (Buf())(16, 16);
    for (let row = 0; row < 16 / bh; row++) {
      const y0 = row * bh, off = (row % 2) * (bw / 2);
      for (let bx = -off; bx < 16; bx += bw) {
        const v = r();
        const col = v < 0.3 ? pal.dark : v > 0.75 ? pal.light : pal.base;
        for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) {
          const x = (((bx + i) % 16) + 16) % 16;
          let c = col;
          if (j === bh - 1 || i === bw - 1) c = pal.mortar;
          else if (j === 0 || i === 0) c = sh(col, 0.16);
          else if (r() < 0.09) c = sh(col, -0.16);
          b.put(x, y0 + j, c);
        }
      }
    }
    return b;
  }

  function dirt(pal, seed) {
    const r = PL.Pixel.rng(seed);
    const b = new (Buf())(16, 16);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = r();
      b.put(x, y, v < 0.1 ? pal.dark : v < 0.18 ? pal.light : pal.base);
    }
    for (let k = 0; k < 3; k++) {
      const x = Math.floor(r() * 14), y = Math.floor(r() * 14);
      b.rect(x, y, 2, 2, pal.pebble || pal.light);
      b.put(x + 1, y + 1, sh(pal.pebble || pal.light, -0.3));
    }
    return b;
  }

  function planks(pal, seed) {
    const r = PL.Pixel.rng(seed);
    const b = new (Buf())(16, 16);
    for (let row = 0; row < 4; row++) {
      const y0 = row * 4, seam = Math.floor(r() * 16);
      const base = r() < 0.5 ? pal.base : sh(pal.base, r() < 0.5 ? 0.07 : -0.07);
      for (let j = 0; j < 4; j++) for (let x = 0; x < 16; x++) {
        let c = j === 3 ? pal.gap : j === 0 ? sh(base, 0.18) : base;
        if (x === seam && j < 3) c = pal.gap;
        else if ((j === 1 || j === 2) && r() < 0.12) c = sh(base, -0.2);
        b.put(x, y0 + j, c);
      }
      if (pal.nail) { b.put((seam + 2) % 16, y0 + 1, pal.nail); b.put((seam + 14) % 16, y0 + 1, pal.nail); }
    }
    return b;
  }

  function vplanks(pal, seed) {
    const r = PL.Pixel.rng(seed);
    const b = new (Buf())(16, 16);
    for (let col = 0; col < 4; col++) {
      const x0 = col * 4;
      const base = r() < 0.5 ? pal.base : sh(pal.base, -0.08);
      for (let y = 0; y < 16; y++) for (let i = 0; i < 4; i++) {
        let c = i === 3 ? pal.gap : i === 0 ? sh(base, 0.12) : base;
        if (i > 0 && i < 3 && r() < 0.1) c = sh(base, -0.18);
        b.put(x0 + i, y, c);
      }
    }
    return b;
  }

  function grassTop(pal, seed) {
    const b = dirt(pal, seed);
    const r = PL.Pixel.rng(seed + 7);
    for (let x = 0; x < 16; x++) {
      const depth = 3 + Math.floor(r() * 3);
      for (let y = 0; y < depth; y++) b.put(x, y, y === 0 ? pal.grassLight : y === depth - 1 ? pal.grassDark : pal.grass);
    }
    return b;
  }

  const GEN = { brick, dirt, planks, vplanks, grassTop, bigBrick: (p, s) => brick(p, s, 16, 8) };

  function tile(kind, pal, variant, topEdge) {
    const key = 'tile|' + kind + '|' + JSON.stringify(pal) + '|' + variant + '|' + (topEdge ? 1 : 0);
    return memo(key, () => {
      const b = GEN[kind](pal, 1 + variant * 101);
      if (topEdge) for (let x = 0; x < 16; x++) { const c = b.get(x, 0); b.put(x, 0, sh(c, 0.3)); b.put(x, 1, sh(b.get(x, 1), 0.12)); }
      return b.toCanvas();
    });
  }

  // ---------------- Decorations ----------------
  const WOOD = { base: '#8a5a30', light: '#a8723e', dark: '#5e3a1c' };
  const IRON = { base: '#7a808c', light: '#a4aab4', dark: '#4e535c' };
  const GOLD = { base: '#e0b040', light: '#ffe08a', dark: '#a87a1c' };

  function torchBase() {
    return memo('torchBase', () => {
      const b = new (Buf())(7, 14);
      b.rect(3, 5, 2, 7, WOOD.base); b.put(3, 5, WOOD.light); b.rect(4, 6, 1, 6, WOOD.dark);
      b.rect(2, 10, 4, 2, IRON.base); b.put(2, 10, IRON.light);
      b.outline();
      return b.toCanvas();
    });
  }
  const FLAMES = [
    ['..r..', '.ryr.', 'roYyo', 'oYYYo', '.oYo.'],
    ['.r...', '.ryr.', 'oyYyr', 'oYYYo', '.oYo.'],
    ['...r.', '.ryo.', 'ryYoo', 'oYYYo', '.oYo.']
  ];
  const FLAME_PAL = { Y: '#fff4b0', y: '#ffd04a', o: '#ff8a2a', r: '#d8481a' };
  function flame(frame) {
    return memo('flame|' + frame, () => {
      const b = new (Buf())(5, 5);
      b.grid(FLAMES[frame % FLAMES.length], FLAME_PAL, 0, 0);
      return b.toCanvas();
    });
  }
  function smallFlame(frame) {
    return memo('sflame|' + frame, () => {
      const b = new (Buf())(3, 4);
      b.grid(frame % 2 ? ['.y.', 'yYo', 'oYo', '.o.'] : ['y..', 'yYy', 'oYo', '.o.'], FLAME_PAL, 0, 0);
      return b.toCanvas();
    });
  }

  function chandelier() {
    return memo('chandelier', () => {
      const b = new (Buf())(28, 12);
      b.rect(2, 8, 24, 2, IRON.base); b.rect(2, 8, 24, 1, IRON.light);
      b.rect(12, 4, 4, 5, IRON.base); b.put(12, 4, IRON.light);
      for (const x of [3, 13, 23]) { b.rect(x, 3, 2, 5, '#f2ead8'); b.put(x + 1, 4, '#c8bea8'); b.rect(x - 1, 8, 4, 1, GOLD.base); }
      b.rect(6, 10, 2, 2, GOLD.dark); b.rect(20, 10, 2, 2, GOLD.dark);
      b.outline();
      return b.toCanvas();
    });
  }

  function lantern() {
    return memo('lantern', () => {
      const b = new (Buf())(8, 12);
      b.rect(2, 0, 4, 2, IRON.dark); b.rect(1, 2, 6, 1, IRON.base);
      b.rect(1, 3, 6, 6, '#ffcc5a'); b.rect(2, 4, 4, 4, '#fff0a8');
      b.rect(1, 3, 1, 6, IRON.base); b.rect(6, 3, 1, 6, IRON.base);
      b.rect(1, 9, 6, 1, IRON.base); b.rect(2, 10, 4, 1, IRON.dark);
      b.outline();
      return b.toCanvas();
    });
  }

  const EMBLEMS = {
    sword: ['..W..', '..W..', '..W..', 'GWWWG', '..g..'],
    crown: ['G.G.G', 'GGGGG', 'GRGRG', 'GGGGG', '.....'],
    skull: ['.WWW.', 'WEWEW', 'WWWWW', '.W.W.', '.....'],
    star: ['..G..', '.GGG.', 'GGGGG', '.G.G.', 'G...G']
  };
  function banner(color, emblem) {
    return memo('banner|' + color + '|' + emblem, () => {
      const b = new (Buf())(14, 32);
      b.rect(0, 0, 14, 2, WOOD.base); b.rect(0, 0, 14, 1, WOOD.light);
      b.rect(2, 2, 10, 24, color);
      b.rect(2, 2, 1, 24, sh(color, 0.2)); b.rect(11, 2, 1, 24, sh(color, -0.3));
      b.rect(3, 4, 8, 1, GOLD.base); b.rect(3, 22, 8, 1, GOLD.base);
      for (let i = 0; i < 5; i++) { b.put(2 + i, 26 + i, color); b.put(11 - i, 26 + i, color); }
      for (let y = 26; y < 31; y++) for (let x = 2; x < 12; x++) if (x - 2 < 5 - (y - 26) || 11 - x < 5 - (y - 26)) b.put(x, y, sh(color, -0.1));
      b.grid(EMBLEMS[emblem] || EMBLEMS.sword, { W: '#f2ead8', G: GOLD.base, g: GOLD.dark, R: '#d02a2a', E: '#1a1420' }, 5, 11);
      b.outline();
      return b.toCanvas();
    });
  }

  function chest(seed) {
    return memo('chest|' + seed, () => {
      const b = new (Buf())(16, 12);
      const wood = seed % 2 ? WOOD : { base: '#6a4a8a', light: '#8a68aa', dark: '#4a3266' };
      b.rect(0, 0, 16, 12, wood.base); b.rect(0, 0, 16, 1, wood.light); b.rect(0, 4, 16, 1, wood.dark);
      b.rect(0, 11, 16, 1, wood.dark);
      for (const x of [2, 13]) b.rect(x, 0, 1, 12, GOLD.base);
      b.rect(7, 3, 2, 4, GOLD.base); b.put(7, 3, GOLD.light); b.put(8, 6, GOLD.dark);
      b.outline();
      return b.toCanvas();
    });
  }

  function barrel() {
    return memo('barrel', () => {
      const b = new (Buf())(12, 15);
      for (let x = 0; x < 12; x++) {
        const c = x < 2 ? WOOD.dark : x < 4 ? WOOD.base : x < 7 ? WOOD.light : x < 10 ? WOOD.base : WOOD.dark;
        const inset = (x === 0 || x === 11) ? 1 : 0;
        b.rect(x, inset, 1, 15 - inset * 2, c);
      }
      for (const y of [2, 12]) b.rect(0, y, 12, 1, IRON.base);
      b.rect(2, 0, 8, 1, WOOD.light);
      b.outline();
      return b.toCanvas();
    });
  }

  const BOOK_COLORS = ['#b83a3a', '#3a6ab8', '#3a9a4a', '#c8a03a', '#8a3ab0', '#d87a2a', '#2a8a8a'];
  function bookshelf(seed) {
    return memo('bookshelf|' + seed, () => {
      const r = PL.Pixel.rng(seed);
      const b = new (Buf())(26, 32);
      b.rect(0, 0, 26, 32, WOOD.dark);
      b.rect(0, 0, 26, 2, WOOD.base); b.rect(0, 0, 2, 32, WOOD.base); b.rect(24, 0, 2, 32, WOOD.base);
      for (const y of [10, 20, 30]) b.rect(0, y, 26, 2, WOOD.base);
      for (const shelfTop of [2, 12, 22]) {
        let x = 2;
        while (x < 23) {
          const w = 2 + Math.floor(r() * 2), h = 6 + Math.floor(r() * 3);
          if (x + w > 24) break;
          const c = BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)];
          b.rect(x, shelfTop + 8 - h, w, h, c);
          b.rect(x, shelfTop + 8 - h, 1, h, sh(c, 0.25));
          b.put(x + w - 1, shelfTop + 8 - h + 2, GOLD.light);
          x += w + (r() < 0.2 ? 1 : 0);
        }
      }
      b.outline();
      return b.toCanvas();
    });
  }

  function table() {
    return memo('table', () => {
      const b = new (Buf())(26, 11);
      b.rect(0, 0, 26, 3, WOOD.base); b.rect(0, 0, 26, 1, WOOD.light);
      b.rect(2, 3, 2, 8, WOOD.dark); b.rect(22, 3, 2, 8, WOOD.dark);
      b.rect(4, 6, 18, 1, WOOD.dark);
      b.outline();
      return b.toCanvas();
    });
  }

  function candleStick() {
    return memo('candle', () => {
      const b = new (Buf())(5, 7);
      b.rect(1, 0, 3, 5, '#f2ead8'); b.put(3, 1, '#c8bea8');
      b.rect(0, 5, 5, 2, GOLD.base); b.put(0, 5, GOLD.light);
      b.outline();
      return b.toCanvas();
    });
  }

  const ITEMS = {
    sword: { rows: ['......W', '.....WM', '....WM.', '.g.WM..', '..gM...', '.hgg...', 'h......'], pal: { W: '#eef2f6', M: '#9aa4b2', g: '#e0b040', h: '#6a4424' } },
    bow: { rows: ['..hh...', '.h..s..', 'h...s..', 'h...s..', 'h...s..', '.h..s..', '..hh...'], pal: { h: '#a8723e', s: '#e8e4d8' } },
    staff: { rows: ['.....BB', '.....BB', '....h..', '...h...', '..h....', '.h.....', 'h......'], pal: { B: '#6ad9ff', h: '#8a5a30' } },
    potion: { rows: ['..c..', '..g..', '.ggg.', 'gRRRg', 'gRWRg', 'gRRRg', '.ggg.'], pal: { c: '#8a5a30', g: '#c8e0f0', R: '#e03a5a', W: '#ffb0c0' } },
    shield: { rows: ['IIIIIII', 'IRRGRRI', 'IRGGGRI', 'IRRGRRI', '.IRRRI.', '..IRI..', '...I...'], pal: { I: '#a4aab4', R: '#b83a3a', G: '#e0b040' } }
  };
  function itemFrame(item) {
    return memo('frame|' + item, () => {
      const b = new (Buf())(15, 15);
      b.rect(0, 0, 15, 15, WOOD.base); b.rect(0, 0, 15, 1, WOOD.light); b.rect(0, 0, 1, 15, WOOD.light);
      b.rect(2, 2, 11, 11, '#3a2a22');
      const it = ITEMS[item];
      b.grid(it.rows, it.pal, 2 + Math.floor((11 - it.rows[0].length) / 2), 4);
      b.outline();
      return b.toCanvas();
    });
  }

  function skullPlaque() {
    return memo('skullPlaque', () => {
      const b = new (Buf())(16, 17);
      b.rect(1, 0, 14, 12, WOOD.base); b.rect(3, 12, 10, 2, WOOD.base); b.rect(5, 14, 6, 2, WOOD.base);
      b.rect(1, 0, 14, 1, WOOD.light);
      b.grid(['.WWWWWW.', 'WWWWWWWW', 'WEEWWEEW', 'WEEWWEEW', 'WWWNNWWW', '.WWWWWW.', '.W.WW.W.'], { W: '#efe8d4', E: '#1a1420', N: '#7a705e' }, 4, 3);
      b.outline();
      return b.toCanvas();
    });
  }

  function plant(seed) {
    return memo('plant|' + seed, () => {
      const r = PL.Pixel.rng(seed);
      const b = new (Buf())(14, 18);
      b.rect(3, 12, 8, 6, '#b8643a'); b.rect(3, 12, 8, 1, '#d8844e'); b.rect(9, 13, 2, 5, '#8a4426');
      const greens = ['#3a8a3a', '#4eaa44', '#2e6a2e'];
      for (let i = 0; i < 18; i++) {
        const x = 2 + Math.floor(r() * 10), y = 1 + Math.floor(r() * 11);
        b.rect(x, y, 2, 2, greens[Math.floor(r() * 3)]);
      }
      b.rect(6, 6, 1, 6, '#2e6a2e');
      b.outline();
      return b.toCanvas();
    });
  }

  const BOTTLES = ['#e03a5a', '#3a8ae0', '#4ec85a', '#c86ae0', '#e0c03a'];
  function potionShelf(seed) {
    return memo('pshelf|' + seed, () => {
      const r = PL.Pixel.rng(seed);
      const b = new (Buf())(30, 14);
      b.rect(0, 11, 30, 3, WOOD.base); b.rect(0, 11, 30, 1, WOOD.light);
      b.rect(2, 13, 2, 1, WOOD.dark); b.rect(26, 13, 2, 1, WOOD.dark);
      let x = 2;
      while (x < 26) {
        const c = BOTTLES[Math.floor(r() * BOTTLES.length)];
        const tall = r() < 0.5;
        if (tall) { b.rect(x + 1, 2, 2, 2, '#c8e0f0'); b.rect(x, 4, 4, 7, c); b.put(x + 1, 5, '#ffffff'); b.put(x + 1, 1, '#8a5a30'); }
        else { b.rect(x + 1, 5, 2, 1, '#c8e0f0'); b.rect(x, 6, 4, 5, c); b.put(x + 1, 7, '#ffffff'); b.put(x + 1, 4, '#8a5a30'); }
        x += 5 + Math.floor(r() * 2);
      }
      b.outline();
      return b.toCanvas();
    });
  }

  function windowFrame() {
    return memo('window', () => {
      const b = new (Buf())(28, 38);
      b.rect(0, 0, 28, 2, WOOD.base); b.rect(0, 0, 2, 36, WOOD.base); b.rect(26, 0, 2, 36, WOOD.base);
      b.rect(0, 0, 28, 1, WOOD.light);
      b.rect(13, 2, 2, 32, WOOD.base); b.rect(2, 17, 24, 2, WOOD.base);
      b.rect(0, 34, 28, 2, WOOD.base);
      b.rect(-1, 36, 30, 2, WOOD.light);
      b.rect(0, 36, 28, 2, WOOD.dark); b.rect(0, 36, 28, 1, WOOD.light);
      b.outline();
      return b.toCanvas();
    });
  }

  function crystal(color) {
    return memo('crystal|' + color, () => {
      const b = new (Buf())(11, 16);
      for (let y = 0; y < 16; y++) {
        const half = y < 8 ? Math.floor(y * 0.7) : Math.floor((15 - y) * 0.7);
        for (let x = 5 - half; x <= 5 + half; x++) b.put(x, y, x < 5 ? sh(color, 0.35) : x === 5 ? color : sh(color, -0.25));
      }
      b.put(4, 4, '#ffffff'); b.put(4, 5, '#ffffff');
      b.outline(-0.6);
      return b.toCanvas();
    });
  }

  const ARMORS = [
    { plate: '#c8ccd6', trim: '#e0b040', plume: '#d03030' },
    { plate: '#e0b040', trim: '#fff0a0', plume: '#3a6ab8' },
    { plate: '#6a4a8a', trim: '#c8a0ff', plume: '#e0e0e0' },
    { plate: '#b84a2a', trim: '#ffb060', plume: '#ffd040' }
  ];
  // Armour stand (mannequin) or, with stone=true, a stone knight statue on a pedestal.
  function armorStand(variant, stone) {
    return memo('stand|' + variant + '|' + (stone ? 1 : 0), () => {
      const a = ARMORS[variant % ARMORS.length];
      const metal = stone ? '#8a8e98' : '#a4aab4';
      const plate = stone ? '#9a9ea8' : a.plate;
      const trim = stone ? '#b8bcc6' : a.trim;
      const b = new (Buf())(16, 36);
      const top = stone ? 0 : 2;
      if (stone) { b.rect(0, 30, 16, 6, '#6a6e78'); b.rect(0, 30, 16, 1, '#8a8e98'); b.rect(2, 32, 12, 1, '#5a5e68'); }
      else { b.rect(2, 33, 12, 3, WOOD.base); b.rect(2, 33, 12, 1, WOOD.light); b.rect(7, 26, 2, 7, WOOD.dark); }
      b.rect(4, top + 20, 3, 9, metal); b.rect(9, top + 20, 3, 9, sh(metal, -0.12));
      b.rect(3, top + 9, 10, 11, plate); b.rect(3, top + 9, 1, 11, sh(plate, 0.25)); b.rect(12, top + 9, 1, 11, sh(plate, -0.3));
      b.rect(7, top + 10, 2, 8, trim);
      b.rect(3, top + 18, 10, 2, stone ? '#7a7e88' : '#6a4424');
      b.rect(1, top + 9, 3, 4, metal); b.rect(12, top + 9, 3, 4, metal);
      b.rect(4, top + 1, 8, 8, metal); b.rect(4, top + 1, 8, 1, sh(metal, 0.3));
      b.rect(6, top + 4, 6, 1, '#1a1420');
      b.rect(6, top - 1 < 0 ? 0 : top - 1, 4, 2, stone ? '#b8bcc6' : a.plume);
      if (stone) { b.rect(14, 6, 1, 18, '#c8ccd6'); b.rect(13, 22, 3, 1, '#9a9ea8'); }
      b.outline();
      return b.toCanvas();
    });
  }

  function tombstone() {
    return memo('tombstone', () => {
      const b = new (Buf())(12, 15);
      b.rect(1, 2, 10, 13, '#8a8e98'); b.rect(2, 0, 8, 2, '#8a8e98');
      b.rect(1, 2, 1, 13, '#a8acb6'); b.rect(2, 0, 8, 1, '#a8acb6'); b.rect(10, 2, 1, 13, '#6a6e78');
      b.rect(5, 3, 2, 8, '#5a5e68'); b.rect(3, 5, 6, 2, '#5a5e68');
      b.rect(0, 13, 12, 2, '#6a5a48');
      b.outline();
      return b.toCanvas();
    });
  }

  return {
    armorStand, tombstone, tile, torchBase, flame, smallFlame, chandelier, lantern, banner, chest, barrel, bookshelf, table,
    candleStick, itemFrame, skullPlaque, plant, potionShelf, windowFrame, crystal, WOOD, IRON, GOLD
  };
})();

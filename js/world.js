// Tile-built arenas: ceiling, beam, brick walls, pillars, floor, and decoration modules between pillars.
// The static part is pre-rendered once per arena; flames, window skies/snow and lights animate per frame.
window.PL = window.PL || {};

const SKY_SNOW = ['#8aa4c8', '#a2b8d4', '#b8cade', '#ccdbe8', '#dfe9f2'];
const SKY_DUSK = ['#2a2a4a', '#3a3458', '#52406a', '#7a5478', '#a8687a'];
const SKY_FOREST = ['#6a9ac8', '#82acd2', '#9cbedc', '#b6d0e6', '#d0e2f0'];
const SKY_STAINED = ['#5a2a8a', '#2a4aa8', '#a82a4a', '#2a8a7a', '#c8902a'];

const T = {
  hallWall: { base: '#5e4b40', light: '#6c574a', dark: '#514036', mortar: '#33281f' },
  hallWood: { base: '#6a4426', gap: '#3e2614' },
  floorPlank: { base: '#b07a40', gap: '#5a3a1c', nail: '#e0d8c8' },
  redBrick: { base: '#9a5a5a', light: '#ae6a68', dark: '#864c4c', mortar: '#4a2828' },
  ceilWood: { base: '#4a3220', gap: '#24160c' },
  greyStone: { base: '#6a6e7a', light: '#7c808c', dark: '#5a5e6a', mortar: '#33363e' }
};

const THEMES = {
  arena: {
    wall: ['brick', T.hallWall], wainscot: ['vplanks', T.hallWood], floorTop: ['planks', T.floorPlank], floor: ['brick', T.redBrick],
    ceiling: ['planks', T.ceilWood], side: ['bigBrick', T.greyStone], sky: SKY_SNOW, snow: true, ambient: 0.66, tint: [1.0, 0.95, 1.1],
    banners: ['#a83a3a', '#3a5aa8'], emblems: ['sword', 'crown'], modules: ['window', 'frames', 'shelf', 'banner', 'trophy', 'window']
  },
  crypt: {
    wall: ['brick', { base: '#3e3848', light: '#4a4456', dark: '#34303e', mortar: '#1c1922' }], wainscot: null,
    floorTop: ['bigBrick', { base: '#6a6674', light: '#7a7684', dark: '#5a5664', mortar: '#2a2830' }],
    floor: ['bigBrick', { base: '#4a4654', light: '#56525e', dark: '#3e3a48', mortar: '#1e1c24' }],
    ceiling: ['dirt', { base: '#26222e', light: '#2e2a36', dark: '#1c1922', pebble: '#36323e' }], side: ['bigBrick', T.greyStone],
    sky: null, ambient: 0.4, tint: [0.85, 0.9, 1.25], fx: 'wisps', fxColor: '#8ad0ff', banners: ['#5a2a7a', '#3a3a4a'], emblems: ['skull'], modules: ['trophy', 'shelf', 'banner', 'trophy']
  },
  volcanic: {
    wall: ['dirt', { base: '#3a2420', light: '#4a2e28', dark: '#2c1a16', pebble: '#5a3a30' }], wainscot: null,
    floorTop: ['bigBrick', { base: '#3a3042', light: '#4a3e54', dark: '#2a2230', mortar: '#120e16' }],
    floor: ['dirt', { base: '#2a1a16', light: '#3a2218', dark: '#1e120e', pebble: '#ff6a1a' }],
    ceiling: ['dirt', { base: '#241612', light: '#2e1c16', dark: '#1a0e0a', pebble: '#3a2420' }], side: ['bigBrick', { base: '#3a2a2a', light: '#4a3434', dark: '#2e2020', mortar: '#140c0c' }],
    sky: null, ambient: 0.36, tint: [1.25, 0.8, 0.7], fx: 'embers', fxColor: '#ff8a2a', banners: ['#a8401a'], emblems: ['star'], modules: ['crystalOrange', 'banner', 'trophy', 'crystalOrange']
  },
  voidrealm: {
    wall: ['brick', { base: '#2a1a3e', light: '#36224e', dark: '#221432', mortar: '#120a1e' }], wainscot: null,
    floorTop: ['bigBrick', { base: '#4a2e6a', light: '#5a387e', dark: '#3e2658', mortar: '#1a0e2a' }],
    floor: ['bigBrick', { base: '#2e1c44', light: '#382252', dark: '#261638', mortar: '#120a1e' }],
    ceiling: ['dirt', { base: '#1a0e28', light: '#221232', dark: '#12081e', pebble: '#3a1e5a' }], side: ['bigBrick', { base: '#3a2a4e', light: '#46345e', dark: '#2e2040', mortar: '#160e22' }],
    sky: null, ambient: 0.32, tint: [1.0, 0.75, 1.35], fx: 'sparks', fxColor: '#d04aff', banners: ['#7a2aa8'], emblems: ['star'], modules: ['crystal', 'banner', 'crystal', 'trophy']
  },
  skyruins: {
    wall: ['bigBrick', { base: '#9aa4b4', light: '#aeb8c6', dark: '#8892a2', mortar: '#5a6272' }], wainscot: null,
    floorTop: ['grassTop', { base: '#6a5a4a', light: '#7a6a58', dark: '#5a4a3c', pebble: '#8a7a68', grass: '#e8f0f6', grassLight: '#ffffff', grassDark: '#b8c8d8' }],
    floor: ['dirt', { base: '#6a5a4a', light: '#7a6a58', dark: '#5a4a3c', pebble: '#8a7a68' }],
    ceiling: ['bigBrick', { base: '#7a8494', light: '#8a94a4', dark: '#6c7686', mortar: '#4a5262' }], side: ['bigBrick', T.greyStone],
    sky: SKY_SNOW, snow: true, ambient: 0.82, tint: [0.95, 1.0, 1.12], banners: ['#3a6ab8', '#e8e8f0'], emblems: ['star', 'sword'], modules: ['window', 'banner', 'window', 'trophy']
  },
  cathedral: {
    wall: ['bigBrick', { base: '#5a5668', light: '#6a6678', dark: '#4e4a5c', mortar: '#2a2834' }], wainscot: ['vplanks', { base: '#4a3428', gap: '#2a1c14' }],
    floorTop: ['brick', { base: '#8a8698', light: '#9a96a8', dark: '#7a768a', mortar: '#4a4658' }],
    floor: ['brick', { base: '#6a6678', light: '#7a7688', dark: '#5e5a6c', mortar: '#3a3646' }],
    ceiling: ['planks', T.ceilWood], side: ['bigBrick', T.greyStone],
    sky: SKY_STAINED, windowLight: '#c898ff', ambient: 0.5, tint: [1.0, 0.92, 1.2], banners: ['#6a2a8a', '#a8902a'], emblems: ['crown', 'star'], modules: ['window', 'trophy', 'window', 'shelf']
  },
  forest: {
    wall: ['vplanks', { base: '#7a5432', gap: '#4a3018' }], wainscot: null,
    floorTop: ['grassTop', { base: '#6a4a2e', light: '#7a583a', dark: '#5a3c24', pebble: '#8a7a68', grass: '#4eaa44', grassLight: '#7ad06a', grassDark: '#2e7a2e' }],
    floor: ['dirt', { base: '#6a4a2e', light: '#7a583a', dark: '#5a3c24', pebble: '#8a7a68' }],
    ceiling: ['planks', T.ceilWood], side: ['dirt', { base: '#5a3c24', light: '#6a4a2e', dark: '#4a301c', pebble: '#7a6a58' }],
    sky: SKY_FOREST, ambient: 0.7, tint: [0.95, 1.08, 0.92], fx: 'spores', fxColor: '#cfe8a0', banners: ['#3a8a3a'], emblems: ['star'], modules: ['window', 'shelf', 'frames', 'window']
  },
  survival: {
    wall: ['dirt', { base: '#3a3230', light: '#463c3a', dark: '#2e2826', pebble: '#5a4e4a' }], wainscot: null,
    floorTop: ['bigBrick', { base: '#5a524e', light: '#6a605c', dark: '#4e4642', mortar: '#2a2422' }],
    floor: ['dirt', { base: '#2e2624', light: '#3a302e', dark: '#241e1c', pebble: '#4a403c' }],
    ceiling: ['dirt', { base: '#221c1a', light: '#2a2220', dark: '#1a1412', pebble: '#3a3230' }], side: ['bigBrick', T.greyStone],
    sky: SKY_DUSK, ambient: 0.44, tint: [1.05, 0.9, 1.05], fx: 'ash', fxColor: '#9a8e94', banners: ['#8a2a2a'], emblems: ['skull'], modules: ['frames', 'banner', 'window', 'trophy']
  }
};

const PILLAR_GAP = 144, PILLAR_W = 10, LX0 = -64, ABOVE = 520, BELOW = 64;

PL.World = {
  width: 1600,
  groundY: 300,
  theme: 'arena',
  _layer: null,
  _dyn: [],
  _time: 0,

  camera: {
    x: 0, shakeTime: 0, shakeMag: 0,
    shake(mag, time) { this.shakeMag = Math.max(this.shakeMag, mag); this.shakeTime = Math.max(this.shakeTime, time); },
    update(dt, targetX) {
      const half = PL.VIEW_W / 2;
      const desired = PL.U.clamp(targetX - half, 0, Math.max(0, PL.World.width - PL.VIEW_W));
      this.x = PL.U.lerp(this.x, desired, Math.min(1, dt * 7));
      if (this.shakeTime > 0) this.shakeTime -= dt; else this.shakeMag = 0;
    },
    offsetX() {
      return this.shakeTime > 0 ? this.x + (Math.random() - 0.5) * this.shakeMag : this.x;
    },
    reset() { this.x = 0; this.shakeTime = 0; this.shakeMag = 0; }
  },

  // Ambient light colour (brightness x biome tint) used by the light map.
  ambient() { const t = THEMES[this.theme]; return t.tint.map(v => v * t.ambient); },
  // Screen-space y offset that puts the floor surface 3 tiles above the bottom edge.
  offsetY() { return Math.round(PL.VIEW_H - 48 - this.groundY); },

  setArena(theme, width) {
    this.theme = THEMES[theme] ? theme : 'arena';
    this.width = width || 1600;
    this.camera.reset();
    this._fx = [];
    this._build();
  },

  _build() {
    const th = THEMES[this.theme];
    const gy = this.groundY;
    const W = this.width - LX0 * 2, H = ABOVE + BELOW;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const ox = -LX0, oy = ABOVE - gy; // world -> layer coordinates
    const tileAt = (spec, col, row, seed, top) => PL.Tiles.tile(spec[0], spec[1], Math.floor(PL.U.hashNoise(col, row, seed) * 3), top);
    const beamY = gy - 176, upperBeamY = beamY - 144;
    const darker = {};
    for (const k in th.wall[1]) darker[k] = PL.U.shade(th.wall[1][k], -0.18);
    const upperWall = [th.wall[0], darker];

    // ceiling + upper storey wall + ground storey wall (rows anchored on the floor line)
    for (let row = 1; row * 16 <= ABOVE; row++) {
      const y = gy - row * 16;
      for (let x = LX0; x < this.width - LX0; x += 16) {
        const spec = y < upperBeamY ? th.ceiling : y < beamY ? upperWall : (th.wainscot && y >= gy - 48) ? th.wainscot : th.wall;
        g.drawImage(tileAt(spec, x / 16, row, 3), x + ox, y + oy);
      }
    }
    if (th.wainscot) {
      g.fillStyle = PL.Tiles.WOOD.base; g.fillRect(0, gy - 50 + oy, W, 3);
      g.fillStyle = PL.Tiles.WOOD.light; g.fillRect(0, gy - 50 + oy, W, 1);
      g.fillStyle = PL.Tiles.WOOD.dark; g.fillRect(0, gy - 47 + oy, W, 1);
    }
    // contact shadows where walls meet floors
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, gy - 2 + oy, W, 2); g.fillRect(0, beamY - 2 + oy, W, 2);

    // decoration modules between pillars (both storeys)
    this._dyn = [];
    const rnd = PL.Pixel.rng(this.width + this.theme.length * 97);
    const pillars = [];
    for (let px = 40; px < this.width - 20; px += PILLAR_GAP) pillars.push(px);
    const UPPER = ['armory', 'statue', 'library', 'storage'];
    for (let i = 0; i < pillars.length - 1; i++) {
      const cx = (pillars[i] + pillars[i + 1]) / 2;
      this._placeModule(g, th.modules[i % th.modules.length], cx, gy, beamY, ox, oy, th, rnd);
      this._placeUpper(g, UPPER[(i + this.theme.length) % UPPER.length], cx, beamY, upperBeamY, ox, oy, th, rnd);
    }

    // pillars span both storeys; beams cross over them
    const postPal = { base: '#5e3c20', gap: '#2e1c0e' };
    const postTop = upperBeamY + 8;
    for (const px of pillars) {
      for (let y = postTop; y < gy; y += 16) {
        const h = Math.min(16, gy - y);
        g.drawImage(PL.Tiles.tile('vplanks', postPal, 0), 0, 0, PILLAR_W, h, px - PILLAR_W / 2 + ox, y + oy, PILLAR_W, h);
      }
      g.fillStyle = '#1e140c';
      g.fillRect(px - PILLAR_W / 2 - 1 + ox, postTop + oy, 1, gy - postTop);
      g.fillRect(px + PILLAR_W / 2 + ox, postTop + oy, 1, gy - postTop);
      for (const capY of [beamY + 8, postTop]) {
        g.fillStyle = '#8a5a30'; g.fillRect(px - 7 + ox, capY + oy, 14, 3);
        g.fillStyle = '#a8723e'; g.fillRect(px - 7 + ox, capY + oy, 14, 1);
      }
      for (const footY of [gy - 4, beamY - 4]) {
        g.fillStyle = '#8a5a30'; g.fillRect(px - 7 + ox, footY + oy, 14, 4);
        g.fillStyle = '#a8723e'; g.fillRect(px - 7 + ox, footY + oy, 14, 1);
      }
      for (const ty of [gy - 84, beamY - 84]) {
        g.drawImage(PL.Tiles.torchBase(), px - 3 + ox, ty + oy);
        this._dyn.push({ type: 'torch', x: px - 3, y: ty });
      }
    }

    const beamTile = PL.Tiles.tile('planks', { base: '#7a5230', gap: '#3e2614', nail: '#c8c0b0' }, 0, true);
    for (const by of [beamY, upperBeamY]) {
      for (let x = LX0; x < this.width - LX0; x += 16) g.drawImage(beamTile, 0, 0, 16, 8, x + ox, by + oy, 16, 8);
      g.fillStyle = '#1e140c'; g.fillRect(0, by - 1 + oy, W, 1); g.fillRect(0, by + 8 + oy, W, 1);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(0, by + 9 + oy, W, 2);
    }

    // floor
    for (let row = 0; row * 16 < BELOW; row++) {
      const y = gy + row * 16;
      for (let x = LX0; x < this.width - LX0; x += 16) {
        g.drawImage(tileAt(row === 0 ? th.floorTop : th.floor, x / 16, row, 9, row === 0), x + ox, y + oy);
      }
    }
    g.fillStyle = '#140e0a'; g.fillRect(0, gy - 1 + oy, W, 1);
    for (let row = 1; row * 16 < BELOW; row++) { g.fillStyle = `rgba(0,0,0,${0.12 * row})`; g.fillRect(0, gy + row * 16 + oy, W, 16); }

    // solid side walls framing the arena
    for (const [x0, x1] of [[LX0, 0], [this.width, this.width - LX0]]) {
      for (let y = gy - ABOVE; y < gy + BELOW; y += 16) for (let x = x0; x < x1; x += 16) g.drawImage(tileAt(th.side, x / 16, y / 16, 5), x + ox, y + oy);
      g.fillStyle = '#0e0a08';
      g.fillRect((x0 === LX0 ? -1 : this.width) + ox, 0, 1, H);
    }

    this._layer = c;
  },

  _placeModule(g, mod, cx, gy, beamY, ox, oy, th, rnd) {
    const put = (img, x, y) => g.drawImage(img, Math.round(x) + ox, Math.round(y) + oy);
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    const T2 = PL.Tiles;
    if (mod === 'window' && th.sky) {
      this._dyn.push({ type: 'window', x: Math.round(cx - 14), y: gy - 132 });
      put(T2.table(), cx - 13, gy - 11);
      put(T2.candleStick(), cx - 8, gy - 18);
      this._dyn.push({ type: 'candle', x: cx - 7, y: gy - 22 });
      put(T2.plant(Math.floor(rnd() * 99)), cx + 30, gy - 18);
      put(T2.barrel(), cx - 50, gy - 15);
    } else if (mod === 'frames') {
      const items = ['sword', 'bow', 'staff', 'shield', 'potion'];
      for (let k = -1; k <= 1; k++) put(T2.itemFrame(pick(items)), cx + k * 22 - 7, gy - 104);
      put(T2.chest(Math.floor(rnd() * 9)), cx - 30, gy - 12);
      put(T2.barrel(), cx + 16, gy - 15);
      put(T2.barrel(), cx + 30, gy - 15);
      this._addChandelier(g, cx, beamY, ox, oy);
    } else if (mod === 'shelf') {
      put(T2.bookshelf(Math.floor(rnd() * 99)), cx - 44, gy - 32);
      put(T2.bookshelf(Math.floor(rnd() * 99)), cx - 17, gy - 32);
      put(T2.potionShelf(Math.floor(rnd() * 99)), cx + 14, gy - 70);
      put(T2.chest(Math.floor(rnd() * 9)), cx + 20, gy - 12);
    } else if (mod === 'banner') {
      put(T2.banner(pick(th.banners), pick(th.emblems)), cx - 32, beamY + 12);
      put(T2.banner(pick(th.banners), pick(th.emblems)), cx + 18, beamY + 12);
      put(T2.plant(Math.floor(rnd() * 99)), cx - 40, gy - 18);
      put(T2.plant(Math.floor(rnd() * 99)), cx + 26, gy - 18);
      put(T2.chest(Math.floor(rnd() * 9)), cx - 8, gy - 12);
      this._addChandelier(g, cx, beamY, ox, oy);
    } else if (mod === 'trophy') {
      put(T2.skullPlaque(), cx - 8, gy - 112);
      put(T2.itemFrame('sword'), cx - 34, gy - 98);
      put(T2.itemFrame('shield'), cx + 19, gy - 98);
      put(T2.table(), cx - 13, gy - 11);
      put(T2.candleStick(), cx - 10, gy - 18);
      put(T2.candleStick(), cx + 6, gy - 18);
      this._dyn.push({ type: 'candle', x: cx - 9, y: gy - 22 });
      this._dyn.push({ type: 'candle', x: cx + 7, y: gy - 22 });
    } else if (mod === 'crystal' || mod === 'crystalOrange') {
      const col = mod === 'crystal' ? '#b04aff' : '#ff8a2a';
      for (const [dx, h] of [[-34, 0], [-6, -10], [22, 2]]) {
        put(T2.crystal(col), cx + dx, gy - 16 + h);
        this._dyn.push({ type: 'glow', x: cx + dx + 5, y: gy - 8 + h, color: col });
      }
      put(T2.skullPlaque(), cx - 8, gy - 110);
    } else {
      put(T2.chest(1), cx - 8, gy - 12);
    }
  },

  // Upper storey: stands on the beam (floorY), hangs from the upper beam (ceilY).
  _placeUpper(g, mod, cx, floorY, ceilY, ox, oy, th, rnd) {
    const put = (img, x, y) => g.drawImage(img, Math.round(x) + ox, Math.round(y) + oy);
    const T2 = PL.Tiles;
    const v = Math.floor(rnd() * 4);
    if (mod === 'armory') {
      put(T2.armorStand(v), cx - 40, floorY - 36);
      put(T2.armorStand(v + 1), cx - 8, floorY - 36);
      put(T2.armorStand(v + 2), cx + 24, floorY - 36);
      put(T2.itemFrame('bow'), cx - 26, floorY - 72);
      put(T2.itemFrame('staff'), cx + 10, floorY - 72);
    } else if (mod === 'statue') {
      put(T2.armorStand(v, true), cx - 8, floorY - 36);
      put(T2.plant(Math.floor(rnd() * 99)), cx - 34, floorY - 18);
      put(T2.plant(Math.floor(rnd() * 99)), cx + 20, floorY - 18);
      put(T2.banner(th.banners[0], th.emblems[0]), cx - 46, ceilY + 12);
      put(T2.banner(th.banners[th.banners.length - 1], th.emblems[th.emblems.length - 1]), cx + 32, ceilY + 12);
    } else if (mod === 'library') {
      put(T2.bookshelf(Math.floor(rnd() * 99)), cx - 40, floorY - 32);
      put(T2.bookshelf(Math.floor(rnd() * 99)), cx - 13, floorY - 32);
      put(T2.potionShelf(Math.floor(rnd() * 99)), cx + 16, floorY - 50);
      put(T2.skullPlaque(), cx - 8, floorY - 60);
      put(T2.chest(Math.floor(rnd() * 9)), cx + 22, floorY - 12);
    } else {
      put(T2.chest(Math.floor(rnd() * 9)), cx - 36, floorY - 12);
      put(T2.chest(Math.floor(rnd() * 9)), cx - 36, floorY - 24);
      put(T2.barrel(), cx - 16, floorY - 15);
      put(T2.barrel(), cx - 3, floorY - 15);
      put(T2.barrel(), cx - 10, floorY - 30);
      put(T2.armorStand(v), cx + 22, floorY - 36);
      g.fillStyle = '#4e535c';
      for (let y = ceilY + 9; y < ceilY + 30; y += 3) g.fillRect(Math.round(cx) + 7 + ox, y + oy, 2, 2);
      put(T2.lantern(), cx + 4, ceilY + 30);
      this._dyn.push({ type: 'lamp', x: cx + 8, y: ceilY + 36 });
    }
  },

  _addChandelier(g, cx, beamY, ox, oy) {
    const chainLen = 26;
    g.fillStyle = '#4e535c';
    for (let y = beamY + 9; y < beamY + 9 + chainLen; y += 3) g.fillRect(Math.round(cx) - 1 + ox, y + oy, 2, 2);
    const x = Math.round(cx - 14), y = beamY + 9 + chainLen - 4;
    g.drawImage(PL.Tiles.chandelier(), x + ox, y + oy);
    this._dyn.push({ type: 'chandelier', x, y });
  },

  // Draws the arena in world coordinates (caller has applied the vertical offset) and registers lights.
  renderScene(ctx, camX, dt) {
    this._time += dt || 1 / 60;
    const th = THEMES[this.theme];
    const t = this._time;
    if (this._layer) ctx.drawImage(this._layer, LX0 - camX, this.groundY - ABOVE);
    const fr = Math.floor(t * 9);
    for (const d of this._dyn) {
      const sx = d.x - camX;
      if (sx < -60 || sx > PL.VIEW_W + 60) continue;
      const seed = (d.x * 7) % 3;
      if (d.type === 'torch') {
        ctx.drawImage(PL.Tiles.flame(fr + seed), sx + 1, d.y + 1);
        PL.Lighting.add(d.x + 3, d.y + 3, 74 + (fr % 3) * 3, 1.0, true);
      } else if (d.type === 'candle') {
        ctx.drawImage(PL.Tiles.smallFlame(fr + seed), sx, d.y);
        PL.Lighting.add(d.x + 1, d.y + 2, 42, 0.55, true);
      } else if (d.type === 'chandelier') {
        for (const fx of [3, 13, 23]) ctx.drawImage(PL.Tiles.smallFlame(fr + fx), sx + fx, d.y);
        PL.Lighting.add(d.x + 14, d.y + 6, 104, 0.8, true);
      } else if (d.type === 'lamp') {
        PL.Lighting.add(d.x, d.y, 70, 0.5, true);
      } else if (d.type === 'glow') {
        PL.Lighting.add(d.x, d.y, 56, 0.45, false, d.color);
      } else if (d.type === 'window') {
        this._drawWindow(ctx, Math.round(sx), d.y, d.x, th, t);
        PL.Lighting.add(d.x + 14, d.y + 18, 86, 0.45, false, th.windowLight);
      }
    }
  },

  // Glowing ambient particles drawn after the light map: torch embers, dust motes, biome effects.
  renderAmbientFx(ctx, camX, dt) {
    dt = Math.min(dt || 1 / 60, 0.05);
    const th = THEMES[this.theme], fx = this._fx || (this._fx = []);
    const top = this.groundY - (PL.VIEW_H - 48), x0 = camX, x1 = camX + PL.VIEW_W;
    for (const d of this._dyn) {
      if (d.x < x0 - 20 || d.x > x1 + 20) continue;
      const rate = d.type === 'torch' ? 2.5 : d.type === 'chandelier' ? 1.2 : 0;
      if (rate && Math.random() < dt * rate) {
        const ex = d.type === 'torch' ? d.x + 3 : d.x + PL.U.choose([4, 14, 24]);
        fx.push({ x: ex + PL.U.rand(-1, 1), y: d.y + 1, vx: PL.U.rand(-6, 6), vy: -PL.U.rand(14, 32), t: 0, life: PL.U.rand(0.7, 1.5), c: PL.U.choose(['#ffd04a', '#ff8a2a', '#fff0a0']), a: 1, s: 1, wob: 2 });
      }
    }
    let motes = 0;
    for (const p of fx) if (p.mote) motes++;
    for (; motes < 34; motes++) {
      fx.push({ mote: true, x: PL.U.rand(x0, x1), y: PL.U.rand(top, this.groundY - 4), vx: PL.U.rand(-4, 4), vy: PL.U.rand(-3, 2), t: 0, life: PL.U.rand(4, 9), c: '#ffeccc', a: 0.35, s: 1, wob: 3 });
    }
    if (th.fx && Math.random() < dt * 14) {
      const k = th.fx, c = th.fxColor;
      if (k === 'embers') fx.push({ x: PL.U.rand(x0, x1), y: this.groundY - 2, vx: PL.U.rand(-8, 8), vy: -PL.U.rand(20, 45), t: 0, life: PL.U.rand(1.5, 3), c: PL.U.choose([c, '#ffd04a', '#ff5a1a']), a: 1, s: PL.U.choose([1, 1, 2]), wob: 4 });
      else if (k === 'ash') fx.push({ x: PL.U.rand(x0, x1), y: top, vx: PL.U.rand(-6, 6), vy: PL.U.rand(10, 22), t: 0, life: 7, c, a: 0.7, s: 1, wob: 5 });
      else fx.push({ x: PL.U.rand(x0, x1), y: PL.U.rand(top + 20, this.groundY - 10), vx: PL.U.rand(-6, 6), vy: PL.U.rand(-8, 4), t: 0, life: PL.U.rand(2, 4), c, a: k === 'spores' ? 0.6 : 0.9, s: k === 'wisps' ? 2 : 1, wob: 6 });
    }
    this._fx = fx.filter(p => {
      p.t += dt;
      p.x += (p.vx + Math.sin(p.t * 2 + p.y * 0.1) * p.wob) * dt;
      p.y += p.vy * dt;
      if (p.t >= p.life || p.x < x0 - 30 || p.x > x1 + 30) return false;
      const u = p.t / p.life;
      ctx.globalAlpha = p.a * Math.min(1, u * 5, (1 - u) * 3.3);
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x - camX), Math.round(p.y), p.s, p.s);
      return true;
    });
    ctx.globalAlpha = 1;
  },

  renderVignette(ctx) {
    const key = PL.VIEW_W + 'x' + PL.VIEW_H;
    if (!this._vig || this._vigKey !== key) {
      const c = document.createElement('canvas');
      c.width = PL.VIEW_W; c.height = PL.VIEW_H;
      const g = c.getContext('2d');
      const r = Math.hypot(PL.VIEW_W, PL.VIEW_H) / 2;
      const grad = g.createRadialGradient(PL.VIEW_W / 2, PL.VIEW_H * 0.55, r * 0.45, PL.VIEW_W / 2, PL.VIEW_H * 0.55, r);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.55)');
      g.fillStyle = grad;
      g.fillRect(0, 0, c.width, c.height);
      this._vig = c; this._vigKey = key;
    }
    ctx.drawImage(this._vig, 0, 0);
  },

  _drawWindow(ctx, sx, y, wx, th, t) {
    const gx = sx + 2, gy = y + 2, gw = 24, gh = 32;
    const sky = th.sky;
    for (let r = 0; r < gh; r++) {
      ctx.fillStyle = sky[Math.min(sky.length - 1, Math.floor(r / gh * sky.length))];
      ctx.fillRect(gx, gy + r, gw, 1);
    }
    for (let c = 0; c < gw; c++) {
      const h = 3 + Math.floor(PL.U.hashNoise(wx + c, 7, 3) * 3) + (c % 7 < 3 ? 1 : 0);
      ctx.fillStyle = th.snow ? '#eef4f8' : '#2e4a2e';
      ctx.fillRect(gx + c, gy + gh - h, 1, h);
      ctx.fillStyle = th.snow ? '#c8d6e2' : '#22381f';
      ctx.fillRect(gx + c, gy + gh - h, 1, 1);
    }
    if (th.snow) {
      ctx.fillStyle = '#ffffff';
      for (let k = 0; k < 9; k++) {
        const fx = (k * 53 + Math.floor(Math.sin(t * 0.8 + k) * 2)) % gw;
        const fy = Math.floor(k * 29 + t * (10 + (k % 3) * 5)) % gh;
        ctx.fillRect(gx + ((fx + gw) % gw), gy + fy, 1, 1);
      }
    }
    ctx.drawImage(PL.Tiles.windowFrame(), sx, y);
  }
};

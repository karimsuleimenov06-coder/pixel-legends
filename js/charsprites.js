// Pixel character sprite engine. Specs (pixel grids + palettes) live in spritedata.js.
// Humanoids: hand-authored head/torso grids, limbs + held weapons placed per pose on integer pixels,
// each layer outlined separately. Also blobs (slimes), quadrupeds and the dragon.
// Composed frames are cached per pose; drawing is one drawImage.
window.PL = window.PL || {};

PL.CharSprites = (function () {
  const STEPS = 40;
  const sh = (c, a) => PL.U.shade(c, a);
  const mk = (w, h) => new PL.Pixel.Buf(w, h);

  // Leg frames: [knee, foot] offsets from the hip for back (b) and front (f) leg, facing right.
  const LEGS = {
    stand: { b: [[0, 5], [0, 11]], f: [[0, 5], [0, 11]] },
    run0: { b: [[-1, 6], [-4, 9]], f: [[3, 4], [4, 10]] },
    run1: { b: [[2, 4], [0, 8]], f: [[1, 5], [0, 11]] },
    run2: { b: [[3, 4], [4, 10]], f: [[-1, 6], [-4, 9]] },
    run3: { b: [[1, 5], [0, 11]], f: [[2, 4], [0, 8]] },
    jump: { b: [[0, 5], [-2, 10]], f: [[3, 3], [2, 8]] },
    fall: { b: [[-1, 5], [-2, 10]], f: [[2, 5], [1, 10]] },
    crouch: { b: [[-2, 3], [-3, 8]], f: [[3, 2], [1, 8]] }
  };

  // Weapons are authored pointing UP with the pivot at the grip.
  const WEAPONS = {
    greatsword: {
      pal: { W: '#eef2f6', M: '#bcc6d2', m: '#7c8796', G: '#e8b84a', g: '#a87a22', h: '#6a4424', H: '#8a5c32' },
      rows: ['...W...', '..WMm..', '..WMm..', '..WMm..', '..WMm..', '..WMm..', '..WMm..', '..WMm..', '..WMm..', '..WMm..',
        '..WMm..', '..WMm..', '..WMm..', '..WMm..', '.gGGGg.', 'gGGGGGg', '..hHh..', '..hHh..', '..hHh..', '...g...'],
      px: 3, py: 17
    },
    sword: {
      pal: { W: '#e6eaf0', M: '#b0b8c4', m: '#6c7482', G: '#c8a040', g: '#8a6a20', h: '#5a3a1e' },
      rows: ['..W..', '.WMm.', '.WMm.', '.WMm.', '.WMm.', '.WMm.', '.WMm.', '.WMm.', '.WMm.', 'gGGGg', '..h..', '..h..', '..g..'],
      px: 2, py: 11
    },
    dagger: {
      pal: { W: '#eef2f6', M: '#b0b8c4', m: '#6c7482', G: '#8a6a3a', h: '#4a3020' },
      rows: ['.W.', 'WMm', 'WMm', 'WMm', 'WMm', 'GGG', '.h.', '.h.', '.G.'],
      px: 1, py: 6
    },
    staff: {
      pal: { B: '#6ad9ff', W: '#ffffff', g: '#c8a040', H: '#8a5a30', h: '#6a4424' },
      rows: ['.gBg.', 'gBWBg', 'gBBBg', '.gBg.', '..h..', '..H..', '..h..', '..H..', '..h..', '..H..', '..h..',
        '..H..', '..h..', '..H..', '..h..', '..H..', '..h..', '..H..', '..h..', '..g..'],
      px: 2, py: 14
    },
    mace: {
      pal: { M: '#e8d070', W: '#fff4c0', m: '#a88a30', S: '#d0d4dc', H: '#8a5a30', h: '#5a3a1e', G: '#e0b040' },
      rows: ['..S..', '.mMm.', 'SMWMS', 'mMMMm', '.mMm.', '..S..', '..h..', '..H..', '..h..', '..H..', '..h..', '..H..', '..G..', '..h..'],
      px: 2, py: 11
    },
    skullStaff: {
      pal: { T: '#ece6d4', t: '#a89e88', E: '#6aff8a', d: '#1a1420', H: '#4a3a4a', h: '#2e2232', g: '#8a7aa0' },
      rows: ['.tTTt.', 'tTTTTt', 'TEdTEd', 'tTTTTt', '.tdTd.', '..gg..', '..hH..', '..Hh..', '..hH..', '..Hh..', '..hH..',
        '..Hh..', '..hH..', '..Hh..', '..hH..', '..Hh..', '..hH..', '..Hh..', '..hH..', '..gg..'],
      px: 2, py: 14
    },
    bow: {
      pal: { h: '#6a4424', H: '#8a5a30', G: '#c8a040', w: '#e8e4d8' },
      rows: ['......GGG......', '....hHGGGHh....', '..hHH.....HHh..', '.hH.........Hh.', 'hH...........Hh', 'hwwwwwwwwwwwwwh'],
      px: 7, py: 1
    },
    bowDrawn: {
      pal: { h: '#6a4424', H: '#8a5a30', G: '#c8a040', w: '#e8e4d8', W: '#eef2f6', I: '#a8723e', F: '#d03030' },
      rows: ['.......W.......', '......GWG......', '....hHGIGHh....', '..hHH..I..HHh..', '.hH....I....Hh.',
        'hH.w...I...w.Hh', 'h...w..I..w...h', '.....w.I.w.....', '......wFw......'],
      px: 7, py: 2
    },
    axe: {
      pal: { M: '#aab4c0', W: '#e6eaf0', m: '#6c7482', H: '#8a5a30', h: '#5a3a1e', G: '#4e535c' },
      rows: ['..mMMM..', '.hHMWWMm', '.hHMMMMm', '.hHmMMm.', '.hH.mm..', '.hH.....', '.hH.....', '.hH.....', '.hH.....',
        '.hH.....', '.hH.....', '.hH.....', '.hH.....', '.hH.....', '.GG.....'],
      px: 2, py: 11
    },
    greataxe: {
      pal: { M: '#9aa2ae', W: '#d6dae2', m: '#5c6470', H: '#6a4424', h: '#4a2e16', G: '#4e535c' },
      rows: ['mMM..hH..MMm', 'MWMMmhHmMMWM', 'MWMMMhHMMMWM', 'MMMMmhHmMMMM', 'mMMm.hH.mMMm', '.mm..hH..mm.',
        '.....hH.....', '.....hH.....', '.....hH.....', '.....hH.....', '.....hH.....', '.....hH.....', '.....hH.....',
        '.....hH.....', '.....hH.....', '.....hH.....', '.....GG.....'],
      px: 6, py: 13
    }
  };

  // Resting pose (arm + weapon angle) per weapon; 0 = arm down, PI/2 = forward, PI = up.
  const REST = {
    greatsword: { front: 0.45, weapon: 2.4 }, sword: { front: 0.45, weapon: 2.3 }, axe: { front: 0.45, weapon: 2.2 },
    greataxe: { front: 0.45, weapon: 2.3 }, dagger: { front: 0.5, weapon: 1.3 }, staff: { front: 0.5, weapon: 3.1 }, skullStaff: { front: 0.5, weapon: 3.1 }, mace: { front: 0.45, weapon: 2.3 },
    bow: { front: 0.55, weapon: 1.0 }, none: { front: 0.3, weapon: null }
  };

  const frames = {}, weapons = {}, meta = {};
  function spec(id) { const s = PL.SPRITE_SPECS[id]; if (s && !s.id) s.id = id; return s; }
  function qi(a) { const s = Math.PI * 2 / STEPS; let i = Math.round(a / s) % STEPS; if (i < 0) i += STEPS; return i; }
  function qa(i) { return i * Math.PI * 2 / STEPS; }
  function dims(s) { const F = s.frame || 64; return { F, AX: F >> 1, FOOT: F - 12 }; }

  function rotatedWeapon(s, name, idx) {
    const key = s.id + '|' + name + '|' + idx;
    if (weapons[key]) return weapons[key];
    const w = WEAPONS[name];
    const b = mk(w.rows[0].length, w.rows.length);
    b.grid(w.rows, Object.assign({}, w.pal, s.weaponPal || {}), 0, 0);
    return (weapons[key] = PL.Pixel.rotate(b, Math.PI - qa(idx), w.px, w.py));
  }

  function drawLeg(b, hx, hy, frame, ls, thick, pants, boot) {
    const kx = hx + Math.round(frame[0][0] * ls), ky = hy + Math.round(frame[0][1] * ls);
    const fx = hx + Math.round(frame[1][0] * ls), fy = hy + Math.round(frame[1][1] * ls);
    b.line(hx, hy, kx, ky, pants, thick);
    b.line(kx, ky, fx, fy - 1, pants, thick);
    b.rect(fx - 1, fy - 2, thick + 1, 3, boot);
    b.put(fx - 1, fy - 2, sh(boot, 0.3));
  }

  function drawArm(b, sx, sy, a, sleeve, hand, thick, len) {
    const dx = Math.sin(a), dy = Math.cos(a);
    b.line(sx, sy, sx + dx * (len - 2), sy + dy * (len - 2), sleeve, thick);
    const hx = Math.round(sx + dx * len), hy = Math.round(sy + dy * len);
    const hs = thick >= 5 ? 4 : 3;
    b.rect(hx - (hs >> 1), hy - (hs >> 1), hs, hs, hand);
  }

  function drawBack(b, back, g, extra) {
    if (back.type === 'cape') {
      const top = g.shY - 1, bottom = g.hipY + (back.len || 8);
      for (let y = top; y <= bottom; y++) {
        const k = y - top;
        const x0 = g.backSh - 2 - Math.floor(k * 0.3) - ((extra && (k >> 1) % 2) ? 1 : 0);
        for (let x = x0; x <= g.AX + 1; x++) b.put(x, y, x === x0 ? sh(back.color, -0.3) : x === x0 + 1 ? sh(back.color, 0.15) : back.color);
      }
      const x0 = g.backSh - 2 - Math.floor((bottom - top) * 0.3);
      for (let x = x0 + (extra ? 1 : 0); x <= g.AX + 1; x += 3) b.put(x, bottom + 1, sh(back.color, -0.2));
    } else if (back.type === 'wings') {
      const rx = g.backSh - 1, ry = g.shY + 1;
      const dirs = extra ? [[-1, 0.15], [-1, 0.55], [-0.6, 0.95], [-1, -0.25]] : [[-1, -0.95], [-1, -0.45], [-0.55, -1.15], [-1, 0.05]];
      dirs.forEach(([dx, dy], i) => {
        const len = 14 - i, m = Math.hypot(dx, dy);
        const ex = rx + dx / m * len, ey = ry + dy / m * len;
        b.line(rx, ry, ex, ey, i % 2 ? back.color : sh(back.color, 0.15), 3);
        b.line(rx, ry, ex, ey, back.light, 1);
      });
    } else if (back.type === 'grid') {
      b.grid(back.rows, back.pal, g.backSh + (back.dx || 0), g.torsoTop + (back.dy || 0));
    }
  }

  function composeHumanoid(s, p) {
    const { F, AX, FOOT } = dims(s);
    const legs = LEGS[p.legs] || LEGS.stand;
    const ls = s.legScale || 1;
    const hipY = FOOT - Math.round(Math.max(legs.b[1][1], legs.f[1][1]) * ls);
    const tw = s.torso[0].length;
    const torsoTop = hipY - (s.torsoAbove || s.torso.length);
    const hw = s.head[0].length, hh = s.head.length;
    const headX = AX - (hw >> 1) + (s.headDx || 0), headTop = torsoTop - hh + 1 + (s.headDy || 0);
    const shY = torsoTop + 2;
    const frontSh = AX + (tw >> 1) - 3, backSh = AX - (tw >> 1) + 2;
    const L = s.limbs, armT = s.armThick || 3, armLen = s.armLen || 7, hs = s.hipSpread || 2;
    const out = mk(F, F);

    if (s.back) {
      const b = mk(F, F);
      drawBack(b, s.back, { AX, torsoTop, hipY, shY, backSh }, p.extra);
      b.volume(0.18, 0.2).outline();
      out.stamp(b, 0, 0);
    }

    const ba = mk(F, F);
    const bang = qa(p.bi), bl = p.backLen || armLen;
    if (s.backWeapon && p.bwi != null) {
      const rw = rotatedWeapon(s, s.backWeapon, p.bwi);
      ba.stamp(rw.buf, Math.round(backSh + Math.sin(bang) * bl) - rw.cx, Math.round(shY + Math.cos(bang) * bl) - rw.cy);
    }
    drawArm(ba, backSh, shY, bang, sh(L.sleeve, -0.3), sh(L.hand, -0.3), armT, bl);
    ba.volume(0.2, 0.18).outline();
    out.stamp(ba, 0, 0);

    const body = mk(F, F);
    drawLeg(body, AX - hs, hipY, legs.b, ls, s.legThick || 4, sh(L.pants, -0.28), sh(L.boot, -0.25));
    drawLeg(body, AX + hs, hipY, legs.f, ls, s.legThick || 4, L.pants, L.boot);
    body.grid(s.torso, s.pal, AX - (tw >> 1), torsoTop);
    body.grid(s.head, s.pal, headX, headTop);
    for (const o of s.headOver || []) body.grid(o.rows, s.pal, headX + o.dx, headTop + o.dy);
    body.volume(0.22, 0.2).outline();
    out.stamp(body, 0, 0);

    const fr = mk(F, F);
    if (s.shield) {
      // Held shield: drawn in front of the body, centred on the back arm's hand.
      const sh0 = s.shield, hx = Math.round(backSh + Math.sin(bang) * bl), hy = Math.round(shY + Math.cos(bang) * bl);
      const sb = mk(sh0.rows[0].length, sh0.rows.length);
      sb.grid(sh0.rows, sh0.pal, 0, 0);
      sb.volume(0.2, 0.2).outline();
      fr.stamp(sb, hx - (sb.w >> 1) + 1, hy - (sb.h >> 1));
    }
    const fang = qa(p.fi);
    if (s.weapon && p.wi != null) {
      const rw = rotatedWeapon(s, p.weaponName || s.weapon, p.wi);
      fr.stamp(rw.buf, Math.round(frontSh + Math.sin(fang) * armLen) - rw.cx, Math.round(shY + Math.cos(fang) * armLen) - rw.cy);
    }
    drawArm(fr, frontSh, shY, fang, L.sleeve, L.hand, armT, armLen);
    fr.volume(0.25, 0.2).outline();
    out.stamp(fr, 0, 0);
    return out;
  }

  const BLOB_SHAPES = { idle0: [7, 5.5], idle1: [7.5, 5], jump: [5.5, 7], squash: [8.5, 4] };
  function composeBlob(s, p) {
    const { F, AX, FOOT } = dims(s);
    const [rx, ry] = BLOB_SHAPES[p.frame] || BLOB_SHAPES.idle0;
    const P = s.pal, b = mk(F, F);
    const cy = FOOT + 1 - ry;
    for (let y = Math.floor(cy - ry) - 1; y <= FOOT; y++) for (let x = Math.floor(AX - rx) - 1; x <= AX + rx + 1; x++) {
      const nx = (x + 0.5 - AX) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      let c = ny > 0.45 ? P.a : P.A;
      if (nx < -0.15 && ny < -0.25 && d > 0.25) c = P.L;
      if (d < 0.16 && ny > -0.15) c = P.d;
      b.put(x, y, c);
    }
    const ey = Math.round(cy - ry * 0.25);
    b.rect(AX + 1, ey, 1, 2, P.E); b.rect(AX + 4, ey, 1, 2, P.E);
    b.put(AX - 3, Math.round(cy - ry * 0.6), '#ffffff');
    b.outline();
    return b;
  }

  const QLEGS = {
    stand: { bf: [[0, 4], [1, 7]], bn: [[0, 4], [0, 7]], ff: [[0, 4], [1, 7]], fn: [[0, 4], [0, 7]] },
    run0: { bf: [[-1, 3], [-3, 7]], bn: [[-2, 3], [-4, 6]], ff: [[2, 3], [4, 7]], fn: [[3, 3], [5, 6]] },
    run1: { bf: [[1, 4], [1, 7]], bn: [[0, 4], [-1, 7]], ff: [[0, 4], [-1, 7]], fn: [[1, 4], [1, 7]] },
    run2: { bf: [[2, 3], [3, 7]], bn: [[3, 3], [4, 6]], ff: [[-1, 3], [-3, 7]], fn: [[-2, 3], [-4, 6]] },
    run3: { bf: [[0, 4], [-1, 7]], bn: [[1, 4], [1, 7]], ff: [[1, 4], [1, 7]], fn: [[0, 4], [-1, 7]] }
  };
  function qleg(b, hx, hy, fr, col) {
    const kx = hx + fr[0][0], ky = hy + fr[0][1], fx = hx + fr[1][0], fy = hy + fr[1][1];
    b.line(hx, hy, kx, ky, col, 2);
    b.line(kx, ky, fx, fy, col, 2);
    b.rect(fx - 1, fy, 3, 1, sh(col, -0.2));
  }
  function composeQuad(s, p) {
    const { F, AX, FOOT } = dims(s);
    const lg = QLEGS[p.frame] || QLEGS.stand, P = s.pal;
    const bodyTop = FOOT - 14 - ((p.frame === 'run0' || p.frame === 'run2') ? 1 : 0);
    const bx = AX - 9, legY = bodyTop + 6;
    const far = mk(F, F);
    qleg(far, AX - 5, legY, lg.bf, sh(P.A, -0.35));
    qleg(far, AX + 6, legY, lg.ff, sh(P.A, -0.35));
    far.outline();
    const body = mk(F, F);
    const wag = p.frame === 'run1' || p.frame === 'run3' ? 2 : 0;
    body.line(bx + 1, bodyTop + 2, bx - 5, bodyTop - 3 + wag, P.A, 3);
    body.put(bx - 6, bodyTop - 4 + wag, P.L);
    body.grid(s.body, P, bx, bodyTop);
    body.grid(p.mouth ? s.headOpen : s.head, P, AX + 5, bodyTop - 4);
    qleg(body, AX - 6, legY, lg.bn, P.A);
    qleg(body, AX + 5, legY, lg.fn, P.A);
    body.volume(0.22, 0.2).outline();
    const out = mk(F, F);
    out.stamp(far, 0, 0);
    out.stamp(body, 0, 0);
    return out;
  }

  function dragonWing(b, rx, ry, up, membrane, bone) {
    const pts = up ? [[rx, ry], [rx - 12, ry - 24], [rx - 25, ry - 17], [rx - 24, ry - 7], [rx - 12, ry + 1]]
      : [[rx, ry], [rx - 15, ry + 10], [rx - 27, ry + 3], [rx - 25, ry - 7], [rx - 12, ry - 4]];
    b.polygon(pts, membrane);
    for (let i = 1; i < pts.length - 1; i++) b.line(rx, ry, pts[i][0], pts[i][1], bone, i === 1 ? 2 : 1);
  }
  function composeDragon(s, p) {
    const { F, AX, FOOT } = dims(s);
    const P = s.pal, cx = AX - 2, by = FOOT - 12;
    const step = p.legs === 'walk1' ? 2 : p.legs === 'walk0' ? -2 : 0;
    const out = mk(F, F);
    const farW = mk(F, F);
    dragonWing(farW, cx + 3, by - 8, !p.wing, sh(P.M, -0.35), sh(P.A, -0.35));
    farW.outline();
    out.stamp(farW, 0, 0);
    const farL = mk(F, F);
    farL.line(cx - 6, by + 4, cx - 6 + step, FOOT - 1, sh(P.A, -0.3), 4);
    farL.line(cx + 9, by + 4, cx + 10 - step, FOOT - 1, sh(P.A, -0.3), 4);
    farL.outline();
    out.stamp(farL, 0, 0);

    const body = mk(F, F);
    const tail = [[cx - 10, by + 1, 6], [cx - 20, by + 4, 5], [cx - 28, by, 4], [cx - 33, by - 6, 3]];
    for (let i = 0; i < tail.length - 1; i++) body.line(tail[i][0], tail[i][1], tail[i + 1][0], tail[i + 1][1], P.A, tail[i][2]);
    body.polygon([[cx - 33, by - 6], [cx - 38, by - 10], [cx - 34, by - 2]], P.h);
    for (let y = by - 9; y <= by + 8; y++) for (let x = cx - 14; x <= cx + 14; x++) {
      const nx = (x + 0.5 - cx) / 14, ny = (y + 0.5 - by) / 8.5, d = nx * nx + ny * ny;
      if (d > 1) continue;
      body.put(x, y, ny > 0.35 ? P.B : ny < -0.55 ? P.L : P.A);
    }
    for (let x = cx - 10; x <= cx + 8; x += 4) body.polygon([[x, by - 8], [x + 2, by - 12], [x + 3, by - 8]], P.h);
    body.line(cx + 9, by - 3, cx + 16, by - 13, P.A, 6);
    body.line(cx + 10, by - 1, cx + 16, by - 10, P.B, 2);
    body.grid(p.mouth ? s.headOpen : s.head, P, cx + 11, by - 20);
    body.line(cx - 8, by + 4, cx - 8 - step, FOOT - 1, P.A, 4);
    body.line(cx + 7, by + 4, cx + 8 + step, FOOT - 1, P.A, 4);
    body.rect(cx - 10 - step, FOOT - 1, 5, 1, P.h);
    body.rect(cx + 7 + step, FOOT - 1, 5, 1, P.h);
    body.volume(0.2, 0.2).outline();
    out.stamp(body, 0, 0);

    const nearW = mk(F, F);
    dragonWing(nearW, cx + 1, by - 7, !!p.wing, P.M, P.A);
    nearW.volume(0.2, 0.15).outline();
    out.stamp(nearW, 0, 0);
    return out;
  }

  function composeBat(s, p) {
    const { F, AX, FOOT } = dims(s);
    const P = s.pal, cy = FOOT - 6, b = mk(F, F);
    const wing = p.frame === 'up'
      ? [[AX - 2, cy - 1], [AX - 9, cy - 8], [AX - 13, cy - 4], [AX - 10, cy - 1], [AX - 7, cy + 1]]
      : [[AX - 2, cy], [AX - 9, cy + 5], [AX - 13, cy + 1], [AX - 10, cy + 2], [AX - 6, cy + 3]];
    b.polygon(wing, P.M);
    b.polygon(wing.map(([x, y]) => [2 * AX - x, y]), P.M);
    b.line(AX - 2, cy, wing[2][0], wing[2][1], P.a, 1);
    b.line(AX + 2, cy, 2 * AX - wing[2][0], wing[2][1], P.a, 1);
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = AX - 4; x <= AX + 4; x++) {
      const nx = (x - AX) / 3.6, ny = (y - cy) / 4.2;
      if (nx * nx + ny * ny <= 1) b.put(x, y, ny > 0.3 ? P.L : P.A);
    }
    b.put(AX - 2, cy - 5, P.A); b.put(AX - 2, cy - 6, P.A); b.put(AX + 2, cy - 5, P.A); b.put(AX + 2, cy - 6, P.A);
    b.put(AX + 1, cy - 1, P.E); b.put(AX + 3, cy - 1, P.E);
    b.put(AX + 1, cy + 2, P.T); b.put(AX + 3, cy + 2, P.T);
    b.volume(0.2, 0.2).outline();
    return b;
  }

  function composeEye(s, p) {
    const { F, AX, FOOT } = dims(s);
    const P = s.pal, cx = AX + 2, cy = FOOT - 8, R = 6.5, b = mk(F, F);
    for (let i = 0; i < 3; i++) {
      const y0 = cy - 3 + i * 3, w = p.frame ? (i % 2 ? 2 : -2) : (i % 2 ? -2 : 2);
      b.line(cx - 5, y0, cx - 10, y0 + w, P.r, 2);
      b.line(cx - 10, y0 + w, cx - 15, y0 - w, P.r, 1);
    }
    for (let y = Math.floor(cy - R); y <= cy + R; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= R) b.put(x, y, (x < cx - 2 && y > cy + 1) ? P.w : P.W);
    }
    for (const [vx, vy] of [[-5, -2], [-4, -3], [-5, 2], [-4, 3], [-3, 4], [0, 6], [-1, -6]]) b.put(cx + vx, cy + vy, P.r);
    for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx; x <= cx + 6; x++) {
      if (Math.hypot(x - (cx + 3), y - cy) <= 3) b.put(x, y, Math.hypot(x - (cx + 4), y - cy) <= 1.6 ? P.d : P.I);
    }
    b.put(cx + 2, cy - 2, '#ffffff');
    b.volume(0.15, 0.2).outline();
    return b;
  }

  function normalize(s, pose) {
    if (s.kind === 'bat' || s.kind === 'eye') return { key: 'x|' + pose.frame, p: pose };
    if (s.kind === 'blob') return { key: 'b|' + pose.frame, p: pose };
    if (s.kind === 'quad') return { key: 'q|' + pose.frame + '|' + (pose.mouth ? 1 : 0), p: pose };
    if (s.kind === 'dragon') return { key: 'd|' + pose.legs + '|' + (pose.wing ? 1 : 0) + '|' + (pose.mouth ? 1 : 0), p: pose };
    const p = {
      legs: pose.legs || 'stand', fi: qi(pose.front || 0), bi: qi(pose.back || 0),
      wi: pose.weapon == null ? null : qi(pose.weapon), bwi: pose.backWeapon == null ? null : qi(pose.backWeapon),
      backLen: pose.backLen || 0, extra: pose.extra ? 1 : 0, weaponName: pose.weaponName || ''
    };
    return { key: [p.legs, p.fi, p.bi, p.wi, p.bwi, p.backLen, p.extra, p.weaponName].join('|'), p };
  }

  function frame(id, pose) {
    const s = spec(id);
    const n = normalize(s, pose);
    const key = id + '|' + n.key;
    let f = frames[key];
    if (!f) {
      let buf = s.kind === 'blob' ? composeBlob(s, n.p) : s.kind === 'quad' ? composeQuad(s, n.p)
        : s.kind === 'dragon' ? composeDragon(s, n.p) : s.kind === 'bat' ? composeBat(s, n.p)
          : s.kind === 'eye' ? composeEye(s, n.p) : composeHumanoid(s, n.p);
      if ((s.pixelScale || 1) > 1) buf = buf.upscale(s.pixelScale);
      f = frames[key] = { buf, right: buf.toCanvas(), left: null, fx: {} };
    }
    return f;
  }

  function idlePose(s) {
    if (s.kind === 'blob') return { frame: 'idle0' };
    if (s.kind === 'quad') return { frame: 'stand' };
    if (s.kind === 'dragon') return { legs: 'stand', wing: 0 };
    if (s.kind === 'bat') return { frame: 'up' };
    if (s.kind === 'eye') return { frame: 0 };
    return { legs: 'stand', front: 0.4, back: 0.15 };
  }

  function info(id) {
    if (meta[id]) return meta[id];
    const s = spec(id), k = s.pixelScale || 1, { FOOT } = dims(s);
    const bb = frame(id, idlePose(s)).buf.bbox();
    const h = (FOOT + 1) * k - bb.y0;
    const w = s.hitW || (s.torso ? (s.torso[0].length + 4) * k : bb.x1 - bb.x0 + 1);
    return (meta[id] = { h, w });
  }

  // flash: false | true (white) | '#rrggbb' silhouette colour.
  function draw(ctx, id, sx, sy, facing, pose, flash) {
    const s = spec(id);
    const f = frame(id, pose);
    let img;
    const dir = facing >= 0 ? 'R' : 'L';
    if (flash) {
      const col = flash === true ? '#ffffff' : flash;
      const k = col + dir;
      img = f.fx[k] || (f.fx[k] = (dir === 'R' ? f.buf : f.buf.flipped()).silhouette(col).toCanvas());
    } else {
      img = dir === 'R' ? f.right : (f.left || (f.left = f.buf.flipped().toCanvas()));
    }
    const k = s.pixelScale || 1, { F, AX, FOOT } = dims(s);
    const ax = dir === 'R' ? AX * k : F * k - 1 - AX * k;
    ctx.drawImage(img, Math.round(sx) - ax, Math.round(sy) - (FOOT + 1) * k);
  }

  // Shared animation logic: turns a simple state description into a pose for any sprite kind.
  // st = { move: idle|run|jump|fall|crouch, phase, time, hurt, attack: { style, stage, u, from, to } }
  function poseFor(id, st) {
    const s = spec(id);
    const a = st.attack;
    const runFrame = 'run' + (Math.floor((st.phase || 0) / (Math.PI / 2)) % 4);
    if (s.kind === 'blob') {
      let fr = Math.floor((st.time || 0) * 3) % 2 ? 'idle1' : 'idle0';
      if (st.move === 'jump') fr = 'jump';
      if (a) fr = a.stage === 'windup' ? 'squash' : a.stage === 'active' ? 'jump' : 'idle1';
      return { frame: fr };
    }
    if (s.kind === 'quad') {
      let fr = st.move === 'run' ? runFrame : (st.move === 'jump' || st.move === 'fall') ? 'run0' : 'stand';
      if (a) fr = a.stage === 'windup' ? 'run1' : 'run0';
      return { frame: fr, mouth: !!(a && a.stage !== 'recover') };
    }
    if (s.kind === 'bat') return { frame: Math.floor((st.time || 0) * (a ? 16 : 10)) % 2 ? 'up' : 'down' };
    if (s.kind === 'eye') return { frame: Math.floor((st.time || 0) * (a ? 10 : 5)) % 2 };
    if (s.kind === 'dragon') {
      const walk = st.move === 'run' ? (Math.floor((st.phase || 0) / Math.PI) % 2 ? 'walk1' : 'walk0') : 'stand';
      return { legs: walk, wing: Math.floor((st.time || 0) * (a ? 9 : 4)) % 2, mouth: !!(a && (a.stage === 'active' || a.style === 'breath' && a.stage !== 'windup')) };
    }

    const R = Object.assign({ back: 0.15 }, REST[s.weapon || 'none'], s.rest || {});
    const hasW = !!s.weapon;
    const p = { legs: 'stand', front: R.front, back: R.back, weapon: hasW ? R.weapon : null, extra: Math.floor((st.time || 0) * (s.back && s.back.type === 'wings' ? 8 : 2)) % 2 };
    if (st.move === 'jump' || st.move === 'fall') {
      p.legs = st.move; p.front = 1.2; p.back = -0.7; if (hasW) p.weapon = R.weapon + 0.2;
    } else if (st.move === 'crouch') {
      p.legs = 'crouch'; p.front = 1.3; p.back = -0.4; if (hasW) p.weapon = 1.6;
    } else if (st.move === 'run') {
      const sn = Math.sin(st.phase || 0);
      p.legs = runFrame; p.front = R.front + sn * 0.35; p.back = R.back - 0.05 - sn * (s.rest ? 0.2 : 0.6); if (hasW) p.weapon = R.weapon + sn * 0.2;
    }
    if (st.hurt) { p.front = -0.3; p.back = -0.5; if (hasW) p.weapon = (R.weapon || 0) + 0.5; }

    if (a) {
      const u = PL.U.clamp(a.u || 0, 0, 1);
      const ease = 1 - (1 - u) * (1 - u);
      const ground = st.move !== 'jump' && st.move !== 'fall';
      const restW = R.weapon == null ? R.front : R.weapon;
      let f, w;
      switch (a.style) {
        case 'swing': {
          const from = a.from != null ? a.from : 3.3, to = a.to != null ? a.to : 0.45;
          if (a.stage === 'windup') f = PL.U.lerp(restW, from, ease);
          else if (a.stage === 'active') f = PL.U.lerp(from, to, u);
          else f = PL.U.lerp(to, restW, Math.max(0, u - 0.5) * 2);
          w = f; p.back = 0.3;
          if (ground) p.legs = 'run0';
          break;
        }
        case 'slam':
          if (a.stage === 'windup') { f = PL.U.lerp(restW, 3.3, ease); }
          else { f = a.stage === 'active' ? PL.U.lerp(3.3, 0.3, Math.min(1, u * 2)) : 0.3; if (ground) p.legs = 'crouch'; }
          w = f; p.back = a.stage === 'windup' ? 2.9 : 0.5;
          break;
        case 'thrust':
          if (a.stage === 'windup') { f = 2.6; w = 2.9; if (ground) p.legs = 'crouch'; }
          else if (a.stage === 'active') { f = 1.55; w = 1.57; if (ground) p.legs = 'run0'; }
          else { f = 0.9; w = 1.2; }
          p.back = a.stage === 'active' ? -0.4 : 0.4;
          break;
        case 'cast':
          if (a.stage === 'windup') { f = PL.U.lerp(R.front, 2.6, ease); w = 3.0; }
          else if (a.stage === 'active') { f = 1.6; w = 1.75; }
          else { f = 1.1; w = 2.4; }
          p.back = a.stage === 'windup' ? 1.4 : 0.5;
          if (ground) p.legs = 'run0';
          break;
        case 'shoot': case 'shootUp': {
          const aim = a.style === 'shootUp' ? 2.5 : 1.57;
          f = aim; w = aim;
          if (a.stage === 'windup') { p.back = aim; p.backLen = 3; p.weaponName = 'bowDrawn'; }
          else if (a.stage === 'active') { p.back = aim - 0.4; p.backLen = 6; }
          else { f = aim - 0.25; w = aim - 0.25; p.back = 0.4; }
          if (ground) p.legs = 'run0';
          break;
        }
        case 'raise':
          f = PL.U.lerp(R.front, 3.0, ease); w = 3.1; p.back = PL.U.lerp(0.15, 2.9, ease);
          if (ground && a.stage === 'active') p.legs = 'crouch';
          break;
        case 'guard':
          f = 0.7; w = 2.0; p.back = 1.5; p.backLen = 6;
          if (ground && st.move !== 'run') p.legs = 'crouch';
          break;
        case 'bash':
          if (a.stage === 'windup') { f = 0.4; w = 2.6; p.back = 0.9; p.backLen = 5; if (ground) p.legs = 'crouch'; }
          else if (a.stage === 'active') { f = 0.5; w = 2.5; p.back = 1.57; p.backLen = 9; if (ground) p.legs = 'run0'; }
          else { f = 0.5; w = 2.4; p.back = 1.3; }
          break;
        case 'punch':
          if (a.stage === 'windup') { f = -0.7; p.back = 1.0; if (ground) p.legs = 'crouch'; }
          else if (a.stage === 'active') { f = 1.57; p.back = -0.5; if (ground) p.legs = 'run0'; }
          else { f = 1.0; p.back = 0.2; }
          w = f;
          break;
        default:
          f = 1.57; w = 1.57;
      }
      p.front = f;
      if (hasW) p.weapon = w;
      // Shield bearers keep the shield up through ordinary swings.
      if (s.shield && (a.style === 'swing' || a.style === 'thrust')) p.back = Math.max(p.back, 1.1);
    }
    if (s.backWeapon) p.backWeapon = a ? p.back + 0.6 : 1.3 + p.back * 0.2;
    return p;
  }

  // Opaque pixels of the current frame relative to the feet anchor (used for the death "shatter").
  function pixels(id, pose, facing, maxCount) {
    const s = spec(id), k = s.pixelScale || 1, { AX, FOOT } = dims(s);
    const buf = frame(id, pose).buf;
    let count = 0;
    for (let i = 0; i < buf.px.length; i += k) if (buf.px[i]) count++;
    const step = k * Math.max(1, Math.ceil(Math.sqrt(count / (maxCount || 400))));
    const out = [];
    for (let y = 0; y < buf.h; y += step) for (let x = 0; x < buf.w; x += step) {
      const c = buf.px[y * buf.w + x];
      if (!c) continue;
      const dx = x - AX * k;
      out.push({ dx: facing >= 0 ? dx : -dx, dy: y - (FOOT + 1) * k, c });
    }
    return { list: out, size: step };
  }

  const shadowCache = {};
  function drawShadow(ctx, sx, sy, width) {
    const w = Math.max(8, Math.round(width)) | 1;
    let img = shadowCache[w];
    if (!img) {
      const b = new PL.Pixel.Buf(w, 3);
      for (let x = 0; x < w; x++) {
        const t = Math.abs(x - (w >> 1)) / (w / 2);
        if (t < 0.95) b.put(x, 1, '#000000');
        if (t < 0.7) { b.put(x, 0, '#000000'); b.put(x, 2, '#000000'); }
      }
      img = shadowCache[w] = b.toCanvas();
    }
    ctx.globalAlpha = 0.32;
    ctx.drawImage(img, Math.round(sx - w / 2), Math.round(sy - 2));
    ctx.globalAlpha = 1;
  }

  function portrait(id) {
    const s = spec(id);
    const R = REST[s.weapon || 'none'];
    const pose = s.kind && s.kind !== 'humanoid' ? idlePose(s) : { legs: 'stand', front: R.front, back: 0.15, weapon: s.weapon ? R.weapon : null, backWeapon: s.backWeapon ? 1.3 : null };
    const buf = frame(id, pose).buf;
    const bb = buf.bbox();
    const c = document.createElement('canvas');
    c.width = bb.x1 - bb.x0 + 1; c.height = bb.y1 - bb.y0 + 1;
    c.getContext('2d').drawImage(buf.toCanvas(), -bb.x0, -bb.y0);
    return c;
  }

  return {
    has: (id) => !!(PL.SPRITE_SPECS && PL.SPRITE_SPECS[id]),
    draw, poseFor, portrait, pixels, drawShadow,
    height: (id) => info(id).h,
    width: (id) => info(id).w
  };
})();

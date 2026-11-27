// Unified keyboard + touch input. Produces a per-frame state consumed by the player controller.
window.PL = window.PL || {};

PL.Input = (function () {
  const down = new Set();
  const justPressed = new Set();

  const KEYMAP = {
    left: ['a', 'arrowleft'],
    right: ['d', 'arrowright'],
    jump: [' ', 'space', 'arrowup', 'w'],
    light: ['j'],
    heavy: ['k'],
    dodge: ['shift'],
    ability1: ['q'],
    ability2: ['e'],
    pause: ['escape', 'p']
  };
  // Holding the attack button keeps the combo going.
  const REPEAT_FIRST_MS = 320, REPEAT_MS = 200;

  function normKey(e) {
    let k = e.key.toLowerCase();
    if (k === ' ') k = 'space';
    return k;
  }

  window.addEventListener('keydown', (e) => {
    const k = normKey(e);
    if (!down.has(k)) {
      justPressed.add(k);
      if (KEYMAP.light.includes(k)) repeatAt = performance.now() + REPEAT_FIRST_MS;
    }
    down.add(k);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'space'].includes(k)) e.preventDefault();
  }, { passive: false });

  window.addEventListener('keyup', (e) => { down.delete(normKey(e)); });

  function actionDown(action) { return (KEYMAP[action] || []).some(k => down.has(k)) || !!touchState[action]; }
  function actionJustPressed(action) {
    return (KEYMAP[action] || []).some(k => justPressed.has(k)) || !!touchJustPressed[action];
  }

  // ---------------- Touch controls ----------------
  const BTN_ACTION = { light: 'light', heavy: 'heavy', jump: 'jump', dodge: 'dodge', q: 'ability1', e: 'ability2' };
  const touchState = {};
  const touchJustPressed = {};
  const held = {};
  const touchOwner = new Map(); // touch id -> action it is holding
  let buttons = [];
  let zoneEl, baseEl, knobEl, hitEl;
  let joyId = null, joyX = 0, joyY = 0, joyDX = 0, joyUpArmed = true, joyRadius = 44, restX = 0, restY = 0;
  let repeatAt = 0;

  function haptic() { try { if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* not supported */ } }

  function press(action) {
    held[action] = (held[action] || 0) + 1;
    if (held[action] === 1) {
      touchJustPressed[action] = true;
      touchState[action] = true;
      if (action === 'light') repeatAt = performance.now() + REPEAT_FIRST_MS;
      haptic();
    }
    paint(action);
  }
  function release(action) {
    held[action] = Math.max(0, (held[action] || 0) - 1);
    if (!held[action]) touchState[action] = false;
    paint(action);
  }
  function paint(action) {
    for (const b of buttons) if (b.action === action) b.el.classList.toggle('pressed', !!held[action]);
  }

  // Nearest button whose (generously padded) area contains the point, so near-misses still count
  // and a thumb can slide from one button to the next.
  function buttonAt(x, y) {
    let best = null, bestD = Infinity;
    for (const b of buttons) {
      const r = b.el.getBoundingClientRect();
      const pad = r.width * 0.22;
      if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) continue;
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)) / r.width;
      if (d < bestD) { bestD = d; best = b.action; }
    }
    return best;
  }

  function onActionTouch(e) {
    e.preventDefault();
    PL.Audio.unlock();
    const ending = e.type === 'touchend' || e.type === 'touchcancel';
    for (const t of e.changedTouches) {
      const prev = touchOwner.get(t.identifier) || null;
      const next = ending ? null : buttonAt(t.clientX, t.clientY);
      if (prev === next) continue;
      if (prev) release(prev);
      if (next) { press(next); touchOwner.set(t.identifier, next); } else touchOwner.delete(t.identifier);
    }
  }

  function placeBase(x, y) {
    baseEl.style.left = (x - baseEl.offsetWidth / 2) + 'px';
    baseEl.style.top = (y - baseEl.offsetHeight / 2) + 'px';
  }

  function onJoyStart(e) {
    e.preventDefault();
    PL.Audio.unlock();
    if (joyId !== null) return;
    const t = e.changedTouches[0];
    const r = zoneEl.getBoundingClientRect();
    joyId = t.identifier;
    joyX = t.clientX - r.left; joyY = t.clientY - r.top;
    placeBase(joyX, joyY);
    baseEl.classList.add('active');
    moveKnob(t.clientX - r.left, t.clientY - r.top);
  }
  function onJoyMove(e) {
    e.preventDefault();
    const r = zoneEl.getBoundingClientRect();
    for (const t of e.changedTouches) if (t.identifier === joyId) moveKnob(t.clientX - r.left, t.clientY - r.top);
  }
  function onJoyEnd(e) {
    for (const t of e.changedTouches) {
      if (t.identifier !== joyId) continue;
      joyId = null; joyDX = 0; joyUpArmed = true;
      touchState.left = touchState.right = false;
      baseEl.classList.remove('active');
      placeBase(restX, restY);
      knobEl.style.transform = 'translate(-50%, -50%)';
    }
  }
  function moveKnob(x, y) {
    let dx = x - joyX, dy = y - joyY;
    const m = Math.hypot(dx, dy);
    if (m > joyRadius) {
      // Drag the base along behind the thumb so the stick never feels stuck at its rim.
      joyX += dx / m * (m - joyRadius); joyY += dy / m * (m - joyRadius);
      dx = x - joyX; dy = y - joyY;
      placeBase(joyX, joyY);
    }
    knobEl.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joyDX = dx / joyRadius;
    const ny = dy / joyRadius;
    touchState.left = joyDX < -0.2;
    touchState.right = joyDX > 0.2;
    if (ny < -0.62 && joyUpArmed) { touchJustPressed.jump = true; joyUpArmed = false; haptic(); }
    if (ny > -0.3) joyUpArmed = true;
  }

  function initTouch() {
    zoneEl = document.getElementById('joystick-zone');
    baseEl = document.getElementById('joystick-base');
    knobEl = document.getElementById('joystick-knob');
    hitEl = document.getElementById('action-hit');
    if (!zoneEl || !hitEl) return;
    buttons = Array.from(document.querySelectorAll('#mobile-controls .tbtn')).map(el => ({ el, action: BTN_ACTION[el.dataset.btn] }));
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
      hitEl.addEventListener(ev, onActionTouch, { passive: false });
    }
    zoneEl.addEventListener('touchstart', onJoyStart, { passive: false });
    zoneEl.addEventListener('touchmove', onJoyMove, { passive: false });
    zoneEl.addEventListener('touchend', onJoyEnd, { passive: false });
    zoneEl.addEventListener('touchcancel', onJoyEnd, { passive: false });
  }

  // How far the phone's notch / home indicator reaches into the controls box, per side.
  let probe = null;
  function safeInsets(box) {
    if (!probe) {
      probe = document.createElement('div');
      probe.style.cssText = 'position:fixed;inset:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';
      document.body.appendChild(probe);
    }
    const cs = getComputedStyle(probe), r = box.getBoundingClientRect();
    const px = (v) => parseFloat(v) || 0;
    return {
      left: Math.max(0, px(cs.paddingLeft) - r.left),
      right: Math.max(0, px(cs.paddingRight) - (window.innerWidth - r.right)),
      bottom: Math.max(0, px(cs.paddingBottom) - (window.innerHeight - r.bottom))
    };
  }

  // Lays the touch controls out over the game view: an arc of buttons around a
  // big attack button under the right thumb, and a floating joystick for the left thumb.
  function layoutTouch() {
    const box = document.getElementById('mobile-controls');
    const w = box ? box.offsetWidth : 0, h = box ? box.offsetHeight : 0;
    if (!buttons.length || !w) return;
    const ins = safeInsets(box);
    const A = PL.U.clamp(h * 0.2, 56, 88), B = A * 0.74, C = A * 0.64;
    const m = Math.max(10, h * 0.04);
    const cx = w - m - ins.right - A / 2, cy = h - m - ins.bottom - A / 2;
    const R1 = A / 2 + B / 2 + h * 0.022;
    const spots = {
      light: [A, 0, 0], heavy: [B, 180, R1], jump: [B, 90, R1], dodge: [C, 135, R1 * 1.32],
      q: [C, 162, R1 * 2.05], e: [C, 108, R1 * 2.05]
    };
    for (const { el } of buttons) {
      const [size, ang, rad] = spots[el.dataset.btn];
      const a = ang * Math.PI / 180;
      el.style.width = el.style.height = Math.round(size) + 'px';
      el.style.left = Math.round(cx + Math.cos(a) * rad - size / 2) + 'px';
      el.style.top = Math.round(cy - Math.sin(a) * rad - size / 2) + 'px';
    }
    joyRadius = PL.U.clamp(h * 0.13, 34, 56);
    const base = joyRadius * 2 + 12;
    baseEl.style.width = baseEl.style.height = Math.round(base) + 'px';
    knobEl.style.width = knobEl.style.height = Math.round(joyRadius * 0.95) + 'px';
    restX = m + ins.left + base / 2 + 8;
    const zr = zoneEl.getBoundingClientRect();
    restY = zr.height - m - ins.bottom - base / 2;
    if (joyId === null) placeBase(restX, restY);
  }

  function frameReset() {
    justPressed.clear();
    for (const k in touchJustPressed) touchJustPressed[k] = false;
    if (actionDown('light') && performance.now() >= repeatAt) {
      touchJustPressed.light = true;
      repeatAt = performance.now() + REPEAT_MS;
    }
  }

  function getMoveAxis() {
    if (joyId !== null && Math.abs(joyDX) > 0.2) return PL.U.clamp(joyDX * 1.35, -1, 1);
    let v = 0;
    if (actionDown('left')) v -= 1;
    if (actionDown('right')) v += 1;
    return v;
  }

  return {
    initTouch, layoutTouch, actionDown, actionJustPressed, getMoveAxis, frameReset,
    isTouchDevice: () => ('ontouchstart' in window) || navigator.maxTouchPoints > 0
  };
})();

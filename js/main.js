// Bootstrap: canvas setup, responsive scaling, and the main requestAnimationFrame loop.
window.PL = window.PL || {};

(function () {
  function resizeCanvas(canvas) {
    // Scale by a whole number of *device* pixels so every art pixel is the same size and crisp.
    // The view size adapts to the screen (bigger screens see more of the arena), like Terraria.
    const dpr = window.devicePixelRatio || 1;
    const wDev = Math.floor(window.innerWidth * dpr), hDev = Math.floor(window.innerHeight * dpr);
    const s = Math.max(1, Math.round(hDev / 330));
    PL.VIEW_H = Math.max(200, Math.floor(hDev / s));
    PL.VIEW_W = Math.min(760, Math.floor(wDev / s));
    if (canvas.width !== PL.VIEW_W || canvas.height !== PL.VIEW_H) {
      canvas.width = PL.VIEW_W;
      canvas.height = PL.VIEW_H;
    }
    const w = PL.VIEW_W * s / dpr, h = PL.VIEW_H * s / dpr;
    const left = Math.floor((wDev - PL.VIEW_W * s) / 2) / dpr;
    const top = Math.floor((hDev - PL.VIEW_H * s) / 2) / dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.style.left = left + 'px';
    canvas.style.top = top + 'px';

    // Anchor the HUD + touch controls to the canvas's actual on-screen rect (not the
    // full viewport) so they hug the game view instead of floating over letterbox bars.
    for (const id of ['hud', 'mobile-controls']) {
      const el = document.getElementById(id);
      el.style.left = left + 'px';
      el.style.top = top + 'px';
      el.style.width = w + 'px';
      el.style.height = h + 'px';
    }
    PL.Input.layoutTouch();
  }

  let autoPausedForRotation = false;
  function checkOrientation() {
    const prompt = document.getElementById('rotate-prompt');
    const bad = PL.Input.isTouchDevice() && window.innerHeight > window.innerWidth;
    if (bad) {
      prompt.classList.remove('hidden');
      if (PL.Game.running && !PL.Game.paused) { PL.Game.pause(); autoPausedForRotation = true; }
    } else {
      prompt.classList.add('hidden');
      if (autoPausedForRotation && PL.Game.running) { PL.Game.resume(); autoPausedForRotation = false; }
    }
  }

  function start() {
    const canvas = document.getElementById('game-canvas');
    resizeCanvas(canvas);

    PL.Game.init(canvas);
    PL.World.setArena('arena', 1200);
    PL.UI.init();

    checkOrientation();
    window.addEventListener('resize', () => { resizeCanvas(canvas); checkOrientation(); });
    window.addEventListener('orientationchange', () => { resizeCanvas(canvas); checkOrientation(); });

    const unlock = () => PL.Audio.unlock();
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);

    let last = performance.now();
    function loop(now) {
      const dt = (now - last) / 1000;
      last = now;
      PL.Game.update(Math.min(dt, 0.05));
      PL.Game.render(Math.min(dt, 0.05));
      PL.Input.frameReset();
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

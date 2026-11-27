// Procedural WebAudio sound effects & simple ambient music loop. No external audio files.
window.PL = window.PL || {};

PL.Audio = (function () {
  let ctx = null;
  let masterGain = null;
  let musicGain = null;
  let unlocked = false;
  let musicTimer = null;
  let musicStep = 0;
  let intensity = 0; // 0 calm, 1 combat, 2 boss

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.55;
      masterGain.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.18;
      musicGain.connect(masterGain);
    }
    return ctx;
  }

  function unlock() {
    ensureCtx();
    if (ctx.state === 'suspended') ctx.resume();
    unlocked = true;
  }

  function noiseBuffer(dur) {
    const c = ensureCtx();
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buf;
  }

  function tone(freq, dur, type, opts) {
    opts = opts || {};
    const c = ensureCtx();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.slideTo), t0 + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(opts.vol || 0.5, t0 + (opts.attack || 0.008));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(masterGain);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function noiseHit(dur, vol, filterFreq, type) {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(dur);
    const filt = c.createBiquadFilter();
    filt.type = type || 'bandpass';
    filt.frequency.value = filterFreq || 1200;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt); filt.connect(g); g.connect(masterGain);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  const sfx = {
    swingLight() { tone(PL.U.rand(520, 600), 0.09, 'triangle', { vol: 0.25, slideTo: 300 }); },
    swingHeavy() { tone(PL.U.rand(180, 220), 0.22, 'sawtooth', { vol: 0.3, slideTo: 90 }); },
    hit() { noiseHit(0.09, 0.35, 1800); },
    hitHeavy() { noiseHit(0.16, 0.5, 900); tone(90, 0.14, 'sine', { vol: 0.3 }); },
    crit() { noiseHit(0.12, 0.55, 2600); tone(1400, 0.1, 'square', { vol: 0.2, slideTo: 2000 }); },
    block() { noiseHit(0.07, 0.4, 2800, 'highpass'); },
    magic() { tone(760, 0.22, 'sine', { vol: 0.3, slideTo: 1200 }); },
    magicCast() { tone(300, 0.3, 'sawtooth', { vol: 0.22, slideTo: 700 }); },
    bow() { noiseHit(0.05, 0.25, 3200, 'highpass'); tone(900, 0.07, 'triangle', { vol: 0.15, slideTo: 400 }); },
    dash() { noiseHit(0.12, 0.25, 2200, 'highpass'); },
    hurt() { tone(220, 0.18, 'sawtooth', { vol: 0.3, slideTo: 100 }); },
    uiClick() { tone(500, 0.05, 'square', { vol: 0.12, slideTo: 700 }); },
    uiHover() { tone(700, 0.03, 'sine', { vol: 0.06 }); },
    levelUp() {
      [0, 0.1, 0.2].forEach((t, i) => setTimeout(() => tone(440 * Math.pow(1.26, i), 0.25, 'triangle', { vol: 0.3 }), t * 1000));
    },
    bossRoar() { noiseHit(0.5, 0.4, 250, 'lowpass'); tone(80, 0.5, 'sawtooth', { vol: 0.35, slideTo: 40 }); },
    explosion() { noiseHit(0.45, 0.55, 500, 'lowpass'); tone(60, 0.4, 'sine', { vol: 0.3 }); },
    shieldBreak() { noiseHit(0.2, 0.4, 2000); tone(200, 0.2, 'square', { vol: 0.2, slideTo: 60 }); },
    death() { tone(300, 0.5, 'sawtooth', { vol: 0.3, slideTo: 40 }); },
    pickup() { tone(880, 0.12, 'sine', { vol: 0.2, slideTo: 1320 }); }
  };

  function musicNote(freq, dur, type, vol) {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const osc = c.createOscillator();
    osc.type = type; osc.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g); g.connect(musicGain);
    osc.start(t0); osc.stop(t0 + dur + 0.02);
  }

  function musicTick() {
    if (!unlocked) return;
    const bassPatterns = [55, 55, 82.5, 73.5];
    const beat = musicStep % 8;
    const bass = bassPatterns[Math.floor(musicStep / 2) % bassPatterns.length];
    if (beat % 2 === 0) musicNote(bass, 0.3, 'triangle', 0.5);
    if (intensity >= 1 && beat % 2 === 1) noiseHit2(0.06, 0.12, 4000);
    if (intensity >= 2 && beat === 4) musicNote(bass * 2, 0.15, 'square', 0.25);
    musicStep++;
  }
  function noiseHit2(dur, vol, freq) {
    const c = ensureCtx();
    const t0 = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(dur);
    const filt = c.createBiquadFilter();
    filt.type = 'highpass'; filt.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt); filt.connect(g); g.connect(musicGain);
    src.start(t0); src.stop(t0 + dur + 0.02);
  }

  function startMusic() {
    if (musicTimer) return;
    ensureCtx();
    musicTimer = setInterval(musicTick, 260);
  }
  function stopMusic() {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  }
  function setMusicIntensity(level) { intensity = level; }

  return { unlock, sfx, startMusic, stopMusic, setMusicIntensity, isUnlocked: () => unlocked };
})();

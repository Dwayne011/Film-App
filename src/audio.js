// All sound: the theme song for the spin, the flapper clicks, the menacing bed and the reveal fanfare.
let ctx = null, master = null, themeBuf = null, themeEnd = 0, themeLoading = null, muted = false;

export function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    // iPhone: play through the media channel so the ringer switch does not silence the app.
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}
export const getCtx = () => ctx;
export const getMaster = () => master;
export const isMuted = () => muted;
export function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 1; }

// Where the track goes quiet: the last moment louder than about -34 dB.
function audibleEnd(buf) {
  let last = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c); let i = d.length - 1;
    while (i > 0 && Math.abs(d[i]) < 0.02) i--;
    if (i > last) last = i;
  }
  return Math.max(1, Math.min(buf.duration, last / buf.sampleRate));
}
export function loadTheme() {
  if (themeLoading) return themeLoading;
  themeLoading = fetch("/wheel-theme.mp3")
    .then((r) => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then((b) => new Promise((res, rej) => { const c = audio(); if (!c) return rej(); const p = c.decodeAudioData(b, res, rej); if (p && p.catch) p.catch(rej); }))
    .then((buf) => { themeBuf = buf; themeEnd = audibleEnd(buf); })
    .catch(() => { themeBuf = null; themeLoading = null; });
  return themeLoading;
}
export const theme = () => (themeBuf ? { buf: themeBuf, end: themeEnd } : null);

// Flapper click. weight 0..1: heavier and lower as the wheel slows.
export function tick(weight) {
  if (!ctx) return;
  const w = weight || 0, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = "square"; o.frequency.setValueAtTime(1900 - w * 900, t); o.frequency.exponentialRampToValueAtTime(700 - w * 380, t + 0.03 + w * 0.03);
  g.gain.setValueAtTime(0.05 + w * 0.16, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04 + w * 0.06);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.12);
}
function thud(t, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(34, t + 0.22);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
  o.connect(g).connect(master); o.start(t); o.stop(t + 0.32);
}
// "Ta-DAA!" brass stab for the moment the film is unveiled.
export function exclaim() {
  if (!ctx) return;
  const t = ctx.currentTime, out = ctx.createGain(), lp = ctx.createBiquadFilter();
  out.gain.value = 0.16; lp.type = "lowpass"; lp.Q.value = 1.2; lp.connect(out).connect(master);
  lp.frequency.setValueAtTime(900, t); lp.frequency.exponentialRampToValueAtTime(5200, t + 0.3); lp.frequency.exponentialRampToValueAtTime(1400, t + 1.5);
  const chord = (freqs, at, len) => freqs.forEach((f, i) => [-5, 5].forEach((det) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sawtooth"; o.frequency.value = f; o.detune.value = det + i * 2;
    g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(0.5, at + 0.025); g.gain.setValueAtTime(0.5, at + len * 0.55); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(lp); o.start(at); o.stop(at + len + 0.05);
  }));
  chord([196, 246.9, 293.7, 392], t, 0.16);                       // "ta"
  chord([130.8, 261.6, 329.6, 392, 523.3, 659.3], t + 0.2, 1.5);  // "DAA"
  const n = ctx.createBufferSource(), nb = ctx.createBuffer(1, ctx.sampleRate * 1.2, ctx.sampleRate), d = nb.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2.5);
  const hp = ctx.createBiquadFilter(), ng = ctx.createGain(); hp.type = "highpass"; hp.frequency.value = 6000; ng.gain.value = 0.18;
  n.buffer = nb; n.connect(hp).connect(ng).connect(master); n.start(t + 0.2);  // cymbal shimmer
}
// Menacing bed: low drone a semitone apart, a slow rising tone, and a heartbeat that quickens.
export function startMenace() {
  const has = !!audio();
  let out, lp, riser, rg, oscs = [], lfo, nextBeat = performance.now() + 300, live = true;
  if (has) {
    const t = ctx.currentTime; out = ctx.createGain(); lp = ctx.createBiquadFilter();
    out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(0.5, t + 1.2);
    lp.type = "lowpass"; lp.frequency.setValueAtTime(140, t); lp.Q.value = 7; lp.connect(out).connect(master);
    oscs = [[55, "sawtooth", 0.5], [58.27, "sawtooth", 0.42], [27.5, "sine", 0.8], [82.4, "triangle", 0.2]].map(([f, ty, v]) => {
      const o = ctx.createOscillator(), g = ctx.createGain(); o.type = ty; o.frequency.value = f; g.gain.value = v; o.connect(g).connect(lp); o.start(t); return o;
    });
    lfo = ctx.createOscillator(); const lg = ctx.createGain(); lfo.frequency.value = 0.33; lg.gain.value = 60; lfo.connect(lg).connect(lp.frequency); lfo.start(t);
    riser = ctx.createOscillator(); rg = ctx.createGain(); riser.type = "sine"; riser.frequency.value = 110; rg.gain.value = 0; riser.connect(rg).connect(out); riser.start(t);
    const trem = ctx.createOscillator(), tg = ctx.createGain(); trem.frequency.value = 7; tg.gain.value = 0.03; trem.connect(tg).connect(rg.gain); trem.start(t); oscs.push(trem);
  }
  return {
    // p: 0..1 tension. Returns true on the frames a heartbeat lands.
    beat(p) {
      if (!live) return false;
      if (has) { const now = ctx.currentTime; lp.frequency.setTargetAtTime(140 + p * 620, now, 0.3); riser.frequency.setTargetAtTime(110 * Math.pow(2, p * 1.9), now, 0.25); rg.gain.setTargetAtTime(p * p * 0.11, now, 0.3); }
      const now = performance.now();
      if (now >= nextBeat) { nextBeat = now + (1100 - p * 720); if (has) { const t = ctx.currentTime; thud(t, 0.75); thud(t + 0.15, 0.5); } return true; }
      return false;
    },
    stop(fade) {
      live = false; if (!has) return;
      const now = ctx.currentTime; out.gain.cancelScheduledValues(now); out.gain.setTargetAtTime(0, now, fade);
      setTimeout(() => { oscs.concat([lfo, riser]).forEach((o) => { try { o.stop(); } catch (e) {} }); }, 2500);
    },
  };
}

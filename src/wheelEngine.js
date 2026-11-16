// The wheel itself: drawing, the song-timed spin, the rim lights and hold-and-drag browsing.
// Kept outside React because it animates every frame.
import * as A from "./audio";
import { FILMS } from "./films";

const SEG = 3.6, TURNS = 14, BULBS = 72, FALLBACK_SPIN = 22.5;
// Seconds into the theme where "The" and "Wheel!" are sung, measured from the track to within about 10 ms.
// [time, strength]: a small wind-up on "The", the big hit on "Wheel!".
const CUES = [[12.533, 0], [12.76, 1], [14.843, 0], [15.07, 1], [19.547, 0], [19.745, 1]];
const COLORS = ["#3d5afe", "#7c4dff", "#c51bff", "#0091ea"];
const SEEN_A = "#353a55", SEEN_B = "#40465f";
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const indexAt = (a) => Math.floor(((((360 - (a % 360)) % 360) + 360) % 360) / SEG) % 100;
const ease = (p) => 1 - Math.pow(1 - p, 3);

export function createWheel(els, cb) {
  const { cv, lights, box, flash, ring, whiteout, pointer, hub, hubNum, hubCap, beams } = els;
  const g2 = cv.getContext("2d"), lg2 = lights.getContext("2d");
  let data = { seen: {}, current: null, skipSeen: false };
  let angle = 0, spinning = false, browseN = null, hitUntil = 0, idlePhase = 0, dead = false;
  const isSeen = (n) => Object.prototype.hasOwnProperty.call(data.seen, n);
  const left = () => 100 - Object.keys(data.seen).length;

  function drawWheel() {
    const css = cv.clientWidth; if (!css) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3), px = Math.round(css * dpr);
    if (cv.width !== px) { cv.width = px; cv.height = px; }
    const R = px / 2;
    g2.clearRect(0, 0, px, px); g2.save(); g2.translate(R, R);
    const a0 = -Math.PI / 2, da = (Math.PI * 2) / 100;
    for (let i = 0; i < 100; i++) {
      g2.beginPath(); g2.moveTo(0, 0); g2.arc(0, 0, R, a0 + i * da, a0 + (i + 1) * da); g2.closePath();
      g2.fillStyle = isSeen(i + 1) ? (i % 2 ? SEEN_A : SEEN_B) : COLORS[i % 4]; g2.fill();
      g2.strokeStyle = "rgba(255,255,255,.18)"; g2.lineWidth = dpr * 0.6; g2.stroke();
    }
    g2.textBaseline = "middle";
    const numFont = "700 " + R * 0.056 + "px Roboto, system-ui, sans-serif", nameFont = "500 " + R * 0.038 + "px Roboto, system-ui, sans-serif";
    const fit = (t, max) => { if (g2.measureText(t).width <= max) return t; while (t.length > 1 && g2.measureText(t + "…").width > max) t = t.slice(0, -1); return t.trimEnd() + "…"; };
    for (let i = 0; i < 100; i++) {
      const n = i + 1, seen = isSeen(n);
      g2.save(); g2.rotate(a0 + (i + 0.5) * da);
      g2.textAlign = "right"; g2.font = numFont;
      g2.fillStyle = seen ? "rgba(255,255,255,.42)" : data.current === n ? "#ffc940" : "#fff";
      g2.fillText(String(n), R * 0.975, 0);
      if (seen) { // film name and its stars run along the slice, reading outwards
        g2.font = nameFont;
        const r = data.seen[n] || 0, sw = g2.measureText("★").width, count = Math.ceil(r), x = R * 0.87 - count * sw;
        g2.textAlign = "left"; g2.fillStyle = "#ffc940";
        for (let k = 0; k < count; k++) {
          const half = k + 1 > r;
          if (half) { g2.save(); g2.beginPath(); g2.rect(x + k * sw, -R * 0.05, sw * 0.5, R * 0.1); g2.clip(); }
          g2.fillText("★", x + k * sw, 0);
          if (half) g2.restore();
        }
        const right = x - (count ? R * 0.012 : 0), inner = R * 0.31;
        g2.textAlign = "right"; g2.fillStyle = "rgba(255,255,255,.82)";
        g2.fillText(fit(FILMS[i].title, right - inner), right, 0);
      }
      g2.restore();
    }
    const sh = g2.createRadialGradient(0, 0, R * 0.24, 0, 0, R * 0.36); sh.addColorStop(0, "rgba(8,10,40,.7)"); sh.addColorStop(1, "rgba(8,10,40,0)");
    g2.fillStyle = sh; g2.beginPath(); g2.arc(0, 0, R * 0.36, 0, Math.PI * 2); g2.fill();
    g2.restore();
  }
  // Bulbs round the rim. mode: "idle" (alternate twinkle), "chase" (run with the wheel), "all" (flash), "off".
  function drawLights(mode, phase) {
    const css = lights.clientWidth; if (!css) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), px = Math.round(css * dpr);
    if (lights.width !== px) { lights.width = px; lights.height = px; }
    const R = px / 2, rr = R * 0.983, br = Math.max(2 * dpr, R * 0.0105);
    lg2.clearRect(0, 0, px, px);
    for (let k = 0; k < BULBS; k++) {
      const a = -Math.PI / 2 + ((k + 0.5) * Math.PI * 2) / BULBS;
      const on = mode === "all" || (mode === "idle" && (k + phase) % 2 === 0) || (mode === "chase" && (((k - phase) % 4) + 4) % 4 === 0);
      lg2.beginPath(); lg2.arc(R + Math.cos(a) * rr, R + Math.sin(a) * rr, br, 0, Math.PI * 2);
      lg2.shadowColor = "#ffc940"; lg2.shadowBlur = on ? br * 3.5 : 0;
      lg2.fillStyle = on ? "#fff3c4" : "rgba(255,201,64,.22)"; lg2.fill();
    }
  }
  const idleTimer = setInterval(() => { if (!spinning && cv.clientWidth) { idlePhase ^= 1; drawLights("idle", idlePhase); } }, 700);

  function setHub(n, cap) {
    hubNum.textContent = n; hubCap.textContent = cap;
    hub.classList.toggle("seen", cap !== "left to watch" && isSeen(n));
  }
  function restHub() { if (spinning) return; if (browseN != null) setHub(browseN, isSeen(browseN) ? "seen" : "to watch"); else setHub(left(), "left to watch"); }
  function flap(strength) {
    if (reduceMotion()) return;
    pointer.animate([{ transform: "rotate(" + (-10 - strength * 22) + "deg)" }, { transform: "rotate(0deg)" }], { duration: 110 + strength * 160, easing: "ease-out" });
  }
  // The wheel jumps, flashes and lights up on each "The Wheel!"
  function wheelHit(big) {
    hitUntil = performance.now() + (big ? 520 : 120);
    if (reduceMotion()) return;
    if (!big) { // "The": a quick crouch before the jump
      box.animate([{ transform: "scale(1)" }, { transform: "scale(.94)" }], { duration: 200, easing: "ease-in", fill: "forwards" });
      return;
    }
    // "Wheel!": hits full size within one frame, then springs back
    box.getAnimations().forEach((x) => x.cancel());
    box.animate([{ transform: "scale(1.26) rotate(-2.5deg)" }, { transform: "scale(1.24) rotate(2deg)", offset: 0.1 }, { transform: "scale(.95) rotate(0deg)", offset: 0.42 }, { transform: "scale(1.07)", offset: 0.66 }, { transform: "scale(.99)", offset: 0.85 }, { transform: "scale(1)" }], { duration: 900, easing: "ease-out" });
    flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: "ease-out" });
    ring.animate([{ opacity: 1, transform: "scale(.9)" }, { opacity: 0, transform: "scale(1.7)" }], { duration: 750, easing: "cubic-bezier(.1,.7,.3,1)" });
    whiteout.animate([{ opacity: 0.75 }, { opacity: 0 }], { duration: 480, easing: "ease-out" });
    hub.animate([{ transform: "scale(1.5)" }, { transform: "scale(.92)", offset: 0.5 }, { transform: "scale(1)" }], { duration: 620, easing: "ease-out" });
    beams.animate([{ filter: "brightness(4.5)" }, { filter: "brightness(1)" }], { duration: 900, easing: "ease-out" });
    try { if (navigator.vibrate) navigator.vibrate(60); } catch (e) {}
  }

  async function spin() {
    if (spinning || dead) return;
    const pool = FILMS.map((_, i) => i).filter((i) => !data.skipSeen || !isSeen(i + 1));
    if (!pool.length) { cb.toast("You've watched all 100!"); return; }
    spinning = true; setBrowse(null); document.body.classList.add("spinning"); cb.onSpin(true);
    A.audio(); await A.loadTheme();
    const forced = window.__target;
    const target = forced >= 1 && forced <= 100 ? forced - 1 : pool[Math.floor(Math.random() * pool.length)];
    const want = 360 - (target + 0.25 + Math.random() * 0.5) * SEG;
    const from = angle, delta = ((((want - from) % 360) + 360) % 360) + 360 * TURNS;
    const th = A.theme(), ctx = A.getCtx();
    const dur = th ? th.end : window.__spinSeconds || FALLBACK_SPIN;
    let clock, t0, lag = 0;
    if (th && ctx) {
      const src = ctx.createBufferSource(); src.buffer = th.buf; src.connect(A.getMaster());
      t0 = ctx.currentTime + 0.06; src.start(t0); clock = () => ctx.currentTime;
      lag = ctx.outputLatency || ctx.baseLatency || 0;
    } else { t0 = performance.now() / 1000; clock = () => performance.now() / 1000; }
    const cues = th && ctx ? CUES : window.__cues || [];
    let last = -1, lastTick = 0, cue = 0;
    const frame = () => {
      if (dead) return;
      const el = clock() - t0, p = Math.max(0, Math.min(1, el / dur));
      // What you hear lags the audio clock by the output delay (bigger on Bluetooth), so line the picture up with the sound, one frame ahead.
      const heard = el - lag + 0.012;
      while (cue < cues.length && heard >= cues[cue][0]) { wheelHit(cues[cue][1]); cue++; }
      angle = from + delta * ease(p);
      cv.style.transform = "rotate(" + angle + "deg)";
      drawLights(performance.now() < hitUntil ? "all" : "chase", Math.floor(angle / (360 / BULBS)));
      const i = indexAt(angle);
      if (i !== last) {
        last = i; setHub(i + 1, "…");
        const now = performance.now(), slow = Math.max(0, (p - 0.55) / 0.45);
        if (now - lastTick > 45) {
          lastTick = now; A.tick(slow * slow); flap(slow);
          if (slow > 0.5 && !reduceMotion()) hub.animate([{ transform: "scale(" + (1 + slow * 0.12) + ")" }, { transform: "scale(1)" }], { duration: 260, easing: "ease-out" });
        }
      }
      if (p < 1) requestAnimationFrame(frame); else landed(target + 1);
    };
    requestAnimationFrame(frame);
  }
  function landed(n) {
    angle = angle % 360;
    setHub(n, isSeen(n) ? "already seen" : "landed");
    if (!reduceMotion()) {
      flash.animate([{ opacity: 0 }, { opacity: 0.95, offset: 0.15 }, { opacity: 0 }], { duration: 900, easing: "ease-out" });
      box.animate([{ transform: "scale(1)" }, { transform: "scale(1.035)", offset: 0.2 }, { transform: "scale(1)" }], { duration: 500, easing: "ease-out" });
    }
    let f = 0; const fl = setInterval(() => { drawLights(f % 2 ? "off" : "all", 0); if (++f > 6) clearInterval(fl); }, 140);
    setTimeout(() => {
      if (dead) return;
      spinning = false; document.body.classList.remove("spinning"); cb.onSpin(false);
      cb.onLanded(n, isSeen(n));
    }, 1100);
  }

  // Hold and drag the wheel to browse. The film card shows only while browsing.
  function setBrowse(n) { if (n === browseN) return; browseN = n; cb.onBrowse(n); }
  let prev = null, hideT;
  const at = (e) => { const r = cv.getBoundingClientRect(); return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI; };
  const sync = () => {
    cv.style.transform = "rotate(" + angle + "deg)";
    const n = indexAt(angle) + 1;
    if (n !== browseN) { setBrowse(n); A.tick(0.15); flap(0.2); setHub(n, isSeen(n) ? "seen" : "to watch"); }
  };
  const down = (e) => { if (spinning) return; A.audio(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} prev = at(e); cv.style.cursor = "grabbing"; clearTimeout(hideT); sync(); };
  const move = (e) => { if (prev == null || spinning) return; const a = at(e); let d = a - prev; if (d > 180) d -= 360; if (d < -180) d += 360; angle += d; prev = a; sync(); };
  // The card lingers a few seconds after you let go (so you can tap it), then slips away.
  const up = () => { if (prev == null) return; prev = null; cv.style.cursor = ""; clearTimeout(hideT); hideT = setTimeout(() => { if (spinning || dead) return; setBrowse(null); restHub(); }, 4000); };
  cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move); cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  const redraw = () => { drawWheel(); drawLights("idle", idlePhase); };
  window.addEventListener("resize", redraw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!dead) drawWheel(); });

  return {
    setData(d) { data = d; redraw(); restHub(); },
    redraw,
    spin,
    isSpinning: () => spinning,
    destroy() {
      dead = true; clearInterval(idleTimer); clearTimeout(hideT); window.removeEventListener("resize", redraw);
      cv.removeEventListener("pointerdown", down); cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerup", up); cv.removeEventListener("pointercancel", up);
      document.body.classList.remove("spinning");
    },
  };
}

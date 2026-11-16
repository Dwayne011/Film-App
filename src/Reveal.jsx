// The reveal: the list scrolls down to the number, the three candidates stay blurred,
// tension builds, then silence, then the film.
import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import * as A from "./audio";
import { FILMS, film } from "./films";
import { Stars, starsHTML } from "./Stars";

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const has = (seen, n) => Object.prototype.hasOwnProperty.call(seen, n);

export default function Reveal({ n, seen, onChoose, onClose }) {
  const scRef = useRef(null), ulRef = useRef(null), dreadRef = useRef(null);
  const [head, setHead] = useState(["The wheel has spoken", "Number " + n]);
  const [picking, setPicking] = useState(false);
  const seenAtStart = useRef(seen);

  useEffect(() => {
    let alive = true;
    const sc = scRef.current, ul = ulRef.current, dread = dreadRef.current, sn = seenAtStart.current;
    ul.innerHTML = FILMS.map((f, i) => {
      const k = i + 1, s = has(sn, k);
      const meta = s ? (sn[k] ? starsHTML(sn[k]) : '<span class="meta">Seen · not rated</span>') : "<span></span>";
      return '<li class="row' + (s ? " seen" : "") + '"><span class="n">' + k + '</span><span><span class="ti">' + esc(f.title) + '</span> <span class="yr">' + f.year + "</span></span>" + meta + "</li>";
    }).join("");
    const cands = [n - 1, n, n + 1].filter((k) => k >= 1 && k <= 100);
    cands.forEach((k) => ul.children[k - 1].classList.add("veil")); // hidden until the very end
    sc.scrollTop = 0;
    const row = ul.children[n - 1];
    const end = row.offsetTop - sc.clientHeight / 2 + row.offsetHeight / 2;
    const quick = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = quick ? 600 : window.__revealMs || 5200 + n * 90, t0 = performance.now();
    const m = A.startMenace();
    let tension = 0, looping = true;
    const pulse = () => { if (!quick) dread.animate([{ opacity: 0.15 + tension * 0.55 }, { opacity: 0 }], { duration: 520, easing: "ease-out" }); };
    const loop = (now) => {
      if (!alive || !looping) return;
      const p = Math.min(1, (now - t0) / dur);
      if (p < 1) { sc.scrollTop = end * (1 - Math.pow(1 - p, 3)); tension = p * 0.8; }
      if (m.beat(tension)) pulse();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    (async () => {
      await wait(dur); if (!alive) return;
      sc.scrollTop = end; sc.classList.add("done"); ul.children[n - 1].classList.add("landed");
      cands.forEach((k) => { if (k !== n) ul.children[k - 1].classList.add("cand"); });
      if (!quick) {
        tension = 0.88; await wait(1100); if (!alive) return;
        if (n > 1) { setHead(["One above", "Number " + (n - 1)]); ul.children[n - 2].classList.remove("veil"); tension = 0.93; await wait(1700); if (!alive) return; }
        if (n < 100) { setHead(["One below", "Number " + (n + 1)]); ul.children[n].classList.remove("veil"); tension = 1; await wait(1900); if (!alive) return; }
        setHead(["And the wheel chose", "Number " + n]);
        looping = false; m.stop(0.12);            // everything drops to silence…
        await wait(1500); if (!alive) return;
      } else { looping = false; m.stop(0.2); cands.forEach((k) => ul.children[k - 1].classList.remove("veil")); }
      ul.children[n - 1].classList.remove("veil"); // …then the film
      A.exclaim();
      await wait(quick ? 0 : 1500); if (!alive) return;
      setPicking(true);
      requestAnimationFrame(() => { if (alive) sc.scrollTop = row.offsetTop - sc.clientHeight / 2 + row.offsetHeight / 2; });
    })();
    return () => { alive = false; m.stop(0.15); };
  }, [n]);

  const Opt = ({ k, label, main }) => {
    if (k < 1 || k > 100) return null;
    const f = film(k), s = has(seen, k);
    return (
      <button className={"opt" + (main ? " main" : "")} disabled={s} onClick={() => onChoose(k)}>
        <span><span className="k">{label} · #{k}</span><br /><span className="ti">{f.title}</span> <span className="yr">{f.year}</span></span>
        {s ? (seen[k] ? <Stars value={seen[k]} /> : <span className="go">Seen</span>) : <span className="go">Details</span>}
      </button>
    );
  };
  return (
    <div className="overlay">
      <div className="dread" ref={dreadRef} />
      <div className="inner">
        <div className="rv-head">
          <div className="eyebrow">{head[0]}</div>
          <div className="big">{head[1]}</div>
        </div>
        <div className="rv-scroll" ref={scRef}><ul ref={ulRef} /></div>
        {picking && (
          <Paper className="rv-pick">
            <div className="eyebrow" style={{ textAlign: "center" }}>Which one tonight?</div>
            <Opt k={n - 1} label="One above" />
            <Opt k={n} label="Landed on" main />
            <Opt k={n + 1} label="One below" />
            <Button variant="text" color="secondary" onClick={onClose}>Spin again instead</Button>
          </Paper>
        )}
      </div>
    </div>
  );
}

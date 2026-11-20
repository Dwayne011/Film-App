import { useEffect, useRef, useState } from "react";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import { createWheel } from "./wheelEngine";
import { film } from "./films";
import { Status } from "./Stars";

export default function WheelView({ visible, s, onLanded, onOpenFilm, onToast }) {
  const r = useRef({});
  const engine = useRef(null);
  const latest = useRef({});
  latest.current = { onLanded, onToast };
  const [browseN, setBrowseN] = useState(null);

  useEffect(() => {
    const e = createWheel(
      { ...r.current, beams: document.querySelector(".beams"), whiteout: document.querySelector(".whiteout") },
      { onSpin: () => {}, onLanded: (n, seen) => latest.current.onLanded(n, seen), onBrowse: setBrowseN, toast: (m) => latest.current.onToast(m) }
    );
    engine.current = e;
    return () => e.destroy();
  }, []);
  useEffect(() => { engine.current.setData({ seen: s.seen, current: s.current, skipSeen: s.skipSeen }); }, [s.seen, s.current, s.skipSeen]);
  useEffect(() => { if (visible) engine.current.redraw(); }, [visible]);

  const set = (k) => (el) => { r.current[k] = el; };
  const spin = () => engine.current.spin();
  const b = browseN && film(browseN);
  return (
    <section className="view wheelview" hidden={!visible}>
      {s.current && (
        <Paper className="tonight chrome">
          <div className="grow">
            <div className="eyebrow">Tonight's film</div>
            <div className="t">#{s.current} {film(s.current).title} ({film(s.current).year})</div>
          </div>
          <Button variant="contained" size="small" onClick={() => onOpenFilm(s.current)}>Rate it</Button>
        </Paper>
      )}
      <div className="stage">
        <div className="wheelbox" ref={set("box")}>
          <div className="rim" />
          <canvas className="wheel-cv" ref={set("cv")} aria-label="Wheel of 100 films. Hold and drag to browse." />
          <canvas className="lights-cv" ref={set("lights")} aria-hidden="true" />
          <div className="flash" ref={set("flash")} />
          <div className="ring" ref={set("ring")} />
          <div className="pointer" ref={set("pointer")} aria-hidden="true">
            <svg viewBox="0 0 34 46"><path d="M17 45 L2 10 A15 15 0 0 1 32 10 Z" fill="#ffc940" stroke="#fff3c4" strokeWidth="1.5" /><circle cx="17" cy="13" r="4.5" fill="#2a1c00" /></svg>
          </div>
          <button className="hub" ref={set("hub")} onClick={spin} aria-label="Spin the wheel">
            <span className="num" ref={set("hubNum")}>100</span>
            <span className="cap" ref={set("hubCap")}>films</span>
          </button>
        </div>
        <button className={"info chrome" + (b ? "" : " off")} onClick={() => browseN && onOpenFilm(browseN)} tabIndex={b ? 0 : -1}>
          {b && (
            <>
              <span><span className="eyebrow">Number {browseN}</span><br /><span className="ti">{b.title}</span> <span className="yr">{b.year}</span></span>
              {Status({ n: browseN, seen: s.seen, current: s.current }) || <span className="meta">Not watched yet</span>}
            </>
          )}
        </button>
      </div>
      <Button className="chrome spinbtn" variant="contained" fullWidth onClick={spin}>Spin the wheel</Button>
    </section>
  );
}

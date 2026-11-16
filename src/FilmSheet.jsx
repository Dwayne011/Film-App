// Bottom sheets about one film: decide whether to watch it, rate it, or see that it's already been watched.
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Rating from "@mui/material/Rating";
import PlayArrowRounded from "@mui/icons-material/PlayArrowRounded";
import { film, posterURL, trailerApp, trailerWeb, IN_APP, IS_ANDROID, IS_IOS } from "./films";
import { Stars } from "./Stars";

const has = (seen, n) => Object.prototype.hasOwnProperty.call(seen, n);
const mins = (m) => (m ? `${Math.floor(m / 60)}h ${m % 60}m` : "");

function About({ n }) {
  const f = film(n);
  return (
    <>
      <div className="filmhead">
        <img src={posterURL(n)} alt="" loading="lazy" />
        <div>
          <div className="eyebrow">Number {n}</div>
          <h2>{f.title}</h2>
          <div className="sub">{[f.year, mins(f.runtime)].filter(Boolean).join(" · ")}</div>
        </div>
      </div>
      <p className="syn">{f.overview}</p>
      <div className="actions">
        <Button variant="outlined" fullWidth startIcon={<PlayArrowRounded />} href={trailerApp(n)} target="_blank" rel="noopener">Watch the trailer</Button>
        {(IS_ANDROID || IS_IOS) && !IN_APP && <Button variant="text" color="secondary" size="small" href={trailerWeb(n)} target="_blank" rel="noopener">Open in the browser instead</Button>}
      </div>
    </>
  );
}

// mode: "decide" (after the reveal), "film" (browse or list: rate it), "seen" (wheel landed on a watched film)
export default function FilmSheet({ sheet, seen, onClose, onWatch, onRate, onSeenLater, onUnwatch, onSpinAgain }) {
  const [val, setVal] = useState(0);
  const n = sheet?.n, mode = sheet?.mode;
  useEffect(() => { if (n) setVal(seen[n] || 0); }, [n, mode]); // eslint-disable-line
  if (!sheet) return null;
  const f = film(n), watched = has(seen, n);
  return (
    <Dialog open onClose={onClose} scroll="paper">
      <div className="sheet">
        {mode === "seen" && (
          <>
            <div className="eyebrow">Number {n} · already seen</div>
            <h2>{f.title}</h2>
            <p>{seen[n] ? <><Stars value={seen[n]} /> &nbsp;{seen[n]} / 5</> : "Watched, not rated yet"}</p>
            <div className="actions">
              <Button variant="contained" fullWidth onClick={onSpinAgain}>Spin again</Button>
              <Button variant="text" color="secondary" onClick={onClose}>Not now</Button>
            </div>
          </>
        )}
        {mode === "decide" && (
          <>
            <About n={n} />
            <div className="actions">
              <Button variant="contained" fullWidth onClick={() => onWatch(n)}>We're watching it</Button>
              <Button variant="text" color="secondary" onClick={onClose}>Not this one</Button>
            </div>
          </>
        )}
        {mode === "film" && (
          <>
            <About n={n} />
            <div className="rate">
              <Rating name="rating" value={val} precision={0.5} onChange={(e, v) => setVal(v || 0)} />
              <div className="val">{val ? `${val} / 5` : "Tap to rate. Half stars allowed."}</div>
            </div>
            <div className="actions">
              <Button variant="contained" fullWidth disabled={!val} onClick={() => onRate(n, val)}>Save rating</Button>
              {watched
                ? <Button variant="text" color="error" onClick={() => onUnwatch(n)}>Mark as not watched</Button>
                : <Button variant="text" color="secondary" onClick={() => onSeenLater(n)}>We've seen it, rate later</Button>}
              <Button variant="text" color="secondary" onClick={onClose}>Close</Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

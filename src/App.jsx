import { useEffect, useState } from "react";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import SvgIcon from "@mui/material/SvgIcon";
import FormatListNumberedRounded from "@mui/icons-material/FormatListNumberedRounded";
import SettingsRounded from "@mui/icons-material/SettingsRounded";
import VolumeOffRounded from "@mui/icons-material/VolumeOffRounded";
import VolumeUpRounded from "@mui/icons-material/VolumeUpRounded";
import * as A from "./audio";
import { title } from "./films";
import { onNotice, setCurrent, setRating, start, unwatch, useStore } from "./store";
import FilmSheet from "./FilmSheet";
import Gate from "./Gate";
import ListView from "./ListView";
import Reveal from "./Reveal";
import SettingsSheet from "./SettingsSheet";
import WheelView from "./WheelView";

const WheelIcon = (p) => (
  <SvgIcon {...p}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 2.07A8 8 0 0 1 19.93 11H14.8a3 3 0 0 0-1.8-1.8V4.07zM11 4.07V9.2A3 3 0 0 0 9.2 11H4.07A8 8 0 0 1 11 4.07zM4.07 13H9.2a3 3 0 0 0 1.8 1.8v5.13A8 8 0 0 1 4.07 13zM13 19.93V14.8a3 3 0 0 0 1.8-1.8h5.13A8 8 0 0 1 13 19.93z" /></SvgIcon>
);
const MUTE_KEY = "filmwheel.muted";

export default function App() {
  const s = useStore();
  const [tab, setTab] = useState("wheel");
  const [sheet, setSheet] = useState(null);       // { mode, n }
  const [settings, setSettings] = useState(false);
  const [revealN, setRevealN] = useState(null);
  const [toast, setToast] = useState("");
  const [muted, setMuted] = useState(() => { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { return false; } });

  useEffect(() => { onNotice(setToast); start(); }, []);
  useEffect(() => { A.setMuted(muted); try { localStorage.setItem(MUTE_KEY, muted ? "1" : "0"); } catch (e) {} }, [muted]);

  if (s.status !== "ready" && s.status !== "local") return <Gate status={s.status} />;

  const seenCount = Object.keys(s.seen).length;
  const rated = Object.values(s.seen).filter(Boolean);
  const avg = rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : "–";
  const close = () => setSheet(null);

  return (
    <>
      <div className="beams" aria-hidden="true" />
      <div className="whiteout" aria-hidden="true" />
      <div className="app">
        <Paper component="header" className="bar chrome">
          <div className="grow">
            <h1>Film Wheel</h1>
            <div className="sub">{seenCount} of 100 watched · average {avg} ★</div>
          </div>
          <IconButton aria-label="Settings" onClick={() => setSettings(true)}><SettingsRounded /></IconButton>
          <IconButton aria-label={muted ? "Unmute sound" : "Mute sound"} aria-pressed={muted} onClick={() => setMuted(!muted)}>{muted ? <VolumeOffRounded /> : <VolumeUpRounded />}</IconButton>
        </Paper>

        <WheelView key="wheel" visible={tab === "wheel"} s={s}
          onLanded={(n, seen) => (seen ? setSheet({ mode: "seen", n }) : setRevealN(n))}
          onOpenFilm={(n) => setSheet({ mode: "film", n })} onToast={setToast} />
        <ListView visible={tab === "list"} s={s} onOpenFilm={(n) => setSheet({ mode: "film", n })} />

        <BottomNavigation className="chrome" showLabels value={tab} onChange={(e, v) => setTab(v)}>
          <BottomNavigationAction value="wheel" label="Wheel" icon={<WheelIcon />} />
          <BottomNavigationAction value="list" label="The 100" icon={<FormatListNumberedRounded />} />
        </BottomNavigation>
      </div>

      {revealN && <Reveal n={revealN} seen={s.seen} onChoose={(k) => setSheet({ mode: "decide", n: k })} onClose={() => setRevealN(null)} />}

      <FilmSheet sheet={sheet} seen={s.seen} onClose={close}
        onWatch={(n) => { setCurrent(n); close(); setRevealN(null); setToast("Tonight: " + title(n)); }}
        onRate={(n, v) => { setRating(n, v); close(); setToast(`${title(n)} rated ${v} / 5`); }}
        onSeenLater={(n) => { setRating(n, null); close(); setToast(title(n) + " marked as seen"); }}
        onUnwatch={(n) => { unwatch(n); close(); setToast(title(n) + " is back on the wheel"); }}
        onSpinAgain={() => { close(); document.querySelector(".hub")?.click(); }} />
      <SettingsSheet open={settings} s={s} onClose={() => setSettings(false)} onToast={setToast} />
      <Snackbar open={!!toast} message={toast} autoHideDuration={2800} onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }} sx={{ bottom: { xs: "calc(96px + env(safe-area-inset-bottom, 0px))" } }} />
    </>
  );
}

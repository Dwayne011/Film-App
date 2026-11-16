import { useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import Switch from "@mui/material/Switch";
import { CLOUD, inviteLink, leaveRoom, setSkipSeen } from "./store";
import { pushAll, tmdbReady } from "./tmdb";

export default function SettingsSheet({ open, s, onClose, onToast }) {
  const [busy, setBusy] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(inviteLink()); onToast("Invite link copied"); }
    catch (e) { onToast("Couldn't copy. Press and hold the link to copy it."); }
  };
  const sendAll = async () => {
    setBusy("Sending…");
    try { const k = await pushAll(s.tmdb, s.seen, (d, t) => setBusy(`Sending ${d} of ${t}…`)); onToast(`${k} ratings sent to The Movie Database`); }
    catch (e) { onToast("The Movie Database didn't accept that. Try again later."); }
    setBusy("");
  };
  return (
    <Dialog open={open} onClose={onClose} scroll="paper">
      <div className="sheet">
        <h2>Settings</h2>
        <label className="setting">
          <span><b>Skip films we've seen</b><small>The wheel only lands on films you haven't watched. Off: it can land on a seen film and you spin again.</small></span>
          <Switch checked={!!s.skipSeen} onChange={(e) => setSkipSeen(e.target.checked)} />
        </label>

        {CLOUD ? (
          <div className="setting">
            <span className="full"><b>Shared wheel</b><small>{s.online ? "Connected. Changes appear on both phones within a second or two." : "Offline. Changes you make now are sent when you're back online, as long as the app stays open."}</small></span>
            <span className="full"><small>To add another phone, open this link on it:</small><span className="code">{inviteLink()}</span></span>
            <span className="full" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button variant="outlined" size="small" onClick={copy}>Copy invite link</Button>
              {!confirmLeave
                ? <Button variant="text" color="error" size="small" onClick={() => setConfirmLeave(true)}>Leave this wheel</Button>
                : <Button variant="text" color="error" size="small" onClick={() => { setConfirmLeave(false); onClose(); leaveRoom(); }}>Tap again to leave (ratings stay saved)</Button>}
            </span>
          </div>
        ) : (
          <div className="setting"><span className="full"><b>Saved on this device only</b><small>Sharing between phones isn't switched on yet.</small></span></div>
        )}

        <div className="setting">
          <span className="full"><b>The Movie Database</b>
            <small>{tmdbReady(s.tmdb) ? "Connected. Each rating you save is also sent to your account on themoviedb.org, doubled to their 10-point scale." : "Not connected. Ratings stay in this app."}</small></span>
          {tmdbReady(s.tmdb) && <span className="full"><Button variant="outlined" size="small" disabled={!!busy} onClick={sendAll}>{busy || "Send all ratings now"}</Button></span>}
        </div>

        <p className="credit">Film details, posters and trailers come from The Movie Database (TMDB). This product uses the TMDB API but is not endorsed or certified by TMDB. The list is The New York Times' 100 Best Movies of the 21st Century.</p>
        <div className="actions"><Button variant="text" color="secondary" onClick={onClose}>Done</Button></div>
      </div>
    </Dialog>
  );
}

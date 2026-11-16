// Shown when this phone isn't connected to a shared wheel yet.
import { useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { createRoom, joinRoom } from "./store";

export default function Gate({ status }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  if (status === "starting" || status === "joining") return <div className="gate"><CircularProgress color="primary" /></div>;
  const clean = (v) => { const m = v.match(/room=([A-Za-z0-9]+)/); return (m ? m[1] : v).trim(); };
  const msg = { notfound: "That wheel couldn't be found. Check the invite link and try again.", badcode: "That doesn't look like an invite link or code.", error: "Couldn't reach the shared wheel. Check your connection and try again." }[status];
  return (
    <div className="gate">
      <Paper className="card">
        <h1>Film Wheel</h1>
        <p>Open your invite link on this phone, or paste the link or code here.</p>
        {msg && <p style={{ color: "var(--danger)" }}>{msg}</p>}
        <TextField id="join-code" label="Invite link or code" value={code} onChange={(e) => setCode(e.target.value)} fullWidth autoComplete="off" />
        <Button variant="contained" disabled={!code.trim() || busy} onClick={() => joinRoom(clean(code))}>Join</Button>
        <Button variant="text" color="secondary" disabled={busy} onClick={async () => { setBusy(true); try { await createRoom(); } catch (e) { setBusy(false); } }}>Start a brand-new wheel instead</Button>
      </Paper>
    </div>
  );
}

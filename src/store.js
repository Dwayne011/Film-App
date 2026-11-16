// App state. With a Firebase project configured, everything lives in one shared record in the
// Firebase Realtime Database ("a wheel") that both phones listen to. Without one, it is saved on this device only.
import { useSyncExternalStore } from "react";
import { firebaseConfig } from "./firebaseConfig";
import { SEED } from "./seed";
import { pushRating, tmdbReady } from "./tmdb";

const LS_STATE = "filmwheel.v1", LS_ROOM = "filmwheel.room";
export const CLOUD = !!firebaseConfig;
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

let state = { status: CLOUD ? "starting" : "local", room: null, seen: {}, current: null, skipSeen: false, tmdb: null, online: true };
const listeners = new Set();
const set = (patch) => { state = { ...state, ...patch }; listeners.forEach((l) => l()); };
export const useStore = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);
export const getState = () => state;
let notify = () => {};
export const onNotice = (fn) => { notify = fn; };

/* ---------- device-only mode ---------- */
function loadLocal() {
  let j = null; try { j = JSON.parse(lsGet(LS_STATE)); } catch (e) {}
  if (!j || !j.seen) j = { seen: { ...SEED }, current: null, skipSeen: false };
  set({ status: "local", seen: j.seen, current: j.current ?? null, skipSeen: !!j.skipSeen });
}
const saveLocal = () => lsSet(LS_STATE, JSON.stringify({ seen: state.seen, current: state.current, skipSeen: state.skipSeen }));

/* ---------- shared (Realtime Database) mode ---------- */
// The database stores films as seen/f47 = stars, with 0 meaning "seen, not rated yet"
// (it cannot store null, and plain numeric keys would be turned into a list).
let fb = null, unsub = null;
async function firebase() {
  if (fb) return fb;
  const [{ initializeApp }, d] = await Promise.all([import("firebase/app"), import("firebase/database")]);
  const db = d.getDatabase(initializeApp(firebaseConfig));
  d.onValue(d.ref(db, ".info/connected"), (snap) => set({ online: !!snap.val() }));
  fb = { db, d };
  return fb;
}
const roomPath = (code) => "filmwheel/rooms/" + code;
const fromDb = (seen) => { const out = {}; for (const k in seen || {}) out[+k.slice(1)] = seen[k] || null; return out; };
const cacheKey = (code) => LS_STATE + "." + code;
export const validCode = (c) => /^[A-Za-z0-9]{20,40}$/.test(c || "");
export function newCode() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789", a = new Uint8Array(24); crypto.getRandomValues(a);
  return Array.from(a, (x) => abc[x % abc.length]).join("");
}
export async function joinRoom(code) {
  code = (code || "").trim();
  if (!validCode(code)) { set({ status: "badcode" }); return; }
  // Show the last known ratings straight away (also when offline); live data replaces them.
  let cached = null; try { cached = JSON.parse(lsGet(cacheKey(code))); } catch (e) {}
  set(cached ? { status: "ready", room: code, ...cached, tmdb: null } : { status: "joining", room: code });
  const { db, d } = await firebase();
  if (unsub) unsub();
  unsub = d.onValue(d.ref(db, roomPath(code)), (snap) => {
    if (!snap.exists()) { lsSet(LS_ROOM, null); lsSet(cacheKey(code), null); set({ status: "notfound", room: null }); return; }
    const v = snap.val(), next = { seen: fromDb(v.seen), current: v.current ?? null, skipSeen: !!v.skipSeen };
    lsSet(LS_ROOM, code); lsSet(cacheKey(code), JSON.stringify(next));
    set({ status: "ready", room: code, ...next, tmdb: v.tmdb || null });
  }, () => set({ status: "error" }));
}
export async function createRoom() {
  const { db, d } = await firebase();
  const code = newCode();
  await d.set(d.ref(db, roomPath(code)), { skipSeen: false, updatedAt: d.serverTimestamp() });
  await joinRoom(code);
}
export function leaveRoom() { if (unsub) unsub(); unsub = null; lsSet(LS_ROOM, null); set({ status: "needroom", room: null, seen: {}, current: null, tmdb: null }); }
export const inviteLink = () => `${location.origin}/?room=${state.room}`;

// patch: paths inside the wheel, e.g. { "seen/f47": 3.5, current: null }. null removes a value.
async function write(patch) {
  if (!CLOUD) { saveLocal(); return; }
  const { db, d } = await firebase();
  // Not awaited: it applies on this phone at once and is sent when there is a connection.
  d.update(d.ref(db, roomPath(state.room)), { ...patch, updatedAt: d.serverTimestamp() }).catch(() => notify("Couldn't save that. Check your connection."));
}

/* ---------- actions ---------- */
// rating: 0.5 to 5, or null for "seen it, not rated yet"
export function setRating(n, rating) {
  const seen = { ...state.seen, [n]: rating };
  const clear = state.current === n;
  set({ seen, current: clear ? null : state.current });
  write({ ["seen/f" + n]: rating || 0, ...(clear ? { current: null } : {}) });
  mirror(n, rating);
}
export function unwatch(n) {
  const seen = { ...state.seen }; delete seen[n];
  set({ seen });
  write({ ["seen/f" + n]: null });
  mirror(n, null);
}
export function setCurrent(n) { set({ current: n }); write({ current: n }); }
export function setSkipSeen(v) { set({ skipSeen: v }); write({ skipSeen: v }); }
function mirror(n, rating) {
  if (!tmdbReady(state.tmdb)) return;
  pushRating(state.tmdb, n, rating).catch(() => notify("Saved here, but The Movie Database didn't accept it."));
}

/* ---------- start-up ---------- */
export function start() {
  if (!CLOUD) return loadLocal();
  const url = new URL(location.href);
  const fromLink = url.searchParams.get("room") || (location.hash.match(/room=([A-Za-z0-9]+)/) || [])[1];
  const code = validCode(fromLink) ? fromLink : lsGet(LS_ROOM);
  if (code) joinRoom(code); else set({ status: "needroom" });
}

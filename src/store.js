// App state. With a Firebase project configured, everything lives in one shared Firestore document
// ("a wheel") that both phones listen to. Without one, it is saved on this device only.
import { useSyncExternalStore } from "react";
import { firebaseConfig } from "./firebaseConfig";
import { SEED } from "./seed";
import { pushRating, tmdbReady } from "./tmdb";

const LS_STATE = "filmwheel.v1", LS_ROOM = "filmwheel.room";
export const CLOUD = !!firebaseConfig;
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };

let state = { status: CLOUD ? "starting" : "local", room: null, seen: {}, current: null, skipSeen: false, tmdb: null, pending: false };
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

/* ---------- shared (Firestore) mode ---------- */
let fb = null, unsub = null;
async function firebase() {
  if (fb) return fb;
  const [{ initializeApp }, fs] = await Promise.all([import("firebase/app"), import("firebase/firestore")]);
  const app = initializeApp(firebaseConfig);
  let db;
  try { db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }) }); }
  catch (e) { db = fs.getFirestore(app); }
  fb = { db, fs };
  return fb;
}
export const validCode = (c) => /^[A-Za-z0-9]{20,40}$/.test(c || "");
export function newCode() {
  const abc = "abcdefghjkmnpqrstuvwxyz23456789", a = new Uint8Array(24); crypto.getRandomValues(a);
  return Array.from(a, (x) => abc[x % abc.length]).join("");
}
export async function joinRoom(code) {
  code = (code || "").trim();
  if (!validCode(code)) { set({ status: "badcode" }); return; }
  const { db, fs } = await firebase();
  if (unsub) unsub();
  set({ status: "joining", room: code });
  unsub = fs.onSnapshot(fs.doc(db, "rooms", code), { includeMetadataChanges: true }, (snap) => {
    if (!snap.exists()) {
      // A cached "missing" answer while offline is not proof; wait for the server before giving up.
      if (!snap.metadata.fromCache) { lsSet(LS_ROOM, null); set({ status: "notfound", room: null }); }
      return;
    }
    const d = snap.data();
    lsSet(LS_ROOM, code);
    set({ status: "ready", room: code, seen: d.seen || {}, current: d.current ?? null, skipSeen: !!d.skipSeen, tmdb: d.tmdb || null, pending: snap.metadata.hasPendingWrites });
  }, () => set({ status: "error" }));
}
export async function createRoom(withSeed) {
  const { db, fs } = await firebase();
  const code = newCode();
  await fs.setDoc(fs.doc(db, "rooms", code), { seen: withSeed ? { ...SEED } : {}, current: null, skipSeen: false, updatedAt: fs.serverTimestamp() });
  await joinRoom(code);
}
export function leaveRoom() { if (unsub) unsub(); unsub = null; lsSet(LS_ROOM, null); set({ status: "needroom", room: null, seen: {}, current: null, tmdb: null }); }
export const inviteLink = () => `${location.origin}/?room=${state.room}`;

async function write(patch) {
  if (!CLOUD) { saveLocal(); return; }
  const { db, fs } = await firebase();
  const out = { updatedAt: fs.serverTimestamp() };
  for (const k in patch) out[k] = patch[k] === undefined ? fs.deleteField() : patch[k];
  // Not awaited: Firestore applies it on this phone at once and sends it when there is a connection.
  fs.updateDoc(fs.doc(db, "rooms", state.room), out).catch(() => notify("Couldn't save that. Check your connection."));
}

/* ---------- actions ---------- */
// rating: 0.5 to 5, or null for "seen it, not rated yet"
export function setRating(n, rating) {
  const seen = { ...state.seen, [n]: rating };
  const clear = state.current === n;
  set({ seen, current: clear ? null : state.current });
  write({ ["seen." + n]: rating, ...(clear ? { current: null } : {}) });
  mirror(n, rating);
}
export function unwatch(n) {
  const seen = { ...state.seen }; delete seen[n];
  set({ seen });
  write({ ["seen." + n]: undefined });
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

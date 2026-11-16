// Optional: copy each rating to the owners' account on The Movie Database (themoviedb.org).
// The access details live in the shared wheel's private data, never in this repository.
import { FILMS } from "./films";

const API = "https://api.themoviedb.org/3";
export const tmdbReady = (t) => !!(t && t.token && t.session);

// stars: 0.5 to 5 sets the rating (TMDB uses 1 to 10, so it is doubled); null or 0 removes it.
export async function pushRating(t, n, stars) {
  if (!tmdbReady(t)) return false;
  const url = `${API}/movie/${FILMS[n - 1].tmdbId}/rating?session_id=${encodeURIComponent(t.session)}`;
  const headers = { Authorization: "Bearer " + t.token, "Content-Type": "application/json;charset=utf-8" };
  const res = stars ? await fetch(url, { method: "POST", headers, body: JSON.stringify({ value: stars * 2 }) }) : await fetch(url, { method: "DELETE", headers });
  if (!res.ok) throw new Error("TMDB " + res.status);
  return true;
}
// Sends every rating given so far. Returns how many were sent.
export async function pushAll(t, seen, onProgress) {
  const rated = Object.keys(seen).filter((n) => seen[n]);
  let done = 0;
  for (const n of rated) { await pushRating(t, +n, seen[n]); done++; if (onProgress) onProgress(done, rated.length); await new Promise((r) => setTimeout(r, 120)); }
  return done;
}

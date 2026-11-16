// The New York Times "100 Best Movies of the 21st Century" (2025), in rank order.
// Synopsis, poster and trailer come from The Movie Database (TMDB); see data/films.json.
import data from "../data/films.json";

export const FILMS = data;
export const film = (n) => FILMS[n - 1];
export const title = (n) => FILMS[n - 1].title;
export const year = (n) => FILMS[n - 1].year;
export const posterURL = (n, w = 342) => `https://image.tmdb.org/t/p/w${w}${FILMS[n - 1].poster}`;

const UA = typeof navigator === "undefined" ? "" : navigator.userAgent;
export const IS_ANDROID = /Android/i.test(UA);
export const IS_IOS = /iPhone|iPad|iPod/i.test(UA) || (typeof navigator !== "undefined" && navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

// True inside the Film Wheel Android app (android/), which adds this marker to its browser name.
export const IN_APP = /FilmWheelApp/.test(UA);

export const trailerWeb = (n) => `https://www.youtube.com/watch?v=${FILMS[n - 1].trailer}`;
// Phones: hand the trailer straight to the YouTube app. Android falls back to the browser by itself if the app is missing.
export function trailerApp(n) {
  const web = trailerWeb(n), rest = web.slice("https://".length);
  if (IN_APP) return web; // the Android app passes outside links to whichever app handles them
  if (IS_ANDROID) return `intent://${rest}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(web)};end`;
  if (IS_IOS) return `youtube://${rest}`;
  return web;
}

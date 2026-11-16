# Working with the owner of this repo

## Asking the owner for something

Requested by the owner on 2026-11-16, after an ask for "a free account and key" left out where to get it.

Whenever you need something from the owner (an account, a key, a sign-in, a file, a decision), put the full context in the same message as the ask. Do not rely on earlier messages; they are hard to find again.

Each ask should state:

- What exactly is needed, using the full name of the service or thing and its web address.
- Why it is needed and what it unlocks in the app.
- The steps to get it, in order, including what to click and what it costs.
- How to hand it over safely (for example, a secure form instead of pasting a key into chat).
- What happens if they say no, and the fallback.

Keep outstanding asks together in one clearly labelled list at the end of the message, and repeat any that are still open instead of referring back to them.

## About the app

Film Wheel: a private film-night app for the owner and their wife, working through The New York Times' 100 Best Movies of the 21st Century. React + MUI + Vite, with Firebase (Realtime Database for sync, Hosting for the site).

- `npm install`, then `npm run build` (output in `dist/`), `npm run dev` for local work.
- `src/wheelEngine.js` and `src/audio.js` are deliberately outside React: they animate every frame and are timed to the audio clock.
- `data/films.json` holds the film details fetched once from The Movie Database (TMDB). No TMDB key is needed at build time.
- Live site: https://film-wheel-100.web.app. Each phone opens it once through the owner's private invite link (`/?room=<code>`). The code is never committed.
- Firebase: the owner's account had no room for a new project, so Film Wheel lives inside their existing **Motobays** project (`motobays-3405f`), which is a separate live app. Film Wheel uses only its own Hosting site (`film-wheel-100`) and the Realtime Database, which Motobays does not use.
- **Never deploy Firestore or Storage rules from this repo.** Motobays' Firestore rules are maintained in the Motobays codebase. Always deploy with `firebase deploy --only database,hosting:film-wheel-100 --project motobays-3405f`.
- State lives at `filmwheel/rooms/{code}` in the Realtime Database. There is no sign-in: the long random code in the invite link is the key (see `database.rules.json`). Films are stored as `seen/f47 = stars`, with 0 meaning seen but not rated.
- TMDB write access (token and session) is stored in that database record under `tmdb`, never in this repo. Ratings are mirrored to the owner's TMDB account, doubled to a 10-point scale.
- `mockup/` is the approved single-file mockup, kept for reference.

## The theme song is not in this repo

`public/wheel-theme.mp3` (the BBC "The Wheel" theme) is copyrighted and this repo is public, so the file is git-ignored. It must be present in `public/` before `npm run build` and deploy, otherwise the wheel spins silently for 22.5 seconds. If it is missing in a fresh checkout, ask the owner to upload it again. The spin length and the "The Wheel!" cue times in `src/wheelEngine.js` are measured from that exact file.

# Bus Driver Ki Playlist - Creator's Favorite 🚌

A music website built with **React + Vite + Tailwind CSS**. It plays the
[Creator's Favorite YouTube playlist](https://www.youtube.com/playlist?list=PLIV4nZCjWE3E)
in a hidden YouTube player and wraps it in a fun "bus driver" experience:

- 🎵 Full playlist with live song titles (fetched via YouTube oEmbed)
- ▶️ Pill player with progress bar, seek, next/prev/shuffle
- 📋 Queue — add songs, play them in order
- 🟢 Live users "on the highway" (Firebase Realtime Database presence)
- 💬 Rotating Hindi/English quotes
- ✨ Twinkling stars + shooting star + animated wave divider
- 🌫️ Film-grain overlay + themed hero background

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173/
npm run build    # production build to dist/
npm run lint     # oxlint
```

## Config file (`src/config.js`)

Everything content-related lives in one config file:

- `site` — browser tab title, home link
- `moods` — one entry per theme/mood:
  - `playlistId` — a YouTube playlist ID (`?list=...`)
  - `songs` — **or** a fixed list of video IDs (`songs: ['id1', 'id2']`)
  - `bg` — background image (put the file in `public/`)
  - `liveText`, `quotes` — top-bar text and rotating hero quotes

Add a new mood by copying an entry, or add songs by switching `playlistId`
for a `songs` array. The mood switcher (🎨) picks up new entries automatically.

## Notes

- `src/index.css` uses `@source not` directives so Tailwind only scans `src/` —
  the default project-root scan reads binary files (like the `.freebuff`
  conversation database) and generates corrupted CSS.
- The original vanilla HTML/CSS/JS version is kept in `old-vanilla/`.

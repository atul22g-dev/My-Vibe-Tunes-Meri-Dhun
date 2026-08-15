# Bus Driver Ki Playlist - Creator's Favorite 🚌

A music website built with **React + Vite + Tailwind CSS**. It plays playlists
from the Atual APIs server in a hidden YouTube player and wraps it in a fun
"bus driver" experience:

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

## Playlist data (API)

All content comes from the API — there is **no config file** anymore.

`src/api/playlists.js` fetches `https://apis-atual-dev.vercel.app/api/playlists`
and normalizes the response into `site` (tab title, home link) and `moods`
(one entry per theme: `playlistId` **or** `songs`, `bg`, `liveText`, `quotes`,
`tagline`). The mood switcher (🎨) picks up new entries automatically.

### API key

The API requires a key. Copy `.env.example` to `.env.local` and set it
(`.env.local` is git-ignored):

```bash
cp .env.example .env.local
# then edit .env.local and set VITE_API_KEY=your_api_key
```

The key is sent as an `X-API-Key` header (the API also accepts an `api_key`
query param or a Bearer token). If the fetch fails, the playlist section shows
the API error message.

## Deploy to Vercel

This is a standard Vite SPA, and `vercel.json` pins the framework settings
(`npm run build`, output `dist/`). To deploy:

1. Push this repo to GitHub and import it in Vercel (**New Project** → Import).
2. Add the API key as an environment variable in **Project → Settings →
   Environment Variables**: name `VITE_API_KEY`, value = the key from your
   `.env.local`. `.env` / `.env.local` are git-ignored, so the key is **not**
   uploaded with the code — this step is required or the playlist fetch fails.
3. Deploy. If `VITE_API_KEY` is missing, the playlist section shows a clear
   error instead of failing silently.

## Notes

- `src/index.css` uses `@source not` directives so Tailwind only scans `src/` —
  the default project-root scan reads binary files (like the `.freebuff`
  conversation database) and generates corrupted CSS.
- The original vanilla HTML/CSS/JS version is kept in `old-vanilla/`.

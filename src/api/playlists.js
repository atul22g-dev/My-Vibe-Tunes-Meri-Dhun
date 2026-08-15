// ------------------------------------------------------------
//  PLAYLISTS API - data ab yahan se aata hai, config file se nahi
//
//  Endpoint:  https://apis-atual-dev.vercel.app/api/playlists
//  Auth:      X-API-Key header (ya `api_key` query param / Bearer)
//  Key:       `.env.local` mein `VITE_API_KEY=...` (dekho .env.example)
// ------------------------------------------------------------

const API_BASE = 'https://apis-atual-dev.vercel.app'

export function getApiKey() {
  return import.meta.env.VITE_API_KEY
}

// Kisi bhi object se pehla available value uthao
function pick(obj, keys, fallback = '') {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k]
  }
  return fallback
}

function songToVideoId(song) {
  if (typeof song === 'string') return song
  if (song && typeof song === 'object') {
    return String(pick(song, ['videoId', 'video_id', 'id'], '')).trim()
  }
  return ''
}

function normalizeMood(raw) {
  return {
    id: String(pick(raw, ['id', 'key', 'slug', 'name'])).trim(),
    name: pick(raw, ['name', 'title'], ''),
    label: pick(raw, ['label', 'shortName', 'short_name', 'name', 'title'], ''),
    emoji: pick(raw, ['emoji', 'icon'], '🎵'),
    playlistId: pick(raw, ['playlistId', 'playlist_id', 'youtubePlaylistId', 'playlist'], ''),
    songs: Array.isArray(raw.songs)
      ? raw.songs.map(songToVideoId).filter(Boolean)
      : [],
    liveText: pick(raw, ['liveText', 'live_text', 'subtitle', 'description'], ''),
    quotes: Array.isArray(raw.quotes) ? raw.quotes.map(String) : [],
    tagline: pick(raw, ['tagline', 'subtitle'], ''),
  }
}

// API response shape pe depend nahi karte - common shapes handle karte hain:
//   [...], { playlists: [...] }, { data: [...] }, { data: { playlists: [...] } }
function normalizePlaylists(payload) {
  if (!payload) return { site: {}, moods: [] }

  let rawSite = {}
  let rawMoods = []

  if (Array.isArray(payload)) {
    rawMoods = payload
  } else {
    const inner = payload.data && !Array.isArray(payload.data) ? payload.data : payload
    if (Array.isArray(inner.playlists)) {
      rawMoods = inner.playlists
      rawSite = inner.site || payload.site || {}
    } else if (Array.isArray(payload.data)) {
      rawMoods = payload.data
      rawSite = payload.site || {}
    } else if (Array.isArray(payload.moods)) {
      rawMoods = payload.moods
      rawSite = payload.site || {}
    }
  }

  return {
    site: {
      title: pick(rawSite, ['title', 'name'], ''),
      homeUrl: pick(rawSite, ['homeUrl', 'home_url', 'url', 'github'], ''),
    },
    moods: rawMoods
      .map(normalizeMood)
      .filter((m) => m.id && (m.playlistId || m.songs.length > 0)),
  }
}

export async function fetchPlaylists() {
  const apiKey = getApiKey()
  const res = await fetch(`${API_BASE}/api/playlists`, {
    headers: apiKey ? { 'X-API-Key': apiKey } : {},
  })

  if (!res.ok) {
    let message = `Failed to load playlists (${res.status})`
    try {
      const body = await res.json()
      if (body && body.message) message = body.message
    } catch {
      /* keep default message */
    }
    throw new Error(message)
  }

  return normalizePlaylists(await res.json())
}

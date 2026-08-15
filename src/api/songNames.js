// ------------------------------------------------------------
//  SONG NAMES API - YouTube oembed se ek song ka title
//
//  Data-fetching layer: raw fetch() yahan hai, React effect mein nahi.
//  Caller (PlayerContext) cancellation ke liye AbortSignal de sakta hai.
// ------------------------------------------------------------

export async function fetchSongName(videoId, { signal } = {}) {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    { signal },
  )
  if (!res.ok) throw new Error('not ok')
  const data = await res.json()
  return data && data.title ? data.title : `Song (${videoId.slice(0, 6)}...)`
}

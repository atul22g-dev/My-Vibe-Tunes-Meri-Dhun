import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { fetchPlaylists } from '../api/playlists'

const PlayerContext = createContext(null)

// eslint-disable-next-line react-refresh/only-export-components
export function usePlayer() {
  return useContext(PlayerContext)
}

const DEFAULT_SITE = {
  title: 'My Vibe Tunes - Meri Dhun',
  homeUrl: 'https://github.com/atual-dev',
}

// Data load hone tak player bina playlist ke create na ho
const EMPTY_MOOD = {
  id: 'loading',
  name: '',
  label: '',
  emoji: '🎵',
  playlistId: '',
  songs: [],
  liveText: '',
  quotes: [''],
  tagline: '',
}

const YT_STATES = { ENDED: 0, PLAYING: 1, PAUSED: 2, CUED: 5 }

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

let ytPromise = null
function ensureYT() {
  if (!ytPromise) {
    ytPromise = new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT)
        return
      }
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === 'function') prev()
        resolve(window.YT)
      }
    })
  }
  return ytPromise
}

export function PlayerProvider({ children }) {
  // Site + playlists - API se fetch hota hai (src/api/playlists.js)
  const [site, setSite] = useState(DEFAULT_SITE)
  const [moods, setMoods] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchPlaylists()
      .then((data) => {
        if (cancelled) return
        if (data.site && (data.site.title || data.site.homeUrl)) {
          setSite({ ...DEFAULT_SITE, ...data.site })
        }
        setMoods(data.moods)
      })
      .catch((err) => {
        if (cancelled) return
        setDataError(err instanceof Error ? err.message : String(err))
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Current mood (theme) - localStorage se restore, warna pehli entry
  const [currentMoodId, setCurrentMoodId] = useState(
    () => localStorage.getItem('bus-playlist-theme') || '',
  )

  // Moods load hone ke baad saved id valid hai toh use karo, warna pehla mood
  useEffect(() => {
    if (!moods.length) return
    if (!moods.some((m) => m.id === currentMoodId)) {
      setCurrentMoodId(moods[0].id)
    }
  }, [moods, currentMoodId])

  const mood = moods.find((m) => m.id === currentMoodId) || moods[0] || EMPTY_MOOD

  // Player / playlist
  const playerRef = useRef(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [playerError, setPlayerError] = useState(null)
  const [playlistIds, setPlaylistIds] = useState([])
  const [songNames, setSongNames] = useState({})
  const [currentSongIndex, setCurrentSongIndex] = useState(0)

  // Now playing
  const [isPlaying, setIsPlaying] = useState(false)
  const [songTitle, setSongTitle] = useState('Tere Dar Par Sanam')
  const [songArtist, setSongArtist] = useState('Kumar Sanu')
  const [albumArt, setAlbumArt] = useState('https://img.youtube.com/vi/5MIGQBpVeqs/mqdefault.jpg')

  // Queue
  const [userQueue, setUserQueue] = useState([])
  const [queueMode, setQueueMode] = useState(false)
  const [queueIndex, setQueueIndex] = useState(0)
  const queueRef = useRef([])
  const queueModeRef = useRef(false)
  const queueIndexRef = useRef(0)

  // Quote
  const [quote, setQuote] = useState(() => randomFrom(EMPTY_MOOD.quotes))

  // Volume (0-100) - localStorage se restore, warna 80%
  const [volume, setVolumeState] = useState(() => {
    const raw = localStorage.getItem('bus-player-volume')
    const saved = raw === null ? NaN : Number(raw)
    return Number.isFinite(saved) && saved >= 0 && saved <= 100 ? saved : 80
  })
  const [muted, setMuted] = useState(false)
  const volumeRef = useRef(volume)
  const mutedRef = useRef(muted)
  useEffect(() => {
    volumeRef.current = volume
  }, [volume])
  useEffect(() => {
    mutedRef.current = muted
  }, [muted])

  // Song name fetching
  const inProgressRef = useRef(new Set())
  const [fetchTick, setFetchTick] = useState(0)

  const playlistIdsRef = useRef([])
  useEffect(() => {
    playlistIdsRef.current = playlistIds
  }, [playlistIds])
  const songNamesRef = useRef({})
  useEffect(() => {
    songNamesRef.current = songNames
  }, [songNames])
  useEffect(() => {
    queueRef.current = userQueue
  }, [userQueue])

  // --- QUEUE HELPERS (stable, also used inside player event handlers) ---
  const playFromQueue = useCallback((index) => {
    const p = playerRef.current
    if (!p || typeof p.loadVideoById !== 'function') return
    const item = queueRef.current[index]
    if (!item) return
    p.loadVideoById(item.videoId)
    setSongTitle(item.name)
    setSongArtist('From your queue')
    setQueueIndex(index)
    queueIndexRef.current = index
  }, [])

  const updateSongDisplay = useCallback(() => {
    const p = playerRef.current
    if (!p || typeof p.getVideoData !== 'function') return
    const data = p.getVideoData()
    if (data && data.title) {
      setSongTitle(data.title)
      setSongArtist(data.author || 'YouTube')
      if (data.video_id) setAlbumArt(`https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`)
    }
    if (typeof p.getPlaylistIndex === 'function') {
      setCurrentSongIndex(p.getPlaylistIndex())
    }
  }, [])

  // --- YOUTUBE PLAYER LIFECYCLE (recreated when the mood changes) ---
  useEffect(() => {
    let disposed = false
    let pollTimer = null
    let player = null

    // playlistId se poori playlist, ya songs array se fixed list
    const list = mood.songs && mood.songs.length > 0 ? mood.songs.join(',') : mood.playlistId
    if (!list) return // API data abhi tak nahi aaya

    function waitForPlaylist(attempts) {
      if (disposed) return
      const p = playerRef.current
      if (
        p &&
        typeof p.getPlaylist === 'function' &&
        p.getPlaylist() &&
        p.getPlaylist().length > 0
      ) {
        setPlaylistIds(p.getPlaylist())
        if (typeof p.getPlaylistIndex === 'function') {
          setCurrentSongIndex(p.getPlaylistIndex())
        }
        setPlayerReady(true)
        updateSongDisplay()
        // Naye (recreated) player par saved volume + mute state apply karo
        if (typeof p.setVolume === 'function') p.setVolume(volumeRef.current)
        if (mutedRef.current && typeof p.mute === 'function') p.mute()
        return
      }
      if (attempts > 20) {
        setPlayerError('Playlist load nahi hua... try switching again')
        setPlayerReady(true)
        return
      }
      pollTimer = setTimeout(() => waitForPlaylist(attempts + 1), 500)
    }

    // oxlint: no-unused-vars false positive - used below in setup()
    // eslint-disable-next-line no-unused-vars
    function onPlayerStateChange(event) {
      if (disposed) return
      const p = playerRef.current
      if (!p) return

      if (event.data === YT_STATES.ENDED) {
        if (queueModeRef.current) {
          queueIndexRef.current += 1
          if (queueIndexRef.current < queueRef.current.length) {
            playFromQueue(queueIndexRef.current)
          } else {
            queueModeRef.current = false
            setQueueMode(false)
            if (typeof p.nextVideo === 'function') p.nextVideo()
          }
        } else if (typeof p.nextVideo === 'function') {
          p.nextVideo()
        }
        return
      }

      if (event.data === YT_STATES.PLAYING) {
        setIsPlaying(true)
        if (!queueModeRef.current) updateSongDisplay()
        // Playlist data may not have been ready before - try again
        if (playlistIdsRef.current.length === 0) waitForPlaylist(0)
      }

      if (event.data === YT_STATES.PAUSED) {
        setIsPlaying(false)
      }

      if (event.data === YT_STATES.CUED) {
        waitForPlaylist(0)
      }
    }

    async function setup() {
      const YT = await ensureYT()
      if (disposed) return

      // Clear any stale iframe left in the hidden container
      const container = document.getElementById('yt-player')
      if (container) container.innerHTML = ''

      setPlayerReady(false)
      setPlayerError(null)
      setPlaylistIds([])
      setIsPlaying(false)

      player = new YT.Player('yt-player', {
        height: '1',
        width: '1',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          rel: 0,
          listType: 'playlist',
          list,
        },
        events: {
          onReady: () => waitForPlaylist(0),
          onStateChange: onPlayerStateChange,
        },
      })
      playerRef.current = player
    }

    setup()

    return () => {
      disposed = true
      if (pollTimer) clearTimeout(pollTimer)
      if (player) {
        try {
          player.destroy()
        } catch {
          /* already destroyed */
        }
      }
      playerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood.id])

  // --- SONG NAME FETCHING (YouTube oembed, 5 at a time) ---
  useEffect(() => {
    if (!playlistIds.length) return
    const missing = playlistIds.filter(
      (id) => !songNamesRef.current[id] && !inProgressRef.current.has(id),
    )
    if (missing.length === 0) return

    missing.slice(0, 5).forEach((videoId) => {
      inProgressRef.current.add(videoId)
      fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      )
        .then((res) => {
          if (!res.ok) throw new Error('not ok')
          return res.json()
        })
        .then((data) => {
          setSongNames((prev) => ({
            ...prev,
            [videoId]: data && data.title ? data.title : `Song (${videoId.slice(0, 6)}...)`,
          }))
        })
        .catch(() => {
          setSongNames((prev) => ({
            ...prev,
            [videoId]: `Song (${videoId.slice(0, 6)}...)`,
          }))
        })
        .finally(() => {
          inProgressRef.current.delete(videoId)
        })
    })

    if (missing.length > 5) {
      const t = setTimeout(() => setFetchTick((x) => x + 1), 1500)
      return () => clearTimeout(t)
    }
  }, [playlistIds, fetchTick])

  // --- MOOD SWITCHING ---
  const switchMood = useCallback(
    (id) => {
      if (!moods.some((m) => m.id === id) || id === currentMoodId) return
      setCurrentMoodId(id)

      // Reset queue + song name cache for the new playlist
      setUserQueue([])
      queueRef.current = []
      queueModeRef.current = false
      setQueueMode(false)
      queueIndexRef.current = 0
      setQueueIndex(0)
      setSongNames({})
      inProgressRef.current.clear()

      localStorage.setItem('bus-playlist-theme', id)
    },
    [currentMoodId, moods],
  )

  // --- QUOTES (rotate every 5s, new mood quote instantly) ---
  useEffect(() => {
    if (!mood.quotes || !mood.quotes.length) return
    setQuote(randomFrom(mood.quotes))
    const id = setInterval(() => setQuote(randomFrom(mood.quotes)), 5000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood.id])

  // --- VOLUME CONTROLS ---
  const setVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(100, Math.round(v)))
    setVolumeState(clamped)
    volumeRef.current = clamped
    localStorage.setItem('bus-player-volume', String(clamped))
    const p = playerRef.current
    if (p && typeof p.setVolume === 'function') p.setVolume(clamped)
    // Volume 0 se upar le jaane par mute hat jaye
    if (clamped > 0 && mutedRef.current) {
      setMuted(false)
      mutedRef.current = false
      if (p && typeof p.unMute === 'function') p.unMute()
    }
  }, [])

  const toggleMute = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (mutedRef.current) {
      setMuted(false)
      mutedRef.current = false
      if (typeof p.unMute === 'function') p.unMute()
      if (typeof p.setVolume === 'function') p.setVolume(volumeRef.current)
    } else {
      setMuted(true)
      mutedRef.current = true
      if (typeof p.mute === 'function') p.mute()
    }
  }, [])

  // --- CONTROLS ---
  const togglePlay = useCallback(() => {
    const p = playerRef.current
    if (!p || typeof p.getPlayerState !== 'function') return
    if (p.getPlayerState() === YT_STATES.PLAYING) p.pauseVideo()
    else p.playVideo()
  }, [])

  const next = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (queueModeRef.current && queueRef.current.length > 0) {
      queueIndexRef.current += 1
      if (queueIndexRef.current < queueRef.current.length) {
        playFromQueue(queueIndexRef.current)
      } else {
        queueModeRef.current = false
        setQueueMode(false)
        if (typeof p.nextVideo === 'function') p.nextVideo()
      }
    } else if (typeof p.nextVideo === 'function') {
      p.nextVideo()
    }
  }, [playFromQueue])

  const prev = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (queueModeRef.current && queueIndexRef.current > 0) {
      queueIndexRef.current -= 1
      playFromQueue(queueIndexRef.current)
    } else if (typeof p.previousVideo === 'function') {
      p.previousVideo()
    }
  }, [playFromQueue])

  const shuffle = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (typeof p.setShuffle === 'function') {
      p.setShuffle(true)
      p.nextVideo()
    }
  }, [])

  const seekTo = useCallback((fraction) => {
    const p = playerRef.current
    if (!p || typeof p.getDuration !== 'function') return
    const duration = p.getDuration()
    if (duration > 0) p.seekTo(fraction * duration, true)
  }, [])

  const playSongAt = useCallback((index) => {
    const p = playerRef.current
    if (!p) return
    queueModeRef.current = false
    setQueueMode(false)
    if (typeof p.playVideoAt === 'function') p.playVideoAt(index)
    setCurrentSongIndex(index)
  }, [])

  // --- QUEUE ACTIONS ---
  const addToQueue = useCallback((videoId, name) => {
    setUserQueue((prev) => [...prev, { videoId, name }])
  }, [])

  const removeFromQueue = useCallback((index) => {
    setUserQueue((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const clearQueue = useCallback(() => {
    setUserQueue([])
    queueRef.current = []
    queueModeRef.current = false
    setQueueMode(false)
    queueIndexRef.current = 0
    setQueueIndex(0)
  }, [])

  const playQueue = useCallback(() => {
    if (!queueRef.current.length) return
    queueModeRef.current = true
    setQueueMode(true)
    playFromQueue(0)
  }, [playFromQueue])

  const value = {
    site,
    dataLoading,
    dataError,
    moods,
    mood,
    currentMoodId,
    switchMood,
    quote,
    playerReady,
    playerError,
    isPlaying,
    volume,
    muted,
    songTitle,
    songArtist,
    albumArt,
    playlistIds,
    songNames,
    currentSongIndex,
    userQueue,
    queueMode,
    queueIndex,
    playerRef,
    controls: { togglePlay, next, prev, shuffle, seekTo, playSongAt, setVolume, toggleMute },
    queueActions: { addToQueue, removeFromQueue, clearQueue, playQueue },
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

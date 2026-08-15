import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { fetchPlaylists } from '../api/playlists'
import { fetchSongName } from '../api/songNames'

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

// --- STATE SHAPES (state that changes together lives in one reducer) ---

const initialPlayerState = {
  playerReady: false,
  playerError: null,
  playlistIds: [],
  songNames: {},
  currentSongIndex: 0,
  isPlaying: false,
  songTitle: 'Tere Dar Par Sanam',
  songArtist: 'Kumar Sanu',
  albumArt: 'https://img.youtube.com/vi/5MIGQBpVeqs/mqdefault.jpg',
}

function playerReducer(state, action) {
  switch (action.type) {
    case 'reset':
      return { ...state, playerReady: false, playerError: null, playlistIds: [], isPlaying: false }
    case 'ready':
      return {
        ...state,
        playerReady: true,
        playlistIds: action.playlistIds,
        ...(action.index !== undefined ? { currentSongIndex: action.index } : {}),
      }
    case 'error':
      return { ...state, playerError: action.message, playerReady: true }
    case 'songIndex':
      return { ...state, currentSongIndex: action.index }
    // Merge karo — har dispatch sirf ek entry deta hai; replace karne se
    // pehle fetch ke result sab purane names mita dete (flicker + refetch loop)
    case 'songNames':
      return { ...state, songNames: { ...state.songNames, ...action.names } }
    case 'clearSongNames':
      return { ...state, songNames: {} }
    case 'nowPlaying':
      return {
        ...state,
        songTitle: action.title,
        songArtist: action.artist,
        albumArt: action.albumArt ?? state.albumArt,
      }
    case 'playing':
      return { ...state, isPlaying: true }
    case 'paused':
      return { ...state, isPlaying: false }
    default:
      return state
  }
}

const initialQueueState = {
  userQueue: [],
  queueMode: false,
  queueIndex: 0,
}

function queueReducer(state, action) {
  switch (action.type) {
    case 'add':
      return { ...state, userQueue: [...state.userQueue, action.item] }
    case 'remove':
      return { ...state, userQueue: state.userQueue.filter((_, i) => i !== action.index) }
    case 'reset':
      return { userQueue: [], queueMode: false, queueIndex: 0 }
    case 'setQueueMode':
      return { ...state, queueMode: action.mode }
    case 'setQueueIndex':
      return { ...state, queueIndex: action.index }
    default:
      return state
  }
}

// --- SITE + PLAYLISTS (API fetch) ---
function useSiteData() {
  const [site, setSite] = useState(DEFAULT_SITE)
  const [moods, setMoods] = useState([])
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
    return () => {
      cancelled = true
    }
  }, [])

  return { site, moods, dataError }
}

// --- CURRENT MOOD (theme) selection ---
function useMood(moods) {
  // localStorage se restore, warna pehli entry
  const [currentMoodId, setCurrentMoodId] = useState(
    () => localStorage.getItem('music-box-theme') || '',
  )

  // Moods load hone ke baad saved id valid hai toh use karo, warna pehla mood.
  // State ko effect mein sync karne ki jagah render ke dauran adjust karte hain
  // (React docs: "adjusting some state when a prop changes").
  const [prevMoods, setPrevMoods] = useState(moods)
  if (prevMoods !== moods) {
    setPrevMoods(moods)
    if (moods.length && !moods.some((m) => m.id === currentMoodId)) {
      setCurrentMoodId(moods[0].id)
    }
  }

  const mood = moods.find((m) => m.id === currentMoodId) || moods[0] || EMPTY_MOOD

  return { currentMoodId, setCurrentMoodId, mood }
}

// --- QUOTES (rotate every 5s, new mood quote instantly) ---
function useQuote(mood) {
  const [quote, setQuote] = useState(() => randomFrom(EMPTY_MOOD.quotes))

  useEffect(() => {
    if (!mood.quotes || !mood.quotes.length) return
    setQuote(randomFrom(mood.quotes))
    const id = setInterval(() => setQuote(randomFrom(mood.quotes)), 5000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mood.id])

  return quote
}

// --- VOLUME (0-100) + MUTE ---
function useVolume(playerRef) {
  // localStorage se restore, warna 80%
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

  const setVolume = useCallback(
    (v) => {
      const clamped = Math.max(0, Math.min(100, Math.round(v)))
      setVolumeState(clamped)
      volumeRef.current = clamped
      localStorage.setItem('music-box-volume', String(clamped))
      const p = playerRef.current
      if (p && typeof p.setVolume === 'function') p.setVolume(clamped)
      // Volume 0 se upar le jaane par mute hat jaye
      if (clamped > 0 && mutedRef.current) {
        setMuted(false)
        mutedRef.current = false
        if (p && typeof p.unMute === 'function') p.unMute()
      }
    },
    [playerRef],
  )

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
  }, [playerRef])

  return { volume, muted, setVolume, toggleMute, volumeRef, mutedRef }
}

// --- PLAYER ENGINE: YouTube player + now-playing + queue (all in one hook) ---
function usePlayerEngine(mood, volumeRef, mutedRef, playerRef) {
  const [player, dispatch] = useReducer(playerReducer, initialPlayerState)
  const [queue, dispatchQueue] = useReducer(queueReducer, initialQueueState)
  const [fetchTick, setFetchTick] = useState(0)

  const {
    playerReady,
    playerError,
    playlistIds,
    songNames,
    currentSongIndex,
    isPlaying,
    songTitle,
    songArtist,
    albumArt,
  } = player
  const { userQueue, queueMode, queueIndex } = queue

  // Refs kept in sync for use inside player event handlers (stable identity)
  const queueRef = useRef([])
  const queueModeRef = useRef(false)
  const queueIndexRef = useRef(0)
  const inProgressRef = useRef(new Set())
  const playlistIdsRef = useRef([])
  const songNamesRef = useRef({})
  useEffect(() => {
    queueRef.current = userQueue
  }, [userQueue])
  useEffect(() => {
    playlistIdsRef.current = playlistIds
  }, [playlistIds])
  useEffect(() => {
    songNamesRef.current = songNames
  }, [songNames])

  // --- QUEUE HELPERS (stable, also used inside player event handlers) ---
  const playFromQueue = useCallback((index) => {
    const p = playerRef.current
    if (!p || typeof p.loadVideoById !== 'function') return
    const item = queueRef.current[index]
    if (!item) return
    p.loadVideoById(item.videoId)
    dispatch({ type: 'nowPlaying', title: item.name, artist: 'From your queue' })
    dispatchQueue({ type: 'setQueueIndex', index })
    queueIndexRef.current = index
  }, [playerRef])

  // Queue mode mein agla queue item, warna playlist ka next video.
  // ENDED handler aur next() control dono yahi logic use karte hain (DRY).
  const next = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (queueModeRef.current && queueRef.current.length > 0) {
      queueIndexRef.current += 1
      if (queueIndexRef.current < queueRef.current.length) {
        playFromQueue(queueIndexRef.current)
        return
      }
      // Queue khatam — playlist mode par wapas
      queueModeRef.current = false
      dispatchQueue({ type: 'setQueueMode', mode: false })
    }
    if (typeof p.nextVideo === 'function') p.nextVideo()
  }, [playerRef, playFromQueue])

  const updateSongDisplay = useCallback(() => {
    const p = playerRef.current
    if (!p || typeof p.getVideoData !== 'function') return
    const data = p.getVideoData()
    if (data && data.title) {
      dispatch({
        type: 'nowPlaying',
        title: data.title,
        artist: data.author || 'YouTube',
        albumArt: data.video_id
          ? `https://img.youtube.com/vi/${data.video_id}/mqdefault.jpg`
          : undefined,
      })
    }
    if (typeof p.getPlaylistIndex === 'function') {
      dispatch({ type: 'songIndex', index: p.getPlaylistIndex() })
    }
  }, [playerRef])

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
        dispatch({
          type: 'ready',
          playlistIds: p.getPlaylist(),
          index: typeof p.getPlaylistIndex === 'function' ? p.getPlaylistIndex() : undefined,
        })
        updateSongDisplay()
        // Naye (recreated) player par saved volume + mute state apply karo
        if (typeof p.setVolume === 'function') p.setVolume(volumeRef.current)
        if (mutedRef.current && typeof p.mute === 'function') p.mute()
        return
      }
      if (attempts > 20) {
        dispatch({ type: 'error', message: 'Playlist load nahi hua... try switching again' })
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
        next()
        return
      }

      if (event.data === YT_STATES.PLAYING) {
        dispatch({ type: 'playing' })
        if (!queueModeRef.current) updateSongDisplay()
        // Playlist data may not have been ready before - try again
        if (playlistIdsRef.current.length === 0) waitForPlaylist(0)
      }

      if (event.data === YT_STATES.PAUSED) {
        dispatch({ type: 'paused' })
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

      dispatch({ type: 'reset' })

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
  // Fetch data-fetching layer (src/api/songNames.js) mein hai; yahan sirf
  // orchestration: batching, dedup, retry tick + AbortController cancellation.
  useEffect(() => {
    if (!playlistIds.length) return
    const missing = playlistIds.filter(
      (id) => !songNamesRef.current[id] && !inProgressRef.current.has(id),
    )
    if (missing.length === 0) return

    const controller = new AbortController()
    const inFlight = new Set()
    // Set ko local variable mein capture karo (ref ko cleanup mein direct padhna
    // race-prone hai) — inProgressRef.current kabhi reassign nahi hota
    const inProgress = inProgressRef.current

    missing.slice(0, 5).forEach((videoId) => {
      inProgress.add(videoId)
      inFlight.add(videoId)
      fetchSongName(videoId, { signal: controller.signal })
        .then((title) => {
          dispatch({ type: 'songNames', names: { [videoId]: title } })
        })
        .catch(() => {
          // Abort hone par (playlist switch / unmount) kuch mat likho —
          // agli tick is video ko dobara fetch kar legi
          if (controller.signal.aborted) return
          dispatch({
            type: 'songNames',
            names: { [videoId]: `Song (${videoId.slice(0, 6)}...)` },
          })
        })
        .finally(() => {
          inProgress.delete(videoId)
          inFlight.delete(videoId)
        })
    })

    let timer = null
    if (missing.length > 5) {
      timer = setTimeout(() => setFetchTick((x) => x + 1), 1500)
    }
    return () => {
      controller.abort()
      // Aborted videos ko in-progress se turant hatao taaki agli run
      // unhe missing maan kar dobara fetch kar sake
      for (const id of inFlight) inProgress.delete(id)
      if (timer) clearTimeout(timer)
    }
  }, [playlistIds, fetchTick])

  // Queue state + refs ko ek saath reset karo (resetPlayback aur clearQueue dono)
  const resetQueueState = useCallback(() => {
    dispatchQueue({ type: 'reset' })
    queueRef.current = []
    queueModeRef.current = false
    queueIndexRef.current = 0
  }, [])

  // Mood switch karne par queue + song name cache reset (called by switchMood)
  const resetPlayback = useCallback(() => {
    resetQueueState()
    dispatch({ type: 'clearSongNames' })
    inProgressRef.current.clear()
  }, [resetQueueState])

  // --- CONTROLS ---
  const togglePlay = useCallback(() => {
    const p = playerRef.current
    if (!p || typeof p.getPlayerState !== 'function') return
    if (p.getPlayerState() === YT_STATES.PLAYING) p.pauseVideo()
    else p.playVideo()
  }, [playerRef])



  const prev = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (queueModeRef.current && queueIndexRef.current > 0) {
      queueIndexRef.current -= 1
      playFromQueue(queueIndexRef.current)
    } else if (typeof p.previousVideo === 'function') {
      p.previousVideo()
    }
  }, [playerRef, playFromQueue])

  const shuffle = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    if (typeof p.setShuffle === 'function') {
      p.setShuffle(true)
      p.nextVideo()
    }
  }, [playerRef])

  const seekTo = useCallback(
    (fraction) => {
      const p = playerRef.current
      if (!p || typeof p.getDuration !== 'function') return
      const duration = p.getDuration()
      if (duration > 0) p.seekTo(fraction * duration, true)
    },
    [playerRef],
  )

  const playSongAt = useCallback(
    (index) => {
      const p = playerRef.current
      if (!p) return
      queueModeRef.current = false
      dispatchQueue({ type: 'setQueueMode', mode: false })
      if (typeof p.playVideoAt === 'function') p.playVideoAt(index)
      dispatch({ type: 'songIndex', index })
    },
    [playerRef],
  )

  // --- QUEUE ACTIONS ---
  const addToQueue = useCallback((videoId, name) => {
    // Har entry ko stable unique id do taaki list key stable rahe
    // (same video dobara add ho sakta hai, isliye videoId key nahi chalega)
    const id = crypto.randomUUID
      ? crypto.randomUUID()
      : `${videoId}-${Date.now()}-${Math.random().toString(36).slice(2)}`
    dispatchQueue({ type: 'add', item: { id, videoId, name } })
  }, [])

  const removeFromQueue = useCallback((index) => {
    dispatchQueue({ type: 'remove', index })
  }, [])

  const clearQueue = useCallback(() => {
    resetQueueState()
  }, [resetQueueState])

  const playQueue = useCallback(() => {
    if (!queueRef.current.length) return
    queueModeRef.current = true
    dispatchQueue({ type: 'setQueueMode', mode: true })
    playFromQueue(0)
  }, [playFromQueue])

  // Stable object identities — context value memo ko render-par-render kaam karna
  // band na kare (sab members stable useCallbacks hain)
  const controls = useMemo(
    () => ({ togglePlay, next, prev, shuffle, seekTo, playSongAt }),
    [togglePlay, next, prev, shuffle, seekTo, playSongAt],
  )
  const queueActions = useMemo(
    () => ({ addToQueue, removeFromQueue, clearQueue, playQueue }),
    [addToQueue, removeFromQueue, clearQueue, playQueue],
  )

  return {
    playerReady,
    playerError,
    playlistIds,
    songNames,
    currentSongIndex,
    isPlaying,
    songTitle,
    songArtist,
    albumArt,
    userQueue,
    queueMode,
    queueIndex,
    resetPlayback,
    controls,
    queueActions,
  }
}

export function PlayerProvider({ children }) {
  const { site, moods, dataError } = useSiteData()
  const playerRef = useRef(null)
  const { currentMoodId, setCurrentMoodId, mood } = useMood(moods)
  const quote = useQuote(mood)
  const { volume, muted, setVolume, toggleMute, volumeRef, mutedRef } = useVolume(playerRef)
  const {
    playerReady,
    playerError,
    playlistIds,
    songNames,
    currentSongIndex,
    isPlaying,
    songTitle,
    songArtist,
    albumArt,
    userQueue,
    queueMode,
    queueIndex,
    resetPlayback,
    controls,
    queueActions,
  } = usePlayerEngine(mood, volumeRef, mutedRef, playerRef)

  // --- MOOD SWITCHING (queue + song name cache reset is synchronous) ---
  const switchMood = useCallback(
    (id) => {
      if (!moods.some((m) => m.id === id) || id === currentMoodId) return
      setCurrentMoodId(id)
      resetPlayback()
      localStorage.setItem('music-box-theme', id)
    },
    [moods, currentMoodId, setCurrentMoodId, resetPlayback],
  )

  // Controls + volume ko ek stable object mein combine karo (context value deps ke liye)
  const playerControls = useMemo(
    () => ({ ...controls, setVolume, toggleMute }),
    [controls, setVolume, toggleMute],
  )

  // Value ko memoize karo taaki unrelated re-renders par consumers na redraw hon
  const value = useMemo(
    () => ({
      site,
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
      controls: playerControls,
      queueActions,
    }),
    [
      site,
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
      playerControls,
      queueActions,
    ],
  )

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

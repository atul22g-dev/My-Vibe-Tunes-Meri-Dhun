import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function PlayerPill() {
  const { isPlaying, songTitle, songArtist, albumArt, playerRef, controls } = usePlayer()
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const barRef = useRef(null)

  // Track playback progress while playing
  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => {
      const p = playerRef.current
      if (!p || typeof p.getCurrentTime !== 'function') return
      const current = p.getCurrentTime()
      const total = p.getDuration()
      if (total > 0) setProgress({ current, total })
    }, 500)
    return () => clearInterval(id)
  }, [isPlaying, playerRef])

  const pct = progress.total > 0 ? (progress.current / progress.total) * 100 : 0

  const onBarClick = (e) => {
    // Keyboard activation (Enter/Space) fires a synthetic click with no pointer
    // position — arrow keys handle keyboard seeking in onBarKeyDown.
    if (e.detail === 0) return
    const rect = barRef.current.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    controls.seekTo(Math.max(0, Math.min(1, fraction)))
  }

  // Keyboard seeking: arrow keys jump in 5-second steps (same convention as YouTube)
  const onBarKeyDown = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
    e.preventDefault()
    const p = playerRef.current
    if (!p || typeof p.getCurrentTime !== 'function') return
    const total = p.getDuration()
    if (!(total > 0)) return
    const current = p.getCurrentTime()
    const next = current + (e.key === 'ArrowRight' ? 5 : -5)
    controls.seekTo(Math.max(0, Math.min(1, next / total)))
  }

  return (
    <div className="absolute bottom-12 left-1/2 z-10 flex w-[90%] max-w-[520px] -translate-x-1/2 items-center gap-4 rounded-full border border-white/10 bg-black/55 px-6 py-3 backdrop-blur-2xl max-md:rounded-[20px] max-md:px-4 max-xs:bottom-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <img
          src={albumArt}
          alt="Album art"
          className="size-10 shrink-0 rounded-full border-2 border-white/15 object-cover shadow-[0_0_8px_rgba(0,0,0,0.4)]"
        />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[0.85rem] font-bold">{songTitle}</span>
          <span className="truncate text-[0.7rem] opacity-50">{songArtist}</span>
          <div className="mt-0.5 flex items-center gap-0.5">
            <span className="text-[0.6rem] opacity-50">{formatTime(progress.current)}</span>
            <span className="text-[0.6rem] opacity-30">/</span>
            <span className="text-[0.6rem] opacity-50">{formatTime(progress.total)}</span>
          </div>
        </div>
      </div>

      {/* Progress bar — a button so keyboard & screen reader users can focus and seek it */}
      <button
        type="button"
        ref={barRef}
        onClick={onBarClick}
        onKeyDown={onBarKeyDown}
        aria-label="Seek"
        className="absolute bottom-0 left-6 right-6 h-1 cursor-pointer overflow-hidden rounded-sm bg-white/10 transition-[height] duration-200 hover:h-2"
        title="Seek"
      >
        <span className="bg-accent pointer-events-none block h-full rounded-sm" style={{ width: `${pct}%` }} />
      </button>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={controls.prev}
          className="cursor-pointer p-1.5 text-[1.1rem] opacity-60 transition-[transform,opacity] hover:scale-110 hover:opacity-100"
          title="Previous"
        >
          ⏮
        </button>
        <button
          type="button"
          onClick={controls.togglePlay}
          className="flex size-9.5 cursor-pointer items-center justify-center rounded-full bg-white text-[0.9rem] text-black transition-shadow hover:shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          type="button"
          onClick={controls.next}
          className="cursor-pointer p-1.5 text-[1.1rem] opacity-60 transition-[transform,opacity] hover:scale-110 hover:opacity-100"
          title="Next"
        >
          ⏭
        </button>
        <button
          type="button"
          onClick={controls.shuffle}
          className="cursor-pointer p-1.5 text-[0.9rem] opacity-60 transition-[transform,opacity] hover:scale-110 hover:opacity-100"
          title="Shuffle"
        >
          🔀
        </button>
      </div>
    </div>
  )
}

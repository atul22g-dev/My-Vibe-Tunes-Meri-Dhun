import { useEffect, useRef, useState } from 'react'
import { usePlayer } from '../context/PlayerContext'

export default function MoodSwitcher() {
  const { moods, currentMoodId, switchMood } = usePlayer()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Data load hone tak switcher dikhana zaroori nahi
  if (!moods.length) return null

  return (
    <div ref={ref} className="fixed right-16 top-5 z-[101] max-sm:right-14">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Switch Mood"
        className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-white/10 bg-black/50 text-xl text-white backdrop-blur-xl transition-transform duration-300 hover:scale-110 hover:shadow-[0_0_15px_rgba(241,196,15,0.3)]"
      >
        🎨
      </button>

      <div
        className={`absolute right-0 top-[50px] flex max-h-[70vh] min-w-[180px] flex-col gap-1.5 overflow-y-auto rounded-[14px] border border-white/10 bg-black/75 p-2.5 backdrop-blur-xl transition-all duration-300 ${
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none -translate-y-2.5 scale-95 opacity-0'
        }`}
      >
        {moods.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              switchMood(m.id)
              setOpen(false)
            }}
            className={`cursor-pointer rounded-lg border border-transparent px-3.5 py-2.5 text-left text-[0.82rem] font-semibold transition-colors hover:bg-white/10 ${
              m.id === currentMoodId ? 'border-accent bg-accent/10 text-accent' : 'text-white'
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>
    </div>
  )
}

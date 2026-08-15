import { usePlayer } from '../context/PlayerContext'
import { useClock } from '../hooks/useClock'
import { useLiveUsers } from '../hooks/useLiveUsers'
import VolumeIcon from './VolumeIcon'

export default function TopBar() {
  const { mood, volume, muted, controls } = usePlayer()
  const time = useClock()
  const liveUsers = useLiveUsers()

  return (
    <header className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-10 py-5 max-sm:px-5">
      <span className="text-sm font-medium opacity-80">{time}</span>

      {/* Volume: mute toggle + straight bar (player pill se yahan shift kiya) */}
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 py-1.5 pl-3 pr-2.5 backdrop-blur-xl mr-28">
        <button
          type="button"
          onClick={controls.toggleMute}
          className="cursor-pointer text-white/80 transition-all hover:scale-110 hover:text-white"
          title={muted || volume === 0 ? 'Unmute' : 'Mute'}
        >
          <VolumeIcon volume={volume} muted={muted} />
        </button>
        <input
          type="range"
          min={0}
          max={100}
          value={muted ? 0 : volume}
          onChange={(e) => controls.setVolume(Number(e.target.value))}
          className="volume-slider w-20 sm:w-28"
          style={{
            background: `linear-gradient(to right, var(--color-accent) ${muted ? 0 : volume}%, rgba(255, 255, 255, 0.15) ${muted ? 0 : volume}%)`,
          }}
          title="Volume"
        />
      </div>
    </header>
  )
}

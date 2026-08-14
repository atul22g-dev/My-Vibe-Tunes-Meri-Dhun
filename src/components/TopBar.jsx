import { usePlayer } from '../context/PlayerContext'
import { useClock } from '../hooks/useClock'
import { useLiveUsers } from '../hooks/useLiveUsers'
import { site } from '../config'

export default function TopBar() {
  const { mood } = usePlayer()
  const time = useClock()
  const liveUsers = useLiveUsers()

  return (
    <header className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between px-10 py-5 max-sm:px-5">
      <span className="text-sm font-medium opacity-80">{time}</span>
      <span className="flex items-center gap-2 text-sm font-semibold">
        <span className="inline-block size-2 rounded-full bg-[#28c840]" />
        <span>{liveUsers}</span> {mood.liveText}
      </span>
      <a href={site.homeUrl} className="text-xl opacity-60 transition-opacity hover:opacity-100">
        ⚙️
      </a>
    </header>
  )
}

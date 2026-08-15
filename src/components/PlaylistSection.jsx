import { usePlayer } from '../context/PlayerContext'

export default function PlaylistSection() {
  const {
    playlistIds,
    songNames,
    currentSongIndex,
    playerReady,
    playerError,
    controls,
    queueActions,
    dataError,
  } = usePlayer()

  return (
    <section className="mb-12">
      <h2 className="mb-5 text-[1.1rem] opacity-90">🎵 Poori Playlist</h2>

      {playerError || dataError ? (
        <p className="py-8 text-center text-sm opacity-40">
          {playerError || `Playlists load nahi hue: ${dataError}`}
        </p>
      ) : !playerReady || playlistIds.length === 0 ? (
        <p className="py-8 text-center text-sm opacity-40">Loading new playlist...</p>
      ) : (
        <ul className="playlist-scroll flex max-h-[340px] list-none flex-col gap-2 overflow-y-auto pr-2">
          {playlistIds.map((videoId, i) => {
            const active = i === currentSongIndex
            const name = songNames[videoId] || `Song ${i + 1}`
            return (
              <li
                key={videoId}
                className={`flex cursor-pointer items-center justify-between rounded-xl border border-white/10 border-l-[3px] border-l-transparent bg-[rgba(10,10,40,0.75)] px-5 py-4 transition-colors hover:border-accent hover:border-l-accent ${
                  active ? 'border-accent border-l-accent bg-accent/5' : ''
                }`}
                onClick={() => controls.playSongAt(i)}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <img
                    src={`https://img.youtube.com/vi/${videoId}/default.jpg`}
                    alt=""
                    className="h-8 w-11 shrink-0 rounded object-cover"
                  />
                  <span className={`truncate text-sm font-semibold ${active ? 'text-accent' : ''}`}>
                    {name}
                  </span>
                </div>
                {active && <span className="mr-2 text-[0.75rem] opacity-40">▶ Playing</span>}
                <button
                  type="button"
                  title="Add to queue"
                  onClick={(e) => {
                    e.stopPropagation()
                    queueActions.addToQueue(videoId, name)
                  }}
                  className="ml-2 flex size-6.5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/15 text-base text-accent transition-all hover:scale-110 hover:border-accent hover:bg-accent/15"
                >
                  +
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

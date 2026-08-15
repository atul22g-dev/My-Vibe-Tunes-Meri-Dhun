import { usePlayer } from '../context/PlayerContext'

export default function QueueSection() {
  const { userQueue, queueActions } = usePlayer()

  return (
    <section className="mb-12 rounded-2xl border border-white/10 bg-[rgba(10,10,40,0.75)] p-6">
      <h2 className="mb-5 flex items-center gap-2 text-[1.1rem] opacity-90">
        📋 Teri Queue{' '}
        <span className="bg-accent rounded-[10px] px-2 py-0.5 text-[0.65rem] font-extrabold text-black">
          {userQueue.length}
        </span>
      </h2>
      <p className="mb-4 text-[0.8rem] opacity-40">
        Click &quot;+&quot; on any song to add it here. Songs play in this order when queue is active.
      </p>

      {userQueue.length === 0 ? (
        <p className="queue-empty py-4 text-center text-[0.85rem] italic opacity-30">
          Queue khaali hai... kuch add kar bhai
        </p>
      ) : (
        <ul className="queue-scroll mb-4 flex max-h-[220px] list-none flex-col gap-1.5 overflow-y-auto">
          {userQueue.map((item, i) => (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-white/5 bg-white/3 px-4 py-2.5 text-[0.85rem]"
            >
              <span className="min-w-[20px] text-[0.7rem] opacity-40">{i + 1}.</span>
              <span className="flex-1 truncate">{item.name}</span>
              <button
                type="button"
                title="Remove"
                onClick={() => queueActions.removeFromQueue(i)}
                className="cursor-pointer px-1 text-base text-[#e74c3c] opacity-50 transition-opacity hover:opacity-100"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={queueActions.playQueue}
          disabled={userQueue.length === 0}
          className="flex-1 cursor-pointer rounded-lg border border-accent bg-accent/10 px-4 py-2.5 text-[0.85rem] font-semibold text-accent transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          ▶ Play Queue
        </button>
        <button
          type="button"
          onClick={queueActions.clearQueue}
          disabled={userQueue.length === 0}
          className="flex-1 cursor-pointer rounded-lg border border-[#e74c3c] bg-[#e74c3c]/10 px-4 py-2.5 text-[0.85rem] font-semibold text-[#e74c3c] transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-[#e74c3c]/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          🗑 Clear
        </button>
      </div>
    </section>
  )
}

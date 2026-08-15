import { usePlayer } from '../context/PlayerContext'
import PlayerPill from './PlayerPill'

const stars = [
  { top: '12%', left: '18%', size: 3, delay: '0s' },
  { top: '8%', left: '62%', size: 2, delay: '0.7s' },
  { top: '20%', left: '80%', size: 2.5, delay: '1.3s' },
  { top: '30%', left: '35%', size: 2, delay: '1.9s' },
  { top: '16%', left: '45%', size: 3, delay: '2.4s' },
  { top: '28%', left: '70%', size: 2, delay: '0.4s' },
]

const shootingStars = [
  { top: '10%', right: '16%', delay: '1s' },
  { top: '24%', right: '42%', delay: '6s' },
]

// Local hero backgrounds (public/) — API `bg` se nahi lete
const MOOD_BG = {
  songs: '/background.jpg',
  poetry: '/Poetry.jpg',
  'standup-comedy': '/StanUp%20Comedy.jpg',
}

export default function Hero() {
  const { mood, quote } = usePlayer()
  const bg = MOOD_BG[mood.id] || '/background.jpg'
  // Star animation sirf Personal Songs mood mein dikhta hai
  const showStars = mood.id === 'songs'

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Local background image (public/) — not from API */}
      <div
        className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500"
        style={{ backgroundImage: `url('${bg}')` }}
        key={mood.id}
      />

      {/* TWINKLING STARS — sirf Personal Songs mein */}
      {showStars &&
        stars.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}

      {/* SHOOTING STARS — sirf Personal Songs mein */}
      {showStars &&
        shootingStars.map((s, i) => (
          <span
            key={i}
            className="shooting-star"
            style={{ top: s.top, right: s.right, animationDelay: s.delay }}
          />
        ))}

      {/* HERO CONTENT */}
      <div className="absolute inset-x-0 top-[15%] z-[3] text-center">
        <h1 className="font-hindi text-7xl font-normal tracking-wide [text-shadow:0_4px_30px_rgba(0,0,0,0.5)] max-md:text-6xl max-xs:text-5xl">
          {mood.name}
        </h1>
        {mood.tagline && (
          <p className="font-hindi mt-3 text-xl tracking-wide text-white/85 [text-shadow:0_2px_12px_rgba(0,0,0,0.6)] max-xs:text-base">
            {mood.tagline}
          </p>
        )}
      </div>

      {/* QUOTE */}
      <div className="absolute inset-x-0 bottom-[22%] z-[5] text-center">
        <p className="font-hindi mx-auto max-w-[550px] text-[1.15rem] leading-[1.9] opacity-85 [text-shadow:0_2px_10px_rgba(0,0,0,0.6)] max-xs:text-base">
          {quote}
        </p>
      </div>

      {/* PLAYER */}
      <PlayerPill />
    </section>
  )
}

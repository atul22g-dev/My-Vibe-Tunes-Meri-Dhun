import { useEffect } from 'react'
import { site } from './config'
import { PlayerProvider } from './context/PlayerContext'
import GrainOverlay from './components/GrainOverlay'
import TopBar from './components/TopBar'
import MoodSwitcher from './components/MoodSwitcher'
import Hero from './components/Hero'
import PlaylistSection from './components/PlaylistSection'
import QueueSection from './components/QueueSection'
import Footer from './components/Footer'

export default function App() {
  // Browser tab title config se (index.html ke saath match kare)
  useEffect(() => {
    document.title = site.title
  }, [])

  return (
    <PlayerProvider>
      <GrainOverlay />
      <TopBar />
      <MoodSwitcher />
      <Hero />

      {/* BELOW FOLD */}
      <section className="bg-[linear-gradient(180deg,#0f1a3d_0%,#1a237e_30%,#4a1942_60%,#6b1d1d_100%)] px-6 py-16">
        <div className="mx-auto max-w-[600px]">
          <PlaylistSection />
          <QueueSection />
          <Footer />
        </div>
      </section>
    </PlayerProvider>
  )
}

import { usePlayer } from '../context/PlayerContext'

export default function Footer() {
  // API se aaya homeUrl use karo, hardcoded URL duplicate nahi (DRY)
  const { site } = usePlayer()
  const homeUrl = site.homeUrl || 'https://github.com/atual-dev'

  return (
    <footer className="mt-4 border-t border-white/10 pt-8 text-center opacity-50">
      <p>Made with ❤️ by Atul</p>
      <p className="mt-2 text-[0.75rem]">
        a{' '}
        <a href={homeUrl} className="text-accent no-underline">
          Atul
        </a>{' '}
        creation
      </p>
    </footer>
  )
}

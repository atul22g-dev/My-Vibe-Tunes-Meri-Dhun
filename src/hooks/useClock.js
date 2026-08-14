import { useEffect, useState } from 'react'

function formatTime(date) {
  let h = date.getHours()
  const m = String(date.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'pm' : 'am'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

export function useClock() {
  const [time, setTime] = useState(() => formatTime(new Date()))

  useEffect(() => {
    const id = setInterval(() => setTime(formatTime(new Date())), 30000)
    return () => clearInterval(id)
  }, [])

  return time
}

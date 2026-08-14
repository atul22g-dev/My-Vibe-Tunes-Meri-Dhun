import { useEffect, useState } from 'react'
import { onDisconnect, onValue, ref, remove, set } from 'firebase/database'
import { db } from '../firebase'

// Live "on the highway" counter via Firebase Realtime Database presence
export function useLiveUsers() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const myId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const myRef = ref(db, `bus-playlist/connections/${myId}`)
    const connectedRef = ref(db, '.info/connected')
    const connectionsRef = ref(db, 'bus-playlist/connections')

    const connectedOff = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(myRef, true)
        onDisconnect(myRef).remove()
      }
    })

    const connectionsOff = onValue(connectionsRef, (snap) => {
      // Firebase v12 modular SDK: DataSnapshot has a `size` getter (numChildren was compat-only)
      setCount(snap.size)
    })

    return () => {
      connectedOff()
      connectionsOff()
      onDisconnect(myRef).cancel()
      remove(myRef).catch(() => {})
    }
  }, [])

  return count
}

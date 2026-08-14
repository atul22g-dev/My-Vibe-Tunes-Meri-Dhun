// ============================================================
//  SITE CONFIG - ye file edit karo, sab kuch yahin se control
//  hota hai. Naya mood / playlist / song add karna hai toh
//  neeche `moods` array mein entry copy karke badal lo.
// ============================================================

export const site = {
  // Browser tab ka title
  title: "My Vibe Tunes - Meri Dhun",
  // Top bar ke home button ka link
  homeUrl: 'https://github.com/atual-dev',
}

// ------------------------------------------------------------
//  MOODS - har mood ka apna playlist + background image + quotes
//
//  Ek mood add karne ke liye:
//  1. Playlist URL se id lo:  https://www.youtube.com/playlist?list=PLIV4nZCjWE3E
//     -> playlistId: 'PLIV4nZCjWE3E'
//  2. (ya) apne fixed songs ho toh:  songs: ['VIDEO_ID_1', 'VIDEO_ID_2']
//  3. Background image public/ folder mein daalo aur naam likho: bg: 'background.jpg'
//  4. liveText = top bar mein dikhne wala text
//  5. quotes = hero mein rotate hone wale quotes
// ------------------------------------------------------------
export const moods = [
  {
    id: 'creator_fav',
    name: "Creator's Favorite",
    label: "Creator's Fav",
    emoji: '⭐',
    playlistId: 'PLIV4nZCjWE3E',
    bg: 'background.jpg',
    liveText: 'Creator\'s personal diary of music',
    quotes: [
      '"ye playlist meri personal diary hai"',
      '"mood ke hisaab se nahi, playlist ke hisaab se jeeta hoon"',
      '"har gaane ke peeche ek kahani hai"',
      '"shuffle mat karo, order mein suno — trust me"',
      '"ye woh gaane hain jo kisi ko nahi batata"',
      '"3am vibes, headphones on, duniya off"',
      '"curator\'s choice — no skip allowed"',
      '"if you know, you know"',
    ],
  }
]

// Current mood = pehli entry (ya localStorage mein saved)
export function getDefaultMoodId() {
  return moods[0].id
}

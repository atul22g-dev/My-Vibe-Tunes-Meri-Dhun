// Firebase (modular SDK) - same project used by the original site
import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyBNSW4YxTZIbIdfUybjuHu7bACrvbHiwXo',
  authDomain: 'Atullabs-counter.firebaseapp.com',
  databaseURL: 'https://Atullabs-counter-default-rtdb.firebaseio.com',
  projectId: 'Atullabs-counter',
  storageBucket: 'Atullabs-counter.firebasestorage.app',
  messagingSenderId: '1002791226857',
  appId: '1:1002791226857:web:a95b2173c322f49b190f78',
}

const app = initializeApp(firebaseConfig)
export const db = getDatabase(app)

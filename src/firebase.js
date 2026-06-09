import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCDpm_n2qo08yTRqt2i5bTt-fEVPnqxMZY",
  authDomain: "pulse-vercel.firebaseapp.com",
  projectId: "pulse-vercel",
  storageBucket: "pulse-vercel.firebasestorage.app",
  messagingSenderId: "114807293428",
  appId: "1:114807293428:web:4350d89d6412690840e5a1",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db   = getFirestore(app)

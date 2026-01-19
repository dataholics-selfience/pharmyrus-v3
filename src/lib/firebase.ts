import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore'

/**
 * Firebase Configuration
 * 
 * SECURITY NOTE:
 * - API keys are stored in .env.local (gitignored)
 * - Never commit credentials to version control
 * - Firebase keys are safe for client-side use (protected by Firestore rules)
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  throw new Error(
    'Firebase configuration is missing. Please check your .env.local file.'
  )
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)

// Initialize Auth
export const auth = getAuth(app)

// Initialize Firestore
export const db = getFirestore(app)

// Connect to emulators in development (optional)
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  connectAuthEmulator(auth, 'http://localhost:9099')
  connectFirestoreEmulator(db, 'localhost', 8080)
  console.log('🔧 Connected to Firebase Emulators')
}

export default app

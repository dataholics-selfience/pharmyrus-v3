import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser, 
  onAuthStateChanged,
  signOut as firebaseSignOut 
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { User } from '@/types'

/**
 * Auth Context
 * 
 * Provides Firebase authentication state across the app
 * Automatically syncs with Firestore user data
 */
interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Subscribe to Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser)
      
      if (firebaseUser) {
        try {
          // Check if user just signed up
          const justSignedUp = localStorage.getItem('justSignedUp') === 'true'
          
          // If just signed up, wait a bit for Firestore to sync
          if (justSignedUp) {
            console.log('⏳ New signup detected, waiting for Firestore sync...')
            await new Promise(resolve => setTimeout(resolve, 2000)) // 2 seconds
          }
          
          // Fetch user data from Firestore with retry logic
          let userDoc
          let retries = 0
          const maxRetries = 3
          
          while (retries < maxRetries) {
            userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
            
            if (userDoc.exists()) {
              break // Success!
            }
            
            // Document doesn't exist yet, wait and retry
            console.log(`⏳ User document not found, retry ${retries + 1}/${maxRetries}`)
            await new Promise(resolve => setTimeout(resolve, 1000))
            retries++
          }
          
          if (userDoc && userDoc.exists()) {
            const userData = userDoc.data()
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: userData.displayName || firebaseUser.displayName,
              phoneNumber: userData.phoneNumber || null,
              cpf: userData.cpf,
              company: userData.company,
              createdAt: userData.createdAt?.toDate() || new Date(),
              lastLogin: userData.lastLogin?.toDate() || new Date(),
              role: userData.role || 'user',
              organizationId: userData.organizationId,
            })
            
            // Clear signup flag after successful load
            if (justSignedUp) {
              localStorage.removeItem('justSignedUp')
              console.log('✅ Signup flag cleared')
            }
          } else {
            console.error('❌ User document not found after retries')
            // Create minimal user object from Firebase Auth
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email!,
              displayName: firebaseUser.displayName || null,
              phoneNumber: null,
              cpf: null,
              company: null,
              createdAt: new Date(),
              lastLogin: new Date(),
              role: 'user',
              organizationId: null,
            })
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Create minimal user object on error
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email!,
            displayName: firebaseUser.displayName || null,
            phoneNumber: null,
            cpf: null,
            company: null,
            createdAt: new Date(),
            lastLogin: new Date(),
            role: 'user',
            organizationId: null,
          })
        }
      } else {
        setUser(null)
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      setUser(null)
      setFirebaseUser(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const value = {
    user,
    firebaseUser,
    loading,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to access auth state
 */
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

/**
 * Check if user is admin (for protected routes)
 */
export function useIsAdmin() {
  const { user } = useAuth()
  return user?.email === 'innovagenoi@gmail.com'
}

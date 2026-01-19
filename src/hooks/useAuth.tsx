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
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid))
          
          if (userDoc.exists()) {
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
          }
        } catch (error) {
          console.error('Error fetching user data:', error)
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

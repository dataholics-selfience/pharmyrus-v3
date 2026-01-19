/**
 * Pending Search Service - Firestore
 * 
 * Salva busca pendente no Firestore para recuperar após login
 */

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface PendingSearch {
  molecule: string
  brand?: string
  countries: string[]
  timestamp: number
}

/**
 * Salvar busca pendente (ANTES de autenticar)
 * Usa sessionId temporário
 */
export async function savePendingSearch(
  sessionId: string, 
  search: Omit<PendingSearch, 'timestamp'>
): Promise<void> {
  try {
    const pendingSearch: PendingSearch = {
      ...search,
      timestamp: Date.now()
    }
    
    await setDoc(doc(db, 'pending_searches', sessionId), pendingSearch)
    
    console.log('💾 Pending search saved to Firestore:', sessionId)
    
  } catch (error) {
    console.error('Error saving pending search:', error)
    
    // Fallback to localStorage
    localStorage.setItem('pendingSearch', JSON.stringify({
      ...search,
      timestamp: Date.now()
    }))
  }
}

/**
 * Recuperar busca pendente (APÓS autenticar)
 */
export async function getPendingSearch(
  sessionId: string
): Promise<PendingSearch | null> {
  try {
    const docRef = doc(db, 'pending_searches', sessionId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      console.log('✅ Pending search found in Firestore')
      return docSnap.data() as PendingSearch
    }
    
    // Fallback to localStorage
    const local = localStorage.getItem('pendingSearch')
    if (local) {
      console.log('✅ Pending search found in localStorage')
      return JSON.parse(local)
    }
    
    return null
    
  } catch (error) {
    console.error('Error getting pending search:', error)
    
    // Fallback to localStorage
    const local = localStorage.getItem('pendingSearch')
    if (local) {
      return JSON.parse(local)
    }
    
    return null
  }
}

/**
 * Limpar busca pendente após usar
 */
export async function clearPendingSearch(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'pending_searches', sessionId))
    localStorage.removeItem('pendingSearch')
    
    console.log('🗑️ Pending search cleared')
    
  } catch (error) {
    console.error('Error clearing pending search:', error)
    localStorage.removeItem('pendingSearch')
  }
}

/**
 * Gerar session ID único para navegador
 * IMPORTANTE: Usa localStorage para persistir entre fechamentos do navegador
 */
export function getSessionId(): string {
  let sessionId = localStorage.getItem('pharmyrus_session_id')
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('pharmyrus_session_id', sessionId)
    console.log('🆕 Created new session ID:', sessionId)
  } else {
    console.log('♻️ Reusing existing session ID:', sessionId)
  }
  
  return sessionId
}

/**
 * Limpar session ID (após login bem-sucedido)
 */
export function clearSessionId(): void {
  localStorage.removeItem('pharmyrus_session_id')
  console.log('🗑️ Session ID cleared')
}

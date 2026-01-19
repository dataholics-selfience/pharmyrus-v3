/**
 * Journey Tracker - Firestore
 * 
 * Rastreia jornada do usuário de forma SIMPLES usando apenas Firestore
 * Sem delays, sem verificar auth state, APENAS Firestore
 */

import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface Journey {
  molecule: string
  brand?: string
  countries: string[]
  step: 'search_pending' | 'signup_done' | 'login_done' | 'search_done'
  sessionId: string
  createdAt: number
  userId?: string
}

/**
 * Salvar journey no Firestore (público)
 */
export async function saveJourney(sessionId: string, journey: Omit<Journey, 'sessionId' | 'createdAt'>): Promise<void> {
  try {
    await setDoc(doc(db, 'journeys', sessionId), {
      ...journey,
      sessionId,
      createdAt: Date.now()
    })
    console.log('💾 Journey saved:', sessionId, journey.step)
  } catch (error) {
    console.error('Error saving journey:', error)
  }
}

/**
 * Buscar journey do Firestore
 */
export async function getJourney(sessionId: string): Promise<Journey | null> {
  try {
    const docRef = doc(db, 'journeys', sessionId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      console.log('✅ Journey found:', sessionId)
      return docSnap.data() as Journey
    }
    
    return null
  } catch (error) {
    console.error('Error getting journey:', error)
    return null
  }
}

/**
 * Atualizar step do journey
 */
export async function updateJourneyStep(
  sessionId: string, 
  step: Journey['step'],
  userId?: string
): Promise<void> {
  try {
    await setDoc(doc(db, 'journeys', sessionId), {
      step,
      userId,
      updatedAt: Date.now()
    }, { merge: true })
    
    console.log('✅ Journey updated:', sessionId, '→', step)
  } catch (error) {
    console.error('Error updating journey:', error)
  }
}

/**
 * Limpar journey após concluir
 */
export async function clearJourney(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'journeys', sessionId))
    console.log('🗑️ Journey cleared:', sessionId)
  } catch (error) {
    console.error('Error clearing journey:', error)
  }
}

/**
 * Gerar session ID
 */
export function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('pharmyrus_journey_id')
  
  if (!sessionId) {
    sessionId = `journey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('pharmyrus_journey_id', sessionId)
    console.log('🆕 New journey ID:', sessionId)
  } else {
    console.log('♻️ Existing journey ID:', sessionId)
  }
  
  return sessionId
}

/**
 * Limpar session ID local
 */
export function clearSessionId(): void {
  localStorage.removeItem('pharmyrus_journey_id')
  console.log('🗑️ Journey ID cleared from localStorage')
}

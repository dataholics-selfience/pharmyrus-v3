/**
 * User Plan & Quota System
 */

import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export type PlanTier = 'free' | 'basic' | 'intermediate' | 'unlimited'

export interface UserPlan {
  tier: PlanTier
  searchesUsed: number
  searchesLimit: number
  createdAt: Date
  lastSearchAt?: Date
  searchHistory: string[] // job_ids
}

const PLAN_LIMITS: Record<PlanTier, number> = {
  free: 1,
  basic: 50,
  intermediate: 200,
  unlimited: -1 // unlimited
}

/**
 * Get user's current plan
 */
export async function getUserPlan(userId: string): Promise<UserPlan | null> {
  try {
    const docRef = doc(db, 'users', userId, 'plan', 'current')
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      // Create free plan
      const newPlan: UserPlan = {
        tier: 'free',
        searchesUsed: 0,
        searchesLimit: PLAN_LIMITS.free,
        createdAt: new Date(),
        searchHistory: []
      }
      
      await setDoc(docRef, newPlan)
      return newPlan
    }
    
    return docSnap.data() as UserPlan
    
  } catch (error) {
    console.error('Error getting user plan:', error)
    return null
  }
}

/**
 * Check if user can search
 */
export async function canUserSearch(userId: string): Promise<boolean> {
  const plan = await getUserPlan(userId)
  
  if (!plan) return false
  
  // Unlimited plan
  if (plan.searchesLimit === -1) return true
  
  // Check quota
  return plan.searchesUsed < plan.searchesLimit
}

/**
 * Increment search usage
 */
export async function incrementSearchUsage(
  userId: string, 
  jobId: string
): Promise<void> {
  try {
    const docRef = doc(db, 'users', userId, 'plan', 'current')
    
    await updateDoc(docRef, {
      searchesUsed: increment(1),
      lastSearchAt: new Date(),
      searchHistory: [...(await getUserPlan(userId))?.searchHistory || [], jobId]
    })
    
    console.log('✅ Search usage incremented')
    
  } catch (error) {
    console.error('Error incrementing search usage:', error)
  }
}

/**
 * Get search history
 */
export async function getSearchHistory(userId: string): Promise<string[]> {
  const plan = await getUserPlan(userId)
  return plan?.searchHistory || []
}

/**
 * Upgrade plan (for future implementation)
 */
export async function upgradePlan(
  userId: string, 
  newTier: PlanTier
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'plan', 'current')
  
  await updateDoc(docRef, {
    tier: newTier,
    searchesLimit: PLAN_LIMITS[newTier]
  })
}

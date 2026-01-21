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
 * CORRIGIDO: Busca de userPlans/{uid} (sistema de assinaturas)
 */
export async function canUserSearch(userId: string): Promise<boolean> {
  try {
    // Tentar buscar de userPlans primeiro (sistema de assinaturas)
    const userPlanRef = doc(db, 'userPlans', userId)
    const userPlanSnap = await getDoc(userPlanRef)
    
    if (userPlanSnap.exists()) {
      const data = userPlanSnap.data()
      console.log('📊 Quota check (userPlans):', {
        used: data.searchesUsed || 0,
        limit: data.searchesLimit || 0,
        canSearch: (data.searchesUsed || 0) < (data.searchesLimit || 0)
      })
      
      // Verificar se está ativo e tem quota
      if (data.status !== 'active') {
        console.warn('⚠️ Assinatura não está ativa:', data.status)
        return false
      }
      
      // Unlimited plan (-1)
      if (data.searchesLimit === -1) return true
      
      // Check quota
      return (data.searchesUsed || 0) < (data.searchesLimit || 0)
    }
    
    // Fallback: tentar users/{uid}/plan/current (sistema antigo)
    const plan = await getUserPlan(userId)
    
    if (!plan) {
      console.warn('⚠️ Nenhum plano encontrado para usuário')
      return false
    }
    
    console.log('📊 Quota check (fallback):', {
      used: plan.searchesUsed,
      limit: plan.searchesLimit,
      canSearch: plan.searchesUsed < plan.searchesLimit
    })
    
    // Unlimited plan
    if (plan.searchesLimit === -1) return true
    
    // Check quota
    return plan.searchesUsed < plan.searchesLimit
    
  } catch (error) {
    console.error('Error checking quota:', error)
    return false
  }
}

/**
 * Increment search usage
 * CORRIGIDO: Atualiza AMBOS locais (userPlans + users/plan/current)
 */
export async function incrementSearchUsage(
  userId: string, 
  jobId: string
): Promise<void> {
  try {
    // 1. Atualizar userPlans (sistema de assinaturas - PRINCIPAL)
    const userPlanRef = doc(db, 'userPlans', userId)
    const userPlanSnap = await getDoc(userPlanRef)
    
    if (userPlanSnap.exists()) {
      await updateDoc(userPlanRef, {
        searchesUsed: increment(1),
        lastSearchAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ Search usage incremented (userPlans)')
    }
    
    // 2. Atualizar users/{uid}/plan/current (sistema antigo - SYNC)
    const planRef = doc(db, 'users', userId, 'plan', 'current')
    const planSnap = await getDoc(planRef)
    
    if (planSnap.exists()) {
      const currentHistory = (await getUserPlan(userId))?.searchHistory || []
      
      await updateDoc(planRef, {
        searchesUsed: increment(1),
        lastSearchAt: new Date(),
        searchHistory: [...currentHistory, jobId]
      })
      console.log('✅ Search usage incremented (users/plan/current)')
    }
    
  } catch (error) {
    console.error('Error incrementing search usage:', error)
    throw error // Propagar erro para não perder quota
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

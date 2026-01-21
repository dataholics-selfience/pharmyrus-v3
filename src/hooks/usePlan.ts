import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  increment,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Plan, UserPlan } from '@/types/plans'

/**
 * Hook para gerenciar planos do usuário
 */
export function usePlan(userId: string | undefined) {
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [canSearch, setCanSearch] = useState(false)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    loadUserPlan()
  }, [userId])

  const loadUserPlan = async () => {
    if (!userId) return

    try {
      // Buscar plano do usuário
      const userPlanDoc = await getDoc(doc(db, 'userPlans', userId))
      
      if (!userPlanDoc.exists()) {
        // Usuário sem plano - não criar automaticamente
        console.log('[usePlan] Usuário sem plano definido')
        setLoading(false)
        return
      }

      const userPlanData = {
        ...userPlanDoc.data(),
        createdAt: userPlanDoc.data().createdAt?.toDate(),
        updatedAt: userPlanDoc.data().updatedAt?.toDate(),
        lastSearchAt: userPlanDoc.data().lastSearchAt?.toDate() || null
      } as UserPlan

      setUserPlan(userPlanData)

      // Buscar detalhes do plano
      const planDoc = await getDoc(doc(db, 'plans', userPlanData.planId))
      if (planDoc.exists()) {
        const planData = {
          ...planDoc.data(),
          id: planDoc.id,
          createdAt: planDoc.data().createdAt?.toDate(),
          updatedAt: planDoc.data().updatedAt?.toDate()
        } as Plan
        setPlan(planData)

        // Verificar se pode buscar
        const canDoSearch = 
          userPlanData.status === 'active' && 
          userPlanData.searchesUsed < userPlanData.searchesLimit
        setCanSearch(canDoSearch)
      }

    } catch (error) {
      console.error('[usePlan] Error loading plan:', error)
    } finally {
      setLoading(false)
    }
  }

  const createFreePlan = async (uid: string) => {
    console.log('[usePlan] Usuário sem plano - não criando automaticamente')
    // NÃO criar plano automaticamente - deve ser criado pelo admin
    // Apenas setar loading false para não travar a UI
    setLoading(false)
    return
  }


  const incrementSearchCount = async () => {
    if (!userId || !userPlan) {
      throw new Error('User or plan not found')
    }

    try {
      await updateDoc(doc(db, 'userPlans', userId), {
        searchesUsed: increment(1),
        updatedAt: Timestamp.now()
      })

      // Atualizar estado local
      setUserPlan(prev => prev ? {
        ...prev,
        searchesUsed: prev.searchesUsed + 1,
        updatedAt: new Date()
      } : null)

      // Atualizar canSearch
      if (userPlan.searchesUsed + 1 >= userPlan.searchesLimit) {
        setCanSearch(false)
      }

      console.log('✅ Search count incremented:', userPlan.searchesUsed + 1)
    } catch (error) {
      console.error('[usePlan] Error incrementing search count:', error)
      throw error
    }
  }

  const getRemainingSearches = () => {
    if (!userPlan) return 0
    return Math.max(0, userPlan.searchesLimit - userPlan.searchesUsed)
  }

  const getUsagePercentage = () => {
    if (!userPlan || userPlan.searchesLimit === 0) return 0
    return (userPlan.searchesUsed / userPlan.searchesLimit) * 100
  }

  return {
    userPlan,
    plan,
    loading,
    canSearch,
    remainingSearches: getRemainingSearches(),
    usagePercentage: getUsagePercentage(),
    incrementSearchCount,
    reload: loadUserPlan
  }
}

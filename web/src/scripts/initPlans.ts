import { collection, doc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_PLANS } from '@/types/plans'

/**
 * Script para inicializar os planos no Firestore
 * EXECUTAR UMA VEZ APENAS!
 * 
 * Como usar:
 * 1. Abrir console do navegador
 * 2. import { initializePlans } from './scripts/initPlans'
 * 3. await initializePlans()
 */
export async function initializePlans() {
  console.log('🚀 Initializing plans in Firestore...')
  
  try {
    for (const plan of DEFAULT_PLANS) {
      const planId = plan.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
      
      await setDoc(doc(db, 'plans', planId), {
        ...plan,
        id: planId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      
      console.log(`✅ Created plan: ${plan.name} (ID: ${planId})`)
    }
    
    console.log('🎉 All plans initialized successfully!')
    console.log('Plans created:', DEFAULT_PLANS.map(p => p.name).join(', '))
    
    return {
      success: true,
      count: DEFAULT_PLANS.length
    }
  } catch (error) {
    console.error('❌ Error initializing plans:', error)
    throw error
  }
}

// Auto-export para facilitar uso
if (typeof window !== 'undefined') {
  (window as any).initializePlans = initializePlans
}

import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  Timestamp,
  query,
  where 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { DEFAULT_PLANS } from '@/types/plans'

/**
 * Script de Migração e Inicialização Completa
 * 
 * EXECUTAR UMA VEZ APENAS!
 * 
 * O que faz:
 * 1. Cria os 5 planos no Firestore
 * 2. Migra todos os usuários existentes
 * 3. Cria organizações individuais
 * 4. Atribui plano Básico (1 consulta)
 * 5. Admin (innovagenoi@gmail.com) fica ilimitado
 */

export async function initializeSystem() {
  console.log('🚀 Starting system initialization...')
  
  try {
    // ETAPA 1: Criar Planos
    console.log('\n📋 Step 1: Creating plans...')
    await initializePlans()
    
    // ETAPA 2: Migrar Usuários
    console.log('\n👥 Step 2: Migrating users...')
    await migrateExistingUsers()
    
    console.log('\n🎉 System initialization completed successfully!')
    console.log('\n✅ Summary:')
    console.log('   - 5 plans created')
    console.log('   - All users migrated')
    console.log('   - Organizations created')
    console.log('   - Plans assigned')
    
    return {
      success: true,
      message: 'System initialized successfully'
    }
  } catch (error) {
    console.error('❌ Error during initialization:', error)
    throw error
  }
}

async function initializePlans() {
  for (const plan of DEFAULT_PLANS) {
    const planId = plan.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
    
    await setDoc(doc(db, 'plans', planId), {
      ...plan,
      id: planId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    console.log(`   ✅ Created plan: ${plan.name} (${planId})`)
  }
}

async function migrateExistingUsers() {
  // Buscar todos os usuários do Firebase Auth via Firestore users collection
  const usersSnapshot = await getDocs(collection(db, 'users'))
  
  if (usersSnapshot.empty) {
    console.log('   ⚠️  No users found to migrate')
    return
  }
  
  console.log(`   Found ${usersSnapshot.size} users to migrate`)
  
  // Buscar plano básico
  const basicPlanQuery = query(
    collection(db, 'plans'),
    where('name', '==', 'Básico')
  )
  const basicPlanSnapshot = await getDocs(basicPlanQuery)
  const basicPlan = basicPlanSnapshot.docs[0]
  
  if (!basicPlan) {
    throw new Error('Basic plan not found! Run initializePlans first.')
  }
  
  let migratedCount = 0
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data()
    const userId = userDoc.id
    const userEmail = userData.email
    
    console.log(`   Processing: ${userEmail}`)
    
    // Verificar se já tem userPlan
    const existingUserPlan = await getDocs(
      query(collection(db, 'userPlans'), where('userId', '==', userId))
    )
    
    if (!existingUserPlan.empty) {
      console.log(`     ⏭️  Already has plan, skipping`)
      continue
    }
    
    // Criar organização individual
    const orgId = `org_user_${userId}`
    await setDoc(doc(db, 'organizations', orgId), {
      id: orgId,
      name: userData.displayName || userData.email,
      type: 'individual',
      email: userData.email,
      userId: userId,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      createdBy: 'system_migration'
    })
    console.log(`     ✅ Created organization: ${orgId}`)
    
    // Definir plano
    let planId = basicPlan.id
    let searchesLimit = basicPlan.data().searchesPerUser
    
    // Admin fica ilimitado
    if (userEmail === 'innovagenoi@gmail.com') {
      planId = 'admin_unlimited'
      searchesLimit = 999999
      
      // Criar plano admin ilimitado se não existir
      const adminPlanRef = doc(db, 'plans', 'admin_unlimited')
      await setDoc(adminPlanRef, {
        id: 'admin_unlimited',
        name: 'Admin Ilimitado',
        description: 'Plano administrativo com acesso ilimitado',
        price: 0,
        searchesPerUser: 999999,
        maxUsers: 1,
        features: [
          'Consultas ilimitadas',
          'Acesso total ao sistema',
          'Privilégios administrativos'
        ],
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
      console.log(`     ⭐ Admin unlimited plan assigned`)
    }
    
    // Criar userPlan
    await setDoc(doc(db, 'userPlans', userId), {
      userId: userId,
      organizationId: orgId,
      organizationType: 'individual',
      subscriptionId: null,
      planId: planId,
      planName: userEmail === 'innovagenoi@gmail.com' ? 'Admin Ilimitado' : basicPlan.data().name,
      role: 'admin',
      searchesUsed: 0,
      searchesLimit: searchesLimit,
      status: 'active',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    console.log(`     ✅ Created userPlan with ${searchesLimit} searches`)
    
    migratedCount++
  }
  
  console.log(`\n   ✅ Migrated ${migratedCount} users`)
}

// Auto-export para facilitar uso
if (typeof window !== 'undefined') {
  (window as any).initializeSystem = initializeSystem
}

/**
 * Plan Management Service - Sistema Completo de Gestão de Planos
 * 
 * Features:
 * - Versionamento de planos
 * - Sincronização automática de usuários
 * - Sistema de migração
 * - Limpeza de duplicatas
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  writeBatch
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

// ============================================
// TYPES
// ============================================

export interface Plan {
  id: string
  name: string
  display_name: string
  
  // Quotas
  searches_per_month: number
  exports_per_month?: number
  ai_analysis_per_month?: number
  max_users?: number  // Máximo de usuários permitidos no plano
  
  // Pricing
  price: number
  currency: string
  billing_period: 'monthly' | 'yearly'
  
  // Versioning
  version: number
  updated_at: Timestamp
  updated_by?: string
  
  // Version history
  version_history?: PlanVersion[]
  
  // Status
  is_active: boolean
  is_visible: boolean
  can_subscribe: boolean
  
  // Metadata
  created_at: Timestamp
  created_by?: string
  deleted_at?: Timestamp
  deleted_by?: string
  replaced_by?: string
}

export interface PlanVersion {
  version: number
  searches_per_month: number
  exports_per_month?: number
  ai_analysis_per_month?: number
  updated_at: string
  updated_by?: string
}

export interface UserPlan {
  user_id: string
  plan_id: string
  plan_version: number
  
  // Quotas (sincronizadas do plano)
  searches_limit: number
  exports_limit?: number
  ai_analysis_limit?: number
  
  // Usage
  searchesUsed: number
  exports_used?: number
  ai_analysis_used?: number
  
  // Period
  usage_period_start: string
  usage_period_end: string
  
  // Subscription
  status: 'active' | 'canceled' | 'expired'
  started_at: Timestamp
  expires_at?: Timestamp
  
  // Sync control
  last_synced_at: Timestamp
  needs_sync: boolean
  
  // Metadata
  created_at: Timestamp
  updated_at: Timestamp
  lastSearchAt?: Timestamp
}

export interface PlanMigration {
  id: string
  type: 'plan_update' | 'plan_deletion' | 'manual'
  
  // Source & Target
  from_plan_id: string
  from_version?: number
  to_plan_id: string
  to_version?: number
  
  // Changes
  changes?: Record<string, { from: any; to: any }>
  
  // Execution
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'partial'
  affected_users: number
  migrated_users: number
  failed_users: number
  
  // Metadata
  created_at: Timestamp
  created_by: string
  started_at?: Timestamp
  completed_at?: Timestamp
  
  // Log
  migration_log?: MigrationLogEntry[]
}

export interface MigrationLogEntry {
  user_id: string
  status: 'success' | 'failed'
  error?: string
  timestamp: string
}

// ============================================
// PLAN OPERATIONS
// ============================================

/**
 * Get all active plans
 */
export async function getPlans(): Promise<Plan[]> {
  try {
    const plansRef = collection(db, 'plans')
    const snapshot = await getDocs(query(plansRef, where('is_active', '==', true)))
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Plan))
  } catch (error) {
    console.error('Error getting plans:', error)
    return []
  }
}

/**
 * Get plan by ID
 */
export async function getPlan(planId: string): Promise<Plan | null> {
  try {
    const planRef = doc(db, 'plans', planId)
    const planSnap = await getDoc(planRef)
    
    if (!planSnap.exists()) {
      return null
    }
    
    return {
      id: planSnap.id,
      ...planSnap.data()
    } as Plan
  } catch (error) {
    console.error('Error getting plan:', error)
    return null
  }
}

/**
 * Update plan and sync all users
 */
export async function updatePlan(
  planId: string,
  updates: Partial<Plan>,
  currentUserId: string
): Promise<{ success: boolean; migrationId?: string; error?: string }> {
  try {
    console.log(`🔄 Updating plan ${planId}...`)
    
    // 1. Get current plan
    const planRef = doc(db, 'plans', planId)
    const planSnap = await getDoc(planRef)
    
    if (!planSnap.exists()) {
      return { success: false, error: 'Plan not found' }
    }
    
    const currentPlan = planSnap.data() as Plan
    const newVersion = (currentPlan.version || 1) + 1
    
    // 2. Calculate changes
    const changes: Record<string, { from: any; to: any }> = {}
    if (updates.searches_per_month !== undefined && updates.searches_per_month !== currentPlan.searches_per_month) {
      changes.searches_per_month = { from: currentPlan.searches_per_month, to: updates.searches_per_month }
    }
    if (updates.exports_per_month !== undefined && updates.exports_per_month !== currentPlan.exports_per_month) {
      changes.exports_per_month = { from: currentPlan.exports_per_month, to: updates.exports_per_month }
    }
    if (updates.ai_analysis_per_month !== undefined && updates.ai_analysis_per_month !== currentPlan.ai_analysis_per_month) {
      changes.ai_analysis_per_month = { from: currentPlan.ai_analysis_per_month, to: updates.ai_analysis_per_month }
    }
    
    // Se não há mudanças em quotas, apenas atualizar metadata
    if (Object.keys(changes).length === 0) {
      await updateDoc(planRef, {
        ...updates,
        updated_at: serverTimestamp(),
        updated_by: currentUserId
      })
      
      console.log('✅ Plan updated (no quota changes)')
      return { success: true }
    }
    
    // 3. Update plan with versioning
    await updateDoc(planRef, {
      ...updates,
      version: newVersion,
      updated_at: serverTimestamp(),
      updated_by: currentUserId,
      version_history: arrayUnion({
        version: currentPlan.version || 1,
        searches_per_month: currentPlan.searches_per_month,
        exports_per_month: currentPlan.exports_per_month,
        ai_analysis_per_month: currentPlan.ai_analysis_per_month,
        updated_at: currentPlan.updated_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        updated_by: currentPlan.updated_by
      })
    })
    
    console.log('✅ Plan updated to version', newVersion)
    
    // 4. Create migration record
    const migrationRef = doc(collection(db, 'plan_migrations'))
    const migrationId = migrationRef.id
    
    await setDoc(migrationRef, {
      id: migrationId,
      type: 'plan_update',
      from_plan_id: planId,
      from_version: currentPlan.version || 1,
      to_plan_id: planId,
      to_version: newVersion,
      changes,
      status: 'pending',
      affected_users: 0,
      migrated_users: 0,
      failed_users: 0,
      created_at: serverTimestamp(),
      created_by: currentUserId
    })
    
    console.log('📝 Migration record created:', migrationId)
    
    // 5. Execute migration (background)
    executeMigration(migrationId).catch(err => {
      console.error('Migration error:', err)
    })
    
    return { success: true, migrationId }
    
  } catch (error: any) {
    console.error('Error updating plan:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Execute migration (sync users to new plan version)
 */
export async function executeMigration(migrationId: string): Promise<void> {
  try {
    console.log(`🚀 Executing migration ${migrationId}...`)
    
    // 1. Get migration
    const migrationRef = doc(db, 'plan_migrations', migrationId)
    const migrationSnap = await getDoc(migrationRef)
    
    if (!migrationSnap.exists()) {
      throw new Error('Migration not found')
    }
    
    const migration = migrationSnap.data() as PlanMigration
    
    // 2. Mark as in_progress
    await updateDoc(migrationRef, {
      status: 'in_progress',
      started_at: serverTimestamp()
    })
    
    // 3. Get all users of this plan
    const userPlansQuery = query(
      collection(db, 'userPlans'),
      where('plan_id', '==', migration.from_plan_id)
    )
    const snapshot = await getDocs(userPlansQuery)
    
    console.log(`📊 Found ${snapshot.size} users to migrate`)
    
    // 4. Get updated plan data
    const updatedPlan = await getPlan(migration.to_plan_id)
    if (!updatedPlan) {
      throw new Error('Target plan not found')
    }
    
    // 5. Migrate users in batches (500 per batch)
    const batches: any[] = []
    let batch = writeBatch(db)
    let count = 0
    let migrated = 0
    let failed = 0
    const log: MigrationLogEntry[] = []
    
    for (const userDoc of snapshot.docs) {
      try {
        batch.update(userDoc.ref, {
          plan_id: migration.to_plan_id,
          plan_version: migration.to_version || updatedPlan.version,
          searches_limit: updatedPlan.searches_per_month,
          exports_limit: updatedPlan.exports_per_month,
          ai_analysis_limit: updatedPlan.ai_analysis_per_month,
          last_synced_at: serverTimestamp(),
          needs_sync: false,
          updated_at: serverTimestamp()
        })
        
        count++
        migrated++
        
        log.push({
          user_id: userDoc.id,
          status: 'success',
          timestamp: new Date().toISOString()
        })
        
        if (count === 500) {
          batches.push(batch.commit())
          batch = writeBatch(db)
          count = 0
        }
        
      } catch (error: any) {
        failed++
        log.push({
          user_id: userDoc.id,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString()
        })
      }
    }
    
    // Commit remaining
    if (count > 0) {
      batches.push(batch.commit())
    }
    
    await Promise.all(batches)
    
    // 6. Update migration status
    await updateDoc(migrationRef, {
      status: failed > 0 ? 'partial' : 'completed',
      affected_users: snapshot.size,
      migrated_users: migrated,
      failed_users: failed,
      completed_at: serverTimestamp(),
      migration_log: log
    })
    
    console.log(`✅ Migration complete: ${migrated}/${snapshot.size} users migrated`)
    
  } catch (error) {
    console.error('Error executing migration:', error)
    
    // Mark as failed
    const migrationRef = doc(db, 'plan_migrations', migrationId)
    await updateDoc(migrationRef, {
      status: 'failed',
      completed_at: serverTimestamp()
    })
  }
}

/**
 * Delete plan (requires target plan for user migration)
 */
export async function deletePlan(
  planId: string,
  targetPlanId: string,
  currentUserId: string
): Promise<{ success: boolean; migrationId?: string; error?: string }> {
  try {
    console.log(`🗑️ Deleting plan ${planId}, migrating to ${targetPlanId}...`)
    
    // 1. Check if users exist
    const userPlansQuery = query(
      collection(db, 'userPlans'),
      where('plan_id', '==', planId)
    )
    const snapshot = await getDocs(userPlansQuery)
    
    if (snapshot.size > 0 && !targetPlanId) {
      return { 
        success: false, 
        error: `Cannot delete plan with ${snapshot.size} active users. Provide target plan for migration.` 
      }
    }
    
    // 2. Create migration
    const migrationRef = doc(collection(db, 'plan_migrations'))
    const migrationId = migrationRef.id
    
    await setDoc(migrationRef, {
      id: migrationId,
      type: 'plan_deletion',
      from_plan_id: planId,
      to_plan_id: targetPlanId,
      status: 'pending',
      affected_users: snapshot.size,
      migrated_users: 0,
      failed_users: 0,
      created_at: serverTimestamp(),
      created_by: currentUserId
    })
    
    // 3. Execute migration
    if (snapshot.size > 0) {
      await executeMigration(migrationId)
    }
    
    // 4. Deactivate plan (don't delete!)
    const planRef = doc(db, 'plans', planId)
    await updateDoc(planRef, {
      is_active: false,
      is_visible: false,
      can_subscribe: false,
      replaced_by: targetPlanId,
      deleted_at: serverTimestamp(),
      deleted_by: currentUserId
    })
    
    console.log('✅ Plan deactivated and users migrated')
    
    return { success: true, migrationId }
    
  } catch (error: any) {
    console.error('Error deleting plan:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get user count for plan
 */
export async function getPlanUserCount(planId: string): Promise<number> {
  try {
    const userPlansQuery = query(
      collection(db, 'userPlans'),
      where('plan_id', '==', planId)
    )
    const snapshot = await getDocs(userPlansQuery)
    return snapshot.size
  } catch (error) {
    console.error('Error getting user count:', error)
    return 0
  }
}

/**
 * Get migration status
 */
export async function getMigration(migrationId: string): Promise<PlanMigration | null> {
  try {
    const migrationRef = doc(db, 'plan_migrations', migrationId)
    const migrationSnap = await getDoc(migrationRef)
    
    if (!migrationSnap.exists()) {
      return null
    }
    
    return migrationSnap.data() as PlanMigration
  } catch (error) {
    console.error('Error getting migration:', error)
    return null
  }
}

// ============================================
// CLEANUP UTILITIES
// ============================================

/**
 * Clean duplicate plans (keep most recent)
 */
export async function cleanDuplicatePlans(currentUserId: string): Promise<{
  cleaned: number
  migrated_users: number
  errors: string[]
}> {
  try {
    console.log('🧹 Cleaning duplicate plans...')
    
    const plansSnapshot = await getDocs(collection(db, 'plans'))
    
    // Group by name (case-insensitive)
    const plansByName: Record<string, Plan[]> = {}
    
    plansSnapshot.forEach(doc => {
      const plan = { id: doc.id, ...doc.data() } as Plan
      const name = plan.name.toLowerCase()
      
      if (!plansByName[name]) {
        plansByName[name] = []
      }
      
      plansByName[name].push(plan)
    })
    
    let cleaned = 0
    let migratedUsers = 0
    const errors: string[] = []
    
    // Process duplicates
    for (const [name, plans] of Object.entries(plansByName)) {
      if (plans.length === 1) {
        console.log(`✅ ${name}: unique, OK`)
        continue
      }
      
      console.log(`⚠️ ${name}: ${plans.length} duplicates found`)
      
      // Sort by updated_at (most recent first)
      plans.sort((a, b) => {
        const aTime = a.updated_at?.toMillis?.() || 0
        const bTime = b.updated_at?.toMillis?.() || 0
        return bTime - aTime
      })
      
      const keep = plans[0]
      const remove = plans.slice(1)
      
      console.log(`  ✅ Keeping: ${keep.id} (${keep.searches_per_month} searches)`)
      
      // Migrate users from old plans
      for (const old of remove) {
        try {
          const result = await deletePlan(old.id, keep.id, currentUserId)
          
          if (result.success) {
            const migration = await getMigration(result.migrationId!)
            migratedUsers += migration?.migrated_users || 0
            cleaned++
            console.log(`  ✅ Migrated users from ${old.id}`)
          } else {
            errors.push(`Failed to migrate ${old.id}: ${result.error}`)
          }
          
        } catch (error: any) {
          errors.push(`Error migrating ${old.id}: ${error.message}`)
        }
      }
    }
    
    console.log('🎉 Cleanup complete!')
    
    return { cleaned, migrated_users: migratedUsers, errors }
    
  } catch (error: any) {
    console.error('Error cleaning duplicate plans:', error)
    return { cleaned: 0, migrated_users: 0, errors: [error.message] }
  }
}

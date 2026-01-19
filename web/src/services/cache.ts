/**
 * Firestore Cache Service - Optimized for Millions of Molecules
 * 
 * Strategy:
 * 1. Hash-based index for O(1) lookups
 * 2. Separate index and data collections
 * 3. Never blocks polling - cache check happens BEFORE calling API
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SearchResult } from '@/services/railway'

/**
 * Generate cache key hash
 * Format: md5(molecule_lowercase + countries_sorted)
 */
function generateCacheHash(molecule: string, countries: string[]): string {
  const normalized = molecule.toLowerCase().trim()
  const sorted = [...countries].sort().join(',')
  const key = `${normalized}_${sorted}`
  
  // Simple hash function (can use crypto.subtle.digest for production)
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Check if search exists in cache (FAST - index only)
 */
export async function checkCache(
  molecule: string,
  countries: string[]
): Promise<SearchResult | null> {
  try {
    const hash = generateCacheHash(molecule, countries)
    console.log('🔍 Checking cache with hash:', hash)
    
    // Check index first (small document, fast)
    const indexRef = doc(db, 'patent_cache_index', hash)
    const indexSnap = await getDoc(indexRef)
    
    if (!indexSnap.exists()) {
      console.log('❌ Cache MISS - not in index')
      return null
    }
    
    const indexData = indexSnap.data()
    console.log('✅ Found in index, loading data...')
    
    // Load full result
    const dataRef = doc(db, 'patent_cache_data', hash)
    const dataSnap = await getDoc(dataRef)
    
    if (!dataSnap.exists()) {
      console.error('⚠️ Index exists but data missing! Cleaning up...')
      // TODO: Clean orphaned index
      return null
    }
    
    const result = dataSnap.data().result as SearchResult
    
    console.log('✅ Cache HIT:', {
      molecule: indexData.molecule_normalized,
      lastSearched: indexData.last_searched.toDate(),
      patents: result.patent_discovery.summary.total_patents
    })
    
    return result
    
  } catch (error) {
    console.error('❌ Cache check error:', error)
    return null
  }
}

/**
 * Save search to cache (after API completes)
 */
export async function saveToCache(
  molecule: string,
  countries: string[],
  result: SearchResult
): Promise<void> {
  try {
    const hash = generateCacheHash(molecule, countries)
    const now = Timestamp.now()
    
    console.log('💾 Saving to cache with hash:', hash)
    
    // Save index (small, fast)
    const indexRef = doc(db, 'patent_cache_index', hash)
    await setDoc(indexRef, {
      molecule_normalized: molecule.toLowerCase().trim(),
      countries_sorted: [...countries].sort(),
      last_searched: now,
      total_patents: result.patent_discovery.summary.total_patents,
      hash: hash
    })
    
    // Save full data (large)
    const dataRef = doc(db, 'patent_cache_data', hash)
    await setDoc(dataRef, {
      result: result,
      cached_at: now
    })
    
    console.log('✅ Saved to cache successfully')
    
  } catch (error) {
    console.error('❌ Cache save error:', error)
    // Don't throw - cache failure shouldn't break search
  }
}

/**
 * Save search to user history (separate from cache)
 */
export async function saveToUserHistory(
  userId: string,
  jobId: string,
  molecule: string,
  countries: string[],
  totalPatents: number
): Promise<void> {
  try {
    const historyRef = doc(db, 'users', userId, 'search_history', jobId)
    await setDoc(historyRef, {
      molecule,
      countries,
      totalPatents,
      searchedAt: Timestamp.now(),
      jobId
    })
    
    console.log('💾 Saved to user history')
    
  } catch (error) {
    console.error('❌ History save error:', error)
  }
}


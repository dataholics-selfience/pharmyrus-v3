/**
 * Firestore Patent Cache Service - Optimized for Scale
 * 
 * Architecture for millions of molecules:
 * 
 * Collection: patent_cache_index (light)
 * ├── {cache_key} → {molecule, countries, lastUpdated, totalPatents}
 * 
 * Collection: patent_cache_data (heavy)
 * ├── {cache_key} → {full SearchResult}
 * 
 * Cache key format: "molecule_BR,US" (lowercase, sorted)
 */

import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { SearchResult } from '@/services/railway'

interface CacheIndex {
  molecule: string
  countries: string[]
  lastUpdated: Timestamp
  totalPatents: number
  searchCount: number
}

/**
 * Generate cache key (deterministic)
 */
function getCacheKey(molecule: string, countries: string[]): string {
  const sortedCountries = [...countries].sort().join(',')
  return `${molecule.toLowerCase().replace(/\s+/g, '_')}_${sortedCountries}`
}

/**
 * Check if cache exists (FAST - only reads index)
 */
export async function hasCachedResult(
  molecule: string, 
  countries: string[]
): Promise<boolean> {
  try {
    const cacheKey = getCacheKey(molecule, countries)
    console.log('🔍 Checking cache in patent_cache_index:', cacheKey)
    
    const indexRef = doc(db, 'patent_cache_index', cacheKey)
    const indexSnap = await getDoc(indexRef)
    
    if (!indexSnap.exists()) {
      console.log('❌ Cache MISS - not found in patent_cache_index')
      return false
    }
    
    const index = indexSnap.data() as CacheIndex
    
    // Check if cache is fresh (< 30 days)
    const now = Date.now()
    const cacheAge = now - index.lastUpdated.toMillis()
    const maxAge = 30 * 24 * 60 * 60 * 1000 // 30 days
    
    if (cacheAge > maxAge) {
      console.log('⏰ Cache EXPIRED (>30 days old)')
      return false
    }
    
    console.log('✅ Cache HIT!', {
      key: cacheKey,
      usedTimes: index.searchCount,
      patents: index.totalPatents,
      ageInDays: Math.floor(cacheAge / (24 * 60 * 60 * 1000))
    })
    return true
    
  } catch (error) {
    console.error('Error checking cache:', error)
    return false
  }
}

/**
 * Get cached result (only if exists)
 */
export async function getCachedResult(
  molecule: string, 
  countries: string[]
): Promise<SearchResult | null> {
  try {
    const cacheKey = getCacheKey(molecule, countries)
    
    // Read from data collection
    const dataRef = doc(db, 'patent_cache_data', cacheKey)
    const dataSnap = await getDoc(dataRef)
    
    if (!dataSnap.exists()) {
      return null
    }
    
    const result = dataSnap.data() as SearchResult
    
    // Increment search count in index (async, don't wait)
    incrementCacheUsage(cacheKey).catch(err => 
      console.error('Failed to increment cache usage:', err)
    )
    
    return result
    
  } catch (error) {
    console.error('Error getting cached result:', error)
    return null
  }
}

/**
 * Save result to cache (2 writes: index + data)
 */
export async function saveToCacheFirestore(
  molecule: string,
  countries: string[],
  result: SearchResult
): Promise<void> {
  try {
    const cacheKey = getCacheKey(molecule, countries)
    const now = Timestamp.now()
    
    console.log('💾 Saving to Firestore cache:')
    console.log('  📍 Collection 1: patent_cache_index')
    console.log('  📍 Collection 2: patent_cache_data')
    console.log('  🔑 Key:', cacheKey)
    
    // 1. Save index (light metadata)
    const index: CacheIndex = {
      molecule,
      countries,
      lastUpdated: now,
      totalPatents: result.patent_discovery?.summary?.total_patents || 0,
      searchCount: 1
    }
    
    await setDoc(doc(db, 'patent_cache_index', cacheKey), index)
    console.log('  ✅ Saved to patent_cache_index')
    
    // 2. Save full data (heavy payload)
    await setDoc(doc(db, 'patent_cache_data', cacheKey), result)
    console.log('  ✅ Saved to patent_cache_data')
    
    console.log('💾 Cache complete!', `${result.patent_discovery?.summary?.total_patents || 0} patents`)
    
  } catch (error) {
    console.error('Error saving to cache:', error)
    // Don't throw - cache failure shouldn't break search
  }
}

/**
 * Increment usage counter (fire-and-forget)
 */
async function incrementCacheUsage(cacheKey: string): Promise<void> {
  try {
    const indexRef = doc(db, 'patent_cache_index', cacheKey)
    const indexSnap = await getDoc(indexRef)
    
    if (indexSnap.exists()) {
      const current = indexSnap.data() as CacheIndex
      await setDoc(indexRef, {
        ...current,
        searchCount: current.searchCount + 1
      })
    }
  } catch (error) {
    console.error('Error incrementing cache usage:', error)
  }
}

/**
 * Save search to user history AND update lastSearch
 */
export async function saveSearchToHistory(
  userId: string,
  jobId: string,
  molecule: string,
  brand: string,
  countries: string[],
  totalPatents: number
): Promise<void> {
  try {
    // 1. Save to search_history
    await setDoc(doc(db, 'users', userId, 'search_history', jobId), {
      molecule,
      brand,
      countries,
      totalPatents,
      searchedAt: Timestamp.now()
    })
    
    // 2. Update lastSearch in user document
    await setDoc(doc(db, 'users', userId), {
      lastSearch: {
        molecule,
        brand,
        countries,
        searchedAt: Timestamp.now()
      }
    }, { merge: true })
    
    console.log('💾 Saved to user history + updated lastSearch')
    
  } catch (error) {
    console.error('Error saving to history:', error)
  }
}

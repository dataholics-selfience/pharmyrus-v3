/**
 * AI Analysis Cache Service
 * 
 * Gerencia cache de análises IA no Firestore para evitar
 * chamadas desnecessárias à API Groq
 */

import { 
  doc, 
  getDoc, 
  setDoc, 
  Timestamp 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'

const CACHE_COLLECTION = 'ai_analysis_cache'
const CACHE_EXPIRY_DAYS = 30 // Análises expiram após 30 dias

export interface AIAnalysisCache {
  jobId: string
  moleculeName: string
  analysis: string
  tokensUsed: number
  generatedAt: Timestamp
  expiresAt: Timestamp
  model: string
  metadata?: {
    totalPatents?: number
    cliffStatus?: string
    firstExpiration?: string
    countries?: string[]
    sources?: string[]
  }
}

export interface PatentAIAnalysisCache {
  patentNumber: string
  jobId: string
  analysis: string
  tokensUsed: number
  generatedAt: Timestamp
  expiresAt: Timestamp
  model: string
  metadata?: {
    title?: string
    applicants?: string[]
    expirationDate?: string
  }
}

/**
 * Get portfolio analysis from cache
 */
export async function getPortfolioAnalysisCache(
  jobId: string
): Promise<AIAnalysisCache | null> {
  try {
    const docRef = doc(db, CACHE_COLLECTION, `portfolio_${jobId}`)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    const data = docSnap.data() as AIAnalysisCache
    
    // Check if expired
    const now = Timestamp.now()
    if (data.expiresAt && data.expiresAt.seconds < now.seconds) {
      console.log(`[AI Cache] Portfolio analysis expired for job ${jobId}`)
      return null
    }
    
    console.log(`[AI Cache] ✅ Retrieved portfolio analysis for job ${jobId}`)
    return data
  } catch (error) {
    console.error('[AI Cache] Error getting portfolio analysis:', error)
    return null
  }
}

/**
 * Save portfolio analysis to cache
 */
export async function savePortfolioAnalysisCache(
  jobId: string,
  moleculeName: string,
  analysis: string,
  tokensUsed: number,
  model: string,
  metadata?: AIAnalysisCache['metadata']
): Promise<void> {
  try {
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromDate(
      new Date(now.toDate().getTime() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    )
    
    const cacheData: AIAnalysisCache = {
      jobId,
      moleculeName,
      analysis,
      tokensUsed,
      generatedAt: now,
      expiresAt,
      model,
      metadata
    }
    
    const docRef = doc(db, CACHE_COLLECTION, `portfolio_${jobId}`)
    await setDoc(docRef, cacheData)
    
    console.log(`[AI Cache] ✅ Saved portfolio analysis for job ${jobId}`)
  } catch (error) {
    console.error('[AI Cache] Error saving portfolio analysis:', error)
    throw error
  }
}

/**
 * Get patent analysis from cache
 */
export async function getPatentAnalysisCache(
  jobId: string,
  patentNumber: string
): Promise<PatentAIAnalysisCache | null> {
  try {
    // Sanitize patent number for use as document ID
    const sanitizedNumber = patentNumber.replace(/[/\\]/g, '_')
    const docRef = doc(db, CACHE_COLLECTION, `patent_${jobId}_${sanitizedNumber}`)
    const docSnap = await getDoc(docRef)
    
    if (!docSnap.exists()) {
      return null
    }
    
    const data = docSnap.data() as PatentAIAnalysisCache
    
    // Check if expired
    const now = Timestamp.now()
    if (data.expiresAt && data.expiresAt.seconds < now.seconds) {
      console.log(`[AI Cache] Patent analysis expired for ${patentNumber}`)
      return null
    }
    
    console.log(`[AI Cache] ✅ Retrieved patent analysis for ${patentNumber}`)
    return data
  } catch (error) {
    console.error('[AI Cache] Error getting patent analysis:', error)
    return null
  }
}

/**
 * Save patent analysis to cache
 */
export async function savePatentAnalysisCache(
  jobId: string,
  patentNumber: string,
  analysis: string,
  tokensUsed: number,
  model: string,
  metadata?: PatentAIAnalysisCache['metadata']
): Promise<void> {
  try {
    const now = Timestamp.now()
    const expiresAt = Timestamp.fromDate(
      new Date(now.toDate().getTime() + CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    )
    
    const cacheData: PatentAIAnalysisCache = {
      patentNumber,
      jobId,
      analysis,
      tokensUsed,
      generatedAt: now,
      expiresAt,
      model,
      metadata
    }
    
    // Sanitize patent number for use as document ID
    const sanitizedNumber = patentNumber.replace(/[/\\]/g, '_')
    const docRef = doc(db, CACHE_COLLECTION, `patent_${jobId}_${sanitizedNumber}`)
    await setDoc(docRef, cacheData)
    
    console.log(`[AI Cache] ✅ Saved patent analysis for ${patentNumber}`)
  } catch (error) {
    console.error('[AI Cache] Error saving patent analysis:', error)
    throw error
  }
}

/**
 * Check if portfolio analysis exists in cache
 */
export async function hasPortfolioAnalysisCache(jobId: string): Promise<boolean> {
  const cache = await getPortfolioAnalysisCache(jobId)
  return cache !== null
}

/**
 * Check if patent analysis exists in cache
 */
export async function hasPatentAnalysisCache(
  jobId: string,
  patentNumber: string
): Promise<boolean> {
  const cache = await getPatentAnalysisCache(jobId, patentNumber)
  return cache !== null
}

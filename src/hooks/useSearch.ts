import { useState, useCallback } from 'react'
import { 
  startSearch, 
  pollSearchStatus, 
  SearchRequest, 
  SearchJob, 
  SearchResult 
} from '@/services/railway'
import { 
  hasCachedResult, 
  getCachedResult, 
  saveToCacheFirestore, 
  saveSearchToHistory 
} from '@/services/cacheFirestore'
import { useAuth } from './useAuth'

/**
 * Hook for managing patent search lifecycle
 * 
 * Features:
 * - Start search
 * - Poll status
 * - Save to Firestore
 * - Track usage quota
 */
export function useSearch() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchResult | null>(null)

  const executeSearch = useCallback(async (request: SearchRequest) => {
    setLoading(true)
    setError(null)
    setProgress(0)
    setCurrentStep('Verificando cache...')

    try {
      const countries = request.countries || ['BR']
      
      // 1. CHECK CACHE FIRST (2 fast Firestore reads)
      console.log('🔍 Checking cache:', request.molecule, countries)
      
      const hasCache = await hasCachedResult(request.molecule, countries)
      
      if (hasCache) {
        console.log('✅ Cache exists, loading...')
        const cachedResult = await getCachedResult(request.molecule, countries)
        
        if (cachedResult) {
          console.log('✅ Using cached result!')
          setResult(cachedResult)
          setProgress(100)
          setCurrentStep('Carregado do cache!')
          setLoading(false)
          
          // Save to user history (só se tiver user)
          if (user) {
            await saveSearchToHistory(
              user.uid,
              `cached_${Date.now()}`,
              request.molecule,
              request.brand || '',
              countries,
              cachedResult.patent_discovery?.summary?.total_patents || 0
            )
          }
          
          return cachedResult
        }
      }
      
      console.log('❌ Cache miss - calling API')
      
      // 2. CACHE MISS - Start API search (UNCHANGED working code)
      setCurrentStep('Iniciando busca...')
      
      console.log('🔍 Starting search:', request)
      const jobId = await startSearch(request)
      console.log('✅ Job ID:', jobId)

      setCurrentStep('Buscando patentes...')

      // 3. Poll status (UNCHANGED - this is the working polling code)
      const result = await pollSearchStatus(
        jobId,
        (status: SearchJob) => {
          console.log('📊 Progress:', status)
          setProgress(status.progress || 0)
          setCurrentStep(status.step || 'Processando...')
        },
        20000 // 20s - don't change this!
      )

      console.log('✅ Search complete:', result)
      setResult(result)
      setProgress(100)
      setCurrentStep('Busca concluída!')

      // 4. SAVE TO CACHE (after successful completion)
      console.log('💾 Saving to cache...')
      await saveToCacheFirestore(request.molecule, countries, result)
      
      // 5. SAVE TO USER HISTORY (só se tiver user)
      if (user) {
        await saveSearchToHistory(
          user.uid,
          jobId,
          request.molecule,
          request.brand || '',
          countries,
          result.patent_discovery?.summary?.total_patents || 0
        )
      }

      return result
    } catch (err: any) {
      console.error('❌ Search error:', err)
      setError(err.message || 'Erro ao buscar patentes')
      throw err
    } finally {
      setLoading(false)
    }
  }, [user])

  return {
    executeSearch,
    loading,
    progress,
    currentStep,
    error,
    result,
  }
}

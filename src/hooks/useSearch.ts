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
import { 
  canUserSearch, 
  incrementSearchUsage 
} from '@/services/plans'
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
    setCurrentStep('Verificando limite...')

    try {
      const countries = request.countries || ['BR']
      
      // 1. VALIDAR QUOTA PRIMEIRO (ANTES de tudo!)
      if (user) {
        console.log('🔍 Checking user quota...')
        const canSearch = await canUserSearch(user.uid)
        
        if (!canSearch) {
          console.error('❌ Quota exceeded!')
          const errorMsg = 'Limite de buscas atingido! Faça upgrade do seu plano.'
          setError(errorMsg)
          setLoading(false)
          
          // Redirecionar para página de planos IMEDIATAMENTE
          console.log('🔀 Redirecionando para /plans...')
          window.location.href = '/plans'
          
          throw new Error(errorMsg)
        }
        
        console.log('✅ Quota OK, proceeding...')
      }
      
      setCurrentStep('Verificando cache...')
      
      // 2. CHECK CACHE (após validar quota)
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
          
          // ✅ CACHE CONTA NA QUOTA (revertido conforme solicitado)
          if (user) {
            console.log('📊 Incrementing usage (cache)...')
            await incrementSearchUsage(user.uid, `cached_${Date.now()}`)
          }
          
          // Save to user history
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
      
      // 3. CACHE MISS - Start API search
      setCurrentStep('Iniciando busca...')
      
      console.log('🔍 Starting search:', request)
      const jobId = await startSearch(request)
      console.log('✅ Job ID:', jobId)

      setCurrentStep('Buscando patentes...')

      // 4. Poll status (ENHANCED with queue support v30.4)
      const result = await pollSearchStatus(
        jobId,
        (status: SearchJob) => {
          console.log('📊 Progress:', status)
          
          // Determinar mensagem a mostrar
          let displayStep = status.step || 'Processando...'
          
          // NOVO: Detectar se está na fila
          if (status.queue_position && status.queue_position > 0) {
            // NA FILA - mostrar posição
            displayStep = `⏳ Aguardando fila de processamento (posição ${status.queue_position})`
            console.log(`⏳ Na fila - posição ${status.queue_position}`)
          } else if (status.status === 'queued' && !status.queue_position) {
            // Queued mas sem posição específica
            displayStep = '⏳ Aguardando fila de processamento...'
            console.log('⏳ Na fila - aguardando...')
          }
          
          setProgress(status.progress || 0)
          setCurrentStep(displayStep)
        },
        20000 // 20s - don't change this!
      )

      console.log('✅ Search complete:', result)
      setResult(result)
      setProgress(100)
      setCurrentStep('Busca concluída!')

      // 5. SAVE TO CACHE (after successful completion)
      console.log('💾 Saving to cache...')
      await saveToCacheFirestore(request.molecule, countries, result)
      
      // 6. INCREMENT USAGE COUNTER (busca nova)
      if (user) {
        console.log('📊 Incrementing usage (new search)...')
        await incrementSearchUsage(user.uid, jobId)
      }
      
      // 7. SAVE TO USER HISTORY (só se tiver user)
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

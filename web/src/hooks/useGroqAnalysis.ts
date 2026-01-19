import { useState, useCallback } from 'react'
import { 
  getPortfolioAnalysisCache, 
  savePortfolioAnalysisCache,
  getPatentAnalysisCache,
  savePatentAnalysisCache
} from '@/services/aiAnalysisCache'

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

interface Patent {
  patent_number: string
  title: string
  applicants: string[]
  expiration_date: string
  patent_status?: string
  abstract?: string
  confidence_tier?: string
}

interface AnalysisResult {
  content: string
  model: string
  tokens_used: number
  fromCache?: boolean
}

export function useGroqAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get API key from environment
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  /**
   * Executive Summary Analysis (with Firestore cache)
   */
  const analyzePortfolio = useCallback(async (
    moleculeName: string,
    totalPatents: number,
    cliffStatus: string,
    firstExpiration: string,
    countries: string[],
    sources: string[],
    jobId?: string
  ): Promise<AnalysisResult | null> => {
    if (!apiKey) {
      setError('Groq API key not configured')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Check cache first if jobId provided
      if (jobId) {
        console.log(`[Groq] Checking cache for portfolio ${jobId}...`)
        const cached = await getPortfolioAnalysisCache(jobId)
        
        if (cached) {
          console.log(`[Groq] ✅ Using cached portfolio analysis`)
          setLoading(false)
          return {
            content: cached.analysis,
            model: cached.model,
            tokens_used: cached.tokensUsed,
            fromCache: true
          }
        }
        
        console.log(`[Groq] No cache found, calling API...`)
      }

    const prompt = `Você é um especialista em propriedade intelectual farmacêutica. Analise o seguinte portfólio de patentes:

MOLÉCULA: ${moleculeName}
TOTAL DE PATENTES: ${totalPatents}
PATENT CLIFF STATUS: ${cliffStatus}
PRIMEIRA EXPIRAÇÃO: ${firstExpiration}
PAÍSES COM PROTEÇÃO: ${countries.join(', ')}
FONTES DE DADOS: ${sources.join(', ')}

Forneça uma análise executiva em português brasileiro de 2-3 parágrafos cobrindo:

1. **Risco de Patent Cliff**: Avalie a exposição temporal considerando a primeira expiração e o status atual.
2. **Força da Proteção IP**: Analise a cobertura geográfica e diversidade de fontes.
3. **Oportunidades de FTO**: Identifique janelas de oportunidade para entrada de genéricos.
4. **Recomendações Estratégicas**: Sugira próximos passos para análise mais aprofundada.

Seja objetivo, técnico e baseado nos dados fornecidos. Use linguagem profissional adequada para relatórios executivos.`

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Você é um consultor sênior de propriedade intelectual especializado em patentes farmacêuticas no Brasil. Responda sempre em português brasileiro profissional.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      
      const result: AnalysisResult = {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        tokens_used: data.usage?.total_tokens || 0,
        fromCache: false
      }
      
      // Save to cache if jobId provided
      if (jobId && result.content) {
        try {
          await savePortfolioAnalysisCache(
            jobId,
            moleculeName,
            result.content,
            result.tokens_used,
            result.model,
            {
              totalPatents,
              cliffStatus,
              firstExpiration,
              countries,
              sources
            }
          )
          console.log(`[Groq] ✅ Saved portfolio analysis to cache`)
        } catch (cacheError) {
          console.error('[Groq] Failed to save to cache:', cacheError)
          // Don't fail the request if cache save fails
        }
      }
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Groq API error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  /**
   * Individual Patent Analysis
   */
  const analyzePatent = useCallback(async (patent: Patent, jobId?: string): Promise<AnalysisResult | null> => {
    if (!apiKey) {
      setError('Groq API key not configured')
      return null
    }

    setLoading(true)
    setError(null)

    try {
      // Check cache first if jobId provided
      if (jobId) {
        console.log(`[Groq] Checking cache for patent ${patent.patent_number}...`)
        const cached = await getPatentAnalysisCache(jobId, patent.patent_number)
        
        if (cached) {
          console.log(`[Groq] ✅ Using cached patent analysis`)
          setLoading(false)
          return {
            content: cached.analysis,
            model: cached.model,
            tokens_used: cached.tokensUsed,
            fromCache: true
          }
        }
        
        console.log(`[Groq] No cache found, calling API...`)
      }

    const prompt = `Você é um especialista em análise de patentes farmacêuticas. Analise a seguinte patente:

NÚMERO: ${patent.patent_number}
TÍTULO: ${patent.title}
DEPOSITANTE(S): ${patent.applicants.join(', ')}
EXPIRAÇÃO: ${patent.expiration_date}
STATUS: ${patent.patent_status || 'Não informado'}
TIER DE CONFIANÇA: ${patent.confidence_tier || 'Não classificado'}

${patent.abstract ? `RESUMO:\n${patent.abstract.substring(0, 500)}...` : ''}

Forneça uma análise técnica em português brasileiro cobrindo:

1. **Importância Estratégica**: Qual o valor desta patente no contexto do portfólio?
2. **Amplitude das Reivindicações**: Com base no título, qual a provável cobertura?
3. **Risco de Invalidação**: Existem indicadores de fragilidade?
4. **Design-Arounds**: Há possibilidade de contornar a proteção?
5. **Recomendação FTO**: O que verificar antes de operar?

Seja técnico, preciso e objetivo. Limite a 3-4 parágrafos.`

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'Você é um advogado especialista em patentes farmacêuticas com experiência em análises FTO (Freedom to Operate) no Brasil. Seja preciso e técnico.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 800
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      
      const result: AnalysisResult = {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        tokens_used: data.usage?.total_tokens || 0,
        fromCache: false
      }
      
      // Save to cache if jobId provided
      if (jobId && result.content) {
        try {
          await savePatentAnalysisCache(
            jobId,
            patent.patent_number,
            result.content,
            result.tokens_used,
            result.model,
            {
              title: patent.title,
              applicants: patent.applicants,
              expirationDate: patent.expiration_date
            }
          )
          console.log(`[Groq] ✅ Saved patent analysis to cache`)
        } catch (cacheError) {
          console.error('[Groq] Failed to save to cache:', cacheError)
          // Don't fail the request if cache save fails
        }
      }
      
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('Groq API error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiKey])

  return {
    analyzePortfolio,
    analyzePatent,
    loading,
    error,
    isConfigured: !!apiKey
  }
}

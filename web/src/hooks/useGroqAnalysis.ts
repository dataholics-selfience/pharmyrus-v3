import { useState, useCallback } from 'react'

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
}

export function useGroqAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get API key from environment
  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  /**
   * Executive Summary Analysis
   */
  const analyzePortfolio = useCallback(async (
    moleculeName: string,
    totalPatents: number,
    cliffStatus: string,
    firstExpiration: string,
    countries: string[],
    sources: string[]
  ): Promise<AnalysisResult | null> => {
    if (!apiKey) {
      setError('Groq API key not configured')
      return null
    }

    setLoading(true)
    setError(null)

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
      
      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        tokens_used: data.usage?.total_tokens || 0
      }
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
  const analyzePatent = useCallback(async (patent: Patent): Promise<AnalysisResult | null> => {
    if (!apiKey) {
      setError('Groq API key not configured')
      return null
    }

    setLoading(true)
    setError(null)

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
      
      return {
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        tokens_used: data.usage?.total_tokens || 0
      }
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

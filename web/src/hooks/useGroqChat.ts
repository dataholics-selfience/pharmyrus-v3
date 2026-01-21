import { useState, useCallback } from 'react'
import { generateDrRootPrompt } from '@/lib/drRootPrompts'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export function useGroqChat(patentData: any) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  // Debug: Log patent data on initialization
  console.log('[Dr. Root] Initialized with patent data:', {
    hasData: !!patentData,
    allPatentsCount: patentData?.all_patents?.length || 0,
    metadata: patentData?.metadata
  })

  const sendMessage = useCallback(async (userMessage: string) => {
    if (!apiKey) {
      setError('Groq API key not configured')
      return
    }

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setError(null)

    try {
      // Build conversation history
      const conversationHistory = [
        ...messages.map(m => ({
          role: m.role,
          content: m.content
        })),
        {
          role: 'user' as const,
          content: userMessage
        }
      ]

      // Generate system prompt with patent data
      const systemPrompt = generateDrRootPrompt(patentData)
      
      console.log('[Dr. Root] System prompt generated:', {
        promptLength: systemPrompt.length,
        patentsInPrompt: (systemPrompt.match(/patentes/g) || []).length,
        hasAllPatents: systemPrompt.includes('Total de Patentes')
      })

      // Call Groq API
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile', // Best free model
          messages: [
            {
              role: 'system',
              content: systemPrompt // ← Use generated prompt
            },
            ...conversationHistory
          ],
          temperature: 0.3, // More deterministic for technical questions
          max_tokens: 2000,
          top_p: 0.9
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `API error: ${response.status}`)
      }

      const data = await response.json()
      const assistantContent = data.choices[0]?.message?.content || 'Desculpe, não consegui gerar uma resposta.'

      // Add assistant message
      const assistantMsg: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMsg])

    } catch (err) {
      console.error('Dr. Root error:', err)
      setError(err instanceof Error ? err.message : 'Erro ao processar mensagem')
      
      // Add error message
      const errorMsg: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua pergunta. Por favor, tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setLoading(false)
    }
  }, [apiKey, messages, patentData])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return {
    messages,
    sendMessage,
    clearChat,
    loading,
    error
  }
}

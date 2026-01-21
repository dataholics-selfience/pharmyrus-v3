import { useState } from 'react'

interface ValidationResult {
  correctedMolecule: string
  correctedBrand: string
  changes: {
    molecule: boolean
    brand: boolean
  }
  suggestions: string[]
}

/**
 * Hook para validar e corrigir inputs de busca usando Groq AI
 * 
 * Corrige:
 * - Traduções PT → EN
 * - Erros de digitação
 * - Variações de escrita
 * - Nomes comerciais incorretos
 */
export function useInputValidation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiKey = import.meta.env.VITE_GROQ_API_KEY

  const validateInputs = async (
    molecule: string,
    brand: string
  ): Promise<ValidationResult | null> => {
    if (!apiKey) {
      setError('Groq API key not configured')
      return null
    }

    if (!molecule.trim()) {
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const prompt = `Você é um assistente especializado em nomenclatura farmacêutica. Sua função é corrigir e normalizar nomes de moléculas e marcas comerciais.

INPUTS RECEBIDOS:
- Molécula: "${molecule}"
${brand ? `- Marca Comercial: "${brand}"` : ''}

INSTRUÇÕES:
1. **Nome da Molécula** (INN - International Nonproprietary Name):
   - Sempre retornar em INGLÊS
   - Corrigir erros de digitação
   - Normalizar variações (darolutamida → darolutamide)
   - Formato correto em minúsculas
   - Se não reconhecer, manter o input original

2. **Marca Comercial** (Brand Name):
   - Sempre retornar em INGLÊS
   - Corrigir erros de digitação
   - Normalizar variações (nubeqaa → nubeqa, nubeca → nubeqa)
   - Formato correto (primeira letra maiúscula)
   - Se não reconhecer, manter o input original

3. **Validações Críticas**:
   - Detectar se usuário trocou molécula por marca (ex: "nubeqa" no campo molécula)
   - Identificar traduções necessárias
   - Corrigir ortografia comum

EXEMPLOS:
Input: "darolutamida" → Output: "darolutamide"
Input: "darolumatide" → Output: "darolutamide"
Input: "darolutamid" → Output: "darolutamide"
Input: "nubeqaa" → Output: "Nubeqa"
Input: "nubeca" → Output: "Nubeqa"
Input: "aspirina" → Output: "aspirin"
Input: "paracetamol" → Output: "acetaminophen"
Input: "imatinibe" → Output: "imatinib"

RESPONDA APENAS EM JSON (sem markdown, sem \`\`\`):
{
  "molecule": "nome correto em inglês (minúsculas)",
  "brand": "nome correto em inglês (primeira letra maiúscula)",
  "molecule_changed": true/false,
  "brand_changed": true/false,
  "suggestions": ["explicação das mudanças, se houver"]
}

Se não tiver certeza, mantenha o original e indique em suggestions.`

      console.log('[Input Validation] Calling Groq...')

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a pharmaceutical nomenclature expert. Return ONLY valid JSON, no markdown.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1, // Low temperature for consistent corrections
          max_tokens: 500,
          response_format: { type: 'json_object' }
        })
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content || '{}'
      
      console.log('[Input Validation] Raw response:', content)

      // Parse response
      const parsed = JSON.parse(content)

      const result: ValidationResult = {
        correctedMolecule: parsed.molecule || molecule.toLowerCase(),
        correctedBrand: parsed.brand || brand,
        changes: {
          molecule: parsed.molecule_changed || false,
          brand: parsed.brand_changed || false
        },
        suggestions: parsed.suggestions || []
      }

      console.log('[Input Validation] Result:', result)

      return result

    } catch (err: any) {
      console.error('[Input Validation] Error:', err)
      setError(err.message || 'Validation failed')
      
      // Return original values on error
      return {
        correctedMolecule: molecule.toLowerCase(),
        correctedBrand: brand,
        changes: {
          molecule: false,
          brand: false
        },
        suggestions: ['Erro na validação. Usando valores originais.']
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    validateInputs,
    loading,
    error
  }
}

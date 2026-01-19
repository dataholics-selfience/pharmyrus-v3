import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  Bot, Zap, FileText
} from 'lucide-react'
import { useGroqAnalysis } from '@/hooks/useGroqAnalysis'

interface Patent {
  patent_number: string
  title: string
  applicants: string[]
  expiration_date: string
  patent_status?: string
  abstract?: string
  confidence_tier?: string
}

interface PatentAIAnalysisProps {
  patent: Patent
  jobId?: string
  autoLoad?: boolean
}

export function PatentAIAnalysis({
  patent,
  jobId,
  autoLoad = true
}: PatentAIAnalysisProps) {
  const { analyzePatent, loading, error, isConfigured } = useGroqAnalysis()
  
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [showFullText, setShowFullText] = useState(false)
  const [fromCache, setFromCache] = useState(false)

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && !hasLoaded && isConfigured && patent) {
      handleAnalyze()
    }
  }, [autoLoad, hasLoaded, isConfigured, patent])

  const handleAnalyze = async () => {
    const result = await analyzePatent(patent, jobId)

    if (result) {
      setAnalysis(result.content)
      setTokensUsed(result.tokens_used)
      setFromCache(result.fromCache || false)
      setHasLoaded(true)
    }
  }

  // Not configured
  if (!isConfigured) {
    return (
      <Card className="border-dashed border-amber-300 bg-amber-50/50">
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Análise AI não configurada</p>
              <p className="text-sm text-amber-600">
                Configure VITE_GROQ_API_KEY para habilitar análise inteligente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with analyze button */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Análise AI desta Patente</h3>
      </div>

      {/* Not yet loaded */}
      {!analysis && !loading && !error && (
        <div className="text-center py-8 bg-gradient-to-br from-primary/5 to-transparent rounded-lg border border-primary/10">
          <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground mb-4">
            Gere uma análise técnica desta patente usando IA
          </p>
          <Button onClick={handleAnalyze} className="gap-2">
            <Sparkles className="h-4 w-4" />
            Gerar Análise
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3 p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-lg border border-primary/10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Analisando patente com IA...</span>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-10/12" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-9/12" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-medium text-destructive">Erro na análise</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3"
                onClick={handleAnalyze}
              >
                <RefreshCw className="h-3 w-3 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analysis result */}
      {analysis && !loading && (
        <div className="space-y-4 p-4 bg-gradient-to-br from-primary/5 to-transparent rounded-lg border border-primary/10">
          <div className="prose prose-sm max-w-none">
            {analysis.split('\n\n').slice(0, showFullText ? undefined : 2).map((paragraph, idx) => (
              <p key={idx} className="text-sm leading-relaxed text-foreground mb-3">
                {paragraph.split('**').map((part, partIdx) => 
                  partIdx % 2 === 1 ? (
                    <strong key={partIdx} className="font-semibold text-primary">
                      {part}
                    </strong>
                  ) : (
                    part
                  )
                )}
              </p>
            ))}
            
            {/* Read more button */}
            {!showFullText && analysis.split('\n\n').length > 2 && (
              <button
                onClick={() => setShowFullText(true)}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-2"
              >
                Ler mais
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
            
            {showFullText && analysis.split('\n\n').length > 2 && (
              <button
                onClick={() => setShowFullText(false)}
                className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1 mt-2"
              >
                Ler menos
                <ChevronUp className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

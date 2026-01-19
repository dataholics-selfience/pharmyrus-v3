import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Sparkles, RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  Bot, Zap, FileText
} from 'lucide-react'
import { useGroqAnalysis } from '@/hooks/useGroqAnalysis'

interface AIAnalysisCardProps {
  moleculeName: string
  totalPatents: number
  cliffStatus: string
  firstExpiration: string
  countries: string[]
  sources: string[]
  autoLoad?: boolean
}

export function AIAnalysisCard({
  moleculeName,
  totalPatents,
  cliffStatus,
  firstExpiration,
  countries,
  sources,
  autoLoad = false
}: AIAnalysisCardProps) {
  const { analyzePortfolio, loading, error, isConfigured } = useGroqAnalysis()
  
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [tokensUsed, setTokensUsed] = useState(0)
  const [expanded, setExpanded] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && !hasLoaded && isConfigured) {
      handleAnalyze()
    }
  }, [autoLoad, hasLoaded, isConfigured])

  const handleAnalyze = async () => {
    const result = await analyzePortfolio(
      moleculeName,
      totalPatents,
      cliffStatus,
      firstExpiration,
      countries,
      sources
    )

    if (result) {
      setAnalysis(result.content)
      setTokensUsed(result.tokens_used)
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
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Análise AI
            <Badge variant="secondary" className="text-xs font-normal">
              <Zap className="h-3 w-3 mr-1" />
              Groq LLaMA 3.3
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {tokensUsed > 0 && (
              <span className="text-xs text-muted-foreground">
                {tokensUsed} tokens
              </span>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Not yet loaded */}
          {!analysis && !loading && !error && (
            <div className="text-center py-6">
              <Bot className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">
                Gere uma análise executiva do portfólio de patentes usando IA
              </p>
              <Button onClick={handleAnalyze} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Gerar Análise
              </Button>
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Analisando portfólio com IA...</span>
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
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none">
                {analysis.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-sm leading-relaxed text-foreground">
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
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  <span>Análise gerada por IA - verifique com especialistas</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleAnalyze}
                  className="text-xs"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}

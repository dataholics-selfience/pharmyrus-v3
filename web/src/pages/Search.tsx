import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, ArrowLeft, Loader2, Clock } from 'lucide-react'
import { useSearch } from '@/hooks/useSearch'
import { useAuth } from '@/hooks/useAuth'
import { useSearchHistory } from '@/hooks/useSearchHistory'

/**
 * Search Page - Railway API Integration
 * 
 * Flow:
 * 1. Get molecule from location.state
 * 2. Check if user is logged in
 * 3. Start search (Railway API)
 * 4. Show progress bar with polling
 * 5. Redirect to results when complete
 */
export function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { executeSearch, loading, progress, currentStep, error } = useSearch()
  const { saveToHistory } = useSearchHistory()
  
  // Get search params from location.state (vem do Login/Signup)
  const molecule = location.state?.molecule
  const brand = location.state?.brand
  const countries = location.state?.countries || ['BR']

  // Flag para evitar múltiplas execuções
  const [searchExecuted, setSearchExecuted] = useState(false)

  useEffect(() => {
    // Prevenir múltiplas execuções
    if (searchExecuted) {
      console.log('⚠️ Busca já foi executada, ignorando...')
      return
    }

    // Apenas verificar se tem molécula
    if (!molecule) {
      console.log('⚠️ No molecule provided')
      navigate('/')
      return
    }

    console.log('🚀 Iniciando busca ÚNICA para:', molecule)
    setSearchExecuted(true)

    // Start search automatically
    const startSearchAsync = async () => {
      try {
        console.log('📞 Chamando executeSearch...')
        const result = await executeSearch({ molecule, brand, countries })
        
        console.log('✅ executeSearch retornou:', result ? 'COM resultado' : 'SEM resultado')
        
        if (!result) {
          console.error('❌ Resultado vazio!')
          return
        }
        
        // NOTA: Não salvar no histórico aqui!
        // O executeSearch já salva automaticamente (linha 60-69 e 107-116 do useSearch.ts)
        // Salvar duas vezes causa duplicação
        
        console.log('⏭️ Pulando saveToHistory (já foi salvo no executeSearch)')
        
        // Redirect to scientific results page
        console.log('🔀 Navegando para resultados...')
        navigate('/results/scientific', { state: { result } })
      } catch (err) {
        console.error('❌ Search failed:', err)
        setSearchExecuted(false) // Permitir retry em caso de erro
      }
    }

    startSearchAsync()
  }, []) // VAZIO! Só executa UMA VEZ

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header com logo */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-center">
          <img src="/logo.png" alt="Pharmyrus" className="h-10 w-auto" />
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <Card>
          <CardHeader className="text-center">
            <CardTitle>Buscando Patentes</CardTitle>
            <CardDescription>
              Consolidando dados de INPI, EPO, WIPO e Google Patents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Molecule info */}
            {molecule && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-1">Molécula:</p>
                <p className="text-lg font-semibold">{molecule}</p>
                {brand && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Nome comercial: {brand}
                  </p>
                )}
                <p className="text-sm text-muted-foreground mt-1">
                  Países: {countries.join(', ')}
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Erro na busca</p>
                  <p className="mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {loading && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{currentStep}</span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
                  {currentStep.includes('Aguardando fila') || currentStep.includes('⏳') ? (
                    <Clock className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>
                    {currentStep.includes('Aguardando fila') || currentStep.includes('⏳') 
                      ? 'Aguardando processamento...'
                      : 'Isso pode levar alguns minutos...'
                    }
                  </span>
                </div>
              </div>
            )}

            {/* Back button (only if error) */}
            {error && (
              <Link to="/">
                <Button variant="outline" className="w-full gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar e tentar novamente
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          A busca é executada em tempo real nas bases oficiais de patentes
        </p>
      </div>
    </div>
    </div>
  )
}

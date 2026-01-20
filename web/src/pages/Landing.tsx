import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Shield, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { CountryMultiSelect } from '@/components/CountryMultiSelect'
import { SearchHistoryGrid } from '@/components/SearchHistoryGrid'
import { ValidationConfirmDialog } from '@/components/ValidationConfirmDialog'
import { SearchLimitReached } from '@/components/SearchLimitReached'
import { useAuth } from '@/hooks/useAuth'
import { useInputValidation } from '@/hooks/useInputValidation'
import { usePlan } from '@/hooks/usePlan'

export function LandingPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { validateInputs, loading: validating } = useInputValidation()
  const { plan, canSearch, remainingSearches, usagePercentage, loading: planLoading } = usePlan(user?.uid)
  
  const [molecule, setMolecule] = useState('')
  const [brand, setBrand] = useState('')
  const [countries, setCountries] = useState<string[]>(['BR'])
  
  // Validation dialog state
  const [showValidationDialog, setShowValidationDialog] = useState(false)
  const [validationResult, setValidationResult] = useState<any>(null)

  // Show limit reached screen if user has plan but can't search
  if (user && !planLoading && plan && !canSearch) {
    return <SearchLimitReached 
      plan={plan} 
      searchesUsed={plan.searches - remainingSearches}
      searchesLimit={plan.searches}
    />
  }

  // Carregar campos salvos do localStorage ao montar componente
  useEffect(() => {
    const camposSalvos = localStorage.getItem('pharmyrus-search-fields')
    if (camposSalvos) {
      const campos = JSON.parse(camposSalvos)
      setMolecule(campos.molecule || '')
      setBrand(campos.brand || '')
      setCountries(campos.countries || ['BR'])
      console.log('✅ Campos de busca carregados:', campos)
    }
  }, [])

  // Salvar campos no localStorage quando mudarem
  const salvarCampos = (mol: string, brn: string, cntr: string[]) => {
    const campos = {
      molecule: mol,
      brand: brn,
      countries: cntr
    }
    localStorage.setItem('pharmyrus-search-fields', JSON.stringify(campos))
    console.log('💾 Campos salvos no localStorage:', campos)
  }

  // Atualizar molecule e salvar
  const handleMoleculeChange = (value: string) => {
    setMolecule(value)
    salvarCampos(value, brand, countries)
  }

  // Atualizar brand e salvar
  const handleBrandChange = (value: string) => {
    setBrand(value)
    salvarCampos(molecule, value, countries)
  }

  // Atualizar countries e salvar
  const handleCountriesChange = (value: string[]) => {
    setCountries(value)
    salvarCampos(molecule, brand, value)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if user is authenticated
    if (!user) {
      console.log('❌ User not authenticated, redirecting to login')
      navigate('/login', { state: { from: '/search', searchData: { molecule: molecule.trim(), brand: brand.trim(), countries } } })
      return
    }
    
    if (!molecule.trim()) {
      alert('Digite o nome da molécula!')
      return
    }

    console.log('🔍 Starting input validation...')
    
    // Validate and correct inputs using Groq
    const validation = await validateInputs(molecule.trim(), brand.trim())
    
    if (!validation) {
      console.error('❌ Validation failed, using original inputs')
      executeSearch(molecule.trim(), brand.trim())
      return
    }

    // Check if there are changes
    if (validation.changes.molecule || validation.changes.brand) {
      console.log('⚠️ Changes detected, showing confirmation dialog')
      setValidationResult(validation)
      setShowValidationDialog(true)
    } else {
      console.log('✅ No changes needed, proceeding with search')
      executeSearch(validation.correctedMolecule, validation.correctedBrand)
    }
  }

  const executeSearch = (finalMolecule: string, finalBrand: string) => {
    console.log('🚀 Executing search:', { 
      molecule: finalMolecule, 
      brand: finalBrand, 
      countries, 
      user: user?.email || 'NO USER' 
    })
    
    // Salvar campos corrigidos
    salvarCampos(finalMolecule, finalBrand, countries)
    
    // Atualizar campos visuais com valores corrigidos
    setMolecule(finalMolecule)
    setBrand(finalBrand)
    
    navigate('/search', { 
      state: { 
        molecule: finalMolecule, 
        brand: finalBrand,
        countries: countries
      } 
    })
  }

  const handleValidationConfirm = () => {
    setShowValidationDialog(false)
    if (validationResult) {
      executeSearch(
        validationResult.correctedMolecule,
        validationResult.correctedBrand
      )
    }
  }

  const handleValidationCancel = () => {
    setShowValidationDialog(false)
    setValidationResult(null)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Pharmyrus" 
              className="h-8 w-auto"
            />
            <span className="font-semibold text-lg">Pharmyrus</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <>
                {/* Usage Indicator */}
                {!planLoading && plan && (
                  <div className="hidden md:flex items-center gap-2 text-sm">
                    <div className="text-muted-foreground">
                      Consultas: 
                      <span className={`ml-1 font-semibold ${
                        remainingSearches === 0 ? 'text-red-600' :
                        remainingSearches <= 2 ? 'text-amber-600' :
                        'text-green-600'
                      }`}>
                        {remainingSearches}
                      </span>
                      <span className="text-muted-foreground">/{plan.searches}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/plans')}
                      className="h-7 text-xs"
                    >
                      {plan.price === 0 ? 'Fazer Upgrade' : 'Ver Plano'}
                    </Button>
                  </div>
                )}
                
                <span className="text-sm text-muted-foreground hidden sm:block">
                  Olá, <span className="font-medium text-foreground">{user.displayName || user.email}</span>
                </span>
                
                {/* Botão Admin - só aparece para innovagenoi@gmail.com */}
                {user.email === 'innovagenoi@gmail.com' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/admin/dashboard')}
                    className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Entrar
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate('/cadastro')}
                >
                  Criar Conta
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center space-y-4">
            <img 
              src="/logo.png" 
              alt="Pharmyrus" 
              className="h-16 w-auto mx-auto"
            />
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Pharmyrus FTO
            </h1>
            <p className="text-muted-foreground text-lg">
              Análise de Freedom to Operate para Farmacêuticas
            </p>
          </div>

          <Card className="border-border shadow-sm">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Nome da molécula (ex: darolutamide)"
                    value={molecule}
                    onChange={(e) => handleMoleculeChange(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Nome comercial (opcional)"
                    value={brand}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <CountryMultiSelect
                    value={countries}
                    onChange={handleCountriesChange}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base gap-2"
                  size="lg"
                  disabled={validating}
                >
                  {validating ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <Search className="h-5 w-5" />
                      Buscar Patentes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Validation Confirmation Dialog */}
          {validationResult && (
            <ValidationConfirmDialog
              open={showValidationDialog}
              onOpenChange={setShowValidationDialog}
              original={{
                molecule,
                brand
              }}
              corrected={{
                molecule: validationResult.correctedMolecule,
                brand: validationResult.correctedBrand
              }}
              changes={validationResult.changes}
              suggestions={validationResult.suggestions}
              onConfirm={handleValidationConfirm}
              onCancel={handleValidationCancel}
            />
          )}

          {/* Search History Grid - Phase 6 */}
          {user && (
            <div className="mt-8">
              <SearchHistoryGrid 
                maxItems={6}
                onReload={(result) => {
                  navigate('/results/scientific', { state: { result } })
                }}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { CountryMultiSelect } from '@/components/CountryMultiSelect'
import { SearchHistoryGrid } from '@/components/SearchHistoryGrid'
import { useAuth } from '@/hooks/useAuth'

export function LandingPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  
  const [molecule, setMolecule] = useState('')
  const [brand, setBrand] = useState('')
  const [countries, setCountries] = useState<string[]>(['BR'])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
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

    console.log('🚀 Executing search:', { molecule, brand, countries, user: user?.email || 'NO USER' })
    
    navigate('/search', { 
      state: { 
        molecule: molecule.trim(), 
        brand: brand.trim(),
        countries: countries
      } 
    })
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
                <span className="text-sm text-muted-foreground">
                  Olá, <span className="font-medium text-foreground">{user.displayName || user.email}</span>
                </span>
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
                    onChange={(e) => setMolecule(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Nome comercial (opcional)"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <CountryMultiSelect
                    value={countries}
                    onChange={setCountries}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base gap-2"
                  size="lg"
                >
                  <Search className="h-5 w-5" />
                  Buscar Patentes
                </Button>
              </form>
            </CardContent>
          </Card>

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

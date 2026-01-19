import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { CountryMultiSelect } from '@/components/CountryMultiSelect'
import { useAuth } from '@/hooks/useAuth'
import { savePendingSearch, getSessionId } from '@/services/pendingSearch'

/**
 * Landing Page - Google-style clean interface
 * 
 * Design System Compliance:
 * - Minimalist functionalism (no gradients, no colorful icons)
 * - zinc-50 background, zinc-950 text
 * - indigo-600 accent for primary CTA
 * - Maximum border-radius: 8px (rounded-lg)
 * 
 * UX Flow:
 * 1. User sees logo + simple search
 * 2. User tries 1 search (guest mode)
 * 3. Results appear → Login prompt for full access
 */
export function LandingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  
  // Ler query params e preencher campos
  const [molecule, setMolecule] = useState(searchParams.get('molecule') || '')
  const [brand, setBrand] = useState(searchParams.get('brand') || '')
  const [countries, setCountries] = useState<string[]>(
    searchParams.get('countries')?.split(',').filter(Boolean) || ['BR']
  )
  
  // Log quando campos são preenchidos via query params
  useEffect(() => {
    const mol = searchParams.get('molecule')
    if (mol) {
      console.log('✅ Landing loaded with prefilled fields:', {
        molecule: mol,
        brand: searchParams.get('brand'),
        countries: searchParams.get('countries')
      })
      
      // CRITICAL: Se usuário acabou de fazer signup, executar busca AUTOMATICAMENTE
      checkAndAutoExecute(mol, searchParams.get('brand') || '', searchParams.get('countries') || 'BR')
    }
  }, [searchParams, user]) // user como dependência
  
  const checkAndAutoExecute = async (mol: string, brandParam: string, countriesParam: string) => {
    if (!user) {
      console.log('⚠️ No user yet, will check again when user loads...')
      return
    }
    
    console.log('✅ User is loaded, checking justSignedUp flag...')
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid))
      const userData = userDoc.data()
      
      console.log('📦 User data:', { justSignedUp: userData?.justSignedUp })
      
      if (userDoc.exists() && userData?.justSignedUp) {
        console.log('✅ User just signed up, auto-executing search!')
        
        // Limpar flag IMEDIATAMENTE
        await setDoc(doc(db, 'users', user.uid), {
          justSignedUp: false,
          autoExecutedAt: new Date()
        }, { merge: true })
        
        // Executar busca automaticamente
        const countriesArray = countriesParam.split(',').filter(Boolean)
        console.log('🚀 Auto-executing search:', { mol, brandParam, countriesArray })
        
        // Pequeno delay para garantir que flag foi salva
        setTimeout(() => {
          navigate('/search', { 
            state: { 
              molecule: mol,
              brand: brandParam,
              countries: countriesArray
            } 
          })
        }, 100)
      } else {
        console.log('ℹ️ No justSignedUp flag, user clicked manually or already auto-executed')
      }
    } catch (error) {
      console.error('Error checking justSignedUp:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🔍 SEARCH TRIGGERED', { molecule, brand, countries })
    
    if (!molecule.trim()) {
      console.warn('⚠️ Empty molecule')
      alert('Digite o nome da molécula!')
      return
    }

    // CRÍTICO: Verificar login PRIMEIRO
    if (!user) {
      console.log('⚠️ User NOT logged in - saving to Firestore and redirecting')
      
      // Salvar busca no Firestore (não localStorage)
      const sessionId = getSessionId()
      savePendingSearch(sessionId, {
        molecule: molecule.trim(),
        brand: brand.trim(),
        countries: countries
      })
      
      // Redirecionar para login
      navigate('/login')
      return
    }

    console.log('✅ User logged in, navigating to /search')
    
    // Se chegou aqui, usuário está logado - pode buscar
    navigate('/search', { 
      state: { 
        molecule: molecule.trim(), 
        brand: brand.trim(),
        countries: countries
      } 
    })
    
    console.log('✅ Navigate called')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - Clean, minimal */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-end gap-4">
          {user && (
            <span className="text-sm text-muted-foreground">
              Olá, <span className="font-medium text-foreground">{user.displayName || user.email}</span>
            </span>
          )}
        </div>
      </header>

      {/* Hero Section - Google-style centered search */}
      <main className="flex-1 flex items-center justify-center px-4 -mt-16">
        <div className="w-full max-w-2xl mx-auto text-center space-y-8">
          {/* Logo + Title */}
          <div className="space-y-4">
            <img 
              src="/logo.png" 
              alt="Pharmyrus" 
              className="h-16 w-auto mx-auto"
            />
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Inteligência de Patentes Farmacêuticas
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Descubra o <span className="font-medium text-foreground">Patent Cliff</span> de qualquer molécula. 
              Consolidamos INPI, EPO, WIPO e Google Patents em segundos.
            </p>
          </div>

          {/* Search Form */}
          <Card className="border-border shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="space-y-3">
                  <Input
                    type="text"
                    placeholder="Nome da molécula (ex: Darolutamide, Olaparib)"
                    value={molecule}
                    onChange={(e) => setMolecule(e.target.value)}
                    className="h-12 text-base"
                    autoFocus
                  />
                  <Input
                    type="text"
                    placeholder="Nome comercial (opcional)"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="h-12 text-base"
                  />
                  
                  {/* Country multiselect */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Países alvo
                    </label>
                    <CountryMultiSelect
                      value={countries}
                      onChange={setCountries}
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <Button 
                    type="submit"
                    size="lg"
                    className="gap-2"
                  >
                    <Search className="h-4 w-4" />
                    Buscar Patentes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Trust indicators */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              Dados agregados de 4 fontes oficiais • Análise preditiva com IA • 
              Visualização de Patent Cliff
            </p>
          </div>
        </div>
      </main>

      {/* Footer - Minimal */}
      <footer className="border-t border-border py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            © 2026 Pharmyrus. Inteligência de patentes para a indústria farmacêutica.
          </p>
        </div>
      </footer>
    </div>
  )
}

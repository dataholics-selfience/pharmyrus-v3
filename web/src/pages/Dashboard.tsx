import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, FileText, History, Settings } from 'lucide-react'

/**
 * Dashboard - User panel
 * 
 * Sprint 3: Search history, usage stats, account settings
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuth()

  console.log('📊 Dashboard rendered:', {
    userEmail: user?.email || 'null',
    loading: loading,
    timestamp: new Date().toISOString()
  })

  // Show loading while auth state loads
  if (loading) {
    console.log('⏳ Auth loading...')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    console.log('⚠️ No user, redirecting to login')
    navigate('/login')
    return null
  }

  console.log('✅ Dashboard ready for user:', user.email)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="Pharmyrus" 
                className="h-8 w-auto"
                onError={(e) => {
                  console.error('❌ Logo failed to load')
                  e.currentTarget.style.display = 'none'
                }}
              />
            </Link>
            <span className="text-sm text-muted-foreground">
              Olá, <span className="font-medium text-foreground">{user.displayName || user.email}</span>
            </span>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            Sair
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meu Painel</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas buscas e configurações
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Quick actions */}
            <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => navigate('/')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Nova Busca
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Iniciar uma nova análise de patentes
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="h-5 w-5" />
                  Histórico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ver buscas anteriores (em breve)
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Settings className="h-5 w-5" />
                  Configurações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gerenciar conta e plano (em breve)
                </p>
              </CardContent>
            </Card>
          </div>

          {/* User info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plano:</span>
                <span className="font-medium">Gratuito (1 busca)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-medium">{user.company || 'Não informado'}</span>
              </div>
            </CardContent>
          </Card>

          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para início
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

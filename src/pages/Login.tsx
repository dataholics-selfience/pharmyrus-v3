import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2 } from 'lucide-react'

/**
 * Login Page
 * 
 * Design: Clean, centered card with minimal form
 * Auth: Firebase Authentication
 */
export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      
      console.log('✅ [LOGIN] Redirecting to landing')
      navigate('/')
    } catch (err: any) {
      console.error('Login error:', err)
      
      // User-friendly error messages
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Email ou senha incorretos')
          break
        case 'auth/too-many-requests':
          setError('Muitas tentativas. Tente novamente mais tarde.')
          break
        case 'auth/network-request-failed':
          setError('Erro de conexão. Verifique sua internet.')
          break
        default:
          setError('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Pharmyrus" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            Bem-vindo de volta
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Entre com sua conta Pharmyrus
          </p>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Entrar</CardTitle>
            <CardDescription>
              Digite seu email e senha para acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium">
                    Senha
                  </label>
                  <Link 
                    to="/recuperar-senha" 
                    className="text-sm text-primary hover:underline"
                  >
                    Esqueceu?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Não tem uma conta?{' '}
              </span>
              <Link 
                to="/cadastro" 
                className="text-primary font-medium hover:underline"
              >
                Criar conta gratuita
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-4 text-center">
          <Link 
            to="/" 
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Voltar para início
          </Link>
        </div>
      </div>
    </div>
  )
}

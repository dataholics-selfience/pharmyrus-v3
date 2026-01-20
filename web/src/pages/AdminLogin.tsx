import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Shield } from 'lucide-react'

/**
 * Admin Login Page
 * 
 * Only innovagenoi@gmail.com can access
 */
export function AdminLoginPage() {
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Check if user is admin
      if (userCredential.user.email !== 'innovagenoi@gmail.com') {
        await auth.signOut()
        setError('Acesso negado. Apenas administradores podem acessar.')
        setLoading(false)
        return
      }
      
      console.log('✅ [ADMIN LOGIN] Success')
      navigate('/admin/dashboard')
      console.error('Admin login error:', err)
      
      switch (err.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setError('Email ou senha incorretos')
          break
        case 'auth/too-many-requests':
          setError('Muitas tentativas. Tente novamente mais tarde.')
          break
        default:
          setError('Erro ao fazer login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-purple-200">
            Pharmyrus Administration
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-purple-500/20 bg-slate-800/50 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Acesso Administrativo</CardTitle>
            <CardDescription className="text-purple-200">
              Apenas para administradores autorizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2 p-3 text-sm text-red-400 bg-red-950/50 border border-red-500/20 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-purple-100">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pharmyrus.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-900/50 border-purple-500/30 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-purple-100">
                  Senha
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-slate-900/50 border-purple-500/30 text-white"
                />
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Entrar como Admin
                  </>
                )}
              </Button>
            </form>

            {/* Back Link */}
            <div className="mt-6 text-center">
              <button 
                onClick={() => navigate('/')}
                className="text-sm text-purple-300 hover:text-purple-100"
              >
                ← Voltar para o site
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

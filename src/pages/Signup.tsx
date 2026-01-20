import { useState, useRef, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, collection, addDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Loader2, Check, X } from 'lucide-react'
import { 
  maskCPF, 
  maskPhone, 
  validateEmail, 
  validatePassword,
  validateCPF,
  validatePhone,
  PHARMA_COMPANIES 
} from '@/lib/validators'

/**
 * Signup Page
 * 
 * Fields:
 * - Email (with validation)
 * - Phone/WhatsApp (international mask)
 * - Full Name
 * - CPF (Brazilian tax ID with mask)
 * - Company (autocomplete from list)
 * - Password (complex validation)
 * - Confirm Password
 * 
 * Flow:
 * 1. Create Firebase Auth user
 * 2. Create Firestore user document
 * 3. Assign FREE plan (1 search limit)
 */
export function SignupPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form state
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [cpf, setCpf] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // Company autocomplete
  const [companyFocused, setCompanyFocused] = useState(false)
  const [filteredCompanies, setFilteredCompanies] = useState<string[]>([])
  const autocompleteRef = useRef<HTMLDivElement>(null)
  
  // Password validation state
  const passwordValidation = validatePassword(password)
  
  // Filter companies for autocomplete
  useEffect(() => {
    if (company.trim().length >= 2) {
      const filtered = PHARMA_COMPANIES.filter(c =>
        c.toLowerCase().includes(company.toLowerCase())
      ).slice(0, 10)
      setFilteredCompanies(filtered)
    } else {
      setFilteredCompanies([])
    }
  }, [company])
  
  // Handle company selection
  const selectCompany = (selected: string) => {
    setCompany(selected)
    setCompanyFocused(false)
  }
  
  // Add new company to Firestore if not in list
  const addNewCompany = async (newCompany: string) => {
    try {
      await addDoc(collection(db, 'companies'), {
        name: newCompany,
        addedBy: 'user',
        createdAt: new Date(),
      })
      console.log('New company added:', newCompany)
    } catch (err) {
      console.error('Error adding company:', err)
    }
  }
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    // Validation
    if (!validateEmail(email)) {
      setError('Email inválido')
      return
    }
    
    if (!validatePhone(phone)) {
      setError('Telefone inválido')
      return
    }
    
    if (!validateCPF(cpf)) {
      setError('CPF inválido')
      return
    }
    
    if (!passwordValidation.isValid) {
      setError('Senha não atende aos requisitos')
      return
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    
    setLoading(true)
    
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user
      
      // 2. Update display name
      await updateProfile(user, {
        displayName: fullName,
      })
      
      // 3. Create Firestore user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        displayName: fullName,
        phoneNumber: phone,
        cpf: cpf.replace(/\D/g, ''),
        company: company,
        role: 'user',
        createdAt: new Date(),
        lastLogin: new Date(),
      })
      
      // 4. Assign FREE plan
      await setDoc(doc(db, 'users', user.uid, 'plan', 'current'), {
        planId: 'free',
        planName: 'Gratuito',
        limits: {
          maxSearches: 1,
          maxUsers: 1,
        },
        usageQuota: {
          searchesThisMonth: 0,
          resetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
        },
        startedAt: new Date(),
      })
      
      // 5. Add new company to database if not in list
      if (!PHARMA_COMPANIES.includes(company)) {
        await addNewCompany(company)
      }
      
      // 6. Marcar que acabou de fazer signup
      localStorage.setItem('justSignedUp', 'true')
      
      console.log('✅ [SIGNUP] Redirecting to landing')
      navigate('/')
      
    } catch (err: any) {
      console.error('Signup error:', err)
      
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Este email já está cadastrado')
          break
        case 'auth/weak-password':
          setError('Senha muito fraca')
          break
        case 'auth/network-request-failed':
          setError('Erro de conexão. Verifique sua internet.')
          break
        default:
          setError('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src="/logo.png" 
            alt="Pharmyrus" 
            className="h-12 w-auto mx-auto mb-4"
          />
          <h1 className="text-2xl font-semibold tracking-tight">
            Criar conta gratuita
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            1 busca grátis sem compromisso
          </p>
        </div>
        
        {/* Signup Card */}
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Cadastro</CardTitle>
            <CardDescription>
              Preencha seus dados para criar sua conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {/* Error Alert */}
              {error && (
                <div className="flex items-start gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Phone/WhatsApp */}
              <div className="space-y-2">
                <Label htmlFor="phone">Celular/WhatsApp *</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+55 (11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(maskPhone(e.target.value))}
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo *</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="João Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              
              {/* CPF */}
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(maskCPF(e.target.value))}
                  required
                  disabled={loading}
                />
              </div>
              
              {/* Company (Autocomplete) */}
              <div className="space-y-2 relative" ref={autocompleteRef}>
                <Label htmlFor="company">Empresa *</Label>
                <Input
                  id="company"
                  type="text"
                  placeholder="Digite o nome da empresa"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  onFocus={() => setCompanyFocused(true)}
                  onBlur={() => setTimeout(() => setCompanyFocused(false), 200)}
                  required
                  disabled={loading}
                  autoComplete="off"
                />
                
                {/* Autocomplete Dropdown */}
                {companyFocused && filteredCompanies.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
                    {filteredCompanies.map((c, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectCompany(c)}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
                
                {companyFocused && company.length >= 2 && filteredCompanies.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg p-3 text-sm text-muted-foreground">
                    Empresa não encontrada. Será adicionada ao cadastro.
                  </div>
                )}
              </div>
              
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Senha *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                
                {/* Password Requirements */}
                {password && (
                  <div className="text-xs space-y-1 pt-1">
                    {passwordValidation.isValid ? (
                      <p className="text-secondary flex items-center gap-1">
                        <Check className="h-3 w-3" />
                        Senha forte
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-muted-foreground">Requisitos:</p>
                        {passwordValidation.errors.map((err, idx) => (
                          <p key={idx} className="text-destructive flex items-center gap-1">
                            <X className="h-3 w-3" />
                            {err}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                {confirmPassword && confirmPassword !== password && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <X className="h-3 w-3" />
                    As senhas não coincidem
                  </p>
                )}
                {confirmPassword && confirmPassword === password && password.length >= 8 && (
                  <p className="text-xs text-secondary flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Senhas coincidem
                  </p>
                )}
              </div>
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || !passwordValidation.isValid}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando conta...
                  </>
                ) : (
                  'Criar conta'
                )}
              </Button>
            </form>
            
            {/* Login Link */}
            <div className="mt-6 text-center text-sm">
              <span className="text-muted-foreground">
                Já tem uma conta?{' '}
              </span>
              <Link 
                to="/login" 
                className="text-primary font-medium hover:underline"
              >
                Entrar
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

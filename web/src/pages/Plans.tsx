import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Plan } from '@/types/plans'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, ArrowLeft, MessageCircle, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

export function PlansPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const plansQuery = query(
        collection(db, 'plans'),
        where('isActive', '==', true)
      )
      const snapshot = await getDocs(plansQuery)
      
      const plansData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Plan[]

      // Ordenar por preço
      plansData.sort((a, b) => a.price - b.price)
      
      setPlans(plansData)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleContactWhatsApp = (planName: string) => {
    const phone = '5511995736666'
    const message = `Olá! Gostaria de contratar o plano *${planName}* do Pharmyrus FTO.`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          {user && (
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha o Plano Ideal
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Análise profissional de patentes farmacêuticas com inteligência artificial
          </p>
        </div>
      </section>

      {/* Plans Grid */}
      <section className="pb-16 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan) => {
              const isPopular = plan.name === 'Profissional'
              const isFree = plan.price === 0

              return (
                <Card 
                  key={plan.id}
                  className={`relative flex flex-col ${
                    isPopular 
                      ? 'border-2 border-primary shadow-xl scale-105' 
                      : 'border-border'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-4 py-1">
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <div className="mb-4">
                      <div className="text-4xl font-bold">
                        {isFree ? (
                          'Grátis'
                        ) : (
                          <>
                            <span className="text-lg font-normal">R$</span>
                            {plan.price.toLocaleString('pt-BR')}
                          </>
                        )}
                      </div>
                      {!isFree && (
                        <div className="text-sm text-muted-foreground">por mês</div>
                      )}
                    </div>
                    <CardDescription>
                      <div className="space-y-1">
                        <div className="font-semibold text-foreground">
                          {plan.searches} consultas/usuário
                        </div>
                        <div className="text-sm">
                          Até {plan.maxUsers} {plan.maxUsers === 1 ? 'usuário' : 'usuários'}
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full gap-2"
                      variant={isPopular ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleContactWhatsApp(plan.name)}
                      disabled={isFree}
                    >
                      {isFree ? (
                        'Plano Atual'
                      ) : (
                        <>
                          <MessageCircle className="h-4 w-4" />
                          Contratar Agora
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ / Contact */}
      <section className="py-16 px-4 bg-white/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">
            Precisa de Ajuda?
          </h2>
          <p className="text-muted-foreground mb-8">
            Nossa equipe está pronta para te ajudar a escolher o melhor plano
          </p>
          <Button 
            size="lg" 
            className="gap-2"
            onClick={() => handleContactWhatsApp('dúvidas sobre planos')}
          >
            <MessageCircle className="h-5 w-5" />
            Falar com Especialista
          </Button>
        </div>
      </section>
    </div>
  )
}

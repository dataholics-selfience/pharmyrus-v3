import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, MessageCircle, TrendingUp } from 'lucide-react'
import { Plan } from '@/types/plans'

interface SearchLimitReachedProps {
  plan: Plan
  searchesUsed: number
  searchesLimit: number
}

export function SearchLimitReached({ plan, searchesUsed, searchesLimit }: SearchLimitReachedProps) {
  const navigate = useNavigate()

  const handleUpgrade = () => {
    navigate('/plans')
  }

  const handleContactWhatsApp = () => {
    const phone = '5511995736666'
    const message = `Olá! Atingi o limite do plano *${plan.name}* e gostaria de fazer upgrade.`
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl">Limite de Consultas Atingido</CardTitle>
          <CardDescription className="text-base">
            Você utilizou todas as {searchesLimit} consultas do seu plano {plan.name}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Usage Stats */}
          <div className="bg-slate-100 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Consultas Utilizadas</span>
              <span className="text-sm font-bold">{searchesUsed} / {searchesLimit}</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Alert */}
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-900">
              Para continuar realizando consultas de patentes, faça upgrade do seu plano ou entre em contato conosco.
            </AlertDescription>
          </Alert>

          {/* Benefits */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Benefícios do Upgrade
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Mais consultas de patentes por mês</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Adicione membros à sua equipe</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Acesso a recursos avançados</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Suporte prioritário</span>
              </li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full gap-2" 
            size="lg"
            onClick={handleUpgrade}
          >
            <TrendingUp className="h-5 w-5" />
            Ver Planos Disponíveis
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full gap-2"
            onClick={handleContactWhatsApp}
          >
            <MessageCircle className="h-5 w-5" />
            Falar com Vendas
          </Button>

          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => navigate('/')}
          >
            Voltar ao Início
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

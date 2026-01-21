/**
 * QuotaFooter Component
 * 
 * Rodapé persistente que mostra informações de quota do usuário
 * Aparece em todas as páginas (exceto landing/login)
 */

import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { QuotaWarning } from './QuotaWarning'
import { Badge } from './ui/badge'
import { TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuotaData {
  searchesUsed: number
  searchesLimit: number
  planName: string
  tier: string
}

export function QuotaFooter() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    loadQuotaData()
    
    // Recarregar a cada 30 segundos
    const interval = setInterval(loadQuotaData, 30000)
    return () => clearInterval(interval)
  }, [user])

  const loadQuotaData = async () => {
    if (!user) return

    try {
      // Tentar carregar de users/{uid}/plan/current primeiro (sistema novo)
      const planDocRef = doc(db, 'users', user.uid, 'plan', 'current')
      const planSnap = await getDoc(planDocRef)
      
      if (planSnap.exists()) {
        const data = planSnap.data()
        setQuotaData({
          searchesUsed: data.searchesUsed || 0,
          searchesLimit: data.searchesLimit || 1,
          planName: data.planName || 'Básico',
          tier: data.tier || 'free'
        })
      } else {
        // Fallback para userPlans (sistema antigo)
        const userPlanRef = doc(db, 'userPlans', user.uid)
        const userPlanSnap = await getDoc(userPlanRef)
        
        if (userPlanSnap.exists()) {
          const data = userPlanSnap.data()
          setQuotaData({
            searchesUsed: data.searchesUsed || 0,
            searchesLimit: data.searchesLimit || 1,
            planName: data.planName || 'Básico',
            tier: 'subscription'
          })
        }
      }
    } catch (error) {
      console.error('[QuotaFooter] Error loading quota:', error)
    } finally {
      setLoading(false)
    }
  }

  // Não mostrar se não estiver logado ou ainda carregando
  if (!user || loading) return null

  // Não mostrar se não tiver dados de quota
  if (!quotaData) return null

  const usagePercentage = (quotaData.searchesUsed / quotaData.searchesLimit) * 100
  const remainingSearches = Math.max(0, quotaData.searchesLimit - quotaData.searchesUsed)

  // Determinar cor da badge baseado no uso
  const getBadgeVariant = () => {
    if (usagePercentage >= 90) return 'destructive'
    if (usagePercentage >= 75) return 'default' // amarelo/warning
    return 'secondary'
  }

  const getBadgeColor = () => {
    if (usagePercentage >= 90) return 'bg-orange-500 hover:bg-orange-600'
    if (usagePercentage >= 75) return 'bg-amber-500 hover:bg-amber-600'
    return ''
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Informações de Quota */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Plano:
              </span>
              <Badge variant="outline">{quotaData.planName}</Badge>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                Buscas:
              </span>
              <Badge 
                variant={getBadgeVariant()}
                className={getBadgeColor()}
              >
                {quotaData.searchesUsed} / {quotaData.searchesLimit}
              </Badge>
            </div>

            {/* Barra de progresso compacta */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    usagePercentage >= 90 
                      ? 'bg-orange-600' 
                      : usagePercentage >= 75 
                        ? 'bg-amber-600'
                        : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground min-w-[3rem]">
                {usagePercentage.toFixed(0)}%
              </span>
            </div>

            {remainingSearches <= 5 && remainingSearches > 0 && (
              <Badge variant="outline" className="text-xs">
                {remainingSearches} restantes
              </Badge>
            )}
          </div>

          {/* Botão de Upgrade (se quota alta) */}
          {usagePercentage >= 75 && (
            <button
              onClick={() => navigate('/plans')}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">
                {usagePercentage >= 90 ? 'Fazer Upgrade' : 'Ver Planos'}
              </span>
              <span className="sm:hidden">Upgrade</span>
            </button>
          )}
        </div>

        {/* Alerta de Quota (se necessário) */}
        {usagePercentage >= 75 && (
          <div className="mt-2">
            <QuotaWarning
              usagePercentage={usagePercentage}
              searchesUsed={quotaData.searchesUsed}
              searchesLimit={quotaData.searchesLimit}
              remainingSearches={remainingSearches}
              compact
            />
          </div>
        )}
      </div>
    </div>
  )
}

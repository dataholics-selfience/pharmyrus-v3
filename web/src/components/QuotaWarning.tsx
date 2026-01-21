/**
 * QuotaWarning Component
 * 
 * Exibe avisos quando o usuário está próximo do limite de quota
 * - 75%: Aviso amarelo
 * - 90%: Aviso laranja crítico
 */

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface QuotaWarningProps {
  usagePercentage: number
  searchesUsed: number
  searchesLimit: number
  remainingSearches: number
  onDismiss?: () => void
  compact?: boolean
}

export function QuotaWarning({
  usagePercentage,
  searchesUsed,
  searchesLimit,
  remainingSearches,
  onDismiss,
  compact = false
}: QuotaWarningProps) {
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  // Determinar nível de alerta
  const getAlertLevel = () => {
    if (usagePercentage >= 90) return '90'
    if (usagePercentage >= 75) return '75'
    return null
  }

  const alertLevel = getAlertLevel()

  // Se não há alerta ou foi dismissed, não renderiza
  if (!alertLevel || dismissed) return null

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const handleUpgrade = () => {
    navigate('/plans')
  }

  // Configurações baseadas no nível
  const config = {
    '75': {
      variant: 'default' as const,
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-950',
      borderColor: 'border-amber-200 dark:border-amber-800',
      title: '⚠️ Aviso: 75% da quota utilizada',
      description: `Você já usou ${searchesUsed} de ${searchesLimit} buscas. Restam apenas ${remainingSearches} buscas.`,
      cta: 'Considere fazer upgrade'
    },
    '90': {
      variant: 'destructive' as const,
      icon: AlertTriangle,
      iconColor: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      borderColor: 'border-orange-200 dark:border-orange-800',
      title: '🚨 Alerta Crítico: 90% da quota utilizada',
      description: `Você já usou ${searchesUsed} de ${searchesLimit} buscas. Restam apenas ${remainingSearches} buscas antes de atingir o limite.`,
      cta: 'Fazer upgrade agora'
    }
  }

  const currentConfig = config[alertLevel]
  const Icon = currentConfig.icon

  // Versão compacta (para rodapé)
  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-md ${currentConfig.bgColor} ${currentConfig.borderColor} border`}>
        <Icon className={`h-4 w-4 ${currentConfig.iconColor}`} />
        <span className="text-xs font-medium flex-1">
          {alertLevel === '90' ? '🚨' : '⚠️'} {searchesUsed}/{searchesLimit} buscas ({usagePercentage.toFixed(0)}%)
        </span>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 px-2 text-xs"
          onClick={handleUpgrade}
        >
          Upgrade
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  // Versão completa
  return (
    <Alert 
      variant={currentConfig.variant}
      className={`${currentConfig.bgColor} ${currentConfig.borderColor} relative`}
    >
      <Icon className={`h-4 w-4 ${currentConfig.iconColor}`} />
      <AlertTitle className="flex items-center justify-between">
        {currentConfig.title}
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 hover:bg-transparent"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{currentConfig.description}</p>
        
        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              alertLevel === '90' 
                ? 'bg-orange-600' 
                : 'bg-amber-600'
            }`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          />
        </div>

        <div className="flex gap-2">
          <Button 
            size="sm"
            onClick={handleUpgrade}
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {currentConfig.cta}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDismiss}
          >
            Dispensar
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Hook para gerenciar notificações de quota
 * 
 * Dispara notificações quando atingir 75% ou 90%
 */
export function useQuotaNotifications(
  usagePercentage: number,
  searchesUsed: number
) {
  const [notified75, setNotified75] = useState(false)
  const [notified90, setNotified90] = useState(false)

  useEffect(() => {
    // Notificar em 75%
    if (usagePercentage >= 75 && usagePercentage < 90 && !notified75) {
      console.log('📊 Quota notification: 75% reached')
      setNotified75(true)
    }

    // Notificar em 90%
    if (usagePercentage >= 90 && !notified90) {
      console.log('🚨 Quota notification: 90% reached')
      setNotified90(true)
    }

    // Reset se voltar abaixo de 75% (ex: admin aumentou limite)
    if (usagePercentage < 75) {
      setNotified75(false)
      setNotified90(false)
    }
  }, [usagePercentage, notified75, notified90])

  return {
    shouldShow: usagePercentage >= 75,
    level: usagePercentage >= 90 ? '90' : usagePercentage >= 75 ? '75' : null
  }
}

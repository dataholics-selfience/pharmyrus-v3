import { AlertCircle, Info, Scale, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PredictiveDisclaimerProps {
  confidence_tier?: string
  confidence_score?: number
  warnings?: string[]
  className?: string
  variant?: 'compact' | 'full'
}

/**
 * Componente de disclaimer jurídico para patentes preditas
 * Segue as diretrizes do Design System e legal framework do projeto
 */
export function PredictiveDisclaimer({
  confidence_tier,
  confidence_score,
  warnings = [],
  className,
  variant = 'compact'
}: PredictiveDisclaimerProps) {
  
  // Mapeamento de cores por tier (seguindo o design system)
  const getTierStyle = (tier?: string) => {
    switch (tier?.toUpperCase()) {
      case 'PUBLISHED':
        return { bg: 'bg-emerald-50/50', border: 'border-emerald-200', text: 'text-emerald-900', icon: 'text-emerald-600' }
      case 'FOUND':
        return { bg: 'bg-blue-50/50', border: 'border-blue-200', text: 'text-blue-900', icon: 'text-blue-600' }
      case 'INFERRED':
        return { bg: 'bg-amber-50/50', border: 'border-amber-200', text: 'text-amber-900', icon: 'text-amber-600' }
      case 'EXPECTED':
        return { bg: 'bg-yellow-50/50', border: 'border-yellow-200', text: 'text-yellow-900', icon: 'text-yellow-600' }
      case 'PREDICTED':
        return { bg: 'bg-orange-50/50', border: 'border-orange-200', text: 'text-orange-900', icon: 'text-orange-600' }
      case 'SPECULATIVE':
        return { bg: 'bg-red-50/50', border: 'border-red-200', text: 'text-red-900', icon: 'text-red-600' }
      default:
        return { bg: 'bg-gray-50/50', border: 'border-gray-200', text: 'text-gray-900', icon: 'text-gray-600' }
    }
  }

  const style = getTierStyle(confidence_tier)

  // Versão compacta para lista de patentes
  if (variant === 'compact') {
    return (
      <div className={cn("mt-3 pt-3 border-t", style.border, className)}>
        <div className="flex items-start gap-2">
          <AlertCircle className={cn("h-3.5 w-3.5 flex-shrink-0 mt-0.5", style.icon)} />
          <div className="text-xs">
            <p className={cn("font-semibold", style.text)}>
              Patente Predita - {confidence_tier}
            </p>
            <p className={style.text}>
              Confiança: <strong>{((confidence_score || 0) * 100).toFixed(0)}%</strong> • 
              Verificação independente obrigatória
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Versão completa para modal
  return (
    <Card className={cn(style.bg, style.border, 'border-2', className)}>
      <CardContent className="pt-4 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Shield className={cn("h-6 w-6 flex-shrink-0", style.icon)} />
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h3 className={cn("font-bold text-lg", style.text)}>
                ⚠️ PATENTE PREVISTA - NÃO CONFIRMADA
              </h3>
              <Badge variant="outline" className={cn("border-current", style.text)}>
                {confidence_tier}
              </Badge>
            </div>
            <p className={cn("text-sm", style.text)}>
              Nível de confiança: <strong>{((confidence_score || 0) * 100).toFixed(0)}%</strong>
            </p>
          </div>
        </div>

        {/* Explicação principal */}
        <div className={cn("p-3 rounded-lg border", style.border, "bg-white/50")}>
          <p className={cn("text-sm font-medium mb-2", style.text)}>
            📊 Metodologia de Predição
          </p>
          <p className="text-sm text-muted-foreground">
            Esta patente foi <strong>inferida</strong> através de análise de família PCT, 
            comportamento histórico de depositante e cronogramas estatutários (Artigos PCT 22/39).
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <strong className={style.text}>Importante:</strong> O número BR específico 
            não pode ser previsto algoritmicamente - é atribuído sequencialmente pelo INPI 
            após entrada de fase nacional.
          </p>
        </div>

        {/* Avisos legais */}
        {warnings && warnings.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Scale className={cn("h-4 w-4", style.icon)} />
              <p className={cn("text-xs font-semibold uppercase tracking-wide", style.text)}>
                Avisos Legais
              </p>
            </div>
            <ul className="space-y-1.5">
              {warnings.slice(0, 5).map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <span className={cn("mt-0.5", style.icon)}>•</span>
                  <span className="text-muted-foreground">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer principal */}
        <div className={cn("p-3 rounded-lg border-2", style.border, "bg-white")}>
          <div className="flex items-start gap-2">
            <Info className={cn("h-4 w-4 flex-shrink-0 mt-0.5", style.icon)} />
            <div className="text-xs space-y-2">
              <p className={cn("font-bold", style.text)}>
                VERIFICAÇÃO INDEPENDENTE OBRIGATÓRIA
              </p>
              <p className="text-muted-foreground">
                Dados preditivos devem ser <strong>confirmados junto ao INPI</strong> antes 
                de uso em análises de FTO ou decisões estratégicas.
              </p>
              <p className="text-muted-foreground">
                Este sistema <strong>NÃO constitui aconselhamento jurídico</strong>. Para 
                análises de liberdade de operação (FTO), consulte profissionais especializados 
                em propriedade intelectual.
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>Janela cega de 18 meses:</strong> Aplicações depositadas recentemente 
                permanecem confidenciais por lei. Nenhum sistema acessa dados não publicados.
              </p>
            </div>
          </div>
        </div>

        {/* Footer com tier classification */}
        <div className="flex items-center justify-between text-xs pt-2 border-t">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Sistema:</span>
            <span className="font-mono font-medium">Pharmyrus v30.4</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Classificação:</span>
            <Badge variant="outline" className={cn("border-current", style.text)}>
              {confidence_tier} ({((confidence_score || 0) * 100).toFixed(0)}%)
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

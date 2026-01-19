import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

interface ConfidenceTier {
  name: string
  count: number
  color: string
  confidence: string
}

interface ConfidenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  data: ConfidenceTier[]
  totalPatents: number
}

const tierDescriptions: Record<string, { icon: any, description: string, legal: string }> = {
  PUBLISHED: {
    icon: ShieldCheck,
    description: 'Patentes publicadas e confirmadas pelo INPI com dados completos.',
    legal: 'Pode ser usado em análises de FTO com alta confiança.'
  },
  FOUND: {
    icon: ShieldCheck,
    description: 'Patentes encontradas em bases oficiais com metadados verificados.',
    legal: 'Recomenda-se verificação complementar para uso legal.'
  },
  INFERRED: {
    icon: ShieldAlert,
    description: 'Patentes inferidas a partir de famílias internacionais (WO/EP).',
    legal: 'Verificação independente junto ao INPI é recomendada.'
  },
  EXPECTED: {
    icon: ShieldAlert,
    description: 'Patentes esperadas baseadas em padrões de filing históricos.',
    legal: 'Não deve ser usada em decisões legais sem verificação.'
  },
  PREDICTED: {
    icon: ShieldQuestion,
    description: 'Patentes previstas por modelo analítico com menor certeza.',
    legal: 'Apenas para fins informativos. Requer validação completa.'
  },
  SPECULATIVE: {
    icon: ShieldQuestion,
    description: 'Patentes especulativas baseadas em tendências do mercado.',
    legal: 'Não recomendado para uso em análises formais de FTO.'
  }
}

export function ConfidenceModal({ 
  open, 
  onOpenChange, 
  data,
  totalPatents 
}: ConfidenceModalProps) {

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Distribuição por Nível de Confiança
          </DialogTitle>
        </DialogHeader>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {data.map(tier => {
            const TierIcon = tierDescriptions[tier.name]?.icon || ShieldQuestion
            const percentage = totalPatents > 0 
              ? ((tier.count / totalPatents) * 100).toFixed(1) 
              : '0'
            
            return (
              <Card key={tier.name} className="overflow-hidden">
                <div className="h-1" style={{ backgroundColor: tier.color }} />
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TierIcon className="h-4 w-4" style={{ color: tier.color }} />
                      <span className="font-semibold text-sm">{tier.name}</span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className="text-xs"
                      style={{ borderColor: tier.color, color: tier.color }}
                    >
                      {tier.confidence}
                    </Badge>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{tier.count}</span>
                    <span className="text-sm text-muted-foreground">({percentage}%)</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bar Chart */}
        <div className="h-64 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis 
                dataKey="name" 
                type="category"
                tick={{ fontSize: 11 }}
                width={100}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
                formatter={(value: number, name: string) => [
                  `${value} patentes (${((value / totalPatents) * 100).toFixed(1)}%)`,
                  'Quantidade'
                ]}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tier Descriptions */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-muted-foreground">
            Descrição dos Níveis de Confiança
          </h4>
          
          {data.map(tier => {
            const info = tierDescriptions[tier.name] || {
              icon: ShieldQuestion,
              description: 'Nível de confiança personalizado.',
              legal: 'Consulte a documentação para uso apropriado.'
            }
            const TierIcon = info.icon
            
            return (
              <div 
                key={tier.name}
                className="p-4 border rounded-lg"
                style={{ borderLeftWidth: '4px', borderLeftColor: tier.color }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <TierIcon className="h-4 w-4" style={{ color: tier.color }} />
                  <span className="font-semibold">{tier.name}</span>
                  <Badge 
                    variant="outline" 
                    className="text-xs"
                    style={{ borderColor: tier.color, color: tier.color }}
                  >
                    {tier.confidence}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {info.description}
                </p>
                <p className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded inline-block">
                  ⚖️ {info.legal}
                </p>
              </div>
            )
          })}
        </div>

        {/* Legal Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Aviso Legal Importante</p>
              <p className="text-amber-800 mt-1">
                Dados marcados como <strong>INFERRED</strong>, <strong>EXPECTED</strong>, <strong>PREDICTED</strong> ou <strong>SPECULATIVE</strong> 
                representam previsões analíticas e não substituem a verificação oficial junto ao INPI. 
                Antes de tomar decisões de FTO ou estratégicas, consulte sempre as fontes primárias.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

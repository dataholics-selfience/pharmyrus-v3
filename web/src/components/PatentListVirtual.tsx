import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'
import { PredictiveDisclaimer } from '@/components/PredictiveDisclaimer'

interface Patent {
  patent_number: string
  country: string
  source: string
  title: string
  applicants: string[]
  filing_date: string
  expiration_date: string
  years_until_expiration?: number
  patent_status?: string
  confidence_tier?: string
  confidence_score?: number
  wo_number?: string
}

interface PatentListVirtualProps {
  patents: Patent[]
  onPatentClick: (patent: Patent) => void
}

export function PatentListVirtual({ patents, onPatentClick }: PatentListVirtualProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: patents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height of each patent card
    overscan: 5 // Render 5 items above and below viewport
  })

  const getStatusColor = (yearsUntilExp?: number) => {
    if (!yearsUntilExp) return 'text-gray-600'
    if (yearsUntilExp < 2) return 'text-red-600'
    if (yearsUntilExp < 5) return 'text-yellow-600'
    return 'text-emerald-600'
  }

  const getSourceBadgeVariant = (source: string) => {
    switch (source.toUpperCase()) {
      case 'EPO':
        return 'default'
      case 'INPI':
        return 'secondary'
      case 'GOOGLE PATENTS':
        return 'outline'
      case 'WIPO':
        return 'default'
      default:
        return 'outline'
    }
  }

  const isPredicted = (patent: Patent) => {
    return patent.confidence_tier && 
           ['PREDICTED', 'EXPECTED', 'SPECULATIVE', 'INFERRED'].includes(patent.confidence_tier)
  }

  return (
    <div 
      ref={parentRef} 
      className="h-[600px] overflow-auto border rounded-lg bg-muted/30"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const patent = patents[virtualRow.index]
          const predicted = isPredicted(patent)

          return (
            <div
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`
              }}
              className="px-4 py-2"
            >
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md hover:border-primary/50 ${
                  predicted 
                    ? 'border-dashed border-amber-300 bg-amber-50/30' 
                    : 'hover:bg-accent/50'
                }`}
                onClick={() => onPatentClick(patent)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <Badge variant={getSourceBadgeVariant(patent.source)} className="flex-shrink-0">
                        {patent.source}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm">
                            {patent.patent_number}
                          </span>
                          {patent.wo_number && (
                            <Badge variant="outline" className="text-xs">
                              WO: {patent.wo_number}
                            </Badge>
                          )}
                          {predicted && (
                            <Badge variant="destructive" className="text-xs">
                              {patent.confidence_tier}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <MapPin className="h-3 w-3" />
                      <span className="font-medium">{patent.country}</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-medium line-clamp-2 mb-3">
                    {patent.title || 'Título não disponível'}
                  </h3>

                  {/* Footer - Dates and Status */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-muted-foreground">Filing:</span>{' '}
                        <span className="font-medium">
                          {new Date(patent.filing_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="h-3 w-px bg-border" />
                      <div>
                        <span className="text-muted-foreground">Exp:</span>{' '}
                        <span className="font-medium">
                          {new Date(patent.expiration_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className={`h-3.5 w-3.5 ${getStatusColor(patent.years_until_expiration)}`} />
                      <span className={`font-semibold ${getStatusColor(patent.years_until_expiration)}`}>
                        {patent.years_until_expiration 
                          ? `${patent.years_until_expiration.toFixed(1)} anos`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Predicted Warning */}
                  {predicted && (
                    <PredictiveDisclaimer
                      confidence_tier={patent.confidence_tier}
                      confidence_score={patent.confidence_score}
                      variant="compact"
                    />
                  )}
                </div>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}

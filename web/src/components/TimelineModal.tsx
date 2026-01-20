import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExternalLink, Calendar, Building2 } from 'lucide-react'

interface Patent {
  patent_number: string
  title: string
  applicants: string[]
  expiration_date: string
  years_until_expiration?: number
  link_national?: string
  patent_status?: string
  confidence_tier?: string
}

interface TimelineModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  year: number
  patents: Patent[]
  onPatentClick: (patent: Patent) => void
}

export function TimelineModal({ 
  open, 
  onOpenChange, 
  year, 
  patents,
  onPatentClick 
}: TimelineModalProps) {
  
  const currentYear = new Date().getFullYear()
  const yearsFromNow = year - currentYear
  
  const getZoneInfo = () => {
    if (yearsFromNow < 2) return { label: 'Zona Crítica', color: 'bg-red-100 text-red-800 border-red-200' }
    if (yearsFromNow < 5) return { label: 'Zona de Atenção', color: 'bg-amber-100 text-amber-800 border-amber-200' }
    return { label: 'Zona Segura', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
  }
  
  const zone = getZoneInfo()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Calendar className="h-5 w-5" />
            Patentes expirando em {year}
            <Badge className={zone.color}>{zone.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          <p>{patents.length} patente(s) • {yearsFromNow} anos a partir de hoje</p>
        </div>

        <div className="space-y-3">
          {patents.map((patent, idx) => (
            <div 
              key={patent.patent_number || idx}
              className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => {
                onPatentClick(patent)
                onOpenChange(false)
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {patent.patent_number}
                    </Badge>
                    {patent.patent_status && (
                      <Badge variant="secondary" className="text-xs">
                        {patent.patent_status}
                      </Badge>
                    )}
                    {patent.confidence_tier && (
                      <Badge 
                        variant={
                          patent.confidence_tier === 'PUBLISHED' ? 'default' :
                          patent.confidence_tier === 'FOUND' ? 'secondary' :
                          'outline'
                        }
                        className="text-xs"
                      >
                        {patent.confidence_tier}
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm font-medium line-clamp-2 mb-2">
                    {patent.title || 'Título não disponível'}
                  </p>
                  
                  {patent.applicants && patent.applicants.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" />
                      <span className="truncate">{patent.applicants[0]}</span>
                      {patent.applicants.length > 1 && (
                        <span className="text-muted-foreground">+{patent.applicants.length - 1}</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-muted-foreground">Expira em</p>
                  <p className="text-sm font-semibold">
                    {new Date(patent.expiration_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {patent.link_national && (
                <div className="mt-3 pt-3 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(patent.link_national, '_blank')
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver no INPI
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {patents.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma patente expirando neste ano.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

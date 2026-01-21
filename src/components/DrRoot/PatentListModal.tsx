import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Patent } from '@/types/patent'
import { PatentListVirtual } from '@/components/PatentListVirtual'
import { Badge } from '@/components/ui/badge'

interface PatentListModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patents: Patent[]
  title: string
  onPatentClick: (patent: Patent) => void
}

export function PatentListModal({ 
  open, 
  onOpenChange, 
  patents, 
  title,
  onPatentClick 
}: PatentListModalProps) {
  // Count predicted vs confirmed
  const predictedCount = patents.filter(p => (p as any)._isPrediction).length
  const confirmedCount = patents.length - predictedCount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <DialogDescription>
                {patents.length} patentes encontradas
              </DialogDescription>
            </div>
            
            <div className="flex gap-2">
              {confirmedCount > 0 && (
                <Badge variant="default">
                  {confirmedCount} Confirmadas
                </Badge>
              )}
              {predictedCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-900">
                  {predictedCount} Preditas
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden -mx-6">
          <PatentListVirtual 
            patents={patents}
            onPatentClick={onPatentClick}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

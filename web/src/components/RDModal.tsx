import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Microscope } from 'lucide-react'
import { RDSection } from '@/components/RDSection'

interface RDModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  molecularData?: any
  clinicalTrials?: any
  fdaData?: any
  pubmedData?: any
  moleculeName: string
}

export function RDModal({
  open,
  onOpenChange,
  molecularData,
  clinicalTrials,
  fdaData,
  pubmedData,
  moleculeName
}: RDModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Microscope className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl">
                Pesquisa & Desenvolvimento
              </DialogTitle>
              <DialogDescription>
                Informações científicas e regulatórias para {moleculeName}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-6">
          <RDSection 
            molecularData={molecularData}
            clinicalTrials={clinicalTrials}
            fdaData={fdaData}
            pubmedData={pubmedData}
            moleculeName={moleculeName}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

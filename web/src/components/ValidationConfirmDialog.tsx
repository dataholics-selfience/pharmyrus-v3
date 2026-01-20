import { AlertCircle, CheckCircle2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ValidationConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  original: {
    molecule: string
    brand: string
  }
  corrected: {
    molecule: string
    brand: string
  }
  changes: {
    molecule: boolean
    brand: boolean
  }
  suggestions: string[]
  onConfirm: () => void
  onCancel: () => void
}

export function ValidationConfirmDialog({
  open,
  onOpenChange,
  original,
  corrected,
  changes,
  suggestions,
  onConfirm,
  onCancel
}: ValidationConfirmDialogProps) {
  const hasChanges = changes.molecule || changes.brand

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasChanges ? (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Correções Sugeridas
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Validação OK
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {hasChanges
              ? 'Detectamos possíveis correções nos termos de busca'
              : 'Os termos de busca estão corretos'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Molecule Changes */}
          {changes.molecule && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Molécula:</h4>
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-sm text-red-700 line-through">
                  {original.molecule}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">→</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700 font-medium">
                  {corrected.molecule}
                </span>
              </div>
            </div>
          )}

          {/* Brand Changes */}
          {changes.brand && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Marca Comercial:</h4>
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <span className="text-sm text-red-700 line-through">
                  {original.brand}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl">→</span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm text-green-700 font-medium">
                  {corrected.brand}
                </span>
              </div>
            </div>
          )}

          {/* No Changes */}
          {!hasChanges && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">
                Os termos estão corretos e serão buscados como digitados.
              </AlertDescription>
            </Alert>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full sm:w-auto"
          >
            {hasChanges ? 'Usar Correções' : 'Prosseguir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

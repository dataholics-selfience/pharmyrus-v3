import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MoleculeViewer } from '@/components/MoleculeViewer'
import { Atom, Pill } from 'lucide-react'

interface MoleculeCardProps {
  moleculeName: string
  brandName?: string
  smiles?: string
  pubchemCid?: number | string
  molecularData?: {
    development_codes?: string[]
    synonyms?: string[]
    cas_number?: string
    molecular_formula?: string
    molecular_weight?: number
  }
}

export function MoleculeCard({
  moleculeName,
  brandName,
  smiles,
  pubchemCid,
  molecularData
}: MoleculeCardProps) {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* 3D Molecule Viewer */}
          <div className="flex-shrink-0">
            <div className="w-40 h-40 rounded-lg overflow-hidden border-2 border-primary/10">
              <MoleculeViewer 
                smiles={smiles}
                moleculeName={moleculeName}
                pubchemCid={pubchemCid}
                width={160}
                height={160}
              />
            </div>
          </div>

          {/* Molecule Info */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Name and Brand */}
            <div>
              <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Atom className="h-6 w-6 text-primary" />
                {moleculeName}
              </h3>
              {brandName && (
                <div className="flex items-center gap-2 mt-1">
                  <Pill className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Nome comercial: <strong className="text-foreground">{brandName}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Compact Data */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              {/* Development Codes */}
              {molecularData?.development_codes && molecularData.development_codes.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Códigos de Desenvolvimento
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {molecularData.development_codes.slice(0, 4).map((code, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {code}
                      </Badge>
                    ))}
                    {molecularData.development_codes.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{molecularData.development_codes.length - 4}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Synonyms */}
              {molecularData?.synonyms && molecularData.synonyms.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Sinônimos
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {molecularData.synonyms.slice(0, 4).map((syn, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {syn}
                      </Badge>
                    ))}
                    {molecularData.synonyms.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{molecularData.synonyms.length - 4} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* CAS Number */}
              {molecularData?.cas_number && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    CAS Number
                  </p>
                  <p className="text-sm font-mono">{molecularData.cas_number}</p>
                </div>
              )}

              {/* Molecular Formula */}
              {molecularData?.molecular_formula && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Fórmula Molecular
                  </p>
                  <p className="text-sm font-mono">{molecularData.molecular_formula}</p>
                </div>
              )}
            </div>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground italic">
              Dados moleculares, ensaios clínicos, aprovações regulatórias e literatura científica
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

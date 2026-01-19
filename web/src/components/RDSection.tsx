import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Microscope, Pill, FileText, ExternalLink, 
  FlaskConical, Building2, Calendar, Users
} from 'lucide-react'
import { MoleculeViewer } from './MoleculeViewer'

interface MolecularData {
  molecule_name?: string
  synonyms?: string[]
  smiles?: string
  inchi?: string
  molecular_formula?: string
  molecular_weight?: number | string
  iupac_name?: string
  cas_number?: string
  pubchem_cid?: number | string
  development_codes?: string[]
}

interface ClinicalTrial {
  nct_id: string
  title?: string
  phase?: string
  overall_status?: string
  primary_sponsor?: string
  start_date?: string
  completion_date?: string
  enrollment?: number
  conditions?: string[]
  interventions?: Array<{ name: string; type?: string }>
  primary_outcome?: string
  countries?: string[]
}

interface ClinicalTrialsData {
  total_trials?: number
  trials_by_phase?: Record<string, number>
  trials_by_status?: Record<string, number>
  primary_sponsors?: string[]
  trial_details?: ClinicalTrial[]
  total_enrollment?: number
}

interface FDAApproval {
  approval_date?: string
  indication?: string
  approval_type?: string
  sponsor?: string
}

interface FDAData {
  fda_approval_status?: string
  approval_date?: string
  indications?: string[]
  sponsor?: string
  dosage_forms?: string[]
  routes_of_administration?: string[]
  marketing_status?: string
  patent_exclusivity?: {
    patents?: Array<{
      patent_number: string
      expiration_date: string
    }>
    exclusivity_periods?: Array<{
      type: string
      expiration_date: string
    }>
  }
}

interface PubMedData {
  total_results?: number
  results_returned?: number
  recent_articles?: Array<{
    pmid: string
    title: string
    authors?: string[]
    journal?: string
    publication_date?: string
  }>
}

interface RDSectionProps {
  molecularData?: MolecularData
  clinicalTrials?: ClinicalTrialsData
  fdaData?: FDAData
  pubmedData?: PubMedData
}

export function RDSection({ 
  molecularData, 
  clinicalTrials, 
  fdaData,
  pubmedData 
}: RDSectionProps) {
  
  if (!molecularData && !clinicalTrials && !fdaData && !pubmedData) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Microscope className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Pesquisa & Desenvolvimento</h2>
      </div>

      {/* Molecular Data */}
      {molecularData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FlaskConical className="h-5 w-5" />
              Dados Moleculares
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* 3D Viewer + Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 3D Molecule Viewer */}
              {molecularData.smiles && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">Estrutura 3D</p>
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <MoleculeViewer 
                      smiles={molecularData.smiles} 
                      width={350} 
                      height={300}
                      rotating={true}
                    />
                  </div>
                  {molecularData.smiles && (
                    <p className="text-xs text-muted-foreground font-mono break-all mt-2">
                      SMILES: {molecularData.smiles}
                    </p>
                  )}
                </div>
              )}

              {/* Molecular Properties */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Propriedades</p>
                  <div className="space-y-2">
                    {molecularData.molecular_formula && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fórmula:</span>
                        <span className="font-mono font-semibold">{molecularData.molecular_formula}</span>
                      </div>
                    )}
                    {molecularData.molecular_weight && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Peso Molecular:</span>
                        <span className="font-semibold">{molecularData.molecular_weight} g/mol</span>
                      </div>
                    )}
                    {molecularData.cas_number && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">CAS Number:</span>
                        <span className="font-mono font-semibold">{molecularData.cas_number}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* External Links */}
                <div className="flex flex-wrap gap-2">
                  {molecularData.pubchem_cid && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={`https://pubchem.ncbi.nlm.nih.gov/compound/${molecularData.pubchem_cid}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        PubChem
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                  {molecularData.cas_number && (
                    <Button variant="outline" size="sm" asChild>
                      <a 
                        href={`https://www.cas.org/cas-data/${molecularData.cas_number}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        CAS Registry
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Synonyms & Development Codes */}
            {(molecularData.synonyms || molecularData.development_codes) && (
              <div className="border-t pt-4 space-y-3">
                {molecularData.development_codes && molecularData.development_codes.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">
                      Códigos de Desenvolvimento
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {molecularData.development_codes.slice(0, 10).map((code, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs font-mono">
                          {code}
                        </Badge>
                      ))}
                      {molecularData.development_codes.length > 10 && (
                        <Badge variant="outline" className="text-xs">
                          +{molecularData.development_codes.length - 10} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {molecularData.synonyms && molecularData.synonyms.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Sinônimos</p>
                    <div className="text-sm text-muted-foreground">
                      {molecularData.synonyms.slice(0, 5).join(', ')}
                      {molecularData.synonyms.length > 5 && ` (+${molecularData.synonyms.length - 5} mais)`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clinical Trials */}
      {clinicalTrials && clinicalTrials.total_trials && clinicalTrials.total_trials > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5" />
              Ensaios Clínicos ({clinicalTrials.total_trials} total)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Phase Distribution */}
            {clinicalTrials.trials_by_phase && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Distribuição por Fase
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {Object.entries(clinicalTrials.trials_by_phase)
                    .filter(([_, count]) => count > 0)
                    .map(([phase, count]) => (
                      <div 
                        key={phase}
                        className="text-center p-3 rounded-lg border bg-muted/30"
                      >
                        <div className="text-2xl font-bold text-primary">{count}</div>
                        <div className="text-xs text-muted-foreground mt-1">{phase}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Recent Trials */}
            {clinicalTrials.trial_details && clinicalTrials.trial_details.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Estudos Recentes
                </p>
                <div className="space-y-3">
                  {clinicalTrials.trial_details.slice(0, 3).map((trial, idx) => (
                    <div 
                      key={trial.nct_id || idx}
                      className="p-4 border rounded-lg bg-muted/30 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-mono text-xs">
                              {trial.nct_id}
                            </Badge>
                            {trial.phase && (
                              <Badge variant="secondary" className="text-xs">
                                {trial.phase}
                              </Badge>
                            )}
                            {trial.overall_status && (
                              <Badge 
                                variant={
                                  trial.overall_status.includes('Recruiting') ? 'default' :
                                  trial.overall_status.includes('Completed') ? 'secondary' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {trial.overall_status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mt-2">
                            {trial.title || trial.primary_outcome || 'Sem título disponível'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {trial.primary_sponsor && (
                          <div className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            <span>{trial.primary_sponsor}</span>
                          </div>
                        )}
                        {trial.enrollment && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{trial.enrollment} pacientes</span>
                          </div>
                        )}
                        {trial.completion_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{trial.completion_date}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a 
                      href={`https://clinicaltrials.gov/search?term=${molecularData?.molecule_name || ''}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      Ver todos em ClinicalTrials.gov
                      <ExternalLink className="h-3 w-3 ml-2" />
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FDA Approval */}
      {fdaData && (fdaData.fda_approval_status || fdaData.indications) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Aprovações Regulatórias
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {fdaData.fda_approval_status && (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-emerald-900">{fdaData.fda_approval_status}</p>
                  {fdaData.approval_date && (
                    <p className="text-sm text-emerald-700">
                      Aprovado em: {new Date(fdaData.approval_date).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            )}

            {fdaData.indications && fdaData.indications.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-muted-foreground mb-2">Indicações</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {fdaData.indications.map((indication, idx) => (
                    <li key={idx}>{indication}</li>
                  ))}
                </ul>
              </div>
            )}

            {fdaData.patent_exclusivity?.patents && fdaData.patent_exclusivity.patents.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-muted-foreground mb-3">
                  Orange Book - Patentes Listadas
                </p>
                <div className="space-y-2">
                  {fdaData.patent_exclusivity.patents.map((patent, idx) => (
                    <div key={idx} className="flex justify-between text-sm p-2 bg-muted/30 rounded">
                      <span className="font-mono">{patent.patent_number}</span>
                      <span className="text-muted-foreground">
                        Exp: {new Date(patent.expiration_date).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* PubMed Literature */}
      {pubmedData && pubmedData.total_results && pubmedData.total_results > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Literatura Científica ({pubmedData.total_results} publicações)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pubmedData.recent_articles && pubmedData.recent_articles.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-muted-foreground">Artigos Recentes</p>
                {pubmedData.recent_articles.slice(0, 5).map((article, idx) => (
                  <div key={article.pmid || idx} className="p-3 border rounded-lg space-y-1">
                    <p className="text-sm font-medium leading-snug">{article.title}</p>
                    {article.authors && (
                      <p className="text-xs text-muted-foreground">
                        {article.authors.slice(0, 3).join(', ')}
                        {article.authors.length > 3 && ' et al.'}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {article.journal && <span>{article.journal}</span>}
                      {article.publication_date && <span>{article.publication_date}</span>}
                      <Badge variant="outline" className="text-xs font-mono">
                        PMID: {article.pmid}
                      </Badge>
                    </div>
                  </div>
                ))}

                <Button variant="outline" size="sm" asChild className="w-full mt-4">
                  <a 
                    href={`https://pubmed.ncbi.nlm.nih.gov/?term=${molecularData?.molecule_name || ''}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Ver todos em PubMed
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </a>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

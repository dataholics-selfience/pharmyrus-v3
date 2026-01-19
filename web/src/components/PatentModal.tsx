import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Clock, MapPin, Building2, User, FileText, 
  ExternalLink, Calendar, Shield, AlertCircle,
  TrendingUp, Scale
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Patent {
  patent_number: string
  country: string
  source: string
  title: string
  applicants: string[]
  inventors?: string[]
  ipc_codes?: string[]
  filing_date: string
  publication_date?: string
  grant_date?: string
  national_phase_date?: string
  expiration_date: string
  years_until_expiration?: number
  patent_status?: string
  wo_number?: string
  pct_number?: string
  link_national?: string
  link_espacenet?: string
  link_google_patents?: string
  abstract?: string
  claims?: Array<{ claimNumber: number; claimText: string; isIndependent: boolean }>
  confidence_tier?: string
  confidence_score?: number
  legal_events?: Array<{ date: string; event: string; description?: string }>
  citations_backward?: string[]
  citations_forward?: string[]
}

interface PatentModalProps {
  patent: Patent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PatentModal({ patent, open, onOpenChange }: PatentModalProps) {
  if (!patent) return null

  const isPredicted = patent.confidence_tier && 
    ['PREDICTED', 'EXPECTED', 'SPECULATIVE', 'INFERRED'].includes(patent.confidence_tier)

  const yearsUntilExp = patent.years_until_expiration || 0
  
  const getStatusColor = () => {
    if (yearsUntilExp < 2) return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' }
    if (yearsUntilExp < 5) return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' }
    return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' }
  }

  const statusColors = getStatusColor()

  const InfoRow = ({ label, value, icon: Icon }: { label: string; value: string; icon?: any }) => (
    <div className="flex items-center gap-3 py-2">
      {Icon && <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value || 'N/A'}</p>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        
        {/* Sticky Header */}
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <Badge>{patent.source}</Badge>
                <span className="font-mono font-bold text-lg">{patent.patent_number}</span>
                {isPredicted && (
                  <Badge variant="destructive">
                    {patent.confidence_tier}
                  </Badge>
                )}
                {patent.wo_number && (
                  <Badge variant="outline">WO: {patent.wo_number}</Badge>
                )}
              </div>
              <DialogTitle className="text-xl leading-tight">
                {patent.title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="family">Família</TabsTrigger>
            <TabsTrigger value="legal">Status Legal</TabsTrigger>
            <TabsTrigger value="claims">Reivindicações</TabsTrigger>
            <TabsTrigger value="analysis">Análise</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 mt-4">
            
            {/* Patent Cliff Highlight */}
            <Card className={cn("p-4", statusColors.bg, statusColors.border)}>
              <div className="flex items-center gap-4">
                <Clock className="h-10 w-10 text-current" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">Data de Expiração</p>
                  <p className={cn("text-3xl font-bold", statusColors.text)}>
                    {new Date(patent.expiration_date).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-sm mt-1">
                    {yearsUntilExp.toFixed(1)} anos restantes
                    {yearsUntilExp < 2 && ' - CRÍTICO'}
                    {yearsUntilExp >= 2 && yearsUntilExp < 5 && ' - ATENÇÃO'}
                    {yearsUntilExp >= 5 && ' - SEGURO'}
                  </p>
                </div>
              </div>
            </Card>

            {/* Predicted Warning */}
            {isPredicted && (
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-4">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-amber-900">Patente Prevista - Não Confirmada</p>
                      <p className="text-amber-800 mt-1">
                        Nível de confiança: <strong>{(patent.confidence_score || 0).toFixed(2)}</strong> ({patent.confidence_tier})
                      </p>
                      <p className="text-amber-800 mt-1">
                        Esta patente foi inferida através de análise de família PCT e padrões de depositante. 
                        <strong> Verificação independente junto ao INPI é obrigatória</strong> antes de uso em análises de FTO.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bibliographic Data */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Datas Importantes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoRow 
                    label="Data de Depósito" 
                    value={new Date(patent.filing_date).toLocaleDateString('pt-BR')}
                    icon={Calendar}
                  />
                  {patent.publication_date && (
                    <InfoRow 
                      label="Data de Publicação" 
                      value={new Date(patent.publication_date).toLocaleDateString('pt-BR')}
                      icon={Calendar}
                    />
                  )}
                  {patent.grant_date && (
                    <InfoRow 
                      label="Data de Concessão" 
                      value={new Date(patent.grant_date).toLocaleDateString('pt-BR')}
                      icon={Calendar}
                    />
                  )}
                  {patent.national_phase_date && (
                    <InfoRow 
                      label="Entrada Fase Nacional" 
                      value={new Date(patent.national_phase_date).toLocaleDateString('pt-BR')}
                      icon={Calendar}
                    />
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Identificação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  <InfoRow 
                    label="País" 
                    value={patent.country}
                    icon={MapPin}
                  />
                  <InfoRow 
                    label="Fonte" 
                    value={patent.source}
                    icon={FileText}
                  />
                  {patent.patent_status && (
                    <InfoRow 
                      label="Status" 
                      value={patent.patent_status}
                      icon={Shield}
                    />
                  )}
                  {patent.pct_number && (
                    <InfoRow 
                      label="Número PCT" 
                      value={patent.pct_number}
                      icon={FileText}
                    />
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Applicants */}
            {patent.applicants && patent.applicants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Depositantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patent.applicants.map((applicant, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {applicant}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inventors */}
            {patent.inventors && patent.inventors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Inventores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patent.inventors.map((inventor, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {inventor}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* IPC Codes */}
            {patent.ipc_codes && patent.ipc_codes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Classificação IPC
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {patent.ipc_codes.map((ipc, idx) => (
                      <Badge key={idx} variant="outline" className="font-mono text-xs">
                        {ipc}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Abstract */}
            {patent.abstract && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Resumo</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {patent.abstract}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* External Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Links Externos
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {patent.link_national && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={patent.link_national} target="_blank" rel="noopener noreferrer">
                      INPI/Nacional
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {patent.link_espacenet && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={patent.link_espacenet} target="_blank" rel="noopener noreferrer">
                      Espacenet
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
                {patent.link_google_patents && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={patent.link_google_patents} target="_blank" rel="noopener noreferrer">
                      Google Patents
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Family Tab */}
          <TabsContent value="family" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Família de Patentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {patent.wo_number && (
                    <div>
                      <p className="text-sm font-semibold mb-2">WO Principal</p>
                      <Badge variant="outline" className="font-mono">
                        {patent.wo_number}
                      </Badge>
                    </div>
                  )}
                  
                  {patent.pct_number && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Número PCT</p>
                      <Badge variant="outline" className="font-mono">
                        {patent.pct_number}
                      </Badge>
                    </div>
                  )}

                  <p className="text-sm text-muted-foreground">
                    Informações detalhadas da família de patentes em desenvolvimento.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legal Status Tab */}
          <TabsContent value="legal" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  Status Legal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-2">Status Atual</p>
                    <Badge variant={patent.patent_status === 'Granted' ? 'default' : 'secondary'}>
                      {patent.patent_status || 'Não disponível'}
                    </Badge>
                  </div>

                  {patent.legal_events && patent.legal_events.length > 0 ? (
                    <div>
                      <p className="text-sm font-semibold mb-3">Eventos Legais</p>
                      <div className="space-y-2">
                        {patent.legal_events.map((event, idx) => (
                          <div key={idx} className="flex gap-3 text-sm border-l-2 border-primary pl-3 py-1">
                            <span className="text-muted-foreground font-mono">
                              {new Date(event.date).toLocaleDateString('pt-BR')}
                            </span>
                            <div>
                              <p className="font-medium">{event.event}</p>
                              {event.description && (
                                <p className="text-muted-foreground text-xs">{event.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Eventos legais não disponíveis. Consulte o INPI para informações atualizadas.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Claims Tab */}
          <TabsContent value="claims" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Reivindicações</CardTitle>
              </CardHeader>
              <CardContent>
                {patent.claims && patent.claims.length > 0 ? (
                  <div className="space-y-4">
                    {patent.claims.map((claim) => (
                      <div 
                        key={claim.claimNumber}
                        className={cn(
                          "p-3 rounded-lg border",
                          claim.isIndependent 
                            ? "border-primary bg-primary/5" 
                            : "border-border bg-muted/30"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Badge variant={claim.isIndependent ? "default" : "secondary"} className="flex-shrink-0">
                            {claim.claimNumber}
                          </Badge>
                          <p className="text-sm leading-relaxed flex-1">
                            {claim.claimText}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Reivindicações não disponíveis. Consulte o documento completo no INPI.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Análise Estratégica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* Strategic Importance */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Importância Estratégica</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <p className="text-sm text-muted-foreground">
                      Análise de importância estratégica baseada em:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                      <li>Prazo até expiração: <strong>{yearsUntilExp.toFixed(1)} anos</strong></li>
                      <li>Depositantes: <strong>{patent.applicants.length}</strong></li>
                      <li>Classificação IPC: <strong>{patent.ipc_codes?.length || 0} classes</strong></li>
                      {isPredicted && (
                        <li className="text-amber-700">
                          ⚠️ Patente prevista - confirmação necessária
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Avaliação de Risco FTO</h4>
                  <Card className={cn("p-4", statusColors.bg, statusColors.border)}>
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className={cn("font-semibold", statusColors.text)}>
                          {yearsUntilExp < 2 && 'Alto Risco - Expiração Iminente'}
                          {yearsUntilExp >= 2 && yearsUntilExp < 5 && 'Risco Moderado - Atenção'}
                          {yearsUntilExp >= 5 && 'Baixo Risco - Período Seguro'}
                        </p>
                        <p className="text-muted-foreground mt-2">
                          {yearsUntilExp < 2 && 'Patente expirará em menos de 2 anos. Oportunidade de FTO próxima.'}
                          {yearsUntilExp >= 2 && yearsUntilExp < 5 && 'Monitorar regularmente. Planejar estratégia para período pós-expiração.'}
                          {yearsUntilExp >= 5 && 'Proteção ainda vigente por período significativo. Avaliar design-around se necessário.'}
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Recomendações</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <ul className="text-sm space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Verificar status legal atual junto ao INPI</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Analisar reivindicações para identificar escopo de proteção</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold">•</span>
                        <span>Avaliar design-around ou licenciamento se necessário</span>
                      </li>
                      {isPredicted && (
                        <li className="flex items-start gap-2">
                          <span className="text-amber-600 font-bold">•</span>
                          <span className="text-amber-800">
                            <strong>IMPORTANTE:</strong> Confirmar existência desta patente no INPI antes de decisões estratégicas
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Disclaimer */}
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">
                    <strong>Aviso Legal:</strong> Esta análise é gerada automaticamente e tem caráter informativo. 
                    Não constitui aconselhamento jurídico. Para análises de liberdade de operação (FTO), 
                    consulte profissionais especializados em propriedade intelectual.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

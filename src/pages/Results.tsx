import { useLocation, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle2, ArrowLeft, FileDown, Search,
  TrendingDown, AlertTriangle, Shield, Database 
} from 'lucide-react'

/**
 * Results Page - Dashboard rico
 */
export function ResultsPage() {
  const location = useLocation()
  const { result } = location.state || {}

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-muted-foreground">Nenhum resultado encontrado</p>
            <Link to="/">
              <Button>Voltar</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const metadata = result.metadata || {}
  const discovery = result.patent_discovery || {}
  const summary = discovery.summary || {}
  const cliff = discovery.patent_cliff || {}
  const audit = result.cortellis_audit || {}
  const patents = discovery.all_patents || []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src="/logo.png" alt="Pharmyrus" className="h-8 w-auto" />
            </Link>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="font-semibold">{metadata.molecule_name}</h1>
              {metadata.brand_name && (
                <p className="text-sm text-muted-foreground">{metadata.brand_name}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Link to="/">
              <Button variant="ghost" size="sm">
                <Search className="h-4 w-4 mr-2" />
                Nova busca
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Status */}
        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  <h2 className="text-2xl font-bold text-emerald-900">Análise Completa</h2>
                </div>
                <p className="text-emerald-700">
                  {summary.total_patents} patentes • {summary.total_wo_patents} WO • {metadata.target_countries?.join(', ')}
                </p>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Tempo</p>
                <p className="text-lg font-semibold text-emerald-900">
                  {Math.round(metadata.elapsed_seconds / 60)} min
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Patent Cliff */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Patent Cliff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className={`text-2xl font-bold ${
                    cliff.status?.includes('Safe') ? 'text-emerald-600' : 
                    cliff.status?.includes('Warning') ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {cliff.status || 'N/A'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">1ª expiração</p>
                    <p className="font-semibold text-sm">
                      {cliff.first_expiration || 'N/A'}
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Anos até cliff</p>
                    <p className="font-semibold text-sm">
                      {cliff.years_until_cliff?.toFixed(1) || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cortellis Audit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Auditoria Cortellis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className={`text-2xl font-bold ${
                    audit.rating === 'EXCELLENT' ? 'text-emerald-600' :
                    audit.rating === 'GOOD' ? 'text-blue-600' :
                    audit.rating === 'WARNING' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {audit.rating || 'N/A'}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <p className="text-xs text-muted-foreground">Encontrados</p>
                    <p className="font-semibold text-emerald-600">{audit.found || 0}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs text-muted-foreground">Faltando</p>
                    <p className="font-semibold text-red-600">{audit.missing || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Predictive */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Predições IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Alta confiança</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {audit.predictive_analysis?.high_confidence_predictions || 0}
                  </p>
                </div>
                
                <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                  <p className="text-xs text-muted-foreground mb-1">Recall ajustado</p>
                  <p className="font-semibold text-indigo-600">
                    {audit.predictive_analysis?.adjusted_recall_if_predictions_valid || 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Fontes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summary.by_source || {}).map(([source, count]) => (
                <div key={source} className="p-4 bg-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">{source}</p>
                  <p className="text-3xl font-bold">{count as number}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Patents Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Patentes ({patents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {patents.slice(0, 5).map((patent: any, idx: number) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">
                          {patent.patent_number}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {patent.country}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {patent.title || patent.title_original || 'Sem título'}
                      </p>
                    </div>
                    
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Filing</p>
                      <p className="font-medium">
                        {patent.filing_date?.split('T')[0] || 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {patents.length > 5 && (
                <p className="text-center text-sm text-muted-foreground pt-2">
                  + {patents.length - 5} patentes
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Nova busca
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button>Ir para Dashboard</Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

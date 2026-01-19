import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, FileDown, Search, Clock, AlertTriangle,
  Database, TrendingDown, Lightbulb, ChevronDown, ChevronUp
} from 'lucide-react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine,
  Cell
} from 'recharts'
import { PatentModal } from '@/components/PatentModal'
import { PatentListVirtual } from '@/components/PatentListVirtual'
import { MoleculeViewer } from '@/components/MoleculeViewer'

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
  expiration_date: string
  years_until_expiration?: number
  patent_status?: string
  wo_number?: string
  pct_number?: string
  link_national?: string
  abstract?: string
  confidence_tier?: string
  confidence_score?: number
}

interface ResultData {
  metadata: {
    search_id: string
    molecule_name: string
    brand_name?: string
    search_date: string
    target_countries: string[]
    elapsed_seconds: number
    version: string
  }
  patent_discovery: {
    summary: {
      total_patents: number
      total_wo_patents: number
      by_country: Record<string, number>
      by_source: Record<string, number>
    }
    patent_cliff: {
      first_expiration: string
      last_expiration: string
      years_until_cliff: number
      status: string
      all_expirations: Array<{
        patent_number: string
        country: string
        filing_date: string
        expiration_date: string
        years_until_expiration: number
        expired: boolean
      }>
    }
    all_patents?: Patent[]
  }
  predictive_intelligence?: {
    summary: {
      by_confidence_tier: {
        PUBLISHED?: number
        FOUND?: number
        INFERRED?: number
        EXPECTED?: number
        PREDICTED?: number
        SPECULATIVE?: number
      }
    }
  }
  research_and_development?: {
    molecular_data?: {
      smiles?: string
      molecular_formula?: string
      molecular_weight?: number
      iupac_name?: string
      cas_number?: string
    }
  }
}

export function ResultsScientificPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { result } = location.state as { result: ResultData } || {}
  
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null)
  const [showAllPatents, setShowAllPatents] = useState(false)

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
  const patents = discovery.all_patents || []
  const predictive = result.predictive_intelligence?.summary?.by_confidence_tier || {}
  const molecularData = result.research_and_development?.molecular_data

  // Process timeline data for Patent Cliff visualization
  const timelineData = useMemo(() => {
    if (!cliff.all_expirations) return []
    
    // Group by year
    const yearMap = new Map<number, number>()
    const currentYear = new Date().getFullYear()
    
    cliff.all_expirations.forEach(exp => {
      const expYear = new Date(exp.expiration_date).getFullYear()
      yearMap.set(expYear, (yearMap.get(expYear) || 0) + 1)
    })
    
    // Create continuous timeline from now to last expiration
    const lastYear = new Date(cliff.last_expiration).getFullYear()
    const data = []
    
    for (let year = currentYear; year <= lastYear; year++) {
      const count = yearMap.get(year) || 0
      const yearsFromNow = year - currentYear
      
      data.push({
        year,
        expirations: count,
        yearsFromNow,
        zone: yearsFromNow < 2 ? 'critical' : yearsFromNow < 5 ? 'warning' : 'safe'
      })
    }
    
    return data
  }, [cliff])

  // Confidence tier data for bar chart
  const confidenceData = useMemo(() => {
    const tiers = [
      { name: 'PUBLISHED', count: predictive.PUBLISHED || 0, color: '#10B981', confidence: '0.95-1.0' },
      { name: 'FOUND', count: predictive.FOUND || 0, color: '#3B82F6', confidence: '0.85-0.94' },
      { name: 'INFERRED', count: predictive.INFERRED || 0, color: '#6366F1', confidence: '0.70-0.84' },
      { name: 'EXPECTED', count: predictive.EXPECTED || 0, color: '#F59E0B', confidence: '0.50-0.69' },
      { name: 'PREDICTED', count: predictive.PREDICTED || 0, color: '#EF4444', confidence: '0.30-0.49' },
      { name: 'SPECULATIVE', count: predictive.SPECULATIVE || 0, color: '#9CA3AF', confidence: '<0.30' }
    ]
    return tiers.filter(t => t.count > 0)
  }, [predictive])

  const totalConfidencePatents = confidenceData.reduce((sum, tier) => sum + tier.count, 0)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <img src="/logo.png" alt="Pharmyrus" className="h-8 w-auto" />
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-3">
              {molecularData?.smiles && (
                <div className="w-16 h-16 -my-2">
                  <MoleculeViewer smiles={molecularData.smiles} width={64} height={64} />
                </div>
              )}
              <div>
                <h1 className="font-semibold text-lg">{metadata.molecule_name}</h1>
                {metadata.brand_name && (
                  <p className="text-sm text-muted-foreground">{metadata.brand_name}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Exportar Excel
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
      <main className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
        
        {/* Summary Cards Row */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Patentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.total_patents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.total_wo_patents} famílias WO
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Patent Cliff Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                cliff.status?.includes('Safe') ? 'text-emerald-600' : 
                cliff.status?.includes('Warning') ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                {cliff.years_until_cliff?.toFixed(1) || 'N/A'} anos
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {cliff.status || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Primeira Expiração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {cliff.first_expiration ? new Date(cliff.first_expiration).getFullYear() : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {cliff.first_expiration || 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo de Análise
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.round(metadata.elapsed_seconds / 60)} min
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metadata.version}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Patent Cliff Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Patent Cliff Timeline
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Visualização temporal das expirações de patentes para análise de FTO
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWarning" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSafe" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="year" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(year) => year.toString()}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    label={{ value: 'Expirações', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value} patente(s)`, 'Expirações']}
                    labelFormatter={(year) => `Ano ${year}`}
                  />
                  <ReferenceLine x={new Date().getFullYear()} stroke="#6366F1" strokeDasharray="3 3" label="Hoje" />
                  <Area 
                    type="monotone" 
                    dataKey="expirations" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    fill="url(#colorSafe)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-red-200 border-2 border-red-500" />
                <span className="text-muted-foreground">Crítico (&lt;2 anos)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-yellow-200 border-2 border-yellow-500" />
                <span className="text-muted-foreground">Atenção (2-5 anos)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-emerald-200 border-2 border-emerald-500" />
                <span className="text-muted-foreground">Seguro (&gt;5 anos)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Predictive Intelligence - Confidence Distribution */}
        {totalConfidencePatents > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Distribuição por Nível de Confiança
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Classificação de certeza dos dados de patentes segundo metodologia Pharmyrus v30.4
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Tier Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {confidenceData.map((tier) => (
                  <Card 
                    key={tier.name} 
                    className="border-2"
                    style={{ borderColor: tier.color + '40', backgroundColor: tier.color + '08' }}
                  >
                    <CardContent className="pt-4 pb-3 text-center">
                      <div className="text-2xl font-bold" style={{ color: tier.color }}>
                        {tier.count}
                      </div>
                      <div className="text-xs font-semibold mt-1">{tier.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {tier.confidence}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Bar Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={confidenceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {confidenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Disclaimer */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900">Aviso Legal Importante</p>
                    <p className="text-amber-800 mt-1">
                      Dados marcados como <strong>INFERRED</strong>, <strong>EXPECTED</strong>, <strong>PREDICTED</strong> ou <strong>SPECULATIVE</strong> 
                      representam previsões analíticas. Verificação independente junto ao INPI é obrigatória antes de uso em análises de FTO ou decisões estratégicas.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Patentes Identificadas ({patents.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em uma patente para ver detalhes completos
                </p>
              </div>
              
              {patents.length > 10 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllPatents(!showAllPatents)}
                >
                  {showAllPatents ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Mostrar todas
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <PatentListVirtual 
              patents={showAllPatents ? patents : patents.slice(0, 10)}
              onPatentClick={setSelectedPatent}
            />
            
            {!showAllPatents && patents.length > 10 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllPatents(true)}
                >
                  Carregar mais {patents.length - 10} patentes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back button */}
        <div className="flex justify-center">
          <Link to="/">
            <Button variant="outline" size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Nova Busca
            </Button>
          </Link>
        </div>
      </main>

      {/* Patent Detail Modal */}
      <PatentModal 
        patent={selectedPatent}
        open={!!selectedPatent}
        onOpenChange={(open) => !open && setSelectedPatent(null)}
      />
    </div>
  )
}

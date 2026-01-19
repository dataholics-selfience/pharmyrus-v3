import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, FileDown, Search, Clock, AlertTriangle,
  Database, TrendingDown, Lightbulb, ChevronDown, ChevronUp,
  PieChart as PieChartIcon, Microscope
} from 'lucide-react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine,
  Cell, PieChart, Pie
} from 'recharts'
import { PatentModal } from '@/components/PatentModal'
import { PatentListVirtual } from '@/components/PatentListVirtual'
import { MoleculeViewer } from '@/components/MoleculeViewer'
import { RDModal } from '@/components/RDModal'
import { TimelineModal } from '@/components/TimelineModal'
import { ConfidenceModal } from '@/components/ConfidenceModal'
import { useExportExcel } from '@/hooks/useExportExcel'
import { AIAnalysisCard } from '@/components/AIAnalysisCard'
import { 
  mergePatentVariants, 
  inferredEventToPatent,
  isPredictedPatent
} from '@/lib/patentUtils'

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
    inferred_events?: Array<any>
  }
  research_and_development?: {
    molecular_data?: {
      smiles?: string
      molecular_formula?: string
      molecular_weight?: number
      iupac_name?: string
      cas_number?: string
      pubchem_cid?: number | string
    }
    clinical_trials_data?: any
    fda_data?: any
    pubmed_data?: any
  }
}

export function ResultsScientificPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { result } = location.state as { result: ResultData } || {}
  
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null)
  const [showAllPatents, setShowAllPatents] = useState(false)
  const [timelineModalOpen, setTimelineModalOpen] = useState(false)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [confidenceModalOpen, setConfidenceModalOpen] = useState(false)
  const [rdModalOpen, setRdModalOpen] = useState(false)

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

  const metadata = result.metadata || {
    search_id: '',
    molecule_name: '',
    brand_name: '',
    search_date: '',
    target_countries: [],
    elapsed_seconds: 0,
    version: ''
  }
  const discovery = result.patent_discovery || {
    summary: {
      total_patents: 0,
      total_wo_patents: 0,
      by_country: {},
      by_source: {}
    },
    patent_cliff: {
      first_expiration: '',
      last_expiration: '',
      years_until_cliff: 0,
      status: '',
      all_expirations: []
    },
    all_patents: []
  }
  const summary = discovery.summary || {
    total_patents: 0,
    total_wo_patents: 0,
    by_country: {},
    by_source: {}
  }
  const cliff = discovery.patent_cliff || {
    first_expiration: '',
    last_expiration: '',
    years_until_cliff: 0,
    status: '',
    all_expirations: []
  }
  const patents = discovery.all_patents || []
  const predictive = result.predictive_intelligence?.summary?.by_confidence_tier || {}
  const molecularData = result.research_and_development?.molecular_data

  // Process patents: merge variants and add predictions
  const processedPatents = useMemo(() => {
    let allPatents = [...patents]
    
    // Add predicted patents from inferred_events
    const inferredEvents = result.predictive_intelligence?.inferred_events || []
    const predictedPatents = inferredEvents
      .map(inferredEventToPatent)
      .filter((p): p is Patent => p !== null)
    
    allPatents = [...allPatents, ...predictedPatents]
    
    // Merge patent variants (A2, B1, etc.)
    const merged = mergePatentVariants(allPatents)
    
    return merged
  }, [patents, result.predictive_intelligence])

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

  // Get patents for a specific year
  const getPatentsByYear = (year: number) => {
    return processedPatents.filter(p => {
      if (!p.expiration_date) return false
      const expYear = new Date(p.expiration_date).getFullYear()
      return expYear === year
    })
  }

  // Handle timeline click
  const handleTimelineClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedYear = data.activePayload[0].payload.year
      setSelectedYear(clickedYear)
      setTimelineModalOpen(true)
    }
  }

  const { exportToExcel, exportToCSV } = useExportExcel()

  const handleExport = async () => {
    try {
      const result = await exportToExcel(patents, metadata.molecule_name)
      if (result.success) {
        console.log('✅ Excel exportado:', result.filename)
      } else {
        // Fallback to CSV
        console.warn('⚠️ Excel falhou, tentando CSV...')
        const csvResult = exportToCSV(patents, metadata.molecule_name)
        if (!csvResult.success) {
          alert('Erro ao exportar: ' + result.error)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      // Fallback to CSV
      const csvResult = exportToCSV(patents, metadata.molecule_name)
      if (!csvResult.success) {
        alert('Erro ao exportar dados')
      }
    }
  }

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
              <div className="w-16 h-16 -my-2">
                <MoleculeViewer 
                  smiles={molecularData?.smiles} 
                  moleculeName={metadata.molecule_name}
                  pubchemCid={molecularData?.pubchem_cid}
                  width={64} 
                  height={64} 
                />
              </div>
              <div>
                <h1 className="font-semibold text-lg">{metadata.molecule_name}</h1>
                {metadata.brand_name && (
                  <p className="text-sm text-muted-foreground">{metadata.brand_name}</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a href="#rd-section">
              <Button variant="ghost" size="sm" className="text-primary">
                <Microscope className="h-4 w-4 mr-2" />
                P&D
              </Button>
            </a>
            <Button variant="outline" size="sm" onClick={handleExport}>
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

          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setConfidenceModalOpen(true)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" />
                Nível de Confiança
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-3">
                {/* Mini Pie Chart */}
                <div className="h-16 w-16 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={confidenceData}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={15}
                        outerRadius={30}
                        paddingAngle={2}
                      >
                        {confidenceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1">
                    {confidenceData.slice(0, 3).map(tier => (
                      <Badge 
                        key={tier.name}
                        variant="outline" 
                        className="text-[10px] px-1.5 py-0"
                        style={{ borderColor: tier.color, color: tier.color }}
                      >
                        {tier.name.slice(0, 3)}: {tier.count}
                      </Badge>
                    ))}
                    {confidenceData.length > 3 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        +{confidenceData.length - 3}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Clique para detalhes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Analysis Card - Phase 7 */}
        <AIAnalysisCard
          moleculeName={metadata.molecule_name}
          totalPatents={summary.total_patents}
          cliffStatus={cliff.status || 'Unknown'}
          firstExpiration={cliff.first_expiration || 'N/A'}
          countries={metadata.target_countries || ['BR']}
          sources={Object.keys(summary.by_source || {}).filter(s => summary.by_source[s] > 0)}
          autoLoad={true}
          jobId={metadata.search_id}
        />

        {/* Patent Cliff Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Patent Cliff Timeline
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em um ano para ver as patentes que expiram nessa data
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} onClick={handleTimelineClick} style={{ cursor: 'pointer' }}>
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
                    formatter={(value: number) => [`${value} patente(s) - Clique para ver`, 'Expirações']}
                    labelFormatter={(year) => `Ano ${year}`}
                  />
                  <ReferenceLine x={new Date().getFullYear()} stroke="#6366F1" strokeDasharray="3 3" label="Hoje" />
                  <Area 
                    type="monotone" 
                    dataKey="expirations" 
                    stroke="#6366F1" 
                    strokeWidth={2}
                    fill="url(#colorSafe)"
                    activeDot={{ r: 8, stroke: '#6366F1', strokeWidth: 2, fill: 'white', cursor: 'pointer' }}
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

        {/* R&D Section - Now as Modal */}
        <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Microscope className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Pesquisa & Desenvolvimento</h2>
                  <p className="text-sm text-muted-foreground">
                    Dados moleculares, ensaios clínicos, aprovações regulatórias e literatura científica
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setRdModalOpen(true)}
                className="gap-2"
              >
                <Microscope className="h-4 w-4" />
                Ver Detalhes P&D
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Patents List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Patentes Identificadas ({processedPatents.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Clique em uma patente para ver detalhes completos
                </p>
              </div>
              
              {processedPatents.length > 10 && (
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
              patents={showAllPatents ? patents : processedPatents.slice(0, 10)}
              onPatentClick={setSelectedPatent}
            />
            
            {!showAllPatents && processedPatents.length > 10 && (
              <div className="text-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAllPatents(true)}
                >
                  Carregar mais {processedPatents.length - 10} patentes
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
        jobId={metadata.search_id}
      />

      {/* R&D Modal */}
      <RDModal
        open={rdModalOpen}
        onOpenChange={setRdModalOpen}
        molecularData={result.research_and_development?.molecular_data}
        clinicalTrials={result.research_and_development?.clinical_trials_data}
        fdaData={result.research_and_development?.fda_data}
        pubmedData={result.research_and_development?.pubmed_data}
        moleculeName={metadata.molecule_name}
      />

      {/* Timeline Modal - Patents by Year */}
      <TimelineModal
        open={timelineModalOpen}
        onOpenChange={setTimelineModalOpen}
        year={selectedYear || new Date().getFullYear()}
        patents={selectedYear ? getPatentsByYear(selectedYear) : []}
        onPatentClick={(patent) => setSelectedPatent(patent as Patent)}
      />

      {/* Confidence Distribution Modal */}
      <ConfidenceModal
        open={confidenceModalOpen}
        onOpenChange={setConfidenceModalOpen}
        data={confidenceData}
        totalPatents={totalConfidencePatents}
      />
    </div>
  )
}

import { useLocation, Link, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, FileDown, Search, Clock, AlertTriangle,
  Database, TrendingDown, Lightbulb, ChevronDown, ChevronUp,
  PieChart as PieChartIcon
} from 'lucide-react'
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine,
  Cell, PieChart, Pie
} from 'recharts'
import { PatentModal } from '@/components/PatentModal'
import { PatentListVirtual } from '@/components/PatentListVirtual'
import { MoleculeViewer } from '@/components/MoleculeViewer'
import { MoleculeCard } from '@/components/MoleculeCard'
import { TimelineModal } from '@/components/TimelineModal'
import { ConfidenceModal } from '@/components/ConfidenceModal'
import { ChatPanel } from '@/components/DrRoot/ChatPanel'
import { PatentListModal } from '@/components/DrRoot/PatentListModal'
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
      development_codes?: string[]
      synonyms?: string[]
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
  
  // Dr. Root chat states
  const [chatListModal, setChatListModal] = useState<{
    open: boolean
    patents: Patent[]
    title: string
  }>({
    open: false,
    patents: [],
    title: ''
  })

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
    console.log('=== PATENT PROCESSING START ===')
    console.log('Input patents:', patents.length)
    
    // STEP 1: Separate patents by type
    const regularPatents: Patent[] = []
    const invalidSuffixedPatents: Patent[] = []
    
    patents.forEach(patent => {
      const hasSuffix = /[ABC][12]$/i.test(patent.patent_number)
      
      if (hasSuffix) {
        // Check if has valid data
        const hasValidDate = !!(
          (patent.filing_date && 
           patent.filing_date !== 'N/A' && 
           patent.filing_date !== 'Invalid Date' &&
           patent.filing_date !== '') ||
          (patent.publication_date && 
           patent.publication_date !== 'N/A' && 
           patent.publication_date !== 'Invalid Date' &&
           patent.publication_date !== '')
        )
        const hasContent = !!(patent.title || patent.applicants?.length > 0)
        
        if (hasValidDate && hasContent) {
          regularPatents.push(patent)
        } else {
          console.log('❌ FILTERING OUT invalid suffixed patent:', patent.patent_number, {
            source: patent.source,
            filing_date: patent.filing_date,
            has_title: !!patent.title
          })
          invalidSuffixedPatents.push(patent)
        }
      } else {
        regularPatents.push(patent)
      }
    })
    
    console.log('Regular patents (kept):', regularPatents.length)
    console.log('Invalid suffixed (removed):', invalidSuffixedPatents.length)
    
    // STEP 2: Add predictions
    const inferredEvents = result.predictive_intelligence?.inferred_events || []
    console.log('Inferred events found:', inferredEvents.length)
    
    const predictedPatents = inferredEvents
      .map(event => {
        if (!event) return null
        
        const sourcePatent = event.source_patent || {}
        const brPrediction = event.brazilian_prediction || {}
        const confidence = event.enhanced_v30_4 || event.confidence_analysis || {}
        
        return {
          patent_number: brPrediction.br_number || event.event_id || sourcePatent.wo_number || 'PENDING',
          country: 'BR',
          source: 'Predictive Intelligence',
          title: sourcePatent.wo_title || 'Título não disponível',
          applicants: sourcePatent.applicant ? [sourcePatent.applicant] : [],
          inventors: [],
          ipc_codes: sourcePatent.ipc_classification || [],
          filing_date: sourcePatent.priority_date || sourcePatent.wo_filing_date || '',
          publication_date: sourcePatent.wo_publication_date || '',
          grant_date: '',
          expiration_date: brPrediction.expected_expiration || '',
          years_until_expiration: undefined,
          patent_status: brPrediction.status || event.event_type || 'PREDICTED',
          wo_number: sourcePatent.wo_number || '',
          pct_number: '',
          link_national: '',
          abstract: sourcePatent.wo_abstract || '',
          confidence_tier: confidence.tier_classification || confidence.confidence_tier || 'PREDICTED',
          confidence_score: confidence.confidence_score || confidence.overall_confidence || 0,
          _isPrediction: true,
          _predictionData: {
            eventId: event.event_id,
            eventType: event.event_type,
            filingWindow: brPrediction.filing_window,
            warnings: event.warnings || [],
            verification: event.validation || {}
          }
        } as Patent
      })
      .filter((p): p is Patent => p !== null)
    
    console.log('Predicted patents created:', predictedPatents.length)
    
    // STEP 3: Merge all
    const allPatents = [...regularPatents, ...predictedPatents]
    console.log('Total patents after merge:', allPatents.length)
    console.log('=== PATENT PROCESSING END ===')
    
    return allPatents
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
    
    // Get all years with data
    const yearsWithData = Array.from(yearMap.keys()).sort((a, b) => a - b)
    
    if (yearsWithData.length === 0) return []
    
    const firstYear = Math.min(currentYear, yearsWithData[0] - 1)
    const lastYear = yearsWithData[yearsWithData.length - 1] + 1
    
    const data = []
    
    for (let year = firstYear; year <= lastYear; year++) {
      const count = yearMap.get(year) || 0
      const yearsFromNow = year - currentYear
      
      // Only include years with data OR one year buffer before/after
      if (count > 0 || year === firstYear || year === lastYear) {
        data.push({
          year,
          expirations: count,
          yearsFromNow,
          zone: yearsFromNow < 2 ? 'critical' : yearsFromNow < 5 ? 'warning' : 'safe'
        })
      }
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
      const result = await exportToExcel(processedPatents, metadata.molecule_name)
      if (result.success) {
        console.log('✅ Excel exportado:', result.filename)
      } else {
        // Fallback to CSV
        console.warn('⚠️ Excel falhou, tentando CSV...')
        const csvResult = exportToCSV(processedPatents, metadata.molecule_name)
        if (!csvResult.success) {
          alert('Erro ao exportar: ' + result.error)
        }
      }
    } catch (error) {
      console.error('❌ Erro ao exportar:', error)
      // Fallback to CSV
      const csvResult = exportToCSV(processedPatents, metadata.molecule_name)
      if (!csvResult.success) {
        alert('Erro ao exportar dados')
      }
    }
  }

  // Dr. Root handlers
  const handleChatPatentClick = (patentNumber: string) => {
    const patent = processedPatents.find(p => p.patent_number === patentNumber)
    if (patent) {
      setSelectedPatent(patent)
    }
  }

  const handleChatPatentListClick = (patents: Patent[], title: string) => {
    setChatListModal({
      open: true,
      patents,
      title
    })
  }

  const filterPatentsByType = (filter: string): Patent[] => {
    switch (filter) {
      case 'all':
        return processedPatents
      case 'confirmed':
        return processedPatents.filter(p => !(p as any)._isPrediction)
      case 'predicted':
        return processedPatents.filter(p => (p as any)._isPrediction)
      case 'expiring-soon':
        return processedPatents
          .filter(p => p.years_until_expiration && p.years_until_expiration < 3)
          .sort((a, b) => (a.years_until_expiration || 0) - (b.years_until_expiration || 0))
      case 'high-risk':
        return processedPatents.filter(p => p.years_until_expiration && p.years_until_expiration < 2)
      default:
        return processedPatents
    }
  }

  // Create enriched data for Dr. Root with processed patents
  const enrichedPatentData = useMemo(() => ({
    ...result,
    all_patents: processedPatents, // ← KEY: Replace with processed patents!
    metadata: {
      ...metadata,
      total_processed: processedPatents.length,
      confirmed_count: processedPatents.filter(p => !(p as any)._isPrediction).length,
      predicted_count: processedPatents.filter(p => (p as any)._isPrediction).length
    }
  }), [result, processedPatents, metadata])

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

        {/* Molecule Card + AI Analysis in 2-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Molecule 3D + Data */}
          <MoleculeCard
            moleculeName={metadata.molecule_name}
            brandName={metadata.brand_name}
            smiles={molecularData?.smiles}
            pubchemCid={molecularData?.pubchem_cid}
            molecularData={{
              development_codes: molecularData?.development_codes,
              synonyms: molecularData?.synonyms,
              cas_number: molecularData?.cas_number,
              molecular_formula: molecularData?.molecular_formula,
              molecular_weight: molecularData?.molecular_weight
            }}
          />

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
        </div>

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
                  Inclui {processedPatents.filter(p => !(p as any)._isPrediction).length} patentes confirmadas + {processedPatents.filter(p => (p as any)._isPrediction).length} predições | Clique para detalhes
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
              patents={showAllPatents ? processedPatents : processedPatents.slice(0, 10)}
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

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8 mt-12">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                Gerado por <strong className="text-foreground">Pharmyrus Patent Analysis 2.0</strong> - FTO (Freedom to Operate)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Todos os direitos reservados.
              </p>
            </div>
            <div>
              <a 
                href="https://wa.me/5511995736666" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                SUPORTE
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Patent Detail Modal */}
      <PatentModal 
        patent={selectedPatent}
        open={!!selectedPatent}
        onOpenChange={(open) => !open && setSelectedPatent(null)}
        jobId={metadata.search_id}
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

      {/* Dr. Root Chat Panel */}
      <ChatPanel
        patentData={enrichedPatentData}
        onPatentClick={handleChatPatentClick}
        onPatentListClick={(filterOrPatents: any, title: string) => {
          // Se receber string de filtro, converter para array de patentes
          const patents = typeof filterOrPatents === 'string' 
            ? filterPatentsByType(filterOrPatents)
            : filterOrPatents
          
          handleChatPatentListClick(patents, title)
        }}
        onReportGenerate={(reportType, data) => {
          console.log('Generate report:', reportType, data)
          // TODO: Implement report generation in Phase 2
        }}
      />

      {/* Patent List Modal from Chat */}
      <PatentListModal
        open={chatListModal.open}
        onOpenChange={(open) => setChatListModal(prev => ({ ...prev, open }))}
        patents={chatListModal.patents}
        title={chatListModal.title}
        onPatentClick={setSelectedPatent}
      />
    </div>
  )
}

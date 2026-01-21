import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts'
import { usePatentCliff, PatentCliffData } from '@/hooks/usePatentCliff'
import { Calendar, TrendingDown, AlertTriangle, RefreshCw, Search } from 'lucide-react'

export function PatentCliffTimeline() {
  const { 
    data, 
    yearGroups, 
    loading, 
    error,
    reload,
    getTotalMolecules,
    getTotalPatents 
  } = usePatentCliff()

  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  // Filtrar dados por busca
  const filteredData = data.filter(item =>
    item.molecule.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (item.brand && item.brand.toLowerCase().includes(searchFilter.toLowerCase()))
  )

  // Preparar dados para o scatter chart
  const chartData = yearGroups.map(group => ({
    year: group.year,
    count: group.count,
    molecules: group.molecules
  }))

  // Cores por status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return '#94a3b8' // gray
      case 'critical': return '#ef4444' // red
      case 'warning': return '#f59e0b' // amber
      default: return '#3b82f6' // blue
    }
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null

    const yearData = payload[0].payload
    const molecules = yearData.molecules.slice(0, 5) // Mostrar primeiras 5

    return (
      <Card className="p-4 shadow-lg border-2 max-w-sm">
        <div className="space-y-2">
          <div className="font-bold text-lg">{yearData.year}</div>
          
          <div className="text-sm text-muted-foreground">
            {yearData.count} molécula(s) expirando
          </div>

          <div className="space-y-1 mt-3">
            {molecules.map((mol: PatentCliffData, idx: number) => (
              <div key={idx} className="text-sm border-l-2 border-primary pl-2 py-1">
                <div className="font-medium">{mol.molecule}</div>
                {mol.brand && (
                  <div className="text-xs text-muted-foreground">{mol.brand}</div>
                )}
                <div className="text-xs">
                  {new Date(mol.expiration_date).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>

          {yearData.count > 5 && (
            <div className="text-xs text-muted-foreground mt-2">
              +{yearData.count - 5} mais...
            </div>
          )}

          <Button 
            size="sm" 
            className="w-full mt-3"
            onClick={() => setSelectedYear(yearData.year)}
          >
            Ver Todas →
          </Button>
        </div>
      </Card>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-4">
          <AlertTriangle className="h-12 w-12 mx-auto text-destructive" />
          <div>
            <h3 className="text-lg font-semibold">Erro ao carregar dados</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={reload}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Novamente
          </Button>
        </div>
      </Card>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-4">
          <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-30" />
          <div>
            <h3 className="text-lg font-semibold">Nenhuma Patente Encontrada</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Faça buscas de moléculas para popular o Patent Cliff Timeline
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const selectedMolecules = selectedYear 
    ? yearGroups.find(g => g.year === selectedYear)?.molecules || []
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <TrendingDown className="h-8 w-8 text-primary" />
            Patent Cliff Timeline
          </h2>
          <p className="text-muted-foreground mt-1">
            Visualização de expirações de patentes farmacêuticas
          </p>
        </div>
        
        <div className="flex gap-2">
          <Badge variant="outline" className="text-base px-4 py-2">
            {getTotalMolecules()} moléculas
          </Badge>
          <Badge variant="outline" className="text-base px-4 py-2">
            {getTotalPatents()} patentes
          </Badge>
          <Button size="sm" variant="outline" onClick={reload}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filtrar por molécula ou marca..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm">Crítico (&lt;1 ano)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm">Atenção (&lt;3 anos)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-sm">Normal (&gt;3 anos)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400" />
          <span className="text-sm">Expirado</span>
        </div>
      </div>

      {/* Scatter Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição de Expirações por Ano</CardTitle>
          <CardDescription>
            Clique em um ponto para ver detalhes das moléculas daquele ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={500}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              
              <XAxis 
                type="number" 
                dataKey="year" 
                name="Ano"
                domain={['dataMin - 1', 'dataMax + 1']}
                label={{ 
                  value: 'Ano de Expiração', 
                  position: 'insideBottom', 
                  offset: -10 
                }}
              />
              
              <YAxis 
                type="number" 
                dataKey="count" 
                name="Quantidade"
                label={{ 
                  value: 'Quantidade de Moléculas', 
                  angle: -90, 
                  position: 'insideLeft' 
                }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              <Scatter 
                data={chartData} 
                fill="#3b82f6"
                onClick={(data) => setSelectedYear(data.year)}
                cursor="pointer"
              >
                {chartData.map((entry, index) => {
                  // Determinar cor dominante do grupo
                  const criticalCount = entry.molecules.filter(m => m.status === 'critical').length
                  const warningCount = entry.molecules.filter(m => m.status === 'warning').length
                  const expiredCount = entry.molecules.filter(m => m.status === 'expired').length
                  
                  let color = '#3b82f6' // blue (normal)
                  if (expiredCount > entry.count / 2) color = '#94a3b8' // gray
                  else if (criticalCount > 0) color = '#ef4444' // red
                  else if (warningCount > 0) color = '#f59e0b' // amber
                  
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={color}
                      fillOpacity={selectedYear === entry.year ? 1 : 0.7}
                      stroke={selectedYear === entry.year ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  )
                })}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed List (when year selected) */}
      {selectedYear && selectedMolecules.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Patentes Expirando em {selectedYear}</CardTitle>
                <CardDescription>
                  {selectedMolecules.length} molécula(s) com primeira expiração neste ano
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedYear(null)}
              >
                Fechar ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Molécula</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Data Expiração</TableHead>
                  <TableHead>Patentes BR</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedMolecules.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{item.molecule}</TableCell>
                    <TableCell>{item.brand || '-'}</TableCell>
                    <TableCell>
                      {new Date(item.expiration_date).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.patents_count}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={
                          item.status === 'expired' ? 'bg-gray-500' :
                          item.status === 'critical' ? 'bg-red-500' :
                          item.status === 'warning' ? 'bg-amber-500' :
                          'bg-blue-500'
                        }
                      >
                        {item.status === 'expired' ? 'Expirado' :
                         item.status === 'critical' ? 'Crítico' :
                         item.status === 'warning' ? 'Atenção' :
                         'Normal'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

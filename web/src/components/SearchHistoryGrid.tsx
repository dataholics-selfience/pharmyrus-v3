import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  History, Clock, FileText, ChevronRight, 
  Trash2, RefreshCw, AlertCircle
} from 'lucide-react'
import { MoleculeViewer } from './MoleculeViewer'
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/hooks/useAuth'

interface SearchHistoryItem {
  id: string
  molecule_name: string
  brand_name?: string
  smiles?: string
  search_date: string
  total_patents: number
  countries: string[]
  patent_cliff_status?: string
  first_expiration?: string
  cached_result?: any // Full result for quick reload
}

interface SearchHistoryGridProps {
  maxItems?: number
  onReload?: (result: any) => void
}

export function SearchHistoryGrid({ maxItems = 6, onReload }: SearchHistoryGridProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [history, setHistory] = useState<SearchHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch search history from Firestore
  useEffect(() => {
    if (!user) {
      setHistory([])
      setLoading(false)
      return
    }

    const fetchHistory = async () => {
      try {
        setLoading(true)
        setError(null)

        const historyRef = collection(db, 'search_history')
        const q = query(
          historyRef,
          where('user_id', '==', user.uid),
          orderBy('search_date', 'desc'),
          limit(maxItems)
        )

        const snapshot = await getDocs(q)
        const items: SearchHistoryItem[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          items.push({
            id: doc.id,
            molecule_name: data.molecule_name || 'Unknown',
            brand_name: data.brand_name,
            smiles: data.smiles || data.molecular_data?.smiles,
            search_date: data.search_date,
            total_patents: data.total_patents || 0,
            countries: data.countries || ['BR'],
            patent_cliff_status: data.patent_cliff_status,
            first_expiration: data.first_expiration,
            cached_result: data.cached_result
          })
        })

        setHistory(items)
      } catch (err) {
        console.error('Error fetching history:', err)
        setError('Erro ao carregar histórico')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [user, maxItems])

  // Handle click on history item
  const handleItemClick = (item: SearchHistoryItem) => {
    if (item.cached_result) {
      // Use cached result directly
      if (onReload) {
        onReload(item.cached_result)
      } else {
        navigate('/results/scientific', { state: { result: item.cached_result } })
      }
    } else {
      // Re-run search
      navigate('/search', {
        state: {
          molecule: item.molecule_name,
          brand: item.brand_name,
          countries: item.countries
        }
      })
    }
  }

  // Handle delete
  const handleDelete = async (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    
    if (!confirm('Remover esta busca do histórico?')) return

    try {
      setDeletingId(itemId)
      await deleteDoc(doc(db, 'search_history', itemId))
      setHistory(prev => prev.filter(item => item.id !== itemId))
    } catch (err) {
      console.error('Error deleting:', err)
      alert('Erro ao remover do histórico')
    } finally {
      setDeletingId(null)
    }
  }

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  // Get cliff status color
  const getCliffColor = (status?: string) => {
    if (!status) return 'bg-gray-100 text-gray-600'
    const lower = status.toLowerCase()
    if (lower.includes('critical') || lower.includes('iminente')) return 'bg-red-100 text-red-700'
    if (lower.includes('warning') || lower.includes('próximo')) return 'bg-amber-100 text-amber-700'
    return 'bg-emerald-100 text-emerald-700'
  }

  // Don't show if not logged in
  if (!user) return null

  // Loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <History className="h-5 w-5" />
          <span className="font-medium">Histórico de Buscas</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="h-32 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
        <AlertCircle className="h-4 w-4" />
        <span>{error}</span>
      </div>
    )
  }

  // Empty state
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Nenhuma busca realizada ainda</p>
        <p className="text-xs mt-1">Suas buscas aparecerão aqui</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ❌ REMOVIDO: Header "Histórico de Buscas" 
          Conforme solicitado pelo usuário
      */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((item) => (
          <Card 
            key={item.id}
            className="overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/50 group"
            onClick={() => handleItemClick(item)}
          >
            <CardContent className="p-0">
              {/* 3D Molecule Viewer */}
              <div className="relative h-32 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
                {item.smiles ? (
                  <MoleculeViewer 
                    smiles={item.smiles} 
                    width={200} 
                    height={128}
                    rotating={true}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-4xl font-bold text-slate-200">
                      {item.molecule_name.charAt(0).toUpperCase()}
                    </div>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button variant="secondary" size="sm" className="gap-1">
                    <RefreshCw className="h-3 w-3" />
                    Carregar
                  </Button>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-red-100 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                  disabled={deletingId === item.id}
                >
                  {deletingId === item.id ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {item.molecule_name}
                  </h3>
                  {item.brand_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.brand_name}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    <span>{item.total_patents} patentes</span>
                  </div>
                  
                  {item.patent_cliff_status && (
                    <Badge 
                      variant="secondary" 
                      className={`text-[10px] ${getCliffColor(item.patent_cliff_status)}`}
                    >
                      {item.patent_cliff_status}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(item.search_date)}</span>
                  </div>
                  
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

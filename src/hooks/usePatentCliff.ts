import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export interface PatentCliffData {
  molecule: string
  brand?: string
  expiration_date: string
  year: number
  patents_count: number
  status: string
  cached_at: string
}

export interface YearGroup {
  year: number
  count: number
  molecules: PatentCliffData[]
}

/**
 * Hook para carregar dados de Patent Cliff
 * Busca todas as moléculas em cache e extrai datas de expiração
 */
export function usePatentCliff() {
  const [data, setData] = useState<PatentCliffData[]>([])
  const [yearGroups, setYearGroups] = useState<YearGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatentCliffData()
  }, [])

  const loadPatentCliffData = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('📊 Loading Patent Cliff data...')

      // ESTRATÉGIA: Tentar index primeiro (rápido), fallback para data (lento)
      
      // 1. Tentar patent_cache_index (pre-computed, rápido)
      const indexRef = collection(db, 'patent_cache_index')
      const indexSnapshot = await getDocs(indexRef)

      console.log(`📦 Found ${indexSnapshot.size} molecules in index`)

      const cliffData: PatentCliffData[] = []
      let usedIndex = 0
      let usedFallback = 0

      // Processar index
      indexSnapshot.forEach((doc) => {
        const docData = doc.data()
        
        try {
          // OPÇÃO A: Usar patent_cliff pre-computed (RÁPIDO) ✅
          if (docData.patent_cliff && docData.patent_cliff.earliest_expiration) {
            const cliff = docData.patent_cliff
            
            cliffData.push({
              molecule: docData.molecule || 'Unknown',
              brand: docData.brand,
              expiration_date: cliff.earliest_expiration,
              year: new Date(cliff.earliest_expiration).getFullYear(),
              patents_count: cliff.total_br_patents || 0,
              status: cliff.status || 'active',
              cached_at: docData.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString()
            })

            usedIndex++
            console.log(`  ✅ ${docData.molecule}: usando patent_cliff pre-computed`)
            return
          }
          
          console.log(`  ⚠️ ${docData.molecule}: sem patent_cliff, precisa buscar data completa`)
          usedFallback++
          
        } catch (err) {
          console.error(`  ❌ Error processing ${docData.molecule}:`, err)
        }
      })

      // 2. Se não conseguiu dados suficientes do index, buscar de patent_cache_data
      if (cliffData.length === 0) {
        console.log('⚠️ Nenhum dado no index, buscando patent_cache_data...')
        
        const cacheRef = collection(db, 'patent_cache_data')
        const snapshot = await getDocs(cacheRef)

        console.log(`📦 Found ${snapshot.size} cached molecules in data`)

        // Processar cada molécula (LENTO)
        snapshot.forEach((doc) => {
          const docData = doc.data()
          
          try {
            // Extrair patentes brasileiras
            const patents = docData.patent_discovery?.brazilian_patents || []
            
            if (patents.length === 0) {
              console.log(`  ⚠️ ${docData.molecule}: sem patentes brasileiras`)
              return
            }

            // Extrair datas de expiração
            const expirations = patents
              .map((p: any) => p.expiration_date)
              .filter(Boolean)
              .sort()

            if (expirations.length === 0) {
              console.log(`  ⚠️ ${docData.molecule}: sem datas de expiração`)
              return
            }

            // Usar a primeira expiração (earliest = patent cliff real)
            const earliestExpiration = expirations[0]
            const year = new Date(earliestExpiration).getFullYear()

            // Determinar status baseado em datas
            let status = 'active'
            const now = new Date()
            const expDate = new Date(earliestExpiration)
            const daysUntil = Math.floor((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

            if (daysUntil < 0) {
              status = 'expired'
            } else if (daysUntil < 365) {
              status = 'critical' // < 1 ano
            } else if (daysUntil < 365 * 3) {
              status = 'warning' // < 3 anos
            }

            cliffData.push({
              molecule: docData.molecule || 'Unknown',
              brand: docData.brand,
              expiration_date: earliestExpiration,
              year: year,
              patents_count: patents.length,
              status: status,
              cached_at: docData.cached_at
            })

            console.log(`  ✅ ${docData.molecule}: ${earliestExpiration} (${patents.length} patentes)`)
            
          } catch (err) {
            console.error(`  ❌ Error processing ${docData.molecule}:`, err)
          }
        })
      }

      // Ordenar por data
      cliffData.sort((a, b) => 
        new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime()
      )

      // Agrupar por ano
      const grouped = groupByYear(cliffData)

      setData(cliffData)
      setYearGroups(grouped)

      console.log(`✅ Loaded ${cliffData.length} molecules`)
      console.log(`📊 Performance: ${usedIndex} from index (fast), ${usedFallback} need fallback`)
      console.log(`📅 Years: ${grouped.map(g => g.year).join(', ')}`)

    } catch (err: any) {
      console.error('Error loading patent cliff data:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const groupByYear = (data: PatentCliffData[]): YearGroup[] => {
    const groups: { [year: number]: PatentCliffData[] } = {}

    data.forEach(item => {
      if (!groups[item.year]) {
        groups[item.year] = []
      }
      groups[item.year].push(item)
    })

    return Object.keys(groups)
      .map(year => ({
        year: parseInt(year),
        count: groups[parseInt(year)].length,
        molecules: groups[parseInt(year)]
      }))
      .sort((a, b) => a.year - b.year)
  }

  const getTotalMolecules = () => data.length

  const getTotalPatents = () => 
    data.reduce((sum, item) => sum + item.patents_count, 0)

  const getYearRange = () => {
    if (yearGroups.length === 0) return null
    return {
      min: yearGroups[0].year,
      max: yearGroups[yearGroups.length - 1].year
    }
  }

  const getMoleculesForYear = (year: number) => 
    yearGroups.find(g => g.year === year)?.molecules || []

  return {
    data,
    yearGroups,
    loading,
    error,
    reload: loadPatentCliffData,
    getTotalMolecules,
    getTotalPatents,
    getYearRange,
    getMoleculesForYear
  }
}

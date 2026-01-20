/**
 * Patent Utilities
 * 
 * Funções para normalização e tratamento de patentes brasileiras
 * com sufixos de tipo de publicação (A2, B1, etc.)
 */

export interface Patent {
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
  [key: string]: any
}

export interface PatentVariant {
  baseNumber: string
  hasData: boolean
  mainPatent: Patent | null
  variants: Array<{
    fullNumber: string
    type: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
    description: string
    patent: Patent
  }>
}

/**
 * Normalize patent number by removing suffix (A2, B1, etc.)
 * BR112020001714A2 → BR112020001714
 */
export function normalizePatentNumber(patentNumber: string): string {
  if (!patentNumber) return ''
  return patentNumber.replace(/[ABC][12]$/i, '')
}

/**
 * Extract patent type suffix
 * BR112020001714A2 → A2
 */
export function getPatentType(patentNumber: string): string | null {
  const match = patentNumber.match(/([ABC][12])$/i)
  return match ? match[1].toUpperCase() : null
}

/**
 * Get description for patent type
 */
export function getPatentTypeDescription(type: string | null): string {
  if (!type) return 'Patente base'
  
  const descriptions: Record<string, string> = {
    'A1': 'Publicação com busca',
    'A2': 'Publicação sem busca',
    'B1': 'Concessão',
    'B2': 'Concessão (nova publicação)',
    'C1': 'Certificado de adição',
    'C2': 'Certificado de adição (republicação)'
  }
  
  return descriptions[type] || type
}

/**
 * Check if patent has meaningful data
 * More strict for regular patents: requires valid dates
 * But accepts predictions even without dates
 */
export function hasPatentData(patent: Patent): boolean {
  // Predictions are always considered to have data
  if ((patent as any)._isPrediction) {
    return true
  }
  
  // For regular patents: must have at least a valid filing date or publication date
  const hasValidDate = !!(
    patent.filing_date && patent.filing_date !== 'N/A' && patent.filing_date !== 'Invalid Date' ||
    patent.publication_date && patent.publication_date !== 'N/A' && patent.publication_date !== 'Invalid Date'
  )
  
  // Must have title or applicants
  const hasBasicInfo = !!(
    patent.title ||
    patent.applicants?.length > 0
  )
  
  return hasValidDate && hasBasicInfo
}

/**
 * Group patents by base number and merge variants
 */
export function groupPatentVariants(patents: Patent[]): PatentVariant[] {
  const groups = new Map<string, Patent[]>()
  
  // Group by base number
  patents.forEach(patent => {
    const base = normalizePatentNumber(patent.patent_number)
    if (!groups.has(base)) {
      groups.set(base, [])
    }
    groups.get(base)!.push(patent)
  })
  
  // Create PatentVariant objects
  const variants: PatentVariant[] = []
  
  groups.forEach((groupPatents, baseNumber) => {
    // Find the patent with most data (usually the base or B1)
    const patentsWithData = groupPatents.filter(hasPatentData)
    const patentsWithoutData = groupPatents.filter(p => !hasPatentData(p))
    
    // Priority: B1 > A2 > A1 > base number
    const mainPatent = patentsWithData.sort((a, b) => {
      const typeA = getPatentType(a.patent_number)
      const typeB = getPatentType(b.patent_number)
      
      const priority: Record<string, number> = {
        'B1': 4,
        'B2': 3,
        'A2': 2,
        'A1': 1
      }
      
      return (priority[typeB || ''] || 0) - (priority[typeA || ''] || 0)
    })[0] || null
    
    const variant: PatentVariant = {
      baseNumber,
      hasData: !!mainPatent,
      mainPatent,
      variants: groupPatents.map(patent => ({
        fullNumber: patent.patent_number,
        type: getPatentType(patent.patent_number) as any || 'A1',
        description: getPatentTypeDescription(getPatentType(patent.patent_number)),
        patent
      }))
    }
    
    variants.push(variant)
  })
  
  return variants
}

/**
 * Merge patent variants into display patents
 * Keeps variants without data as references only
 * IMPROVED: Now merges Google Patents (with suffix) with INPI base (no suffix)
 */
export function mergePatentVariants(patents: Patent[]): Patent[] {
  const grouped = groupPatentVariants(patents)
  const merged: Patent[] = []
  
  grouped.forEach(group => {
    if (group.hasData && group.mainPatent) {
      // Use main patent data
      const mergedPatent: Patent = {
        ...group.mainPatent,
        // Add metadata about variants
        _baseNumber: group.baseNumber,
        _hasVariants: group.variants.length > 1,
        _variantTypes: group.variants.map(v => v.type).join(', '),
        _allVariants: group.variants.map(v => ({
          number: v.fullNumber,
          type: v.type,
          description: v.description,
          hasData: hasPatentData(v.patent)
        }))
      }
      
      merged.push(mergedPatent)
    }
    // Remove else - don't keep placeholders without data
  })
  
  return merged
}

/**
 * Check if patent is a prediction/inferred event
 */
export function isPredictedPatent(patent: any): boolean {
  return !!(
    patent.confidence_tier &&
    ['PREDICTED', 'EXPECTED', 'SPECULATIVE', 'INFERRED'].includes(patent.confidence_tier)
  )
}

/**
 * Convert inferred event to pseudo-patent for display
 */
export function inferredEventToPatent(event: any): Patent | null {
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
    filing_date: sourcePatent.priority_date || '',
    publication_date: sourcePatent.wo_publication_date || '',
    grant_date: '',
    expiration_date: '', // Predictions don't have expiration yet
    years_until_expiration: undefined,
    patent_status: brPrediction.status || event.event_type || 'PREDICTED',
    wo_number: sourcePatent.wo_number || '',
    pct_number: '',
    link_national: '',
    abstract: '',
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
  }
}

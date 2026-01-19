/**
 * PATENT PROCESSING UTILITIES V2
 * 
 * This version AGGRESSIVELY filters out Google Patents with suffixes
 * that don't have valid data, and adds them to the "family" metadata
 * of the main patent.
 */

import { Patent } from './patentUtils'

/**
 * Check if patent number has suffix (A1, A2, B1, B2, C1, C2)
 */
export function hasSuffix(patentNumber: string): boolean {
  return /[ABC][12]$/i.test(patentNumber)
}

/**
 * Remove suffix from patent number
 */
export function removeSuffix(patentNumber: string): string {
  return patentNumber.replace(/[ABC][12]$/i, '')
}

/**
 * Check if patent has valid, usable data
 * STRICT: must have valid dates AND meaningful content
 */
export function isValidPatent(patent: any): boolean {
  // Predictions are always valid
  if (patent._isPrediction) return true
  
  // Must have valid filing or publication date
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
  
  // Must have title OR applicants
  const hasContent = !!(patent.title || patent.applicants?.length > 0)
  
  return hasValidDate && hasContent
}

/**
 * Process patents: 
 * 1. Filter out invalid patents with suffixes
 * 2. Add them to family metadata of base patents
 * 3. Keep valid patents (with or without suffix)
 * 4. Keep all predictions
 */
export function processPatentsForDisplay(patents: any[]): any[] {
  console.log('[processPatents] Starting with', patents.length, 'patents')
  
  // Separate patents with and without suffixes
  const withSuffix: any[] = []
  const withoutSuffix: any[] = []
  
  patents.forEach(patent => {
    if (hasSuffix(patent.patent_number)) {
      withSuffix.push(patent)
    } else {
      withoutSuffix.push(patent)
    }
  })
  
  console.log('[processPatents] With suffix:', withSuffix.length)
  console.log('[processPatents] Without suffix:', withoutSuffix.length)
  
  // Filter suffixed patents: keep only valid ones
  const validSuffixed = withSuffix.filter(p => {
    const valid = isValidPatent(p)
    if (!valid) {
      console.log('[processPatents] REMOVING invalid suffixed patent:', p.patent_number, {
        filing_date: p.filing_date,
        title: p.title?.substring(0, 30)
      })
    }
    return valid
  })
  
  console.log('[processPatents] Valid suffixed:', validSuffixed.length)
  
  // Group invalid suffixed patents by base number
  const invalidByBase = new Map<string, any[]>()
  withSuffix.forEach(p => {
    if (!isValidPatent(p)) {
      const base = removeSuffix(p.patent_number)
      if (!invalidByBase.has(base)) {
        invalidByBase.set(base, [])
      }
      invalidByBase.get(base)!.push(p)
    }
  })
  
  // Add invalid suffixed patents to family metadata of base patents
  const enrichedPatents = [...withoutSuffix, ...validSuffixed].map(patent => {
    const base = removeSuffix(patent.patent_number)
    const relatedInvalid = invalidByBase.get(base) || []
    
    if (relatedInvalid.length > 0) {
      return {
        ...patent,
        _familyVariants: relatedInvalid.map(p => ({
          number: p.patent_number,
          source: p.source,
          hasData: false
        }))
      }
    }
    
    return patent
  })
  
  console.log('[processPatents] Final count:', enrichedPatents.length)
  
  return enrichedPatents
}

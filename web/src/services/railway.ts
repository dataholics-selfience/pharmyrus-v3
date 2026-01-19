/**
 * Railway API Service - FastAPI Async
 * 
 * Flow:
 * 1. POST /.netlify/functions/search-proxy → {job_id}
 * 2. GET /.netlify/functions/search-proxy/status/:id (poll every 20s)
 * 3. GET /.netlify/functions/search-proxy/result/:id
 */

const API_BASE = '/.netlify/functions/search-proxy'

export interface SearchRequest {
  molecule: string
  brand?: string
  countries?: string[]
}

export interface SearchJob {
  job_id: string
  status: 'queued' | 'processing' | 'complete' | 'failed'
  progress?: number
  step?: string
  error?: string
}

export interface SearchResult {
  job_id: string
  metadata: {
    molecule_name: string
    elapsed_seconds: number
  }
  patent_discovery: {
    summary: {
      total_wo_patents: number
      total_patents: number
      by_country: Record<string, number>
      by_source: Record<string, number>
    }
    patent_cliff: {
      expired: number
      expiring_within_2_years: number
      expiring_within_5_years: number
    }
    all_patents: any[]
  }
}

/**
 * Start async search
 */
export async function startSearch(request: SearchRequest): Promise<string> {
  console.log('🔍 Starting search:', request)
  
  const response = await fetch(`${API_BASE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      molecule: request.molecule,
      brand: request.brand || '',
      countries: request.countries || ['BR'],
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Search failed: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  console.log('✅ Job ID:', data.job_id)
  
  return data.job_id
}

/**
 * Check search status
 */
export async function getSearchStatus(jobId: string): Promise<SearchJob> {
  const response = await fetch(`/.netlify/functions/search-status?job_id=${jobId}`)

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Get search result
 */
export async function getSearchResult(jobId: string): Promise<SearchResult> {
  const response = await fetch(`/.netlify/functions/search-result?job_id=${jobId}`)

  if (!response.ok) {
    throw new Error(`Result fetch failed: ${response.status}`)
  }

  return response.json()
}

/**
 * Poll search status until complete
 */
export async function pollSearchStatus(
  jobId: string,
  onProgress: (status: SearchJob) => void,
  intervalMs: number = 20000 // 20s como no script
): Promise<SearchResult> {
  return new Promise((resolve, reject) => {
    let retryCount = 0
    const maxRetries = 3
    
    const poll = async () => {
      try {
        const status = await getSearchStatus(jobId)
        onProgress(status)
        
        // Reset retry count on successful poll
        retryCount = 0

        if (status.status === 'complete') {
          clearInterval(interval)
          const result = await getSearchResult(jobId)
          resolve(result)
        } else if (status.status === 'failed') {
          clearInterval(interval)
          reject(new Error(status.error || 'Search failed'))
        }
        // If status is 'running', continue polling
      } catch (error: any) {
        retryCount++
        console.warn(`⚠️ Poll attempt ${retryCount}/${maxRetries} failed:`, error.message)
        
        // Only reject if we've exceeded max retries
        if (retryCount >= maxRetries) {
          clearInterval(interval)
          reject(new Error(`Polling failed after ${maxRetries} attempts: ${error.message}`))
        }
        // Otherwise, continue polling (API might be temporarily unavailable)
      }
    }

    // Start polling immediately
    poll()
    const interval = setInterval(poll, intervalMs)
    
    // Set overall timeout (15 minutes)
    setTimeout(() => {
      clearInterval(interval)
      reject(new Error('Search timeout - job took longer than 15 minutes'))
    }, 15 * 60 * 1000)
  })
}



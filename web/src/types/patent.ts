// Patent type definitions

export interface Patent {
  patent_number: string
  country: string
  source: string
  title: string
  applicants: string[]
  inventors: string[]
  ipc_codes: string[]
  filing_date: string
  publication_date: string
  grant_date?: string
  expiration_date: string
  years_until_expiration?: number
  patent_status: string
  wo_number?: string
  pct_number?: string
  link_national?: string
  link_espacenet?: string
  link_google_patents?: string
  abstract?: string
  claims?: string
  legal_events?: LegalEvent[]
  confidence_tier?: string
  confidence_score?: number
  _isPrediction?: boolean
  _predictionData?: PredictionData
  _allVariants?: Patent[]
  _familyVariants?: Patent[]
}

export interface LegalEvent {
  date: string
  code: string
  description?: string
}

export interface PredictionData {
  eventId?: string
  eventType?: string
  filingWindow?: {
    pct_30month_deadline?: string
    publication_expected?: string
  }
  warnings?: string[]
  verification?: any
}

export interface PatentSearchResult {
  metadata: {
    molecule_name: string
    brand_name?: string
    countries?: string[]
  }
  discovery: {
    summary: {
      total_patents: number
      total_wo_patents: number
      cliff_status: string
      first_expiration: string
    }
  }
  all_patents: Patent[]
  predictive_intelligence?: {
    inferred_events: any[]
    summary?: any
  }
  research_and_development?: any
}

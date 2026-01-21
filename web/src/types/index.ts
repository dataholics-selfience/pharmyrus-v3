/**
 * Core TypeScript Types for Pharmyrus
 * 
 * These types mirror the Firestore data structure and API responses
 */

// ============================================================================
// USER & AUTHENTICATION
// ============================================================================

export interface User {
  uid: string
  email: string
  displayName: string | null
  phoneNumber: string | null
  cpf?: string
  company?: string
  createdAt: Date
  lastLogin: Date
  role: 'user' | 'admin'
  organizationId?: string
}

export interface SignupData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  cpf: string
  phoneNumber: string
  company: string
}

// ============================================================================
// PLANS & SUBSCRIPTIONS
// ============================================================================

export interface Plan {
  id: string
  name: 'free' | 'basic' | 'intermediate' | 'unlimited'
  displayName: string
  price: number // Monthly price in BRL
  limits: {
    maxUsers: number
    maxSearches: number // Per month
    maxExports?: number
  }
  features: string[]
  stripePriceId?: string
}

export interface UsageQuota {
  searchesThisMonth: number
  exportsThisMonth: number
  resetDate: Date
}

export interface Organization {
  id: string
  name: string
  planId: string
  usageQuota: UsageQuota
  members: string[] // Array of user UIDs
  createdAt: Date
  owner: string // UID of creator
}

// ============================================================================
// PATENT DATA (mirrors Railway API response)
// ============================================================================

export interface Patent {
  patent_number: string
  country: string
  title: string
  publication_date?: string
  filing_date?: string
  priority_date?: string
  applicants?: string[]
  inventors?: string[]
  abstract?: string
  claims?: Claim[]
  family_id?: string
  legal_status?: string
  source: 'INPI' | 'EPO' | 'WIPO' | 'GooglePatents'
  url?: string
  
  // Predictive fields
  isPredicted?: boolean
  confidence_tier?: 'FOUND' | 'INFERRED' | 'EXPECTED' | 'PREDICTED' | 'SPECULATIVE'
  confidence_score?: number
}

export interface Claim {
  claim_number: number
  claim_text: string
  is_independent: boolean
  dependent_on?: number[]
}

export interface PatentFamily {
  family_id: string
  priority_country: string
  priority_date: string
  members: Patent[]
}

// ============================================================================
// SEARCH & RESULTS
// ============================================================================

export interface SearchQuery {
  molecule: string
  brand?: string
  country: 'BR' | 'US' | 'MX'
}

export interface SearchJob {
  jobId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  progress: number
  currentStep: string
  createdAt: Date
  completedAt?: Date
  error?: string
}

export interface SearchResult {
  jobId: string
  query: SearchQuery
  patents: Patent[]
  predictiveIntelligence?: PredictiveIntelligence
  rdData?: RDData
  patentCliff?: PatentCliff
  summary: {
    totalPatents: number
    bySource: Record<string, number>
    byStatus: Record<string, number>
  }
  createdAt: Date
}

// ============================================================================
// PREDICTIVE INTELLIGENCE (from Railway API)
// ============================================================================

export interface PredictiveIntelligence {
  version: string
  generated_at: string
  inferred_events: InferredEvent[]
  summary: {
    total_wipo_patents_analyzed: number
    total_existing_br_patents: number
    total_inferred_events: number
    by_confidence_tier: Record<string, number>
    average_confidence: number
  }
}

export interface InferredEvent {
  event_id: string
  event_type: string
  source_patent: Patent
  brazilian_prediction: {
    status: string
    br_number: string | null
    explanation: string
    filing_window: {
      earliest_filing_date: string
      latest_filing_date: string
      days_until_deadline: number
    }
    confidence_analysis: {
      overall_confidence: number
      confidence_tier: string
      factors: Record<string, any>
    }
  }
}

// ============================================================================
// R&D DATA
// ============================================================================

export interface RDData {
  clinical_trials: ClinicalTrial[]
  regulatory_status: RegulatoryStatus
  market_analysis: MarketAnalysis
}

export interface ClinicalTrial {
  nct_id: string
  title: string
  status: string
  phase: string
  start_date?: string
  completion_date?: string
  sponsor: string
  conditions: string[]
  interventions: string[]
  locations: string[]
  url: string
}

export interface RegulatoryStatus {
  fda_status?: string
  ema_status?: string
  anvisa_status?: string
  approvals: Approval[]
}

export interface Approval {
  agency: string
  date: string
  indication: string
  status: 'approved' | 'pending' | 'rejected'
}

export interface MarketAnalysis {
  estimated_revenue?: number
  market_size?: number
  competitors: string[]
}

// ============================================================================
// PATENT CLIFF
// ============================================================================

export interface PatentCliff {
  critical_dates: CriticalDate[]
  loss_of_exclusivity: string // Date
  estimated_revenue_impact: number
  generic_entry_risk: 'low' | 'medium' | 'high'
  recommendations: string[]
}

export interface CriticalDate {
  date: string
  type: 'filing' | 'grant' | 'expiration' | 'predicted'
  patent_number: string
  description: string
  impact: 'low' | 'medium' | 'high' | 'critical'
}

// ============================================================================
// AI ANALYSIS (Groq)
// ============================================================================

export interface AIAnalysis {
  id: string
  patentId: string
  type: 'patent_summary' | 'dashboard_summary' | 'risk_analysis'
  content: string
  generated_at: Date
  model: string // e.g., 'llama-3.3-70b-versatile'
}

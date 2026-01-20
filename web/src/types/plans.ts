/**
 * Types for Plans and Subscriptions System - FINAL VERSION
 */

export type OrganizationType = 'company' | 'individual'
export type SubscriptionStatus = 'active' | 'paused' | 'expired' | 'cancelled' | 'trial'
export type UserRole = 'admin' | 'member'

export interface Plan {
  id: string
  name: string
  description: string
  price: number // em reais (mensal)
  searchesPerUser: number
  maxUsers: number
  features: string[]
  isActive: boolean
  isTrial?: boolean
  trialDays?: number
  createdAt: Date
  updatedAt: Date
}

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  cnpj?: string | null
  email: string
  phone?: string | null
  userId?: string | null
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Subscription {
  id: string
  organizationId: string
  organizationName: string
  planId: string
  planName: string
  maxUsers: number
  searchesPerUser: number
  totalSearchesLimit: number
  currentUsers: number
  totalSearchesUsed: number
  startDate: Date
  endDate: Date
  status: SubscriptionStatus
  isTrial: boolean
  autoRenew: boolean
  renewalNotificationSent: boolean
  monthlyPrice: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Invoice {
  id: string
  subscriptionId: string
  number: string
  amount: number
  issueDate: Date
  fileUrl: string
  fileName: string
  status: 'pending' | 'paid'
  uploadedAt: Date
  uploadedBy: string
}

export interface RenewalAlert {
  id: string
  subscriptionId: string
  organizationName: string
  planName: string
  expiresAt: Date
  daysUntilExpiry: number
  status: 'pending' | 'resolved'
  invoiceUploaded: boolean
  createdAt: Date
}

export const DEFAULT_PLANS: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Básico',
    description: 'Plano gratuito vitalício',
    price: 0,
    searchesPerUser: 1,
    maxUsers: 1,
    features: ['1 consulta vitalícia', '1 usuário'],
    isActive: true
  },
  {
    name: 'Teste',
    description: 'Teste de 15 dias',
    price: 0,
    searchesPerUser: 30,
    maxUsers: 3,
    features: ['30 consultas/usuário', '3 usuários', '15 dias'],
    isActive: true,
    isTrial: true,
    trialDays: 15
  },
  {
    name: 'Essencial',
    description: 'Para profissionais',
    price: 3500,
    searchesPerUser: 10,
    maxUsers: 1,
    features: ['10 consultas/mês', '1 usuário'],
    isActive: true
  },
  {
    name: 'Profissional',
    description: 'Para equipes',
    price: 7000,
    searchesPerUser: 25,
    maxUsers: 3,
    features: ['25 consultas/mês', '3 usuários'],
    isActive: true
  },
  {
    name: 'Enterprise',
    description: 'Para empresas',
    price: 15000,
    searchesPerUser: 150,
    maxUsers: 15,
    features: ['150 consultas/mês', '15 usuários'],
    isActive: true
  }
]

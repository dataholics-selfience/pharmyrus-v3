/**
 * Types for Plans and Subscriptions System
 */

export interface Plan {
  id: string
  name: string
  price: number // em reais
  searches: number // consultas por usuário
  maxUsers: number // número máximo de usuários
  features: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserPlan {
  userId: string
  planId: string
  role: 'admin' | 'member' // admin pode adicionar membros
  searchesUsed: number
  searchesLimit: number
  status: 'active' | 'expired' | 'blocked'
  createdAt: Date
  updatedAt: Date
  expiresAt: Date | null
}

export interface PlanMembership {
  planId: string
  adminUserId: string // quem criou/gerencia o plano
  memberUserIds: string[] // lista de membros
  totalSearches: number // total usado por todos
  createdAt: Date
  updatedAt: Date
}

export const DEFAULT_PLANS: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Básico',
    price: 0,
    searches: 1,
    maxUsers: 1,
    features: [
      '1 consulta de patentes',
      '1 usuário',
      'Busca básica',
      'Resultados limitados'
    ],
    isActive: true
  },
  {
    name: 'Essencial',
    price: 3500,
    searches: 10,
    maxUsers: 1,
    features: [
      '10 consultas de patentes',
      '1 usuário',
      'Busca avançada',
      'Resultados completos',
      'Histórico de buscas',
      'Dr. Root AI Assistant'
    ],
    isActive: true
  },
  {
    name: 'Profissional',
    price: 7000,
    searches: 25,
    maxUsers: 3,
    features: [
      '25 consultas por usuário',
      'Até 3 usuários',
      'Busca avançada',
      'Análise FTO completa',
      'Histórico ilimitado',
      'Dr. Root AI Assistant',
      'Exportação de relatórios',
      'Suporte prioritário'
    ],
    isActive: true
  },
  {
    name: 'Enterprise',
    price: 15000,
    searches: 150,
    maxUsers: 15,
    features: [
      '150 consultas por usuário',
      'Até 15 usuários',
      'Todas as funcionalidades',
      'API dedicada',
      'Suporte 24/7',
      'Treinamento da equipe',
      'Customizações',
      'SLA garantido'
    ],
    isActive: true
  }
]

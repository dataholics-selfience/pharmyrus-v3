import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, Users, DollarSign, Search, TrendingUp, AlertCircle } from 'lucide-react'

interface Analytics {
  totalOrganizations: number
  totalUsers: number
  totalSubscriptions: number
  activeSubscriptions: number
  totalSearches: number
  monthlyRevenue: number
  usersByPlan: Record<string, number>
  expiringSubscriptions: number
}

export function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      // Buscar organizações
      const orgsSnapshot = await getDocs(collection(db, 'organizations'))
      const totalOrganizations = orgsSnapshot.size

      // Buscar usuários
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const totalUsers = usersSnapshot.size

      // Buscar assinaturas
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'))
      const totalSubscriptions = subsSnapshot.size

      const activeSubscriptions = subsSnapshot.docs.filter(
        doc => doc.data().status === 'active' || doc.data().status === 'trial'
      ).length

      // Calcular revenue
      let monthlyRevenue = 0
      subsSnapshot.docs.forEach(doc => {
        const sub = doc.data()
        if (sub.status === 'active' && !sub.isTrial) {
          monthlyRevenue += sub.monthlyPrice || 0
        }
      })

      // Buscar userPlans para contagem
      const userPlansSnapshot = await getDocs(collection(db, 'userPlans'))
      let totalSearches = 0
      const usersByPlan: Record<string, number> = {}

      userPlansSnapshot.docs.forEach(doc => {
        const plan = doc.data()
        totalSearches += plan.searchesUsed || 0
        
        const planName = plan.planName || 'Desconhecido'
        usersByPlan[planName] = (usersByPlan[planName] || 0) + 1
      })

      // Assinaturas expirando (próximos 30 dias)
      const now = new Date()
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      const expiringSubscriptions = subsSnapshot.docs.filter(doc => {
        const sub = doc.data()
        if (sub.status !== 'active' && sub.status !== 'trial') return false
        const endDate = sub.endDate?.toDate()
        return endDate && endDate <= in30Days && endDate >= now
      }).length

      setAnalytics({
        totalOrganizations,
        totalUsers,
        totalSubscriptions,
        activeSubscriptions,
        totalSearches,
        monthlyRevenue,
        usersByPlan,
        expiringSubscriptions
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Carregando analytics...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar analytics</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Organizações
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrganizations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.activeSubscriptions} com assinaturas ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MRR
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {analytics.monthlyRevenue.toLocaleString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita mensal recorrente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Consultas
            </CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSearches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total realizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {analytics.expiringSubscriptions > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <strong>{analytics.expiringSubscriptions}</strong> assinatura(s) expirando nos próximos 30 dias
          </AlertDescription>
        </Alert>
      )}

      {/* Usuários por Plano */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários por Plano</CardTitle>
          <CardDescription>Distribuição de usuários entre os planos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analytics.usersByPlan).map(([planName, count]) => (
              <div key={planName} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="font-medium">{planName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-sm">{count} usuários</span>
                  <span className="font-bold text-lg min-w-[60px] text-right">
                    {Math.round((count / analytics.totalUsers) * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Assinaturas Ativas</div>
              <div className="text-2xl font-bold text-green-600">{analytics.activeSubscriptions}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Taxa de Conversão</div>
              <div className="text-2xl font-bold">
                {analytics.totalUsers > 0 
                  ? Math.round((analytics.activeSubscriptions / analytics.totalUsers) * 100)
                  : 0}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ARR (Anual)</div>
              <div className="text-2xl font-bold">
                R$ {(analytics.monthlyRevenue * 12).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Plus, Edit, Trash2, Pause, Play, Loader2, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Subscription {
  id: string
  organizationId: string
  organizationName: string
  planId: string
  planName: string
  status: 'active' | 'paused' | 'expired' | 'cancelled'
  startDate: Date
  endDate: Date
  monthlyPrice: number
  maxUsers: number
  searchesPerUser: number
  currentUsers: number
  totalSearchesUsed: number
}

export function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingNew, setCreatingNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSub, setNewSub] = useState({
    organizationId: '',
    planId: '',
    durationMonths: 1
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load organizations
      const orgsSnapshot = await getDocs(collection(db, 'organizations'))
      const orgsData = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setOrganizations(orgsData)

      // Load plans
      const plansSnapshot = await getDocs(collection(db, 'plans'))
      const plansData = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setPlans(plansData)

      // Load subscriptions
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'))
      const subsData = subsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate?.toDate(),
        endDate: doc.data().endDate?.toDate()
      })) as Subscription[]

      subsData.sort((a, b) => {
        if (!a.startDate || !b.startDate) return 0
        return b.startDate.getTime() - a.startDate.getTime()
      })

      setSubscriptions(subsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = async () => {
    if (!newSub.organizationId || !newSub.planId) {
      toast.error('Selecione organização e plano')
      return
    }

    setSaving(true)
    try {
      const org = organizations.find(o => o.id === newSub.organizationId)
      const plan = plans.find(p => p.id === newSub.planId)

      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + newSub.durationMonths)

      await addDoc(collection(db, 'subscriptions'), {
        organizationId: org.id,
        organizationName: org.name,
        planId: plan.id,
        planName: plan.name,
        status: 'active',
        startDate,
        endDate,
        monthlyPrice: plan.price,
        maxUsers: plan.maxUsers,
        searchesPerUser: plan.searchesPerUser,
        totalSearchesLimit: plan.maxUsers * plan.searchesPerUser,
        currentUsers: 0,
        totalSearchesUsed: 0,
        isTrial: false,
        autoRenew: false,
        renewalNotificationSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      })

      toast.success('Assinatura criada!')
      setCreatingNew(false)
      setNewSub({ organizationId: '', planId: '', durationMonths: 1 })
      await loadData()
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast.error('Erro ao criar assinatura')
    } finally {
      setSaving(false)
    }
  }

  const handlePause = async (subId: string) => {
    try {
      await updateDoc(doc(db, 'subscriptions', subId), {
        status: 'paused',
        pausedAt: new Date(),
        updatedAt: new Date()
      })
      toast.success('Assinatura pausada')
      await loadData()
    } catch (error) {
      console.error('Error pausing:', error)
      toast.error('Erro ao pausar')
    }
  }

  const handleResume = async (subId: string) => {
    try {
      await updateDoc(doc(db, 'subscriptions', subId), {
        status: 'active',
        updatedAt: new Date()
      })
      toast.success('Assinatura reativada')
      await loadData()
    } catch (error) {
      console.error('Error resuming:', error)
      toast.error('Erro ao reativar')
    }
  }

  const handleDelete = async (subId: string, orgName: string) => {
    if (!confirm(`Deletar assinatura de ${orgName}?`)) return

    try {
      await deleteDoc(doc(db, 'subscriptions', subId))
      toast.success('Assinatura deletada')
      await loadData()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Erro ao deletar')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'paused': return 'bg-amber-500'
      case 'expired': return 'bg-red-500'
      case 'cancelled': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa'
      case 'paused': return 'Pausada'
      case 'expired': return 'Expirada'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestão de Assinaturas</CardTitle>
              <CardDescription>
                {subscriptions.length} assinatura(s) cadastrada(s)
              </CardDescription>
            </div>
            <Button onClick={() => setCreatingNew(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Assinatura
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Nenhuma assinatura cadastrada</p>
              <p className="text-sm mb-4">Crie a primeira assinatura clicando no botão acima</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => {
                const daysLeft = sub.endDate ? Math.ceil((sub.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0

                return (
                  <Card key={sub.id} className="border-2">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {sub.organizationName}
                            <Badge className={getStatusColor(sub.status)}>
                              {getStatusLabel(sub.status)}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            Plano: {sub.planName}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {sub.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePause(sub.id)}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}
                          {sub.status === 'paused' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResume(sub.id)}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(sub.id, sub.organizationName)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Preço</div>
                          <div className="font-semibold">
                            R$ {sub.monthlyPrice.toLocaleString('pt-BR')}/mês
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Usuários</div>
                          <div className="font-semibold">
                            {sub.currentUsers} / {sub.maxUsers}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Consultas</div>
                          <div className="font-semibold">
                            {sub.searchesPerUser}/usuário
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            {daysLeft > 0 ? 'Expira em' : 'Expirou há'}
                          </div>
                          <div className={`font-semibold ${daysLeft < 10 && daysLeft > 0 ? 'text-amber-600' : ''}`}>
                            {Math.abs(daysLeft)} dias
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                        Período: {sub.startDate?.toLocaleDateString('pt-BR')} até {sub.endDate?.toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={creatingNew} onOpenChange={setCreatingNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Assinatura</DialogTitle>
            <DialogDescription>
              Vincule uma organização a um plano
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Organização *</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={newSub.organizationId}
                onChange={(e) => setNewSub({ ...newSub, organizationId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Plano *</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={newSub.planId}
                onChange={(e) => setNewSub({ ...newSub, planId: e.target.value })}
              >
                <option value="">Selecione...</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - R$ {plan.price}/mês
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Duração (meses)</Label>
              <Input
                type="number"
                min="1"
                value={newSub.durationMonths}
                onChange={(e) => setNewSub({ ...newSub, durationMonths: Number(e.target.value) })}
              />
            </div>

            {newSub.planId && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="font-medium mb-1">Resumo:</div>
                <div>Plano: {plans.find(p => p.id === newSub.planId)?.name}</div>
                <div>Preço: R$ {plans.find(p => p.id === newSub.planId)?.price}/mês</div>
                <div>Usuários: até {plans.find(p => p.id === newSub.planId)?.maxUsers}</div>
                <div>Consultas: {plans.find(p => p.id === newSub.planId)?.searchesPerUser}/usuário</div>
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingNew(false)
                  setNewSub({ organizationId: '', planId: '', durationMonths: 1 })
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNew}
                disabled={saving}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore'
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
  userEmails?: string[] // NOVO: emails dos usuários
  userIds?: string[] // NOVO: IDs dos usuários
}

export function SubscriptionsManagement() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creatingNew, setCreatingNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newSub, setNewSub] = useState({
    organizationId: '',
    planId: '',
    durationMonths: 1,
    userIds: [] as string[]
  })
  
  // NOVO: Estados para detalhes e edição
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [showEdit, setShowEdit] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load organizations
      const orgsSnapshot = await getDocs(collection(db, 'organizations'))
      const orgsData = orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      setOrganizations(orgsData)

      // Load plans
      const plansSnapshot = await getDocs(collection(db, 'plans'))
      const plansData = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      setPlans(plansData)

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        email: doc.data().email,
        displayName: doc.data().displayName
      }))
      setUsers(usersData)

      // Load subscriptions with enhanced data
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'))
      const subsDataPromises = subsSnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()
        
        // Buscar organização
        const org = orgsData.find(o => o.id === data.organizationId)
        
        // Buscar emails dos usuários
        const userEmails: string[] = []
        const userIds = data.userIds || []
        
        for (const userId of userIds) {
          const user = usersData.find(u => u.id === userId)
          if (user?.email) {
            userEmails.push(user.email)
          }
        }
        
        return {
          id: docSnap.id,
          ...data,
          organizationName: org?.name || 'N/A',
          userEmails,
          userIds,
          startDate: data.startDate?.toDate(),
          endDate: data.endDate?.toDate()
        }
      })
      
      const subsData = await Promise.all(subsDataPromises) as Subscription[]

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

  // NOVO: Visualizar detalhes
  const viewDetails = (sub: Subscription) => {
    setSelectedSub(sub)
    setShowDetails(true)
  }

  // NOVO: Editar assinatura
  const editSubscription = (sub: Subscription) => {
    setEditingSub({...sub}) // Clone para edição
    setShowEdit(true)
  }

  // NOVO: Verificar se usuário já está em outra assinatura
  const checkUserInOtherSubscriptions = async (userId: string, currentSubId?: string) => {
    const userSubs = subscriptions.filter(sub => 
      sub.id !== currentSubId && 
      sub.userIds?.includes(userId) &&
      sub.status === 'active'
    )
    return userSubs
  }

  // NOVO: Migrar usuário de uma assinatura para outra
  const migrateUserBetweenSubscriptions = async (
    userId: string, 
    fromSubId: string, 
    toSubId: string
  ) => {
    try {
      console.log(`🔄 Migrando usuário ${userId} de ${fromSubId} para ${toSubId}`)
      
      // Remover da assinatura anterior
      const fromSubRef = doc(db, 'subscriptions', fromSubId)
      const fromSubSnap = await getDoc(fromSubRef)
      
      if (fromSubSnap.exists()) {
        const fromSubData = fromSubSnap.data()
        const updatedUserIds = (fromSubData.userIds || []).filter((id: string) => id !== userId)
        
        await updateDoc(fromSubRef, {
          userIds: updatedUserIds,
          currentUsers: updatedUserIds.length,
          updatedAt: new Date()
        })
        
        console.log(`  ✅ Removido da assinatura ${fromSubId}`)
      }
      
      return true
    } catch (error) {
      console.error('Erro ao migrar usuário:', error)
      return false
    }
  }

  // NOVO: Salvar edição
  const handleUpdate = async () => {
    if (!editingSub) return
    
    setSaving(true)
    try {
      // NOVO: Atualizar também a lista de usuários vinculados
      await updateDoc(doc(db, 'subscriptions', editingSub.id), {
        status: editingSub.status,
        monthlyPrice: editingSub.monthlyPrice,
        maxUsers: editingSub.maxUsers,
        searchesPerUser: editingSub.searchesPerUser,
        endDate: editingSub.endDate,
        userIds: editingSub.userIds || [],
        currentUsers: editingSub.userIds?.length || 0,
        updatedAt: new Date()
      })
      
      // NOVO: Sincronizar planos dos usuários vinculados
      if (editingSub.userIds && editingSub.userIds.length > 0) {
        console.log(`🔄 Sincronizando planos de ${editingSub.userIds.length} usuários...`)
        
        const plan = plans.find(p => p.id === editingSub.planId)
        
        for (const userId of editingSub.userIds) {
          try {
            // Atualizar users/{uid}/plan/current
            await setDoc(doc(db, 'users', userId, 'plan', 'current'), {
              tier: 'subscription',
              searchesLimit: editingSub.searchesPerUser,
              subscriptionId: editingSub.id,
              organizationId: editingSub.organizationId,
              planName: plan?.name || editingSub.planName,
              updatedAt: new Date()
            }, { merge: true })
            
            // Atualizar userPlans também
            await setDoc(doc(db, 'userPlans', userId), {
              subscriptionId: editingSub.id,
              searchesLimit: editingSub.searchesPerUser,
              organizationId: editingSub.organizationId,
              planId: editingSub.planId,
              planName: plan?.name || editingSub.planName,
              updatedAt: new Date()
            }, { merge: true })
          } catch (error) {
            console.error(`Erro ao atualizar plano do usuário ${userId}:`, error)
          }
        }
        
        console.log('✅ Planos sincronizados!')
      }
      
      toast.success('Assinatura atualizada com sucesso!')
      setShowEdit(false)
      loadData() // Recarregar dados
    } catch (error) {
      console.error('Error updating subscription:', error)
      toast.error('Erro ao atualizar assinatura')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNew = async () => {
    if (!newSub.organizationId || !newSub.planId) {
      toast.error('Selecione organização e plano')
      return
    }
    
    // NOVO: Validar limite de usuários
    const plan = plans.find(p => p.id === newSub.planId)
    if (plan && newSub.userIds.length > plan.maxUsers) {
      toast.error(`Este plano permite no máximo ${plan.maxUsers} usuários!`)
      return
    }
    
    // NOVO: Validar múltiplas assinaturas ANTES de criar
    if (newSub.userIds.length > 0) {
      for (const userId of newSub.userIds) {
        const existingSubs = await checkUserInOtherSubscriptions(userId)
        
        if (existingSubs.length > 0) {
          const user = users.find(u => u.id === userId)
          const existingSub = existingSubs[0]
          
          const confirmed = window.confirm(
            `⚠️ O usuário ${user?.email || userId} já está vinculado à assinatura:\n\n` +
            `📋 Empresa: ${existingSub.organizationName}\n` +
            `📦 Plano: ${existingSub.planName}\n\n` +
            `Deseja MIGRAR este usuário para a nova assinatura?\n` +
            `(Ele será removido da assinatura anterior)`
          )
          
          if (!confirmed) {
            toast.info('Operação cancelada pelo usuário')
            return
          }
          
          // Marcar para migração posterior
          console.log(`📝 Usuário ${userId} será migrado de ${existingSub.id}`)
        }
      }
    }

    console.log('📝 Criando assinatura:', newSub)

    setSaving(true)
    try {
      const org = organizations.find(o => o.id === newSub.organizationId)

      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + newSub.durationMonths)

      console.log('💾 Salvando assinatura no Firestore...')
      const subRef = await addDoc(collection(db, 'subscriptions'), {
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
        currentUsers: newSub.userIds.length,
        totalSearchesUsed: 0,
        isTrial: false,
        autoRenew: false,
        renewalNotificationSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      })

      console.log(`✅ Assinatura criada: ${subRef.id}`)

      // NOVO: Migrar usuários se necessário (remover de assinaturas antigas)
      if (newSub.userIds.length > 0) {
        for (const userId of newSub.userIds) {
          const existingSubs = await checkUserInOtherSubscriptions(userId, subRef.id)
          
          if (existingSubs.length > 0) {
            console.log(`🔄 Migrando usuário ${userId} de assinaturas antigas...`)
            
            for (const oldSub of existingSubs) {
              await migrateUserBetweenSubscriptions(userId, oldSub.id, subRef.id)
            }
          }
        }
      }

      // Vincular usuários selecionados
      if (newSub.userIds.length > 0) {
        console.log(`👥 Vinculando ${newSub.userIds.length} usuário(s)...`)
        
        for (const userId of newSub.userIds) {
          try {
            console.log(`  Vinculando usuário: ${userId}`)
            
            // 1. Atualizar userPlans (sistema antigo)
            const userPlanRef = doc(db, 'userPlans', userId)
            const userPlanSnap = await getDocs(collection(db, 'userPlans'))
            const userPlanExists = userPlanSnap.docs.some(d => d.id === userId)
            
            if (userPlanExists) {
              // Atualizar existente
              await updateDoc(userPlanRef, {
                subscriptionId: subRef.id,
                organizationId: org.id,
                organizationType: 'company',
                planId: plan.id,
                planName: plan.name,
                searchesLimit: plan.searchesPerUser,
                updatedAt: new Date()
              })
              console.log(`  ✅ Usuário ${userId} vinculado (atualizado)`)
            } else {
              // Criar novo userPlan
              await setDoc(userPlanRef, {
                userId: userId,
                subscriptionId: subRef.id,
                organizationId: org.id,
                organizationType: 'company',
                planId: plan.id,
                planName: plan.name,
                role: 'member',
                searchesUsed: 0,
                searchesLimit: plan.searchesPerUser,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              })
              console.log(`  ✅ Usuário ${userId} vinculado (criado novo)`)
            }
            
            // 2. NOVO: Atualizar users/{uid}/plan/current (sistema novo)
            const userPlanCurrentRef = doc(db, 'users', userId, 'plan', 'current')
            await setDoc(userPlanCurrentRef, {
              tier: 'subscription',
              searchesUsed: 0,
              searchesLimit: plan.searchesPerUser,
              createdAt: new Date(),
              searchHistory: [],
              subscriptionId: subRef.id,
              organizationId: org.id,
              planName: plan.name
            }, { merge: true })
            
            console.log(`  ✅ Plano do usuário ${userId} sincronizado`)
            
          } catch (userError) {
            console.error(`  ❌ Erro ao vincular usuário ${userId}:`, userError)
            // Continua para próximo usuário mesmo com erro
          }
        }
        
        // NOVO: Atualizar userIds na subscription após vincular todos
        await updateDoc(doc(db, 'subscriptions', subRef.id), {
          userIds: newSub.userIds,
          updatedAt: new Date()
        })
        
        console.log(`✅ Processamento de usuários concluído!`)
        toast.success(`Assinatura criada com ${newSub.userIds.length} usuário(s)!`)
      } else {
        toast.success('Assinatura criada!')
      }

      setCreatingNew(false)
      setNewSub({ organizationId: '', planId: '', durationMonths: 1, userIds: [] })
      await loadData()
    } catch (error) {
      console.error('❌ Error creating subscription:', error)
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
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 mb-1">
                            {sub.organizationName}
                            <Badge className={getStatusColor(sub.status)}>
                              {getStatusLabel(sub.status)}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <span className="font-semibold text-primary">📦 {sub.planName}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs">R$ {sub.monthlyPrice.toLocaleString('pt-BR')}/mês</span>
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
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
                      
                      {/* NOVO: Empresa e Emails */}
                      <div className="space-y-2 mb-4 pb-4 border-b">
                        <div>
                          <span className="text-muted-foreground text-sm">Empresa: </span>
                          <span className="font-medium text-sm">{sub.organizationName}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Emails: </span>
                          <span className="text-sm">
                            {sub.userEmails && sub.userEmails.length > 0 
                              ? sub.userEmails.join(', ')
                              : 'Nenhum usuário vinculado'}
                          </span>
                        </div>
                      </div>
                      
                      {/* NOVO: Botões Ver e Editar */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewDetails(sub)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Detalhes
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => editSubscription(sub)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">{/*Adicionado scroll*/}
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

            <div className="space-y-2">
              <Label>Vincular Usuários (opcional)</Label>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto space-y-2">
                {users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário disponível</p>
                ) : (
                  users.map(user => (
                    <label key={user.id} className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                      <input
                        type="checkbox"
                        checked={newSub.userIds.includes(user.id)}
                        disabled={
                          !newSub.userIds.includes(user.id) && 
                          newSub.planId &&
                          newSub.userIds.length >= (plans.find(p => p.id === newSub.planId)?.maxUsers || 0)
                        }
                        onChange={(e) => {
                          const selectedPlan = plans.find(p => p.id === newSub.planId)
                          
                          if (e.target.checked) {
                            // Validar limite ANTES de adicionar
                            if (selectedPlan && newSub.userIds.length >= selectedPlan.maxUsers) {
                              toast.error(`Máximo de ${selectedPlan.maxUsers} usuários para este plano!`)
                              return
                            }
                            setNewSub({ ...newSub, userIds: [...newSub.userIds, user.id] })
                          } else {
                            setNewSub({ ...newSub, userIds: newSub.userIds.filter(id => id !== user.id) })
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {user.displayName || user.email}
                        <span className="text-xs text-muted-foreground ml-2">({user.email})</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {newSub.userIds.length > 0 
                  ? `${newSub.userIds.length} usuário(s) selecionado(s)`
                  : 'Nenhum usuário selecionado - você pode adicionar depois'}
              </p>
            </div>

            {newSub.planId && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="font-medium mb-1">Resumo:</div>
                <div>Plano: {plans.find(p => p.id === newSub.planId)?.name}</div>
                <div>Preço: R$ {plans.find(p => p.id === newSub.planId)?.price}/mês</div>
                <div>Usuários: até {plans.find(p => p.id === newSub.planId)?.maxUsers}</div>
                <div>Consultas: {plans.find(p => p.id === newSub.planId)?.searchesPerUser}/usuário</div>
                {newSub.userIds.length > 0 && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="text-green-600 font-medium">
                      ✓ {newSub.userIds.length} usuário(s) serão vinculados
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingNew(false)
                  setNewSub({ organizationId: '', planId: '', durationMonths: 1, userIds: [] })
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

      {/* NOVO: Modal de Detalhes */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Assinatura</DialogTitle>
            <DialogDescription>
              {selectedSub?.organizationName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSub && (
            <div className="space-y-4">
              {/* Informações Gerais */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Empresa:</span>
                    <span className="font-medium">{selectedSub.organizationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plano:</span>
                    <span className="font-medium">{selectedSub.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(selectedSub.status)}>
                      {getStatusLabel(selectedSub.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Preço Mensal:</span>
                    <span className="font-medium">
                      R$ {selectedSub.monthlyPrice?.toLocaleString('pt-BR')}
                    </span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Datas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Período</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Início:</span>
                    <span>{selectedSub.startDate?.toLocaleDateString('pt-BR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fim:</span>
                    <span>{selectedSub.endDate?.toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
              
              {/* Usuários */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Usuários ({selectedSub.userIds?.length || 0}/{selectedSub.maxUsers})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedSub.userIds && selectedSub.userIds.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSub.userIds.map((userId, i) => {
                        const userEmail = selectedSub.userEmails?.[i]
                        const user = users.find(u => u.id === userId)
                        
                        return (
                          <div key={i} className="flex items-center gap-2 p-2 rounded bg-muted/50">
                            <div className="flex-1">
                              <div className="text-sm font-medium">
                                {user?.displayName || userEmail || userId}
                              </div>
                              {user?.displayName && userEmail && (
                                <div className="text-xs text-muted-foreground">{userEmail}</div>
                              )}
                            </div>
                            <Badge variant="secondary" className="text-xs">Ativo</Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      ⚠️ Nenhum usuário vinculado ainda
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Uso */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Uso de Buscas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de buscas:</span>
                    <span className="font-medium">{selectedSub.totalSearchesUsed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buscas por usuário:</span>
                    <span className="font-medium">{selectedSub.searchesPerUser}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowDetails(false)}>
              Fechar
            </Button>
            <Button onClick={() => {
              setShowDetails(false)
              editSubscription(selectedSub!)
            }}>
              Editar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* NOVO: Modal de Edição */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">{/*Aumentado de max-w-md*/}
          <DialogHeader>
            <DialogTitle>Editar Assinatura</DialogTitle>
            <DialogDescription>
              {editingSub?.organizationName}
            </DialogDescription>
          </DialogHeader>
          
          {editingSub && (
            <div className="space-y-4">
              <div>
                <Label>Status</Label>
                <select
                  className="w-full border rounded p-2 mt-1"
                  value={editingSub.status}
                  onChange={(e) => setEditingSub({
                    ...editingSub,
                    status: e.target.value as any
                  })}
                >
                  <option value="active">Ativo</option>
                  <option value="paused">Pausado</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="expired">Expirado</option>
                </select>
              </div>
              
              <div>
                <Label>Preço Mensal (R$)</Label>
                <Input
                  type="number"
                  value={editingSub.monthlyPrice}
                  onChange={(e) => setEditingSub({
                    ...editingSub,
                    monthlyPrice: parseFloat(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label>Máximo de Usuários</Label>
                <Input
                  type="number"
                  value={editingSub.maxUsers}
                  onChange={(e) => setEditingSub({
                    ...editingSub,
                    maxUsers: parseInt(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
              
              {/* REMOVIDO: Campo "Buscas por Usuário" - redundante, definido pelo plano */}
              {/* Info: O limite de buscas é definido pelo plano contratado */}
              <div className="p-3 bg-muted/50 rounded-md">
                <div className="text-xs text-muted-foreground">
                  <strong>Buscas por Usuário:</strong> {editingSub.searchesPerUser}
                  <span className="block mt-1">
                    (Definido pelo plano "{editingSub.planName}")
                  </span>
                </div>
              </div>
              
              <div>
                <Label>Data de Fim</Label>
                <Input
                  type="date"
                  value={editingSub.endDate?.toISOString().split('T')[0]}
                  onChange={(e) => setEditingSub({
                    ...editingSub,
                    endDate: new Date(e.target.value)
                  })}
                  className="mt-1"
                />
              </div>
              
              {/* NOVO: Seção de Usuários Vinculados */}
              <div className="pt-4 border-t">
                <Label>Usuários Vinculados</Label>
                <div className="border rounded-md p-3 max-h-60 overflow-y-auto space-y-2 mt-2 bg-muted/30">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum usuário disponível</p>
                  ) : (
                    users.map(user => {
                      const isSelected = editingSub.userIds?.includes(user.id) || false
                      const maxUsersReached = (editingSub.userIds?.length || 0) >= editingSub.maxUsers
                      const isDisabled = !isSelected && maxUsersReached
                      
                      return (
                        <label 
                          key={user.id} 
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                            isDisabled 
                              ? 'opacity-50 cursor-not-allowed bg-muted' 
                              : 'hover:bg-background'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isDisabled}
                            onChange={async (e) => {
                              if (e.target.checked) {
                                // Validar se já está em outra assinatura
                                const existingSubs = await checkUserInOtherSubscriptions(user.id, editingSub.id)
                                
                                if (existingSubs.length > 0) {
                                  const confirmed = window.confirm(
                                    `⚠️ O usuário ${user.email} já está vinculado à:\n\n` +
                                    `📋 ${existingSubs[0].organizationName} - ${existingSubs[0].planName}\n\n` +
                                    `Deseja MIGRAR para esta assinatura?`
                                  )
                                  
                                  if (!confirmed) {
                                    toast.info('Operação cancelada')
                                    return
                                  }
                                  
                                  // Migrar
                                  await migrateUserBetweenSubscriptions(user.id, existingSubs[0].id, editingSub.id)
                                }
                                
                                // Adicionar
                                setEditingSub({
                                  ...editingSub,
                                  userIds: [...(editingSub.userIds || []), user.id]
                                })
                                toast.success(`Usuário ${user.email} adicionado`)
                              } else {
                                // Remover
                                setEditingSub({
                                  ...editingSub,
                                  userIds: (editingSub.userIds || []).filter(id => id !== user.id)
                                })
                                toast.success(`Usuário ${user.email} removido`)
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium">
                              {user.displayName || user.email}
                            </div>
                            {user.displayName && (
                              <div className="text-xs text-muted-foreground">{user.email}</div>
                            )}
                          </div>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">Vinculado</Badge>
                          )}
                        </label>
                      )
                    })
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground flex items-center justify-between">
                  <span>
                    {editingSub.userIds?.length || 0} de {editingSub.maxUsers} usuários vinculados
                  </span>
                  {(editingSub.userIds?.length || 0) >= editingSub.maxUsers && (
                    <span className="text-amber-600 font-medium">⚠️ Limite atingido</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

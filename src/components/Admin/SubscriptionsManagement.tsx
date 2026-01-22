import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FileText, Plus, Edit, Trash2, Pause, Play, Loader2, Calendar, Save } from 'lucide-react'
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
      console.log('📋 Organizations loaded:', orgsData.length)

      // Load plans
      const plansSnapshot = await getDocs(collection(db, 'plans'))
      const plansData = plansSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      setPlans(plansData)
      console.log('📦 Plans loaded:', plansData.length)

      // Load users
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        email: doc.data().email,
        displayName: doc.data().displayName
      }))
      setUsers(usersData)
      console.log('👥 Users loaded:', usersData.length)

      // Load subscriptions with enhanced data
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'))
      console.log('📊 Raw subscriptions:', subsSnapshot.docs.length)
      
      const subsDataPromises = subsSnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data()
        
        console.log('🔍 Processing subscription:', {
          id: docSnap.id,
          userIds: data.userIds,
          userIdsLength: data.userIds?.length || 0
        })
        
        // Buscar organização
        const org = orgsData.find(o => o.id === data.organizationId)
        
        // Buscar emails dos usuários
        const userEmails: string[] = []
        const userIds = data.userIds || []
        
        for (const userId of userIds) {
          const user = usersData.find(u => u.id === userId)
          if (user?.email) {
            userEmails.push(user.email)
            console.log('  ✓ User found:', user.email)
          } else {
            console.warn('  ⚠️ User NOT found:', userId)
          }
        }
        
        console.log('  📧 Emails collected:', userEmails.length)
        
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
      console.log('✅ Subscriptions loaded:', subsData.length)
      console.log('📊 Subscriptions data:', subsData.map(s => ({
        id: s.id,
        org: s.organizationName,
        userIds: s.userIds?.length || 0,
        emails: s.userEmails?.length || 0
      })))
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
            // ✅ CRÍTICO: Buscar searchesUsed atual ANTES de atualizar
            const userPlanRef = doc(db, 'userPlans', userId)
            const userPlanSnap = await getDoc(userPlanRef)
            const currentSearchesUsed = userPlanSnap.exists() 
              ? userPlanSnap.data()?.searchesUsed || 0 
              : 0
            
            const planCurrentRef = doc(db, 'users', userId, 'plan', 'current')
            const planCurrentSnap = await getDoc(planCurrentRef)
            const currentSearchesUsed2 = planCurrentSnap.exists()
              ? planCurrentSnap.data()?.searchesUsed || 0
              : 0
            
            // Usar o maior valor entre os dois (mais conservador)
            const finalSearchesUsed = Math.max(currentSearchesUsed, currentSearchesUsed2)
            
            console.log(`  📊 Usuário ${userId}: preservando ${finalSearchesUsed} buscas usadas`)
            
            // Atualizar users/{uid}/plan/current
            await setDoc(planCurrentRef, {
              tier: 'subscription',
              searchesUsed: finalSearchesUsed,  // ✅ PRESERVA
              searchesLimit: editingSub.searchesPerUser,
              subscriptionId: editingSub.id,
              organizationId: editingSub.organizationId,
              planName: plan?.name || editingSub.planName,
              updatedAt: new Date()
            }, { merge: true })
            
            // Atualizar userPlans também
            await setDoc(userPlanRef, {
              subscriptionId: editingSub.id,
              searchesUsed: finalSearchesUsed,  // ✅ PRESERVA
              searchesLimit: editingSub.searchesPerUser,
              organizationId: editingSub.organizationId,
              planId: editingSub.planId,
              planName: plan?.name || editingSub.planName,
              status: editingSub.status,  // ✅ Atualiza status também
              updatedAt: new Date()
            }, { merge: true })
            
            console.log(`  ✅ Usuário ${userId} sincronizado`)
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
    if (plan && newSub.userIds.length > (plan.max_users || 999)) {
      toast.error(`Este plano permite no máximo ${plan.max_users || 999} usuários!`)
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
        maxUsers: plan.max_users || 999,  // Corrigido: max_users ao invés de maxUsers
        searchesPerUser: plan.searchesPerUser || plan.searches_per_month || 30,
        totalSearchesLimit: (plan.max_users || 999) * (plan.searchesPerUser || plan.searches_per_month || 30),
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
                searchesLimit: plan.searchesPerUser || plan.searches_per_month || 30,
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
                searchesUsed: 0,  // ✅ Começa com 0 para novo usuário
                searchesLimit: plan.searchesPerUser || plan.searches_per_month || 30,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              })
              console.log(`  ✅ Usuário ${userId} vinculado (criado novo)`)
            }
            
            // 2. NOVO: Atualizar users/{uid}/plan/current (sistema novo)
            const userPlanCurrentRef = doc(db, 'users', userId, 'plan', 'current')
            
            // ✅ CRÍTICO: Buscar searchesUsed atual antes de sobrescrever
            const currentPlanSnap = await getDoc(userPlanCurrentRef)
            const currentSearchesUsed = currentPlanSnap.exists() 
              ? currentPlanSnap.data()?.searchesUsed || 0 
              : 0
            
            await setDoc(userPlanCurrentRef, {
              tier: 'subscription',
              searchesUsed: currentSearchesUsed,  // ✅ PRESERVA o valor atual!
              searchesLimit: plan.searchesPerUser || plan.searches_per_month || 30,
              createdAt: currentPlanSnap.exists() ? currentPlanSnap.data()?.createdAt : new Date(),
              searchHistory: currentPlanSnap.exists() ? currentPlanSnap.data()?.searchHistory || [] : [],
              subscriptionId: subRef.id,
              organizationId: org.id,
              planName: plan.name,
              updatedAt: new Date()
            }, { merge: true })
            
            console.log(`  ✅ Plano do usuário ${userId} sincronizado (preservando ${currentSearchesUsed} buscas usadas)`)
            
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

      {/* NOVO: Modal de Detalhes - LAYOUT COMPLETO */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Detalhes da Assinatura</DialogTitle>
            <DialogDescription className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(selectedSub?.status || 'active')}>
                {getStatusLabel(selectedSub?.status || 'active')}
              </Badge>
              <span className="text-muted-foreground">•</span>
              <span>{selectedSub?.organizationName}</span>
            </DialogDescription>
          </DialogHeader>
          
          {selectedSub && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Seção: Informações Gerais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Informações Gerais</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Organização</div>
                      <div className="text-lg font-semibold">{selectedSub.organizationName}</div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Plano Contratado</div>
                      <div className="text-lg font-semibold flex items-center gap-2">
                        📦 {selectedSub.planName}
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Status</div>
                      <div className="text-lg font-semibold">
                        <Badge className={getStatusColor(selectedSub.status)}>
                          {getStatusLabel(selectedSub.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Preço Mensal</div>
                      <div className="text-lg font-semibold text-green-600">
                        R$ {selectedSub.monthlyPrice?.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: Período */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Período da Assinatura</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Data de Início</div>
                      <div className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {selectedSub.startDate?.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Data de Término</div>
                      <div className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        {selectedSub.endDate?.toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Dias Restantes</div>
                      <div className="font-semibold">
                        {selectedSub.endDate
                          ? Math.ceil(
                              (selectedSub.endDate.getTime() - new Date().getTime()) /
                              (1000 * 60 * 60 * 24)
                            )
                          : 0}{' '}
                        dias
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: Limites e Uso */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Limites e Uso</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Usuários</div>
                      <div className="text-2xl font-bold">
                        {selectedSub.userIds?.length || 0}
                        <span className="text-base font-normal text-muted-foreground">
                          {' '}/ {selectedSub.maxUsers}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              ((selectedSub.userIds?.length || 0) / selectedSub.maxUsers) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="text-sm text-muted-foreground mb-1">Buscas por Usuário</div>
                      <div className="text-2xl font-bold">{selectedSub.searchesPerUser}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Total: {selectedSub.maxUsers * selectedSub.searchesPerUser} buscas
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg border bg-card col-span-2">
                      <div className="text-sm text-muted-foreground mb-1">Uso Total de Buscas</div>
                      <div className="text-2xl font-bold">
                        {selectedSub.totalSearchesUsed || 0}
                        <span className="text-base font-normal text-muted-foreground">
                          {' '}/ {selectedSub.maxUsers * selectedSub.searchesPerUser}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              ((selectedSub.totalSearchesUsed || 0) /
                                (selectedSub.maxUsers * selectedSub.searchesPerUser)) *
                                100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: Usuários Vinculados */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Usuários Vinculados ({selectedSub.userIds?.length || 0})
                  </h3>
                  
                  {selectedSub.userIds && selectedSub.userIds.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedSub.userIds.map((userId, i) => {
                        const userEmail = selectedSub.userEmails?.[i]
                        const user = users.find(u => u.id === userId)
                        
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-lg font-semibold text-primary">
                                {(user?.displayName || userEmail || '?')[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {user?.displayName || userEmail || `Usuário ${i + 1}`}
                              </div>
                              {user?.displayName && userEmail && (
                                <div className="text-sm text-muted-foreground truncate">
                                  {userEmail}
                                </div>
                              )}
                              {!userEmail && (
                                <div className="text-xs text-muted-foreground">
                                  ID: {userId.substring(0, 8)}...
                                </div>
                              )}
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              Ativo
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                      <div className="text-4xl mb-2">👥</div>
                      <div className="text-lg font-medium text-muted-foreground">
                        Nenhum usuário vinculado
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        Esta assinatura ainda não possui usuários vinculados
                      </div>
                    </div>
                  )}
                </div>

                {/* Seção: Resumo Financeiro */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Resumo Financeiro</h3>
                  
                  <div className="p-6 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-2 border-green-200 dark:border-green-800">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Valor Mensal</div>
                        <div className="text-2xl font-bold text-green-600">
                          R$ {selectedSub.monthlyPrice?.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Valor por Usuário</div>
                        <div className="text-xl font-semibold">
                          R$ {(selectedSub.monthlyPrice / Math.max(selectedSub.maxUsers, 1)).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Custo por Busca</div>
                        <div className="text-xl font-semibold">
                          R$ {(
                            selectedSub.monthlyPrice /
                            (selectedSub.maxUsers * selectedSub.searchesPerUser)
                          ).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Duração</div>
                        <div className="text-xl font-semibold">
                          {selectedSub.startDate && selectedSub.endDate
                            ? Math.ceil(
                                (selectedSub.endDate.getTime() - selectedSub.startDate.getTime()) /
                                (1000 * 60 * 60 * 24 * 30)
                              )
                            : 0}{' '}
                          mês(es)
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Footer fixo */}
          <div className="border-t px-6 py-4 bg-muted/30">
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowDetails(false)}
              >
                Fechar
              </Button>
              <Button 
                onClick={() => {
                  setShowDetails(false)
                  editSubscription(selectedSub!)
                }}
                className="gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar Assinatura
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NOVO: Modal de Edição - LAYOUT COMPLETO */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-4xl h-[95vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl">Editar Assinatura</DialogTitle>
            <DialogDescription>
              {editingSub?.organizationName} - {editingSub?.planName}
            </DialogDescription>
          </DialogHeader>
          
          {editingSub && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-6">
                {/* Seção: Informações Básicas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Informações Básicas</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organização</Label>
                      <Input
                        value={editingSub.organizationName}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Não editável - definido na criação
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Plano</Label>
                      <Input
                        value={editingSub.planName}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Não editável - definido na criação
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <select
                        className="w-full border rounded-md px-3 py-2 bg-background"
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

                    <div className="space-y-2">
                      <Label>Preço Mensal (R$)</Label>
                      <Input
                        type="number"
                        value={editingSub.monthlyPrice}
                        onChange={(e) => setEditingSub({
                          ...editingSub,
                          monthlyPrice: parseFloat(e.target.value)
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção: Limites e Quotas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Limites e Quotas</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Máximo de Usuários</Label>
                      <Input
                        type="number"
                        value={editingSub.maxUsers}
                        onChange={(e) => setEditingSub({
                          ...editingSub,
                          maxUsers: parseInt(e.target.value)
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Quantidade máxima de usuários permitidos
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Buscas por Usuário</Label>
                      <Input
                        value={editingSub.searchesPerUser}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Definido pelo plano "{editingSub.planName}"
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
                    <div className="text-sm">
                      <div className="font-medium mb-2">📊 Resumo de Quotas:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Total de buscas:</span>
                          <span className="ml-2 font-semibold">
                            {editingSub.maxUsers * editingSub.searchesPerUser}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Buscas usadas:</span>
                          <span className="ml-2 font-semibold">
                            {editingSub.totalSearchesUsed || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Seção: Período */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Período da Assinatura</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data de Início</Label>
                      <Input
                        type="date"
                        value={editingSub.startDate?.toISOString().split('T')[0]}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">
                        Não editável - definido na criação
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label>Data de Fim</Label>
                      <Input
                        type="date"
                        value={editingSub.endDate?.toISOString().split('T')[0]}
                        onChange={(e) => setEditingSub({
                          ...editingSub,
                          endDate: new Date(e.target.value)
                        })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Data de expiração da assinatura
                      </p>
                    </div>
                  </div>

                  {editingSub.endDate && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Duração total:</span>
                        <span className="ml-2 font-semibold">
                          {editingSub.startDate && editingSub.endDate
                            ? Math.ceil(
                                (editingSub.endDate.getTime() - editingSub.startDate.getTime()) /
                                (1000 * 60 * 60 * 24 * 30)
                              )
                            : 0}{' '}
                          mês(es)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Seção: Usuários Vinculados */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">
                    Usuários Vinculados ({editingSub.userIds?.length || 0}/{editingSub.maxUsers})
                  </h3>
                  
                  <div className="border rounded-lg p-4 bg-muted/30 max-h-80 overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum usuário disponível no sistema
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {users.map(user => {
                          const isSelected = editingSub.userIds?.includes(user.id) || false
                          const maxUsersReached = (editingSub.userIds?.length || 0) >= editingSub.maxUsers
                          const isDisabled = !isSelected && maxUsersReached
                          
                          return (
                            <label 
                              key={user.id} 
                              className={`flex items-center gap-3 p-3 rounded-md transition-all ${
                                isDisabled 
                                  ? 'opacity-50 cursor-not-allowed bg-muted' 
                                  : 'cursor-pointer hover:bg-background border border-transparent hover:border-primary/20'
                              } ${isSelected ? 'bg-primary/5 border-primary/30' : ''}`}
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
                                    toast.success(`✓ ${user.email} adicionado`)
                                  } else {
                                    // Remover
                                    setEditingSub({
                                      ...editingSub,
                                      userIds: (editingSub.userIds || []).filter(id => id !== user.id)
                                    })
                                    toast.success(`✓ ${user.email} removido`)
                                  }
                                }}
                                className="w-5 h-5"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {user.displayName || user.email}
                                </div>
                                {user.displayName && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {user.email}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  Vinculado
                                </Badge>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md text-sm">
                    <div>
                      <span className="text-muted-foreground">
                        Usuários selecionados:
                      </span>
                      <span className="ml-2 font-semibold">
                        {editingSub.userIds?.length || 0} de {editingSub.maxUsers}
                      </span>
                    </div>
                    {(editingSub.userIds?.length || 0) >= editingSub.maxUsers && (
                      <Badge variant="outline" className="text-amber-600 border-amber-600">
                        ⚠️ Limite atingido
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Seção: Resumo Final */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Resumo</h3>
                  
                  <div className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Organização:</div>
                        <div className="font-semibold">{editingSub.organizationName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Plano:</div>
                        <div className="font-semibold">{editingSub.planName}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status:</div>
                        <div className="font-semibold capitalize">{editingSub.status}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Preço:</div>
                        <div className="font-semibold">
                          R$ {editingSub.monthlyPrice?.toLocaleString('pt-BR')}/mês
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Usuários:</div>
                        <div className="font-semibold">
                          {editingSub.userIds?.length || 0} de {editingSub.maxUsers}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Período:</div>
                        <div className="font-semibold">
                          {editingSub.startDate?.toLocaleDateString('pt-BR')} até{' '}
                          {editingSub.endDate?.toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Footer fixo */}
          <div className="border-t px-6 py-4 bg-muted/30">
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowEdit(false)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleUpdate} 
                disabled={saving}
                className="min-w-[120px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
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

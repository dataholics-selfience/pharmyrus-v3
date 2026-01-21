import { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Plan } from '@/types/plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Save, Loader2, Plus, X, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

export function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)
  const [creatingNew, setCreatingNew] = useState(false)
  const [newPlan, setNewPlan] = useState({
    name: '',
    description: '',
    price: 0,
    searchesPerUser: 1,
    maxUsers: 1,
    features: [''],
    isActive: true
  })

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'plans'))
      const plansData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Plan[]
      
      plansData.sort((a, b) => a.price - b.price)
      setPlans(plansData)
    } catch (error) {
      console.error('Error loading plans:', error)
      toast.error('Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (plan: Plan) => {
    setEditingPlan({ ...plan })
  }

  const handleSave = async () => {
    if (!editingPlan) return

    setSaving(true)
    try {
      // 1. Atualizar o plano
      await updateDoc(doc(db, 'plans', editingPlan.id), {
        name: editingPlan.name,
        description: editingPlan.description,
        price: editingPlan.price,
        searchesPerUser: editingPlan.searchesPerUser,
        maxUsers: editingPlan.maxUsers,
        features: editingPlan.features,
        isActive: editingPlan.isActive,
        updatedAt: new Date()
      })

      // 2. ✅ NOVO: Sincronizar com assinaturas e usuários deste plano
      console.log('🔄 Sincronizando usuários que usam este plano...')
      
      // Buscar assinaturas que usam este plano
      const subscriptionsSnapshot = await getDocs(collection(db, 'subscriptions'))
      let usersUpdated = 0
      
      for (const subDoc of subscriptionsSnapshot.docs) {
        const sub = subDoc.data()
        
        // Se a assinatura usa este plano
        if (sub.planId === editingPlan.id) {
          console.log(`  📋 Assinatura ${subDoc.id} usa este plano`)
          
          // Atualizar searchesPerUser na assinatura
          await updateDoc(doc(db, 'subscriptions', subDoc.id), {
            searchesPerUser: editingPlan.searchesPerUser,
            planName: editingPlan.name,
            updatedAt: new Date()
          })
          
          // Atualizar todos os usuários vinculados a esta assinatura
          const userIds = sub.userIds || []
          
          for (const userId of userIds) {
            try {
              // Atualizar userPlans
              const userPlanRef = doc(db, 'userPlans', userId)
              const userPlanSnap = await getDoc(userPlanRef)
              
              if (userPlanSnap.exists()) {
                const currentSearchesUsed = userPlanSnap.data()?.searchesUsed || 0
                
                await updateDoc(userPlanRef, {
                  searchesLimit: editingPlan.searchesPerUser,
                  planName: editingPlan.name,
                  updatedAt: new Date()
                })
                
                console.log(`    ✅ userPlans/${userId}: ${currentSearchesUsed}/${editingPlan.searchesPerUser}`)
              }
              
              // Atualizar users/{uid}/plan/current
              const planCurrentRef = doc(db, 'users', userId, 'plan', 'current')
              const planCurrentSnap = await getDoc(planCurrentRef)
              
              if (planCurrentSnap.exists()) {
                await updateDoc(planCurrentRef, {
                  searchesLimit: editingPlan.searchesPerUser,
                  planName: editingPlan.name,
                  updatedAt: new Date()
                })
              }
              
              usersUpdated++
            } catch (error) {
              console.error(`    ❌ Erro ao atualizar usuário ${userId}:`, error)
            }
          }
        }
      }

      console.log(`✅ ${usersUpdated} usuário(s) sincronizado(s)`)
      toast.success(`Plano atualizado! ${usersUpdated} usuário(s) sincronizado(s)`)
      setEditingPlan(null)
      await loadPlans()
    } catch (error) {
      console.error('Error updating plan:', error)
      toast.error('Erro ao salvar plano')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateNew = async () => {
    if (!newPlan.name || !newPlan.description) {
      toast.error('Preencha nome e descrição')
      return
    }

    setSaving(true)
    try {
      const planId = newPlan.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_')
      
      await addDoc(collection(db, 'plans'), {
        ...newPlan,
        id: planId,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      toast.success('Plano criado com sucesso!')
      setCreatingNew(false)
      setNewPlan({
        name: '',
        description: '',
        price: 0,
        searchesPerUser: 1,
        maxUsers: 1,
        features: [''],
        isActive: true
      })
      
      // Auto-refresh
      await loadPlans()
    } catch (error) {
      console.error('Error creating plan:', error)
      toast.error('Erro ao criar plano')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (planId: string) => {
    if (!confirm('Tem certeza que deseja deletar este plano?')) return

    try {
      await deleteDoc(doc(db, 'plans', planId))
      toast.success('Plano deletado')
      
      // Auto-refresh
      await loadPlans()
    } catch (error) {
      console.error('Error deleting plan:', error)
      toast.error('Erro ao deletar plano')
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
              <CardTitle>Gestão de Planos</CardTitle>
              <CardDescription>
                {plans.length} plano(s) cadastrado(s)
              </CardDescription>
            </div>
            <Button onClick={() => setCreatingNew(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">Nenhum plano cadastrado</p>
              <p className="text-sm mb-4">Crie o primeiro plano clicando no botão acima</p>
            </div>
          ) : (
            <div className="space-y-4">
              {plans.map((plan) => (
                <Card key={plan.id} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {plan.name}
                          {!plan.isActive && <Badge variant="secondary">Inativo</Badge>}
                          {plan.isTrial && <Badge variant="outline">Trial</Badge>}
                        </CardTitle>
                        <CardDescription>{plan.description}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(plan)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
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
                          {plan.price === 0 ? 'Grátis' : `R$ ${plan.price.toLocaleString('pt-BR')}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Consultas/Usuário</div>
                        <div className="font-semibold">{plan.searchesPerUser}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Máx. Usuários</div>
                        <div className="font-semibold">{plan.maxUsers}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Status</div>
                        <div className="font-semibold">
                          {plan.isActive ? (
                            <span className="text-green-600">Ativo</span>
                          ) : (
                            <span className="text-gray-500">Inativo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create New Dialog */}
      <Dialog open={creatingNew} onOpenChange={setCreatingNew}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Plano</DialogTitle>
            <DialogDescription>
              Preencha as informações do novo plano
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Plano *</Label>
                <Input
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="Ex: Básico"
                />
              </div>

              <div className="space-y-2">
                <Label>Preço Mensal (R$) *</Label>
                <Input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Consultas por Usuário *</Label>
                <Input
                  type="number"
                  value={newPlan.searchesPerUser}
                  onChange={(e) => setNewPlan({ ...newPlan, searchesPerUser: Number(e.target.value) })}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label>Máximo de Usuários *</Label>
                <Input
                  type="number"
                  value={newPlan.maxUsers}
                  onChange={(e) => setNewPlan({ ...newPlan, maxUsers: Number(e.target.value) })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea
                value={newPlan.description}
                onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                rows={3}
                placeholder="Descrição do plano..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingNew(false)
                  setNewPlan({ name: '', description: '', price: 0, searchesPerUser: 1, maxUsers: 1, features: [''], isActive: true })
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
                    Criar Plano
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editingPlan && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <CardTitle>Editando: {editingPlan.name}</CardTitle>
            <CardDescription>Faça as alterações e salve</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Plano</Label>
                <Input
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Preço Mensal (R$)</Label>
                <Input
                  type="number"
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Consultas por Usuário</Label>
                <Input
                  type="number"
                  value={editingPlan.searchesPerUser}
                  onChange={(e) => setEditingPlan({ ...editingPlan, searchesPerUser: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>Máximo de Usuários</Label>
                <Input
                  type="number"
                  value={editingPlan.maxUsers}
                  onChange={(e) => setEditingPlan({ ...editingPlan, maxUsers: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={editingPlan.description}
                onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setEditingPlan(null)}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}

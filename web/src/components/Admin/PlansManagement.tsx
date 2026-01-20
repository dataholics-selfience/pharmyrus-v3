import { useState, useEffect } from 'react'
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Plan } from '@/types/plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Package, Save, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [saving, setSaving] = useState(false)

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

      toast.success('Plano atualizado com sucesso!')
      setEditingPlan(null)
      await loadPlans()
    } catch (error) {
      console.error('Error updating plan:', error)
      toast.error('Erro ao salvar plano')
    } finally {
      setSaving(false)
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
          <CardTitle>Gestão de Planos</CardTitle>
          <CardDescription>
            {plans.length} plano(s) cadastrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(plan)}
                    >
                      Editar
                    </Button>
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
        </CardContent>
      </Card>

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

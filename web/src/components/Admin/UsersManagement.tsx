import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc, addDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, Loader2, Search, Crown, Edit, Trash2, Save, X, Plus, UserPlus } from 'lucide-react'
import { toast } from 'sonner'

interface UserData {
  uid: string
  email: string
  displayName?: string
  organizationId?: string
  planName?: string
  planId?: string
  searchesUsed?: number
  searchesLimit?: number
  status?: string
  createdAt?: Date
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [saving, setSaving] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    planId: 'basico'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Buscar planos
      const plansSnapshot = await getDocs(collection(db, 'plans'))
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPlans(plansData)

      // Buscar usuários
      const usersSnapshot = await getDocs(collection(db, 'users'))
      const usersData: UserData[] = []

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data()
        
        // Buscar userPlan
        const userPlanSnapshot = await getDocs(
          query(collection(db, 'userPlans'))
        )
        const userPlan = userPlanSnapshot.docs.find(
          doc => doc.data().userId === userDoc.id
        )

        usersData.push({
          uid: userDoc.id,
          email: userData.email,
          displayName: userData.displayName,
          organizationId: userPlan?.data().organizationId,
          planName: userPlan?.data().planName || 'Sem plano',
          planId: userPlan?.data().planId,
          searchesUsed: userPlan?.data().searchesUsed || 0,
          searchesLimit: userPlan?.data().searchesLimit || 0,
          status: userPlan?.data().status || 'unknown',
          createdAt: userData.createdAt?.toDate()
        })
      }

      // Ordenar por data de criação
      usersData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      setUsers(usersData)
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser({ ...user })
  }

  const handleSave = async () => {
    if (!editingUser) return

    setSaving(true)
    try {
      // Buscar limite do plano selecionado
      const selectedPlan = plans.find(p => p.id === editingUser.planId)
      const newLimit = selectedPlan?.searchesPerUser || editingUser.searchesLimit

      // Atualizar userPlan
      await updateDoc(doc(db, 'userPlans', editingUser.uid), {
        planId: editingUser.planId,
        planName: selectedPlan?.name || editingUser.planName,
        searchesLimit: newLimit,
        searchesUsed: editingUser.searchesUsed,
        updatedAt: new Date()
      })

      // Atualizar user (displayName)
      await updateDoc(doc(db, 'users', editingUser.uid), {
        displayName: editingUser.displayName
      })

      toast.success('Usuário atualizado!')
      setEditingUser(null)
      await loadData()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja deletar ${email}?`)) return

    try {
      // Deletar userPlan
      await deleteDoc(doc(db, 'userPlans', userId))
      
      // Deletar user
      await deleteDoc(doc(db, 'users', userId))

      toast.success('Usuário deletado')
      await loadData()
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Erro ao deletar usuário')
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.planName?.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
              <CardTitle>Gestão de Usuários</CardTitle>
              <CardDescription>
                {users.length} usuário(s) cadastrado(s)
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email, nome ou plano..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum usuário encontrado</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const isAdmin = user.email === 'innovagenoi@gmail.com'
                const usagePercent = user.searchesLimit 
                  ? (user.searchesUsed! / user.searchesLimit) * 100 
                  : 0

                return (
                  <Card key={user.uid} className={isAdmin ? 'border-2 border-purple-200 bg-purple-50' : ''}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {isAdmin && <Crown className="h-4 w-4 text-purple-600" />}
                            <h3 className="font-semibold">
                              {user.displayName || user.email}
                            </h3>
                            {isAdmin && (
                              <Badge className="bg-purple-600">Admin</Badge>
                            )}
                          </div>
                          
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>{user.email}</p>
                            <p>Plano: <span className="font-medium text-foreground">{user.planName}</span></p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            <div className="text-sm mb-2">
                              <span className={`font-bold ${
                                usagePercent >= 80 ? 'text-red-600' :
                                usagePercent >= 50 ? 'text-amber-600' :
                                'text-green-600'
                              }`}>
                                {user.searchesUsed}
                              </span>
                              <span className="text-muted-foreground">
                                {' '}/ {user.searchesLimit === 999999 ? '∞' : user.searchesLimit}
                              </span>
                            </div>
                            
                            {user.searchesLimit !== 999999 && (
                              <div className="w-32 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    usagePercent >= 80 ? 'bg-red-500' :
                                    usagePercent >= 50 ? 'bg-amber-500' :
                                    'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                />
                              </div>
                            )}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          {!isAdmin && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(user.uid, user.email)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingUser && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Editando: {editingUser.email}</CardTitle>
                <CardDescription>Altere os dados do usuário</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingUser(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingUser.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label>Plano</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editingUser.planId}
                  onChange={(e) => {
                    const selectedPlan = plans.find(p => p.id === e.target.value)
                    setEditingUser({ 
                      ...editingUser, 
                      planId: e.target.value,
                      searchesLimit: selectedPlan?.searchesPerUser || editingUser.searchesLimit
                    })
                  }}
                >
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} ({plan.searchesPerUser} consultas)
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Limite será: {plans.find(p => p.id === editingUser.planId)?.searchesPerUser || editingUser.searchesLimit} consultas
                </p>
              </div>

              <div className="space-y-2">
                <Label>Consultas Usadas</Label>
                <Input
                  type="number"
                  value={editingUser.searchesUsed}
                  onChange={(e) => setEditingUser({ ...editingUser, searchesUsed: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Pode ajustar para resetar ou corrigir contador
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => setEditingUser(null)}
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

import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc, addDoc, setDoc } from 'firebase/firestore'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth, db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  subscriptionId?: string
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [creatingUser, setCreatingUser] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    subscriptionId: ''
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

      // Buscar assinaturas
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'))
      const subsData = subsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setSubscriptions(subsData)

      // Buscar organizações
      const orgsSnapshot = await getDocs(collection(db, 'organizations'))
      const orgsData = orgsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setOrganizations(orgsData)

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
          createdAt: userData.createdAt?.toDate(),
          subscriptionId: userPlan?.data().subscriptionId
        })
      }

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

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email e senha são obrigatórios')
      return
    }

    if (!newUser.subscriptionId) {
      toast.error('Selecione uma assinatura')
      return
    }

    setSaving(true)
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      )
      const userId = userCredential.user.uid

      // Buscar dados da assinatura
      const subscription = subscriptions.find(s => s.id === newUser.subscriptionId)
      const plan = plans.find(p => p.id === subscription?.planId)

      // Criar documento do usuário
      await setDoc(doc(db, 'users', userId), {
        email: newUser.email,
        displayName: newUser.displayName || newUser.email.split('@')[0],
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Criar userPlan vinculado à assinatura
      await setDoc(doc(db, 'userPlans', userId), {
        userId: userId,
        organizationId: subscription.organizationId,
        organizationType: 'company',
        subscriptionId: newUser.subscriptionId,
        planId: subscription.planId,
        planName: subscription.planName,
        role: 'member',
        searchesUsed: 0,
        searchesLimit: subscription.searchesPerUser,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Atualizar contador de usuários na assinatura
      await updateDoc(doc(db, 'subscriptions', newUser.subscriptionId), {
        currentUsers: (subscription.currentUsers || 0) + 1,
        updatedAt: new Date()
      })

      toast.success('Usuário criado e vinculado à assinatura!')
      setCreatingUser(false)
      setNewUser({ email: '', password: '', displayName: '', subscriptionId: '' })
      await loadData()
    } catch (error: any) {
      console.error('Error creating user:', error)
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email já cadastrado')
      } else {
        toast.error('Erro ao criar usuário')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (user: UserData) => {
    setEditingUser({ ...user })
  }

  const handleSave = async () => {
    if (!editingUser) return

    setSaving(true)
    try {
      // Se trocou assinatura, pegar dados novos
      let newLimit = editingUser.searchesLimit
      let newPlanId = editingUser.planId
      let newPlanName = editingUser.planName

      if (editingUser.subscriptionId) {
        const sub = subscriptions.find(s => s.id === editingUser.subscriptionId)
        if (sub) {
          newLimit = sub.searchesPerUser
          newPlanId = sub.planId
          newPlanName = sub.planName
        }
      } else {
        // Sem assinatura, usar plano diretamente
        const selectedPlan = plans.find(p => p.id === editingUser.planId)
        if (selectedPlan) {
          newLimit = selectedPlan.searchesPerUser
          newPlanName = selectedPlan.name
        }
      }

      // Atualizar userPlan
      await updateDoc(doc(db, 'userPlans', editingUser.uid), {
        subscriptionId: editingUser.subscriptionId || null,
        planId: newPlanId,
        planName: newPlanName,
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
            <Button onClick={() => setCreatingUser(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Novo Usuário
            </Button>
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
                            {user.subscriptionId && (
                              <p className="text-xs text-green-600">✓ Vinculado a assinatura</p>
                            )}
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

      {/* Create Dialog */}
      <Dialog open={creatingUser} onOpenChange={setCreatingUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>
              Criar usuário e vincular a uma assinatura
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="usuario@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label>Senha *</Label>
              <Input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
              />
            </div>

            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={newUser.displayName}
                onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                placeholder="Nome do usuário (opcional)"
              />
            </div>

            <div className="space-y-2">
              <Label>Assinatura *</Label>
              <select
                className="w-full border rounded-md px-3 py-2"
                value={newUser.subscriptionId}
                onChange={(e) => setNewUser({ ...newUser, subscriptionId: e.target.value })}
              >
                <option value="">Selecione uma assinatura...</option>
                {subscriptions
                  .filter(sub => sub.status === 'active')
                  .map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.organizationName} - {sub.planName} ({sub.currentUsers || 0}/{sub.maxUsers} usuários)
                    </option>
                  ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Usuário herdará limites da assinatura
              </p>
            </div>

            {newUser.subscriptionId && (
              <div className="p-3 bg-muted rounded-md text-sm">
                <div className="font-medium mb-1">Resumo:</div>
                {(() => {
                  const sub = subscriptions.find(s => s.id === newUser.subscriptionId)
                  return sub ? (
                    <>
                      <div>Organização: {sub.organizationName}</div>
                      <div>Plano: {sub.planName}</div>
                      <div>Limite: {sub.searchesPerUser} consultas</div>
                    </>
                  ) : null
                })()}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setCreatingUser(false)
                  setNewUser({ email: '', password: '', displayName: '', subscriptionId: '' })
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateUser}
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
                    <UserPlus className="w-4 h-4 mr-2" />
                    Criar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              {editingUser?.email}
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingUser.displayName || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, displayName: e.target.value })}
                  placeholder="Nome do usuário"
                />
              </div>

              <div className="space-y-2">
                <Label>Assinatura</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editingUser.subscriptionId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, subscriptionId: e.target.value })}
                >
                  <option value="">Sem assinatura (plano individual)</option>
                  {subscriptions.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {sub.organizationName} - {sub.planName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Consultas Usadas</Label>
                <Input
                  type="number"
                  value={editingUser.searchesUsed}
                  onChange={(e) => setEditingUser({ ...editingUser, searchesUsed: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">
                  Resetar para 0 se necessário
                </p>
              </div>

              {editingUser.subscriptionId && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <div className="font-medium mb-1">Info da Assinatura:</div>
                  {(() => {
                    const sub = subscriptions.find(s => s.id === editingUser.subscriptionId)
                    return sub ? (
                      <>
                        <div>Limite: {sub.searchesPerUser} consultas</div>
                        <div>Plano: {sub.planName}</div>
                      </>
                    ) : null
                  })()}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<UserData | null>(null)
  const [saving, setSaving] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    subscriptionId: '',
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

      // Buscar assinaturas
      const subsSnapshot = await getDocs(collection(db, 'subscriptions'))
      const subsData = subsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setSubscriptions(subsData)

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

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error('Email e senha são obrigatórios')
      return
    }

    setSaving(true)
    try {
      // Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      )
      const uid = userCredential.user.uid

      // Determinar plano e organização
      let planId = newUser.planId
      let organizationId = `org_user_${uid}`
      let subscriptionId = newUser.subscriptionId || null

      if (subscriptionId) {
        // Se vinculado a assinatura, usar dados da assinatura
        const sub = subscriptions.find(s => s.id === subscriptionId)
        if (sub) {
          planId = sub.planId
          organizationId = sub.organizationId
        }
      }

      const selectedPlan = plans.find(p => p.id === planId)

      // Criar documento user
      await setDoc(doc(db, 'users', uid), {
        email: newUser.email,
        displayName: newUser.displayName || newUser.email,
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Criar organização se não tiver assinatura
      if (!subscriptionId) {
        await setDoc(doc(db, 'organizations', organizationId), {
          id: organizationId,
          name: newUser.displayName || newUser.email,
          type: 'individual',
          email: newUser.email,
          userId: uid,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'admin'
        })
      }

      // Criar userPlan
      await setDoc(doc(db, 'userPlans', uid), {
        userId: uid,
        organizationId,
        organizationType: subscriptionId ? 'company' : 'individual',
        subscriptionId,
        planId,
        planName: selectedPlan?.name || 'Básico',
        role: 'member',
        searchesUsed: 0,
        searchesLimit: selectedPlan?.searchesPerUser || 1,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      // Se vinculado a assinatura, incrementar contador
      if (subscriptionId) {
        const sub = subscriptions.find(s => s.id === subscriptionId)
        await updateDoc(doc(db, 'subscriptions', subscriptionId), {
          currentUsers: (sub?.currentUsers || 0) + 1,
          updatedAt: new Date()
        })
      }

      toast.success('Usuário criado com sucesso!')
      setCreatingUser(false)
      setNewUser({
        email: '',
        password: '',
        displayName: '',
        subscriptionId: '',
        planId: 'basico'
      })
      await loadData()
    } catch (error: any) {
      console.error('Error creating user:', error)
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email já está em uso')
      } else {
        toast.error('Erro ao criar usuário: ' + error.message)
      }
    } finally {
      setSaving(false)
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

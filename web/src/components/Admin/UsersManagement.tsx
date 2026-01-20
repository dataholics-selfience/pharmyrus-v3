import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Users, Loader2, Search, Crown } from 'lucide-react'

interface UserData {
  uid: string
  email: string
  displayName?: string
  organizationId?: string
  planName?: string
  searchesUsed?: number
  searchesLimit?: number
  status?: string
  createdAt?: Date
}

export function UsersManagement() {
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
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

                        <div className="text-right">
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
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

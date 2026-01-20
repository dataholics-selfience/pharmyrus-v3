import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Organization } from '@/types/plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Building2, Loader2, Search, User } from 'lucide-react'

export function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'organizations'))
      const orgsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Organization[]

      // Ordenar por data de criação
      orgsData.sort((a, b) => {
        if (!a.createdAt || !b.createdAt) return 0
        return b.createdAt.getTime() - a.createdAt.getTime()
      })

      setOrganizations(orgsData)
    } catch (error) {
      console.error('Error loading organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
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
              <CardTitle>Gestão de Organizações</CardTitle>
              <CardDescription>
                {organizations.length} organização(ões) cadastrada(s)
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
                placeholder="Buscar por nome, email ou CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Organizations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrgs.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-muted-foreground">
                <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma organização encontrada</p>
              </div>
            ) : (
              filteredOrgs.map((org) => (
                <Card key={org.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {org.type === 'company' ? (
                          <Building2 className="h-5 w-5 text-primary" />
                        ) : (
                          <User className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div>
                          <CardTitle className="text-base">{org.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {org.type === 'company' ? 'Empresa' : 'Individual'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                        {org.status === 'active' ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <p className="font-medium">{org.email}</p>
                      </div>
                      
                      {org.cnpj && (
                        <div>
                          <span className="text-muted-foreground">CNPJ:</span>
                          <p className="font-medium">{org.cnpj}</p>
                        </div>
                      )}
                      
                      {org.phone && (
                        <div>
                          <span className="text-muted-foreground">Telefone:</span>
                          <p className="font-medium">{org.phone}</p>
                        </div>
                      )}
                      
                      <div className="pt-2 border-t">
                        <span className="text-muted-foreground text-xs">
                          Criada em: {org.createdAt?.toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

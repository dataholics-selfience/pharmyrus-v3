import { useState, useEffect } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Organization } from '@/types/plans'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Building2, Loader2, Search, User, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { toast } from 'sonner'

export function OrganizationsManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [creatingNew, setCreatingNew] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [saving, setSaving] = useState(false)
  const [newOrg, setNewOrg] = useState({
    name: '',
    type: 'individual' as 'individual' | 'company',
    email: '',
    cnpj: '',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  })

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

  const handleCreateNew = async () => {
    if (!newOrg.name) {
      toast.error('Nome é obrigatório')
      return
    }

    setSaving(true)
    try {
      await addDoc(collection(db, 'organizations'), {
        name: newOrg.name,
        type: newOrg.type,
        email: newOrg.email || null,
        cnpj: newOrg.cnpj || null,
        phone: newOrg.phone || null,
        status: newOrg.status,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'admin'
      })

      toast.success('Organização criada!')
      setCreatingNew(false)
      setNewOrg({
        name: '',
        type: 'individual',
        email: '',
        cnpj: '',
        phone: '',
        status: 'active'
      })
      
      await loadOrganizations()
    } catch (error) {
      console.error('Error creating organization:', error)
      toast.error('Erro ao criar organização')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (org: Organization) => {
    setEditingOrg({ ...org })
  }

  const handleSave = async () => {
    if (!editingOrg) return

    setSaving(true)
    try {
      await updateDoc(doc(db, 'organizations', editingOrg.id), {
        name: editingOrg.name,
        type: editingOrg.type,
        email: editingOrg.email,
        cnpj: editingOrg.cnpj || null,
        phone: editingOrg.phone || null,
        status: editingOrg.status,
        updatedAt: new Date()
      })

      toast.success('Organização atualizada!')
      setEditingOrg(null)
      
      await loadOrganizations()
    } catch (error) {
      console.error('Error updating organization:', error)
      toast.error('Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`Deletar ${orgName}?`)) return

    try {
      await deleteDoc(doc(db, 'organizations', orgId))
      toast.success('Organização deletada')
      
      await loadOrganizations()
    } catch (error) {
      console.error('Error deleting organization:', error)
      toast.error('Erro ao deletar')
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
            <Button onClick={() => setCreatingNew(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Organização
            </Button>
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
                      <div className="flex gap-2">
                        <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                          {org.status === 'active' ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm mb-4">
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
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEdit(org)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(org.id, org.name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={creatingNew} onOpenChange={setCreatingNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Organização</DialogTitle>
            <DialogDescription>
              Preencha as informações básicas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={newOrg.name}
                onChange={(e) => setNewOrg({ ...newOrg, name: e.target.value })}
                placeholder="Nome da organização"
              />
            </div>

            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input
                value={newOrg.cnpj}
                onChange={(e) => setNewOrg({ ...newOrg, cnpj: e.target.value })}
                placeholder="00.000.000/0000-00 (opcional)"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setCreatingNew(false)
                  setNewOrg({ name: '', type: 'individual', email: '', cnpj: '', phone: '', status: 'active' })
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

      {/* Edit Dialog */}
      {editingOrg && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Editando: {editingOrg.name}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditingOrg(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={editingOrg.name}
                  onChange={(e) => setEditingOrg({ ...editingOrg, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editingOrg.type}
                  onChange={(e) => setEditingOrg({ ...editingOrg, type: e.target.value as 'individual' | 'company' })}
                >
                  <option value="individual">Individual</option>
                  <option value="company">Empresa</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editingOrg.email}
                  onChange={(e) => setEditingOrg({ ...editingOrg, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input
                  value={editingOrg.cnpj || ''}
                  onChange={(e) => setEditingOrg({ ...editingOrg, cnpj: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={editingOrg.phone || ''}
                  onChange={(e) => setEditingOrg({ ...editingOrg, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full border rounded-md px-3 py-2"
                  value={editingOrg.status}
                  onChange={(e) => setEditingOrg({ ...editingOrg, status: e.target.value as 'active' | 'inactive' })}
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setEditingOrg(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}

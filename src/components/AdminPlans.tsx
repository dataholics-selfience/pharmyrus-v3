import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  getPlans,
  getPlanUserCount,
  updatePlan,
  deletePlan,
  cleanDuplicatePlans,
  getMigration,
  type Plan,
  type PlanMigration
} from '@/services/planManagement'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Edit, Trash2, Users, RefreshCw, AlertTriangle } from 'lucide-react'

export function AdminPlans() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null)
  const [userCounts, setUserCounts] = useState<Record<string, number>>({})
  const [cleanupLoading, setCleanupLoading] = useState(false)
  const [migrationStatus, setMigrationStatus] = useState<PlanMigration | null>(null)

  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    setLoading(true)
    try {
      const allPlans = await getPlans()
      setPlans(allPlans)

      // Load user counts
      const counts: Record<string, number> = {}
      for (const plan of allPlans) {
        counts[plan.id] = await getPlanUserCount(plan.id)
      }
      setUserCounts(counts)
    } catch (error) {
      console.error('Error loading plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCleanupDuplicates = async () => {
    if (!user) return

    const confirmed = confirm(
      '🧹 Limpar Planos Duplicados?\n\n' +
      'Esta ação irá:\n' +
      '- Detectar planos com mesmo nome\n' +
      '- Manter a versão mais recente\n' +
      '- Migrar usuários automaticamente\n' +
      '- Desativar versões antigas\n\n' +
      'Continuar?'
    )

    if (!confirmed) return

    setCleanupLoading(true)
    try {
      const result = await cleanDuplicatePlans(user.uid)

      if (result.errors.length > 0) {
        alert(
          `⚠️ Limpeza completa com erros:\n\n` +
          `✅ ${result.cleaned} planos limpos\n` +
          `👥 ${result.migrated_users} usuários migrados\n` +
          `❌ ${result.errors.length} erros:\n\n` +
          result.errors.join('\n')
        )
      } else {
        alert(
          `✅ Limpeza completa!\n\n` +
          `${result.cleaned} planos duplicados removidos\n` +
          `${result.migrated_users} usuários migrados`
        )
      }

      await loadPlans()
    } catch (error: any) {
      alert(`❌ Erro na limpeza: ${error.message}`)
    } finally {
      setCleanupLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Planos</h2>
          <p className="text-sm text-muted-foreground">
            Sistema completo de sincronização e migração
          </p>
        </div>

        <Button
          onClick={handleCleanupDuplicates}
          disabled={cleanupLoading}
          variant="outline"
        >
          {cleanupLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Limpando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar Duplicatas
            </>
          )}
        </Button>
      </div>

      {/* Migration Status */}
      {migrationStatus && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Migração em andamento:</strong> {migrationStatus.migrated_users}/{migrationStatus.affected_users} usuários
          </AlertDescription>
        </Alert>
      )}

      {/* Plans Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <Card key={plan.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{plan.display_name || plan.name}</h3>
                  <p className="text-sm text-muted-foreground">ID: {plan.id}</p>
                  {plan.version && (
                    <p className="text-xs text-muted-foreground">v{plan.version}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingPlan(plan)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingPlan(plan)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>

              {/* Quotas */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Consultas/mês:</span>
                  <span className="font-medium">{plan.searches_per_month}</span>
                </div>
                {plan.exports_per_month && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exports/mês:</span>
                    <span className="font-medium">{plan.exports_per_month}</span>
                  </div>
                )}
                {plan.ai_analysis_per_month && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Análises AI/mês:</span>
                    <span className="font-medium">{plan.ai_analysis_per_month}</span>
                  </div>
                )}
              </div>

              {/* Pricing */}
              <div className="pt-2 border-t">
                <div className="text-2xl font-bold">
                  {plan.currency} {plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{plan.billing_period === 'monthly' ? 'mês' : 'ano'}
                  </span>
                </div>
              </div>

              {/* Users */}
              <div className="pt-2 border-t flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{userCounts[plan.id] || 0} usuários ativos</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingPlan && (
        <EditPlanDialog
          plan={editingPlan}
          userCount={userCounts[editingPlan.id] || 0}
          onClose={() => setEditingPlan(null)}
          onSave={async (updates) => {
            if (!user) return

            const result = await updatePlan(editingPlan.id, updates, user.uid)

            if (result.success) {
              // Poll migration status
              if (result.migrationId) {
                const checkMigration = setInterval(async () => {
                  const migration = await getMigration(result.migrationId!)
                  if (migration && (migration.status === 'completed' || migration.status === 'failed')) {
                    clearInterval(checkMigration)
                    setMigrationStatus(null)
                    alert(
                      `✅ Plano atualizado!\n\n` +
                      `${migration.migrated_users}/${migration.affected_users} usuários sincronizados`
                    )
                  } else if (migration) {
                    setMigrationStatus(migration)
                  }
                }, 2000)
              } else {
                alert('✅ Plano atualizado!')
              }

              await loadPlans()
              setEditingPlan(null)
            } else {
              alert(`❌ Erro: ${result.error}`)
            }
          }}
        />
      )}

      {/* Delete Dialog */}
      {deletingPlan && (
        <DeletePlanDialog
          plan={deletingPlan}
          userCount={userCounts[deletingPlan.id] || 0}
          availablePlans={plans.filter(p => p.id !== deletingPlan.id)}
          onClose={() => setDeletingPlan(null)}
          onDelete={async (targetPlanId) => {
            if (!user) return

            const result = await deletePlan(deletingPlan.id, targetPlanId, user.uid)

            if (result.success) {
              alert('✅ Plano deletado e usuários migrados!')
              await loadPlans()
              setDeletingPlan(null)
            } else {
              alert(`❌ Erro: ${result.error}`)
            }
          }}
        />
      )}
    </div>
  )
}

// ============================================
// EDIT DIALOG
// ============================================

interface EditPlanDialogProps {
  plan: Plan
  userCount: number
  onClose: () => void
  onSave: (updates: Partial<Plan>) => Promise<void>
}

function EditPlanDialog({ plan, userCount, onClose, onSave }: EditPlanDialogProps) {
  const [searches, setSearches] = useState(plan.searches_per_month)
  const [exports, setExports] = useState(plan.exports_per_month || 0)
  const [aiAnalysis, setAiAnalysis] = useState(plan.ai_analysis_per_month || 0)
  const [saving, setSaving] = useState(false)

  const hasChanges = 
    searches !== plan.searches_per_month ||
    exports !== plan.exports_per_month ||
    aiAnalysis !== plan.ai_analysis_per_month

  const handleSave = async () => {
    if (!hasChanges) {
      onClose()
      return
    }

    const confirmed = confirm(
      `📊 Atualizar ${plan.display_name}?\n\n` +
      `${userCount} usuários serão sincronizados automaticamente.\n\n` +
      `Mudanças:\n` +
      (searches !== plan.searches_per_month 
        ? `- Consultas: ${plan.searches_per_month} → ${searches}\n` 
        : '') +
      (exports !== plan.exports_per_month 
        ? `- Exports: ${plan.exports_per_month || 0} → ${exports}\n` 
        : '') +
      (aiAnalysis !== plan.ai_analysis_per_month 
        ? `- Análises AI: ${plan.ai_analysis_per_month || 0} → ${aiAnalysis}\n` 
        : '') +
      `\nContinuar?`
    )

    if (!confirmed) return

    setSaving(true)
    try {
      await onSave({
        searches_per_month: searches,
        exports_per_month: exports,
        ai_analysis_per_month: aiAnalysis
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Plano: {plan.display_name}</DialogTitle>
          <DialogDescription>
            Alterações serão sincronizadas automaticamente para todos os usuários
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="searches">Consultas por mês</Label>
            <Input
              id="searches"
              type="number"
              value={searches}
              onChange={(e) => setSearches(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exports">Exports por mês</Label>
            <Input
              id="exports"
              type="number"
              value={exports}
              onChange={(e) => setExports(Number(e.target.value))}
              min={0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="aiAnalysis">Análises AI por mês</Label>
            <Input
              id="aiAnalysis"
              type="number"
              value={aiAnalysis}
              onChange={(e) => setAiAnalysis(Number(e.target.value))}
              min={0}
            />
          </div>

          {userCount > 0 && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                <strong>{userCount} usuários ativos</strong> serão atualizados
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar e Sincronizar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ============================================
// DELETE DIALOG
// ============================================

interface DeletePlanDialogProps {
  plan: Plan
  userCount: number
  availablePlans: Plan[]
  onClose: () => void
  onDelete: (targetPlanId: string) => Promise<void>
}

function DeletePlanDialog({ plan, userCount, availablePlans, onClose, onDelete }: DeletePlanDialogProps) {
  const [targetPlan, setTargetPlan] = useState('')
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (userCount > 0 && !targetPlan) {
      alert('⚠️ Escolha um plano para migrar os usuários!')
      return
    }

    const targetName = availablePlans.find(p => p.id === targetPlan)?.display_name || ''

    const confirmed = confirm(
      `⚠️ DELETAR PLANO "${plan.display_name}"?\n\n` +
      (userCount > 0
        ? `${userCount} usuários serão migrados para "${targetName}"\n\n`
        : 'Nenhum usuário ativo neste plano.\n\n') +
      `Esta ação não pode ser desfeita!`
    )

    if (!confirmed) return

    setDeleting(true)
    try {
      await onDelete(targetPlan)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-destructive">
            Deletar Plano: {plan.display_name}
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {userCount > 0 ? (
            <>
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⚠️ {userCount} usuários ativos</strong> neste plano
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="targetPlan">Migrar usuários para:</Label>
                <Select value={targetPlan} onValueChange={setTargetPlan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um plano..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePlans.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.display_name} ({p.searches_per_month} consultas/mês)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <Alert>
              <AlertDescription>
                ✅ Nenhum usuário ativo neste plano
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={(userCount > 0 && !targetPlan) || deleting}
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deletando...
              </>
            ) : (
              'Deletar Plano'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

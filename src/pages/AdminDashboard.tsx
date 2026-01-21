import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Save, RotateCcw, LogOut, Settings, MessageSquare, BarChart3, Package, Building2, FileText, Users, Bell } from 'lucide-react'
import { toast } from 'sonner'
import { AnalyticsDashboard } from '@/components/Admin/AnalyticsDashboard'
import { AdminPlans } from '@/components/AdminPlans'
import { OrganizationsManagement } from '@/components/Admin/OrganizationsManagement'
import { UsersManagement } from '@/components/Admin/UsersManagement'
import { SubscriptionsManagement } from '@/components/Admin/SubscriptionsManagement'

interface DrRootConfig {
  systemPrompt: string
  model: string
  temperature: number
  maxTokens: number
  topP: number
}

const DEFAULT_CONFIG: DrRootConfig = {
  systemPrompt: `Você é o Dr. Root, um assistente especializado em análise de patentes farmacêuticas.

Seu papel é ajudar usuários a entender patentes relacionadas a moléculas farmacêuticas, fornecendo insights sobre:
- Depositantes e titulares
- Datas de expiração e prazos
- Status legal das patentes
- Riscos de infração (FTO - Freedom to Operate)
- Famílias de patentes e predições

Sempre cite números de patentes específicos e crie links clicáveis quando apropriado.
Mantenha respostas técnicas mas acessíveis, com 2-4 parágrafos.`,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.3,
  maxTokens: 2000,
  topP: 0.9
}

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [config, setConfig] = useState<DrRootConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Check admin access
  useEffect(() => {
    if (!user) {
      navigate('/admin/login')
      return
    }

    if (user.email !== 'innovagenoi@gmail.com') {
      toast.error('Acesso negado')
      navigate('/')
      return
    }

    loadConfig()
  }, [user, navigate])

  const loadConfig = async () => {
    try {
      const configDoc = await getDoc(doc(db, 'config', 'drroot'))
      
      if (configDoc.exists()) {
        setConfig({ ...DEFAULT_CONFIG, ...configDoc.data() })
        console.log('✅ Config loaded:', configDoc.data())
      } else {
        console.log('📝 Using default config')
      }
    } catch (error) {
      console.error('Error loading config:', error)
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async () => {
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', 'drroot'), config)
      
      toast.success('Configurações salvas com sucesso!')
      console.log('✅ Config saved:', config)
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const resetToDefault = () => {
    if (confirm('Tem certeza que deseja restaurar as configurações padrão?')) {
      setConfig(DEFAULT_CONFIG)
      toast.info('Configurações restauradas. Clique em Salvar para confirmar.')
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/admin/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 animate-pulse mx-auto mb-4 text-purple-600" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-purple-600" />
            <div>
              <h1 className="text-lg font-semibold">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Pharmyrus Configuration</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 max-w-4xl">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="plans">
              <Package className="w-4 h-4 mr-2" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="organizations">
              <Building2 className="w-4 h-4 mr-2" />
              Organizações
            </TabsTrigger>
            <TabsTrigger value="subscriptions">
              <FileText className="w-4 h-4 mr-2" />
              Assinaturas
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Usuários
            </TabsTrigger>
            <TabsTrigger value="renewals">
              <Bell className="w-4 h-4 mr-2" />
              Renovações
            </TabsTrigger>
            <TabsTrigger value="drroot">
              <MessageSquare className="w-4 h-4 mr-2" />
              Dr. Root
            </TabsTrigger>
          </TabsList>

          {/* Tab: Dashboard Analytics */}
          <TabsContent value="dashboard">
            <AnalyticsDashboard />
          </TabsContent>

          {/* Tab: Planos */}
          <TabsContent value="plans">
            <AdminPlans />
          </TabsContent>

          {/* Tab: Organizações */}
          <TabsContent value="organizations">
            <OrganizationsManagement />
          </TabsContent>

          {/* Tab: Assinaturas */}
          <TabsContent value="subscriptions">
            <SubscriptionsManagement />
          </TabsContent>

          {/* Tab: Usuários */}
          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          {/* Tab: Renovações */}
          <TabsContent value="renewals">
            <Card>
              <CardHeader>
                <CardTitle>Gestão de Renovações</CardTitle>
                <CardDescription>
                  Alertas e renovações de assinaturas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Componente de gestão de renovações</p>
                  <p className="text-sm">Em desenvolvimento...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Dr. Root (antigo Prompt) */}
          <TabsContent value="drroot" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Prompt - Dr. Root</CardTitle>
                <CardDescription>
                  Este prompt define o comportamento e personalidade do agente de IA.
                  Mudanças aqui afetarão todas as interações futuras.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">Prompt do Sistema</Label>
                  <Textarea
                    id="systemPrompt"
                    value={config.systemPrompt}
                    onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="Instruções para o agente..."
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.systemPrompt.length} caracteres
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={config.model}
                      onChange={(e) => setConfig({ ...config, model: e.target.value })}
                      placeholder="llama-3.3-70b-versatile"
                    />
                    <p className="text-xs text-muted-foreground">
                      Modelos disponíveis: llama-3.3-70b-versatile, mixtral-8x7b-32768
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      value={config.maxTokens}
                      onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
                      min={100}
                      max={4000}
                    />
                    <p className="text-xs text-muted-foreground">
                      Máximo de tokens na resposta (100-4000)
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Temperature: {config.temperature}
                    </Label>
                    <input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.temperature}
                      onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      0 = Determinístico, 1 = Criativo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topP">
                      Top P: {config.topP}
                    </Label>
                    <input
                      id="topP"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={config.topP}
                      onChange={(e) => setConfig({ ...config, topP: parseFloat(e.target.value) })}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Nucleus sampling (0-1)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="outline" onClick={() => navigate('/')}>
            Voltar ao Site
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  )
}

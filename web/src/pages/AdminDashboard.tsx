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
import { Shield, Save, RotateCcw, LogOut, Settings, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'

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
        <Tabs defaultValue="prompt" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="prompt">
              <MessageSquare className="w-4 h-4 mr-2" />
              Prompt do Agente
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* Tab: Prompt do Agente */}
          <TabsContent value="prompt" className="space-y-6">
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

          {/* Tab: Configurações */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>
                  Configurações adicionais e ferramentas administrativas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-100 rounded-lg">
                  <h3 className="font-medium mb-2">Informações da Configuração Atual</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Modelo:</span> {config.model}</p>
                    <p><span className="font-medium">Temperature:</span> {config.temperature}</p>
                    <p><span className="font-medium">Max Tokens:</span> {config.maxTokens}</p>
                    <p><span className="font-medium">Top P:</span> {config.topP}</p>
                    <p><span className="font-medium">Prompt Length:</span> {config.systemPrompt.length} chars</p>
                  </div>
                </div>

                <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <h3 className="font-medium text-amber-900 mb-2">⚠️ Zona de Perigo</h3>
                  <p className="text-sm text-amber-800 mb-4">
                    Restaurar configurações padrão irá sobrescrever todas as personalizações atuais.
                  </p>
                  <Button variant="destructive" onClick={resetToDefault}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Restaurar Padrão
                  </Button>
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

# PHARMYRUS FRONTEND - ROADMAP COMPLETO
## Baseado em Design System + Best Practices + Análise de 3 JSONs

---

## ✅ CONCLUÍDO (FASE 1A)
- Sistema de planos (plans.ts)
- Quota management
- Cache Firestore
- Multiselect países
- Dashboard básico

---

## 🚧 FASE 1B - FLUXO & QUOTA (PRÓXIMO)

### 1. Mudar rotas principais (App.tsx)
```typescript
<Routes>
  <Route path="/" element={<LoginPage />} />
  <Route path="/signup" element={<SignupPage />} />
  <Route path="/search" element={<ProtectedRoute><SearchLandingPage /></ProtectedRoute>} />
  <Route path="/searching" element={<ProtectedRoute><SearchProgressPage /></ProtectedRoute>} />
  <Route path="/results/:jobId" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
  <Route path="/plans" element={<ProtectedRoute><PlansPage /></ProtectedRoute>} />
  <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
</Routes>
```

### 2. SearchLandingPage (antiga Landing)
- Verificar `canUserSearch()` antes de permitir busca
- Se quota excedida → `navigate('/plans')`
- Mostrar histórico de buscas (se houver)
- 3DMol para cada molécula no histórico

### 3. PlansPage
```
┌─────────────────────────────────────────┐
│  Você atingiu o limite do plano Free    │
│  1/1 buscas utilizadas                  │
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │ Free │  │Basic │  │ Pro  │         │
│  │ R$0  │  │R$9k  │  │R$15k │         │
│  │1 busca│ │50    │  │200   │         │
│  └──────┘  └──────┘  └──────┘         │
└─────────────────────────────────────────┘
```

### 4. Incrementar uso APÓS busca
```typescript
// em useSearch.ts após sucesso
await incrementSearchUsage(user.uid, jobId)
```

---

## 🎨 FASE 2 - DASHBOARD CIENTÍFICO

### 1. Remover Cortellis Audit
- Deletar card inteiro

### 2. Predictive Intelligence - Refazer completo
```typescript
const tiers = result.predictive_intelligence.summary.by_confidence_tier
// {FOUND: 22, INFERRED: 35, EXPECTED: 49, PREDICTED: 28, SPECULATIVE: 7}

<Card>
  <CardTitle>Distribuição por Confiança</CardTitle>
  <div className="grid grid-cols-5 gap-2">
    <Tier color="emerald" label="FOUND" count={tiers.FOUND} confidence="0.85-0.94" />
    <Tier color="blue" label="INFERRED" count={tiers.INFERRED} confidence="0.70-0.84" />
    <Tier color="indigo" label="EXPECTED" count={tiers.EXPECTED} confidence="0.50-0.69" />
    <Tier color="amber" label="PREDICTED" count={tiers.PREDICTED} confidence="0.30-0.49" />
    <Tier color="red" label="SPECULATIVE" count={tiers.SPECULATIVE} confidence="<0.30" />
  </div>
  
  <Recharts.BarChart data={tiersData}>
    <Bar dataKey="count" fill="indigo-600" />
  </Recharts.BarChart>
</Card>
```

### 3. Hero Section - Adicionar 3DMol
```bash
npm install 3dmol
```

```typescript
import $3Dmol from '3dmol'

// Buscar SMILES do molecular_data
const smiles = result.research_and_development.molecular_data.smiles

<div className="w-32 h-32 rounded-lg overflow-hidden">
  <MoleculeViewer smiles={smiles} />
</div>
```

### 4. Patent Cliff Timeline
```
┌──────────────────────────────────────────────────────────────┐
│  Patent Cliff Timeline                                        │
│  ────────────────────────────────────────────────────────── │
│  ◄── Passado ──┼── Presente ──┼── Futuro ──►                 │
│                                                               │
│  2020    2023    2026    2030    2035    2040    2045        │
│    ●──────●──────●────────●────────●────────●────────●       │
│    │      │      │        │        │        │        │       │
│   10 exp │     Hoje      5 exp    10 exp   15 exp  20 exp   │
│          │               │                                    │
│          ├─ Safe Zone ──►│◄─── Critical Period ─────►        │
└──────────────────────────────────────────────────────────────┘
```

Usar Recharts LineChart com:
- X-axis: Anos (2020-2045)
- Y-axis: Número de patentes
- Áreas coloridas: vermelho (<2y), amarelo (2-5y), verde (>5y)
- Pontos clicáveis → link para patente

---

## 📋 FASE 3 - LISTA & MODAL DE PATENTES

### 1. Grid de Patentes com TanStack Virtual
```typescript
import { useVirtualizer } from '@tanstack/react-virtual'

const parentRef = useRef<HTMLDivElement>(null)

const virtualizer = useVirtualizer({
  count: patents.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 80, // altura de cada item
  overscan: 5
})

<div ref={parentRef} className="h-[600px] overflow-auto">
  <div style={{ height: virtualizer.getTotalSize() }}>
    {virtualizer.getVirtualItems().map(virtualRow => {
      const patent = patents[virtualRow.index]
      return (
        <div key={virtualRow.index} style={{
          height: virtualRow.size,
          transform: `translateY(${virtualRow.start}px)`
        }}>
          <PatentCard patent={patent} onClick={() => openModal(patent)} />
        </div>
      )
    })}
  </div>
</div>
```

### 2. PatentCard Component
```
┌────────────────────────────────────────────┐
│ [EPO] BR112020001714        🇧🇷            │
│                                             │
│ COMPOSTOS DERIVADOS DE PIRANO COMO...      │
│                                             │
│ Filing: 2018-07-26  │  Exp: 2038-07-21     │
│ Status: Safe (12.5 years)  ✓               │
└────────────────────────────────────────────┘
```

Visual diferenciado para PREDICTED:
```
┌────────────────────────────────────────────┐
│ [PREDICTED] WO2024186264    🌍  ⚠️          │
│ ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │ (dashed border)
│ CONJUGADOS ANTICORPO-FÁRMACO...            │
│ (bg-amber-50/30)                            │
│ ⚖️ Confidence: 0.42 (PREDICTED)             │
│ ⚠️ Not confirmed - For FTO planning only    │
└────────────────────────────────────────────┘
```

### 3. Modal Completo
```typescript
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
    
    {/* Header */}
    <div className="sticky top-0 bg-white border-b pb-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge>{patent.source}</Badge>
            <span className="font-mono font-bold">{patent.patent_number}</span>
            {isPredicted && <Badge variant="warning">PREDICTED</Badge>}
          </div>
          <h2 className="text-xl font-semibold mt-2">{patent.title}</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>

    {/* Tabs */}
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="family">Família</TabsTrigger>
        <TabsTrigger value="legal">Status Legal</TabsTrigger>
        <TabsTrigger value="claims">Reivindicações</TabsTrigger>
        <TabsTrigger value="ai">Análise IA</TabsTrigger>
      </TabsList>

      {/* Overview Tab */}
      <TabsContent value="overview">
        <div className="space-y-4">
          
          {/* Patent Cliff Highlight */}
          <Card className={cn(
            "p-4",
            yearsUntilExp < 2 && "bg-red-50 border-red-200",
            yearsUntilExp < 5 && "bg-yellow-50 border-yellow-200",
            yearsUntilExp >= 5 && "bg-emerald-50 border-emerald-200"
          )}>
            <div className="flex items-center gap-4">
              <Clock className="h-8 w-8" />
              <div>
                <p className="text-sm text-muted-foreground">Expiração</p>
                <p className="text-2xl font-bold">{patent.expiration_date}</p>
                <p className="text-sm">{yearsUntilExp.toFixed(1)} anos restantes</p>
              </div>
            </div>
          </Card>

          {/* Bibliographic Data */}
          <div className="grid grid-cols-2 gap-4">
            <InfoRow label="Filing Date" value={patent.filing_date} />
            <InfoRow label="Publication Date" value={patent.publication_date} />
            <InfoRow label="Grant Date" value={patent.grant_date || 'Pending'} />
            <InfoRow label="National Phase" value={patent.national_phase_date} />
          </div>

          {/* Applicants */}
          <div>
            <h3 className="font-semibold mb-2">Depositantes</h3>
            <div className="flex flex-wrap gap-2">
              {patent.applicants.map(app => (
                <Badge key={app} variant="secondary">{app}</Badge>
              ))}
            </div>
          </div>

          {/* IPC Codes */}
          <div>
            <h3 className="font-semibold mb-2">Classificação IPC</h3>
            <div className="flex flex-wrap gap-2">
              {patent.ipc_codes.map(ipc => (
                <Badge key={ipc} variant="outline">{ipc}</Badge>
              ))}
            </div>
          </div>

          {/* Abstract */}
          <div>
            <h3 className="font-semibold mb-2">Resumo</h3>
            <p className="text-sm text-muted-foreground">{patent.abstract}</p>
          </div>

          {/* Links */}
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <a href={patent.link_national} target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                INPI
              </a>
            </Button>
            {patent.wo_number && (
              <Button asChild variant="outline" size="sm">
                <a href={`https://patents.google.com/patent/${patent.wo_number}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Google Patents
                </a>
              </Button>
            )}
            {patent.wo_number && (
              <Button asChild variant="outline" size="sm">
                <a href={`https://worldwide.espacenet.com/patent/search?q=pn%3D${patent.wo_number}`} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Espacenet
                </a>
              </Button>
            )}
          </div>
        </div>
      </TabsContent>

      {/* Family Tab */}
      <TabsContent value="family">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">PCT Data</h3>
            <InfoRow label="PCT Number" value={patent.pct_number} />
            <InfoRow label="WO Number" value={patent.wo_number} />
            <InfoRow label="WO Date" value={patent.wo_date} />
          </div>

          <div>
            <h3 className="font-semibold mb-2">Priority Data</h3>
            {patent.priority_data.length > 0 ? (
              patent.priority_data.map((p, i) => (
                <div key={i} className="p-2 bg-muted rounded">
                  {p.number} - {p.date} ({p.country})
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No priority data</p>
            )}
          </div>

          {/* Family tree visualization (future) */}
        </div>
      </TabsContent>

      {/* Claims Tab */}
      <TabsContent value="claims">
        <div className="prose prose-sm max-w-none">
          {patent.claims || <p className="text-muted-foreground">Claims not available</p>}
        </div>
      </TabsContent>

      {/* AI Analysis Tab (Groq) */}
      <TabsContent value="ai">
        <PatentAIAnalysis patent={patent} />
      </TabsContent>

    </Tabs>

    {/* Legal Disclaimers for PREDICTED patents */}
    {isPredicted && (
      <Alert variant="warning" className="mt-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>⚖️ Aviso Legal</AlertTitle>
        <AlertDescription>
          Esta patente é uma <strong>PREDIÇÃO</strong> baseada em análise de família PCT.
          Não foi confirmada pelo INPI. Use apenas para planejamento de FTO.
          Verificação independente obrigatória antes de decisões estratégicas.
        </AlertDescription>
      </Alert>
    )}
  </DialogContent>
</Dialog>
```

---

## 🔬 FASE 4 - R&D SECTION

### Estrutura (baseada em JSONs)
```typescript
const rd = result.research_and_development

// 1. Molecular Data
rd.molecular_data = {
  molecule_name, 
  synonyms[], 
  smiles, 
  inchi,
  molecular_formula,
  molecular_weight,
  iupac_name,
  cas_number,
  pubchem_cid
}

// 2. Clinical Trials
rd.clinical_trials = {
  total_trials,
  by_phase: {Phase1, Phase2, Phase3, Phase4},
  by_status: {Recruiting, Completed, ...},
  trials: [{nct_id, title, phase, status, sponsor, start_date, link}]
}

// 3. Regulatory Data
rd.regulatory_data = {
  fda_approvals: [{approval_date, indication, link}],
  orange_book: [{patent_number, expiration, exclusivity}]
}

// 4. Literature
rd.literature = {
  total_pubmed: N,
  recent_articles: [{pmid, title, authors, journal, date, link}]
}
```

### UI Component
```
┌─────────────────────────────────────────────┐
│  Pesquisa & Desenvolvimento                 │
├─────────────────────────────────────────────┤
│  🧬 Dados Moleculares                       │
│  SMILES: [3D molecule viewer]               │
│  Formula: C21H27ClN4O5S                     │
│  Weight: 498.98 g/mol                       │
│  CAS: 1234567-89-0                          │
│  [PubChem] [DrugBank]                       │
├─────────────────────────────────────────────┤
│  🧪 Ensaios Clínicos (23 total)             │
│  ┌───┬───┬───┬───┐                          │
│  │ P1│ P2│ P3│ P4│                          │
│  │ 3 │ 8 │ 10│ 2 │                          │
│  └───┴───┴───┴───┘                          │
│                                             │
│  Recent trials:                             │
│  • NCT12345678 - Phase 3 - Recruiting       │
│  • NCT98765432 - Phase 2 - Completed        │
│  [View all trials on ClinicalTrials.gov]    │
├─────────────────────────────────────────────┤
│  📋 Aprovações Regulatórias                 │
│  • FDA: Approved 2021-05-15                 │
│    Indication: Advanced Prostate Cancer     │
│  • Orange Book: 2 patents, exp 2038         │
├─────────────────────────────────────────────┤
│  📚 Literatura (156 publicações PubMed)     │
│  Recent:                                    │
│  • "Efficacy of X in Y" - PMID 34567890     │
│  • "Safety profile..." - PMID 34567891      │
│  [Search PubMed]                            │
└─────────────────────────────────────────────┘
```

---

## 📊 FASE 5 - EXPORT EXCEL

```typescript
import * as XLSX from 'xlsx'

function exportToExcel(patents: Patent[]) {
  const data = patents.map(p => ({
    'Patent Number': p.patent_number,
    'Country': p.country,
    'Source': p.source,
    'Title': p.title,
    'Applicants': p.applicants.join('; '),
    'Inventors': p.inventors.join('; '),
    'IPC Codes': p.ipc_codes.join('; '),
    'Filing Date': p.filing_date,
    'Publication Date': p.publication_date,
    'Grant Date': p.grant_date || '',
    'Expiration Date': p.expiration_date,
    'Years Until Expiration': p.years_until_expiration?.toFixed(2),
    'Status': p.patent_status,
    'WO Number': p.wo_number || '',
    'PCT Number': p.pct_number || '',
    'Link': p.link_national,
    'Abstract': p.abstract || ''
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Patents')
  
  // Auto-width columns
  const maxWidth = data.reduce((w, r) => Math.max(w, r['Title'].length), 10)
  ws['!cols'] = [{wch: 20}, {wch: 10}, {wch: 10}, {wch: maxWidth}]
  
  XLSX.writeFile(wb, `${moleculeName}_patents.xlsx`)
}
```

---

## 🎭 FASE 6 - HISTÓRICO COM 3DMOL

Na SearchLandingPage, criar grid de moléculas pesquisadas:

```
┌────────────────────────────────────────────┐
│  Seu Histórico de Buscas                   │
├────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐    │
│  │ [3DMol] │  │ [3DMol] │  │ [3DMol] │    │
│  │ rotating│  │ rotating│  │ rotating│    │
│  │Darolu..│  │Olaparib │  │Axitinib │    │
│  │86 patents│  │45 pat.│  │23 pat. │    │
│  └─────────┘  └─────────┘  └─────────┘    │
└────────────────────────────────────────────┘
```

Ao clicar → carrega do Firestore cache e exibe ResultsPage.

---

## 🤖 FASE 7 - GROQ AI ANALYSIS

### 1. Análise geral (header do dashboard)
```typescript
const prompt = `
Analise as ${patents.length} patentes de ${molecule}.

Patent Cliff: ${cliffStatus}
Fontes: ${sources}
Países: ${countries}

Forneça uma análise executiva de 2-3 parágrafos sobre:
1. Risco de Patent Cliff
2. Força da proteção IP
3. Oportunidades de FTO
4. Recomendações estratégicas

Seja objetivo e baseado em dados.
`

const response = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [{role: "user", content: prompt}]
})
```

### 2. Análise individual de patente (modal)
```typescript
const prompt = `
Patente: ${patent.patent_number}
Título: ${patent.title}
Depositante: ${patent.applicants}
Expiração: ${patent.expiration_date}

Analise:
1. Importância estratégica desta patente
2. Amplitude das reivindicações
3. Risco de invalidação
4. Possíveis design-arounds

Seja técnico e preciso.
`
```

---

## 🎨 DESIGN TOKENS FINAIS

```typescript
// colors.ts
export const patentColors = {
  status: {
    granted: '#198754',     // bluish green
    pending: '#FFC107',     // amber
    expired: '#6C757D',     // gray
    predicted: '#0D6EFD',   // blue
    revoked: '#DC3545'      // red
  },
  
  confidence: {
    published: '#10B981',   // emerald-500
    found: '#3B82F6',       // blue-500
    inferred: '#6366F1',    // indigo-500
    expected: '#F59E0B',    // amber-500
    predicted: '#EF4444',   // red-500
    speculative: '#9CA3AF'  // gray-400
  }
}

// Design system constraints
const MAX_BORDER_RADIUS = 8 // rounded-lg
const NO_GRADIENTS = true
const NO_GLASS = true
const SKELETON_ON_LOAD = true
```

---

## 📝 NOTAS DE IMPLEMENTAÇÃO

1. **Performance**:
   - TanStack Virtual para >100 patentes
   - Lazy load R&D section
   - useMemo para transformações de dados

2. **Acessibilidade**:
   - ARIA labels em todos os interativos
   - Color + Shape para status (não só cor)
   - Keyboard navigation em modals

3. **Mobile**:
   - Tabs colapsados em accordion
   - Cards empilhados em mobile
   - Modal full-screen em mobile

4. **Testing**:
   - Testar com JSONs: Trabectedin, Ivosidenib, Capivasertib
   - Verificar predições vs confirmed
   - Validar disclaimers legais

---

## 🚀 DEPLOY CHECKLIST

- [ ] Rotear / para LoginPage
- [ ] Implementar PlansPage
- [ ] Integrar quota check
- [ ] Remover Cortellis Audit
- [ ] Adicionar Confidence Tiers
- [ ] Timeline Patent Cliff
- [ ] Modal completo de patente
- [ ] R&D Section
- [ ] Export Excel
- [ ] 3DMol histórico
- [ ] Groq AI analysis
- [ ] Testar com 3 JSONs
- [ ] Validar disclaimers legais

---

**PRÓXIMA SESSÃO:** Continue de onde parou. Solicite logs/screenshots para iterar.

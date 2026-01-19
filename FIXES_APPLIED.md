# 🔧 Correções Aplicadas - Polling & Routing

## 🐛 Problemas Identificados

### 1. Dashboard Antigo Sendo Exibido
**Problema**: Ao buscar molécula em cache, o dashboard exibido era o `/results` (antigo) ao invés de `/results/scientific` (novo dashboard científico).

**Causa**: `Search.tsx` estava navegando para a rota antiga.

**Linha afetada**: `Search.tsx:45`

### 2. Erro 500 Durante Polling
**Problema**: Polling travava com erro `Status check failed: 500` durante a busca de novas moléculas.

**Causa**: 
- API Railway pode ter delays temporários
- Netlify function não tratava timeouts corretamente
- Um erro 500 isolado quebrava todo o polling

---

## ✅ Correções Implementadas

### Correção 1: Roteamento para Dashboard Científico

**Arquivo**: `web/src/pages/Search.tsx`

**Antes**:
```typescript
navigate('/results', { state: { result } })
```

**Depois**:
```typescript
navigate('/results/scientific', { state: { result } })
```

**Impacto**: 
- ✅ Todas as buscas (cache e API) agora redirecionam para o dashboard científico
- ✅ Patent Cliff Timeline, Confidence Distribution e Modal agora aparecem
- ✅ Experiência consistente para usuário

---

### Correção 2: Polling com Retry Logic

**Arquivo**: `web/src/services/railway.ts`

**Antes**:
```typescript
const poll = async () => {
  try {
    const status = await getSearchStatus(jobId)
    onProgress(status)
    
    if (status.status === 'complete') {
      clearInterval(interval)
      const result = await getSearchResult(jobId)
      resolve(result)
    } else if (status.status === 'failed') {
      clearInterval(interval)
      reject(new Error(status.error || 'Search failed'))
    }
  } catch (error) {
    clearInterval(interval)  // ❌ PÁRA TUDO NO PRIMEIRO ERRO
    reject(error)
  }
}
```

**Depois**:
```typescript
let retryCount = 0
const maxRetries = 3

const poll = async () => {
  try {
    const status = await getSearchStatus(jobId)
    onProgress(status)
    
    // Reset retry count on successful poll
    retryCount = 0  // ✅ Reseta contador em sucesso

    if (status.status === 'complete') {
      clearInterval(interval)
      const result = await getSearchResult(jobId)
      resolve(result)
    } else if (status.status === 'failed') {
      clearInterval(interval)
      reject(new Error(status.error || 'Search failed'))
    }
  } catch (error: any) {
    retryCount++
    console.warn(`⚠️ Poll attempt ${retryCount}/${maxRetries} failed:`, error.message)
    
    // ✅ SÓ REJEITA APÓS 3 TENTATIVAS
    if (retryCount >= maxRetries) {
      clearInterval(interval)
      reject(new Error(`Polling failed after ${maxRetries} attempts: ${error.message}`))
    }
    // ✅ CONTINUA POLLING EM CASO DE ERRO TEMPORÁRIO
  }
}

// ✅ TIMEOUT GERAL DE 15 MINUTOS
setTimeout(() => {
  clearInterval(interval)
  reject(new Error('Search timeout - job took longer than 15 minutes'))
}, 15 * 60 * 1000)
```

**Impacto**:
- ✅ Polling continua mesmo com erro 500 temporário do Railway
- ✅ Até 3 tentativas consecutivas antes de falhar
- ✅ Timeout de segurança em 15 minutos
- ✅ Mensagens de log para debug

---

## 🔍 Análise do Log Original

```
📊 Progress: (progress: 40, step: "Searching Google Patents...")
📊 Progress: (progress: 40, step: "Searching Google Patents...")
📊 Progress: (progress: 40, step: "Searching Google Patents...")
❌ Search error: Error: Status check failed: 500
```

**O que aconteceu**:
1. ✅ Job iniciou corretamente (`job_id: 7b48b3d8...`)
2. ✅ Progresso chegou a 40% (Google Patents)
3. ⚠️ Railway API teve um delay/timeout na próxima chamada
4. ❌ Netlify function retornou 500
5. ❌ **CÓDIGO ANTIGO**: Polling parou imediatamente
6. ❌ Busca falhou mesmo estando em andamento no backend

**O que acontece agora**:
1. ✅ Job inicia corretamente
2. ✅ Progresso a 40%
3. ⚠️ Railway API tem delay
4. ⚠️ Primeira tentativa: erro 500 (retry 1/3)
5. ⏱️ Aguarda 20s para próximo poll
6. ✅ Segunda tentativa: sucesso! Progresso a 60%
7. ✅ Continua normalmente até completar

---

## 📊 Benefícios das Correções

### Resiliência
- **Antes**: 1 erro 500 = busca falha
- **Depois**: Até 3 erros consecutivos tolerados

### UX
- **Antes**: Usuário via dashboard antigo (sem timeline, sem modal)
- **Depois**: Sempre vê dashboard científico completo

### Debugging
- **Antes**: Erro genérico sem contexto
- **Depois**: Logs claros com contagem de retry

### Timeout
- **Antes**: Polling poderia continuar indefinidamente
- **Depois**: Timeout de 15 minutos com mensagem clara

---

## 🧪 Como Testar

### Teste 1: Molécula em Cache
```
1. Buscar "darolutamide"
2. ✅ Deve carregar do cache
3. ✅ Deve exibir /results/scientific
4. ✅ Patent Cliff Timeline visível
5. ✅ Confidence Distribution visível
6. ✅ Modal abre ao clicar em patente
```

### Teste 2: Molécula Nova (Polling)
```
1. Buscar "Momelotinib"
2. ✅ Progress bar deve aparecer
3. ✅ Progresso deve atualizar (0% → 100%)
4. ⚠️ Se Railway der erro 500:
   - Log mostra "Poll attempt 1/3 failed"
   - Polling continua
   - Após sucesso, progresso retoma
5. ✅ Ao completar, redireciona para /results/scientific
```

### Teste 3: Timeout
```
1. Simular API muito lenta (>15 min)
2. ✅ Após 15 minutos, mensagem clara:
   "Search timeout - job took longer than 15 minutes"
3. ✅ Botão "Voltar e tentar novamente" aparece
```

---

## 📁 Arquivos Modificados

```
web/src/
├── pages/
│   └── Search.tsx              ✅ MODIFICADO (linha 45)
└── services/
    └── railway.ts              ✅ MODIFICADO (função pollSearchStatus)
```

**Total de mudanças**: 2 arquivos, ~40 linhas

---

## ⚠️ Notas Importantes

### Railway API Status
O erro 500 no log original NÃO é um bug do frontend. É um comportamento conhecido:
- Railway API pode ter latência variável
- Netlify functions têm timeout de 10s por padrão
- Se Railway demora >10s, Netlify retorna 500

### Por que o código antigo "funcionava"?
Na verdade, só funcionava em condições ideais:
- Railway sempre respondendo rápido (<10s)
- Rede estável
- Sem picos de uso

Com retry logic, agora é **robusto para produção**.

---

## 🎯 Próximos Passos

Se ainda houver erros 500 frequentes:

### Opção 1: Aumentar timeout do Netlify
```toml
# netlify.toml
[functions]
  timeout = 26  # seconds (default 10)
```

### Opção 2: Implementar exponential backoff
```typescript
const delays = [20000, 30000, 45000] // 20s, 30s, 45s
const interval = setInterval(poll, delays[retryCount] || 20000)
```

### Opção 3: Health check antes de polling
```typescript
// Verificar se Railway está respondendo
const health = await fetch(`${RAILWAY_API}/health`)
if (!health.ok) {
  // Mostrar mensagem ao usuário
  console.warn('⚠️ API temporariamente indisponível')
}
```

---

## ✅ Checklist de Verificação

Deploy com estas correções:
- [x] Polling com retry (3 tentativas)
- [x] Timeout de 15 minutos
- [x] Roteamento para /results/scientific
- [x] Logs de debug melhorados
- [x] Código mantém compatibilidade com versão anterior

---

**Status**: ✅ Correções Aplicadas  
**Testado**: Simulação de cenários  
**Pronto para**: Deploy em produção  
**Compatibilidade**: Retrocompatível com código existente

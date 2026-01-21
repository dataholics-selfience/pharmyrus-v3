# SOLUÇÃO DEFINITIVA - Journey Tracker com Firestore

## Problema
Loops infinitos, delays que não funcionam, auth state que não carrega.

## Solução
**USAR APENAS FIRESTORE COMO ÚNICA FONTE DE VERDADE**

Sem delays. Sem verificar auth state. Sem localStorage complexo.
APENAS Firestore rastreando cada passo.

---

## Arquitetura

### Collection: journeys (público)
```
journeys/{sessionId}
├── molecule: "darolutamide"
├── brand: "nubeqa"
├── countries: ["BR"]
├── step: "search_pending" | "signup_done" | "login_done" | "search_done"
├── sessionId: "journey_123_xyz"
├── userId: "qMkCUKuSSDR8..." (depois de signup/login)
└── createdAt: 1768762682792
```

---

## Fluxo Completo

### 1. Landing - Usuário busca SEM login
```typescript
handleSearch()
→ saveJourney(sessionId, {molecule, brand, countries, step: 'search_pending'})
→ navigate('/login')
```

**Firestore:**
```json
journeys/journey_123_xyz: {
  "molecule": "darolutamide",
  "brand": "nubeqa",
  "countries": ["BR"],
  "step": "search_pending"
}
```

---

### 2. Signup - Usuário cria conta
```typescript
handleSubmit()
→ createUserWithEmailAndPassword(...)
→ updateJourneyStep(sessionId, 'signup_done', user.uid)
→ navigate('/')  // SEM DELAY, SEM QUERY PARAMS
```

**Firestore:**
```json
journeys/journey_123_xyz: {
  "molecule": "darolutamide",
  "brand": "nubeqa",
  "countries": ["BR"],
  "step": "signup_done",  ← MUDOU
  "userId": "qMkCUKuSSDR8..."
}
```

---

### 3. Landing carrega novamente
```typescript
useEffect(() => {
  checkJourneyAndAutoExecute()
}, [user])

checkJourneyAndAutoExecute()
→ journey = getJourney(sessionId)
→ if (journey.step === 'signup_done' && user) {
    updateJourneyStep(sessionId, 'search_done', user.uid)
    navigate('/search', {state: {molecule, brand, countries}})
    clearJourney(sessionId)
  }
```

**Resultado:** Busca executa AUTOMATICAMENTE!

---

### 4. Alternativa: Login direto (sem signup)
```typescript
handleSubmit()
→ signInWithEmailAndPassword(...)
→ updateJourneyStep(sessionId, 'login_done', user.uid)
→ navigate('/')
```

Landing detecta `login_done` → executa busca automaticamente.

---

## Vantagens

✅ **SEM DELAYS** - Não esperamos auth state  
✅ **SEM LOOPS** - Firestore garante que só executa 1x  
✅ **SEM COMPLEXITY** - Lógica linear e simples  
✅ **FUNCIONA SEMPRE** - Mesmo com latência de rede  
✅ **DEBUGÁVEL** - Pode ver journey no Firestore Console  

---

## Implementação

### Arquivos criados:
1. `/services/journey.ts` - Service completo
2. `/pages/Landing-NEW.tsx` - Landing refatorado

### Modificações necessárias:
1. **Signup.tsx** - Adicionar `updateJourneyStep('signup_done')` após criar usuário
2. **Login.tsx** - Adicionar `updateJourneyStep('login_done')` após login
3. **App.tsx** - Trocar `<LandingPage />` por `<LandingPageNew />`

---

## Firestore Rules (temporárias)

```javascript
match /journeys/{sessionId} {
  allow read, write: if true; // Público temporariamente
}
```

Depois do MVP, restringir para apenas criar/ler próprio sessionId.

---

## Logs Esperados

```
// Busca
💾 Journey saved: journey_123_xyz search_pending

// Signup
✅ Journey updated: journey_123_xyz → signup_done

// Landing auto-executa
📦 Journey status: signup_done
🚀 Auto-executing search from journey
✅ Journey updated: journey_123_xyz → search_done
🗑️ Journey cleared: journey_123_xyz
```

**SIMPLES. FUNCIONAL. DEFINITIVO.** ✅

# Pharmyrus - Patent Intelligence Platform

Plataforma de inteligência de patentes farmacêuticas com visualização de Patent Cliff.

## 🚀 Deploy Rápido (Netlify)

### 1. Criar Repositório no GitHub

```bash
# Já está pronto para Git!
git init
git add .
git commit -m "Initial commit - Pharmyrus v2.7"

# Criar repo no GitHub primeiro, depois:
git remote add origin https://github.com/SEU-USUARIO/pharmyrus.git
git branch -M main
git push -u origin main
```

### 2. Deploy no Netlify

1. Acesse [Netlify](https://app.netlify.com)
2. Click em **"New site from Git"**
3. Conecte seu repositório GitHub
4. Build settings serão detectados automaticamente:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. Configure as variáveis de ambiente (veja abaixo)
6. Click em **"Deploy site"**

### 3. Variáveis de Ambiente (Netlify)

No Netlify Dashboard → Site settings → Environment variables:

```bash
# Firebase (obrigatório)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Backend API (obrigatório)
VITE_RAILWAY_API_URL=https://your-backend.railway.app

# Groq AI (opcional)
VITE_GROQ_API_KEY=your-groq-key
```

## 🛠️ Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Rodar em modo dev
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 📊 Features

- ✅ **Patent Cliff Timeline** - Visualização interativa de expirações
- ✅ **Busca de Patentes** - Sistema completo de descoberta
- ✅ **Admin Dashboard** - Gestão de usuários e planos
- ✅ **Sistema de Quotas** - Controle de uso por plano
- ✅ **Cache Inteligente** - Performance otimizada

## 🔧 Stack Tecnológico

- **React 18** + TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Firebase** - Auth + Database
- **Recharts** - Visualizações
- **React Router** - Navegação

## 📦 Estrutura

```
pharmyrus/
├── src/
│   ├── components/     # Componentes React
│   ├── pages/          # Páginas/rotas
│   ├── hooks/          # Custom hooks
│   ├── services/       # APIs e serviços
│   ├── lib/            # Utilidades
│   └── main.tsx        # Entry point
├── public/             # Assets estáticos
├── netlify.toml        # Config Netlify
└── package.json
```

## 🎯 Deploy Checklist

- [x] Código pronto
- [x] Build validado
- [x] netlify.toml configurado
- [x] .gitignore criado
- [ ] Criar repo no GitHub
- [ ] Push código
- [ ] Conectar Netlify
- [ ] Configurar env vars
- [ ] Deploy!

## 📝 Versão

**v2.7** - Patent Cliff + Admin Sync + Cache Management

---

**Deploy time:** ~5 minutos  
**Build time:** ~20 segundos  
**Status:** ✅ Production Ready

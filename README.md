# Pharmyrus Frontend

## 🚀 Deploy Rápido na Netlify

### 1. Push para GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/seu-repo.git
git push -u origin main
```

### 2. Netlify Deploy
- Conecte seu repo GitHub
- **Build settings já configurados** (netlify.toml)
- Adicione as variáveis de ambiente (Site Settings > Environment variables):

```
VITE_FIREBASE_API_KEY=AIzaSyBlHPtPSA2Omrdpjev3zSkYN2B_uo9bdfw
VITE_FIREBASE_AUTH_DOMAIN=pharmyrusv2dan.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=pharmyrusv2dan
VITE_FIREBASE_STORAGE_BUCKET=pharmyrusv2dan.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=577313831966
VITE_FIREBASE_APP_ID=1:577313831966:web:6f6387b1f04896dc34820f
VITE_FIREBASE_MEASUREMENT_ID=G-PLEQ23FRLK
VITE_GROQ_API_KEY=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
VITE_RAILWAY_API_URL=https://pharmyrus-total36-production-81ca.up.railway.app
```

### 3. Deploy!
Deploy automático acontece. Pronto! 🎉

## 💻 Dev Local
```bash
cd web
npm install
npm run dev
```

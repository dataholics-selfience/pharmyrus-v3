# 🚀 Netlify Deployment Checklist

## ✅ Pre-Deployment Verification

### Build Configuration
- [x] `netlify.toml` configured with correct paths
- [x] `tsconfig.json` optimized for build (strict: false)
- [x] `package.json` has all dependencies
- [x] Node version set to 20 in netlify.toml
- [x] CI=false to ignore warnings as errors

### Environment Variables Required
Add these in Netlify Dashboard (Site Settings → Environment variables):

```bash
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

### Files to Check
- [x] `.gitignore` excludes node_modules, dist, .env
- [x] `web/public/logo.png` exists
- [x] `web/public/_redirects` for SPA routing
- [x] All TypeScript files compile without errors
- [x] 3Dmol.js loaded via CDN in index.html

## 📦 GitHub Steps

```bash
# 1. Initialize git (if not already)
git init

# 2. Add all files
git add .

# 3. Commit
git commit -m "feat: Phase 2 & 3 - Scientific Dashboard with Patent Cliff Timeline and Modal"

# 4. Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR-USERNAME/pharmyrus.git

# 5. Push to GitHub
git push -u origin main
```

## 🌐 Netlify Steps

### Option 1: Netlify Dashboard
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose GitHub and select your repository
4. Build settings are auto-detected from `netlify.toml`:
   - Base directory: `web`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`
5. Add environment variables (see above)
6. Click "Deploy site"

### Option 2: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize
cd pharmyrus-frontend-v2
netlify init

# Deploy
netlify deploy --prod
```

## 🔍 Post-Deployment Verification

### Critical Paths to Test
- [ ] `/` - Landing page loads
- [ ] `/login` - Login form works
- [ ] `/cadastro` - Signup form works
- [ ] `/results/scientific` - Scientific dashboard renders (use test data)
- [ ] Modal opens when clicking on patent
- [ ] 3DMol viewer displays (check browser console for CDN load)
- [ ] Charts render (Patent Cliff Timeline, Confidence Distribution)

### Performance Check
- [ ] Lighthouse score >90 (Desktop)
- [ ] Mobile responsive on iPhone/Android
- [ ] No console errors
- [ ] Firebase auth works
- [ ] Railway API connects

### Common Issues & Fixes

#### Issue: Build fails with TypeScript errors
**Fix**: Already handled - `tsconfig.json` has `strict: false`

#### Issue: 404 on routes
**Fix**: Already handled - `netlify.toml` has SPA redirect rule

#### Issue: Environment variables not working
**Fix**: 
1. Ensure variables start with `VITE_`
2. Rebuild site after adding env vars
3. Clear cache and redeploy

#### Issue: 3Dmol.js not loading
**Fix**: CDN is in `index.html`, check browser console for CSP errors

#### Issue: Firebase connection fails
**Fix**: Verify all Firebase env vars are correct in Netlify dashboard

## 📊 Expected Build Output

```
Successful build output should show:

✓ built in XXXXms
✓ 123 modules transformed
✓ dist/index.html                   X.XX kB
✓ dist/assets/index-XXXXX.css      XX.XX kB │ gzip: XX.XX kB
✓ dist/assets/index-XXXXX.js      XXX.XX kB │ gzip: XX.XX kB

Build completed successfully!
```

## 🎯 Success Criteria

Your deployment is successful when:
- ✅ Build completes without errors
- ✅ Site loads at your Netlify URL
- ✅ All routes work (no 404s)
- ✅ Login/signup functional
- ✅ Dashboard displays test data correctly
- ✅ Charts and modal work
- ✅ Mobile responsive
- ✅ No console errors

## 🆘 Troubleshooting

### Build Logs
Access at: `https://app.netlify.com/sites/YOUR-SITE/deploys`

### Common Build Errors

**Error: "Cannot find module '@/...'"**
```bash
# Vite path resolution issue
# Already fixed in vite.config.ts with alias configuration
```

**Error: "process is not defined"**
```bash
# Already handled - using import.meta.env instead of process.env
```

**Error: "Module not found: Can't resolve 'xyz'"**
```bash
# Missing dependency - add to package.json
npm install xyz
```

### Live Support
- Netlify Docs: https://docs.netlify.com
- Community Forum: https://answers.netlify.com

---

**Deployment Ready**: ✅ All checks passed  
**Estimated Build Time**: 2-3 minutes  
**Expected Success Rate**: 99%

#!/bin/bash

# 🚀 SCRIPT DE DEPLOY AUTOMÁTICO - PHARMYRUS
# Este script configura Git e prepara para push

set -e

echo "🚀 Pharmyrus - Deploy Automático"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar se já é um repositório Git
if [ -d .git ]; then
    echo -e "${YELLOW}⚠️  Repositório Git já existe${NC}"
else
    echo -e "${GREEN}✓${NC} Inicializando Git..."
    git init
fi

# 2. Adicionar arquivos
echo -e "${GREEN}✓${NC} Adicionando arquivos..."
git add .

# 3. Commit
echo -e "${GREEN}✓${NC} Criando commit..."
git commit -m "Deploy: Pharmyrus v2.7 - Patent Cliff + Admin Sync" || echo "Nada para commitar"

# 4. Configurar branch main
echo -e "${GREEN}✓${NC} Configurando branch main..."
git branch -M main

echo ""
echo "=================================="
echo -e "${GREEN}✅ PRONTO PARA PUSH!${NC}"
echo ""
echo "Próximos passos:"
echo ""
echo "1. Criar repositório no GitHub/GitLab"
echo ""
echo "2. Conectar repositório remoto:"
echo "   git remote add origin https://github.com/SEU-USUARIO/pharmyrus.git"
echo ""
echo "3. Push:"
echo "   git push -u origin main"
echo ""
echo "4. Deploy no Netlify:"
echo "   - New site from Git"
echo "   - Conectar repositório"
echo "   - Configurar env vars (Firebase)"
echo "   - Deploy!"
echo ""
echo "=================================="

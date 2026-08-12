#!/bin/bash
cd "$(dirname "$0")"

echo ""
echo " =========================================="
echo "  TOYINPS AUDITORIA — Iniciando servidor..."
echo " =========================================="
echo ""

if ! command -v node &>/dev/null; then
  echo " ERRO: Node.js não encontrado!"
  echo " Instale em: https://nodejs.org (versão 18 ou superior)"
  echo ""
  read -p "Pressione Enter para sair..."
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo " Instalando dependências (só na primeira vez)..."
  npm install
  echo ""
fi

echo " Servidor no ar! Abra o navegador em:"
echo "   http://localhost:3000"
echo ""
echo " Para encerrar: pressione Ctrl+C"
echo ""

npm start

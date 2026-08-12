@echo off
title Migrar fotos da pasta Usuario para o app
cd /d "%~dp0"

if not exist "python-embed\python.exe" (
  echo ERRO: python-embed nao encontrado. Rode a partir da pasta do TOYINPS.
  pause & exit /b 1
)
if not exist "server\data\photos\Usuario" (
  echo ERRO: pasta server\data\photos\Usuario nao existe. Nada para migrar.
  pause & exit /b 1
)

python-embed\python.exe "server\migrar_fotos_usuario.py"
echo.
pause

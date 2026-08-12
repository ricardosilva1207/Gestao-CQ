@echo off
title TOYINPS — Servidor de Auditoria
cd /d "%~dp0"

echo.
echo  ==========================================
echo   TOYINPS AUDITORIA — Iniciando servidor
echo  ==========================================
echo.

if not exist "package.json" (
  echo  ERRO: Coloque o iniciar.bat na pasta do projeto.
  pause & exit /b 1
)

if not exist "python-embed\python.exe" (
  echo  ERRO: pasta python-embed nao encontrada!
  echo  Copie a pasta python-embed do Qualyt Gate para esta pasta.
  echo.
  pause & exit /b 1
)

if not exist "server\server.py" (
  echo  ERRO: arquivo server\server.py nao encontrado!
  echo  Coloque o arquivo server.py dentro da pasta server\
  echo.
  pause & exit /b 1
)

echo  Iniciando servidor (aguarde)...
echo.

start "TOYINPS Servidor" cmd /k "cd /d "%~dp0" && python-embed\python.exe server\server.py"

timeout /t 6 /nobreak > nul

netstat -an | find "0.0.0.0:3001" | find "LISTENING" > nul 2>&1
if not errorlevel 1 (
  echo  Servidor no ar! Abrindo navegador...
  start http://localhost:3001
) else (
  echo  ATENCAO: servidor nao respondeu.
  echo  Verifique os erros na janela "TOYINPS Servidor".
)

echo.
pause

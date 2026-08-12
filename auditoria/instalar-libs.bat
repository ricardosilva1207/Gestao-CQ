@echo off
title TOYINPS — Instalando bibliotecas Python
cd /d "%~dp0"

echo.
echo  ==========================================
echo   Instalando bibliotecas (so na 1a vez)
echo  ==========================================
echo.

if not exist "python-embed\python.exe" (
  echo  ERRO: pasta python-embed nao encontrada!
  echo  Copie a pasta python-embed do Qualyt Gate para esta pasta.
  echo.
  pause
  exit /b 1
)

python-embed\python.exe -m pip install flask flask-sock bcrypt --no-warn-script-location

if errorlevel 1 (
  echo.
  echo  ERRO ao instalar bibliotecas!
  echo  Verifique sua conexao com a internet e tente novamente.
  echo.
  pause
  exit /b 1
)

echo.
echo  Bibliotecas instaladas com sucesso!
echo  Agora execute o iniciar.bat para subir o servidor.
echo.
pause

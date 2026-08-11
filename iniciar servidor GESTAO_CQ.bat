@echo off
chcp 65001 >nul
title Gerenciamento de Atividade CQ - Servidor
cd /d "%~dp0"

echo.
echo  ==================================================
echo   Iniciando Servidor: Gerenciamento de Atividade CQ
echo  ==================================================
echo.

REM ---- Localiza Python ----
set "PY="
where python >nul 2>nul && set "PY=python"
if not defined PY where py >nul 2>nul && set "PY=py -3"

if not defined PY (
    echo [ERRO] Python nao foi encontrado no PATH.
    echo.
    echo    Instale o Python 3 em https://www.python.org/downloads/
    echo    Durante a instalacao, marque a opcao "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

REM ---- Verifica servidor.py ----
if not exist "%~dp0servidor.py" (
    echo [ERRO] Arquivo servidor.py nao encontrado em:
    echo   %~dp0
    echo.
    pause
    exit /b 1
)

echo Usando Python: %PY%
echo Pasta:         %~dp0
echo.
echo O navegador sera aberto automaticamente em: http://localhost:8080/
echo (Deixe esta janela aberta enquanto usar o sistema)
echo.

REM ---- Abre o navegador apos 2s (em paralelo com o servidor) ----
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start "" http://localhost:8080/"

REM ---- Executa o servidor ----
%PY% "%~dp0servidor.py"
set "RC=%errorlevel%"

echo.
if not "%RC%"=="0" (
    echo [ERRO] O servidor encerrou com codigo %RC%.
) else (
    echo Servidor encerrado normalmente.
)

echo.
pause

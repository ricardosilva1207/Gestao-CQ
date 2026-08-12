@echo off
chcp 65001 >nul
title Gerenciamento de Atividade CQ - Servidor
cd /d "%~dp0"

echo.
echo  ==================================================
echo   Iniciando Servidor: Gerenciamento de Atividade CQ
echo  ==================================================
echo.

REM ---- Localiza Python do sistema (para o servidor principal) ----
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

REM ---- Verifica servidor.py principal ----
if not exist "%~dp0servidor.py" (
    echo [ERRO] Arquivo servidor.py nao encontrado em:
    echo   %~dp0
    echo.
    pause
    exit /b 1
)

echo Usando Python (principal): %PY%
echo Pasta:                    %~dp0
echo.

REM ---------------------------------------------------------------
REM  MODULO AUDITORIAS (TOYINPS) - servidor secundario na porta 3001
REM ---------------------------------------------------------------
set "AUD_DIR=%~dp0auditoria"
set "AUD_PY=%AUD_DIR%\python-embed\python.exe"
set "AUD_SERVER=%AUD_DIR%\server\server.py"

if exist "%AUD_SERVER%" (
    if exist "%AUD_PY%" (
        echo [Auditoria] Subindo servidor TOYINPS (porta 3001) usando python-embed...
        start "TOYINPS Auditoria - Servidor" cmd /k "cd /d "%AUD_DIR%" && "%AUD_PY%" server\server.py"
    ) else (
        echo [Auditoria] python-embed nao encontrado; tentando Python do sistema...
        start "TOYINPS Auditoria - Servidor" cmd /k "cd /d "%AUD_DIR%" && %PY% server\server.py"
    )
    echo [Auditoria] Aguardando servidor inicializar...
    timeout /t 5 /nobreak >nul
) else (
    echo [Auditoria] auditoria\server\server.py nao encontrado — modulo desativado.
)

echo.
echo O navegador sera aberto automaticamente em: http://localhost:8080/
echo (Deixe esta janela aberta enquanto usar o sistema)
echo.

REM ---- Abre o navegador apos 2s (em paralelo com o servidor principal) ----
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start "" http://localhost:8080/"

REM ---- Executa o servidor principal (bloqueante) ----
%PY% "%~dp0servidor.py"
set "RC=%errorlevel%"

echo.
if not "%RC%"=="0" (
    echo [ERRO] O servidor principal encerrou com codigo %RC%.
) else (
    echo Servidor principal encerrado normalmente.
)

echo.
echo NOTA: A janela do servidor TOYINPS Auditoria continua aberta.
echo Feche-a manualmente para encerrar a auditoria (porta 3001).
echo.
pause

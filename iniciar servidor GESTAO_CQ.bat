@echo off
chcp 65001 >nul
title Gerenciamento de Atividade CQ - Servidor
cd /d "%~dp0"

echo.
echo  ==================================================
echo   Iniciando Servidor: Gerenciamento de Atividade CQ
echo  ==================================================
echo.

REM ============================================================
REM  Localiza Python — busca em 3 lugares, nesta ordem:
REM    1. .\python-embed\python.exe                (raiz do projeto)
REM    2. .\auditoria\python-embed\python.exe      (TOYINPS)
REM    3. python / py no PATH do sistema
REM ============================================================
set "PY="

if exist "%~dp0python-embed\python.exe" (
    set "PY=%~dp0python-embed\python.exe"
    echo Python: python-embed local ^(raiz^)
    goto :py_ok
)
if exist "%~dp0auditoria\python-embed\python.exe" (
    set "PY=%~dp0auditoria\python-embed\python.exe"
    echo Python: python-embed local ^(auditoria^)
    goto :py_ok
)
where python >nul 2>nul && set "PY=python" && echo Python: sistema ^(python^) && goto :py_ok
where py     >nul 2>nul && set "PY=py -3"   && echo Python: sistema ^(py -3^)  && goto :py_ok

echo [ERRO] Python nao foi encontrado.
echo.
echo    Coloque a pasta python-embed em uma das opcoes:
echo      - %~dp0python-embed\
echo      - %~dp0auditoria\python-embed\
echo    Ou instale o Python 3 e adicione ao PATH.
echo.
pause
exit /b 1

:py_ok
echo Pasta:  %~dp0
echo.

REM ---- Verifica servidor.py principal ----
if not exist "%~dp0servidor.py" (
    echo [ERRO] servidor.py nao encontrado em: %~dp0
    echo.
    pause
    exit /b 1
)

REM ============================================================
REM  MODULO AUDITORIAS (TOYINPS) - servidor secundario na porta 3001
REM ============================================================
set "AUD_DIR=%~dp0auditoria"
set "AUD_SERVER=%AUD_DIR%\server\server.py"

if exist "%AUD_SERVER%" (
    echo [Auditoria] Subindo servidor TOYINPS na porta 3001...
    start "TOYINPS Auditoria - Servidor" cmd /k "cd /d ""%AUD_DIR%"" && ""%PY%"" server\server.py"
    echo [Auditoria] Aguardando inicializar...
    timeout /t 5 /nobreak >nul
) else (
    echo [Auditoria] auditoria\server\server.py nao encontrado — modulo desativado.
)

echo.
echo O navegador sera aberto em: http://localhost:8080/
echo (Mantenha esta janela aberta enquanto usar o sistema)
echo.

REM ---- Abre o navegador apos 2s ----
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start "" http://localhost:8080/"

REM ---- Executa o servidor principal (bloqueante) ----
"%PY%" "%~dp0servidor.py"
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

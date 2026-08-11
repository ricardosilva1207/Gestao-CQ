@echo off
chcp 65001 >nul
title Gerenciamento de Atividade CQ - Servidor
cd /d "%~dp0"

echo.
echo  ==================================================
echo   Iniciando Servidor: Gerenciamento de Atividade CQ
echo  ==================================================
echo.

REM Detecta interpretador Python disponivel (python ou py)
where python >nul 2>nul
if %errorlevel%==0 (
    set "PY=python"
) else (
    where py >nul 2>nul
    if %errorlevel%==0 (
        set "PY=py -3"
    ) else (
        echo [ERRO] Python nao encontrado no PATH.
        echo Instale o Python 3 em https://www.python.org/downloads/ e tente novamente.
        echo.
        pause
        exit /b 1
    )
)

REM Sobe o servidor
%PY% "%~dp0servidor.py"

echo.
echo Servidor encerrado.
pause

@echo off
:: ==============================================
:: Script de Deploy Automático para o GitHub
:: ==============================================

:: Caminho do projeto
set "REPO_DIR=C:\Users\titan\Documents\site-album-teste"

:: Muda para o diretório do repositório
cd /d "%REPO_DIR%"

:: Gera data e hora formatadas (sem caracteres inválidos)
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do (
    set "dia=%%a"
    set "mes=%%b"
    set "ano=%%c"
)
for /f "tokens=1-2 delims=: " %%a in ("%time%") do (
    set "hora=%%a"
    set "minuto=%%b"
)

:: Ajuste caso o formato de data do Windows seja diferente
if "%ano%"=="" (
    for /f "tokens=2-4 delims=/ " %%a in ("%date%") do (
        set "dia=%%a"
        set "mes=%%b"
        set "ano=%%c"
    )
)

:: Mensagem de commit automática
set "COMMIT_MSG=Novo cliente %dia%/%mes%/%ano% %hora%:%minuto%"

echo ==============================================
echo Verificando alterações...
echo ==============================================
git status

echo ==============================================
echo Adicionando novos arquivos...
echo ==============================================
git add .

:: Verifica se há mudanças antes de commitar
for /f %%i in ('git diff --cached --name-only') do set CHANGES=1
if not defined CHANGES (
    echo Nenhuma alteração encontrada. Nada para enviar.
    pause
    exit /b
)

echo ==============================================
echo Fazendo commit com mensagem:
echo "%COMMIT_MSG%"
echo ==============================================
git commit -m "%COMMIT_MSG%"

echo ==============================================
echo Enviando para o GitHub...
echo ==============================================
git push origin main

echo ==============================================
echo Deploy concluído com sucesso!
echo ==============================================
pause

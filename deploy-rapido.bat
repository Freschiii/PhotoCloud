@echo off
echo ========================================
echo    DEPLOY RAPIDO - NOVO CLIENTE
echo ========================================
echo.

echo Verificando estrutura...
if not exist "src\assets\clientes" (
    echo ERRO: Pasta src\assets\clientes nao encontrada!
    pause
    exit /b 1
)

echo Adicionando arquivos...
git add .

echo Fazendo commit...
git commit -m "Add: Novo cliente - %date%"

echo Fazendo build...
npm run build

echo Enviando para GitHub...
git push origin main

echo.
echo ✅ DEPLOY CONCLUIDO!
echo Aguarde o Vercel fazer o deploy automatico.
echo.
pause

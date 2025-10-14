@echo off
echo ========================================
echo    DEPLOY AUTOMATICO - NOVO CLIENTE
echo ========================================
echo.

echo [1/4] Adicionando arquivos ao Git...
git add .
if %errorlevel% neq 0 (
    echo ERRO: Falha ao adicionar arquivos ao Git
    pause
    exit /b 1
)

echo [2/4] Fazendo commit das mudanças...
git commit -m "Add: Novo cliente adicionado - %date% %time%"
if %errorlevel% neq 0 (
    echo ERRO: Falha ao fazer commit
    pause
    exit /b 1
)

echo [3/4] Fazendo build do projeto...
npm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha no build do projeto
    pause
    exit /b 1
)

echo [4/4] Enviando para o GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo ERRO: Falha ao enviar para o GitHub
    pause
    exit /b 1
)

echo.
echo ========================================
echo    DEPLOY CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo O novo cliente foi adicionado e o site foi atualizado!
echo Aguarde alguns minutos para o Vercel fazer o deploy automatico.
echo.
pause

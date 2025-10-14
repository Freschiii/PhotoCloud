@echo off
echo ========================================
echo    DEPLOY AUTOMATICO - NOVO CLIENTE
echo ========================================
echo.

echo [1/5] Verificando estrutura de pastas...
if not exist "src\assets\clientes" (
    echo ERRO: Pasta src\assets\clientes nao encontrada!
    echo Certifique-se de estar na pasta raiz do projeto.
    pause
    exit /b 1
)

echo [2/5] Adicionando arquivos ao Git...
git add .
if %errorlevel% neq 0 (
    echo ERRO: Falha ao adicionar arquivos ao Git
    pause
    exit /b 1
)

echo [3/5] Fazendo commit das mudanças...
git commit -m "Add: Novo cliente adicionado - %date% %time%"
if %errorlevel% neq 0 (
    echo ERRO: Falha ao fazer commit
    pause
    exit /b 1
)

echo [4/5] Fazendo build do projeto...
npm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha no build do projeto
    pause
    exit /b 1
)

echo [5/5] Enviando para o GitHub...
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
echo IMPORTANTE: Certifique-se de que as fotos estao em:
echo src\assets\clientes\[nome-do-cliente]\
echo.
pause

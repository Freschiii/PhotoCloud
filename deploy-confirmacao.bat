@echo off
echo ========================================
echo    DEPLOY COM CONFIRMACAO
echo ========================================
echo.

echo Verificando estrutura de pastas...
if not exist "src\assets\clientes" (
    echo ERRO: Pasta src\assets\clientes nao encontrada!
    echo Certifique-se de estar na pasta raiz do projeto.
    pause
    exit /b 1
)

echo Voce esta prestes a fazer deploy de um novo cliente.
echo.
echo Arquivos que serao adicionados:
git status --porcelain
echo.

set /p confirm="Deseja continuar? (s/n): "
if /i "%confirm%" neq "s" (
    echo Deploy cancelado.
    pause
    exit /b 0
)

echo.
echo [1/4] Adicionando arquivos ao Git...
git add .

echo [2/4] Fazendo commit...
git commit -m "Add: Novo cliente - %date% %time%"

echo [3/4] Fazendo build...
npm run build

echo [4/4] Enviando para GitHub...
git push origin main

echo.
echo ✅ DEPLOY CONCLUIDO COM SUCESSO!
echo Aguarde o Vercel fazer o deploy automatico.
echo.
echo IMPORTANTE: Certifique-se de que as fotos estao em:
echo src\assets\clientes\[nome-do-cliente]\
echo.
pause

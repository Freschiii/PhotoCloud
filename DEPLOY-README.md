# 🚀 Scripts de Deploy Automático

Scripts para automatizar o deploy no Git quando adicionar novos clientes.

## 📁 Arquivos Disponíveis

### 1. `deploy-cliente.bat` - **Deploy Completo**
- ✅ Verifica estrutura de pastas
- ✅ Adiciona todos os arquivos ao Git
- ✅ Faz commit com data/hora
- ✅ Executa build do projeto
- ✅ Envia para GitHub
- ✅ Mostra status detalhado de cada etapa
- ✅ Tratamento de erros completo

### 2. `deploy-rapido.bat` - **Deploy Rápido**
- ⚡ Verifica estrutura de pastas
- ⚡ Versão simplificada
- ⚡ Menos mensagens
- ⚡ Mais rápido
- ⚡ Ideal para uso frequente

### 3. `deploy-confirmacao.bat` - **Deploy com Confirmação**
- 🔍 Verifica estrutura de pastas
- 🔍 Mostra arquivos que serão adicionados
- 🔍 Pede confirmação antes de continuar
- 🔍 Mais seguro
- 🔍 Ideal para revisar mudanças

## 🎯 Como Usar

### Para adicionar um novo cliente:

1. **Adicione as fotos** na pasta `src/assets/clientes/[nome-do-cliente]/`
2. **Crie o arquivo de informações**:
   ```
   Nome: Nome do Cliente
   Senha: senha123
   ```
   Salve como: `src/assets/clientes/[nome-do-cliente]/[nome-do-cliente].txt`
3. **Execute um dos scripts**:
   - **Duplo clique** em `deploy-cliente.bat` (recomendado)
   - Ou `deploy-rapido.bat` para versão rápida
   - Ou `deploy-confirmacao.bat` para revisar antes

### ⚠️ Importante:
- **SEMPRE** coloque as fotos em `src/assets/clientes/[nome-do-cliente]/`
- **NÃO** coloque em `public/clientes/` (isso não funciona!)
- Certifique-se de estar na pasta raiz do projeto
- O Vercel fará deploy automático após o push
- Aguarde alguns minutos para o site atualizar

## 🔧 Personalização

Você pode editar os scripts para:
- Alterar mensagens de commit
- Adicionar mais verificações
- Modificar o comportamento

## 📝 Exemplo de Uso

```
1. Criar pasta: src/assets/clientes/joao-silva/
2. Adicionar fotos: src/assets/clientes/joao-silva/foto1.jpg, foto2.jpg...
3. Criar arquivo: src/assets/clientes/joao-silva/joao-silva.txt
   Conteúdo:
   Nome: João Silva
   Senha: joao123
4. Executar: deploy-cliente.bat
5. Aguardar deploy automático no Vercel
6. Cliente acessa: site.com/#/cliente/joao-silva
```

## 🆘 Solução de Problemas

- **Erro de Git**: Verifique se está na pasta correta
- **Erro de Build**: Verifique se o npm está funcionando
- **Erro de Push**: Verifique conexão com GitHub
- **Site não atualiza**: Aguarde alguns minutos para o Vercel
- **Pasta não encontrada**: Certifique-se de estar na raiz do projeto
- **Cliente não aparece**: Verifique se as fotos estão em `src/assets/clientes/`

## 📋 Estrutura Correta

```
src/assets/clientes/
├── nome-cliente-1/
│   ├── nome-cliente-1.txt (Nome: Cliente 1, Senha: senha1)
│   ├── foto1.jpg
│   ├── foto2.jpg
│   └── ...
├── nome-cliente-2/
│   ├── nome-cliente-2.txt (Nome: Cliente 2, Senha: senha2)
│   ├── foto1.jpg
│   └── ...
└── ...
```

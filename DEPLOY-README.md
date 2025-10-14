# 🚀 Scripts de Deploy Automático

Scripts para automatizar o deploy no Git quando adicionar novos clientes.

## 📁 Arquivos Disponíveis

### 1. `deploy-cliente.bat` - **Deploy Completo**
- ✅ Adiciona todos os arquivos ao Git
- ✅ Faz commit com data/hora
- ✅ Executa build do projeto
- ✅ Envia para GitHub
- ✅ Mostra status detalhado de cada etapa
- ✅ Tratamento de erros

### 2. `deploy-rapido.bat` - **Deploy Rápido**
- ⚡ Versão simplificada
- ⚡ Menos mensagens
- ⚡ Mais rápido
- ⚡ Ideal para uso frequente

### 3. `deploy-confirmacao.bat` - **Deploy com Confirmação**
- 🔍 Mostra arquivos que serão adicionados
- 🔍 Pede confirmação antes de continuar
- 🔍 Mais seguro
- 🔍 Ideal para revisar mudanças

## 🎯 Como Usar

### Para adicionar um novo cliente:

1. **Adicione as fotos** na pasta `public/clientes/[nome-do-cliente]/`
2. **Crie o arquivo de info** (se necessário):
   ```
   Nome: Nome do Cliente
   Senha: senha123
   ```
3. **Execute um dos scripts**:
   - **Duplo clique** em `deploy-cliente.bat` (recomendado)
   - Ou `deploy-rapido.bat` para versão rápida
   - Ou `deploy-confirmacao.bat` para revisar antes

### ⚠️ Importante:
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
1. Adicionar fotos em: public/clientes/joao-silva/
2. Executar: deploy-cliente.bat
3. Aguardar deploy automático no Vercel
4. Cliente acessa: site.com/#/cliente/joao-silva
```

## 🆘 Solução de Problemas

- **Erro de Git**: Verifique se está na pasta correta
- **Erro de Build**: Verifique se o npm está funcionando
- **Erro de Push**: Verifique conexão com GitHub
- **Site não atualiza**: Aguarde alguns minutos para o Vercel

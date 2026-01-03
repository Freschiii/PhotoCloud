# Sistema de Galeria para Clientes - Instruções

## 📸 Visão Geral

Este sistema transforma seu portfólio de fotografia em uma plataforma para compartilhar fotos com clientes de eventos. Cada cliente tem sua própria galeria privada com URL única e funcionalidades de download.

## 🚀 Como Usar

### 1. Acessar o Sistema

- **Site Principal**: `http://localhost:5173/` - Seu portfólio público
- **Galerias de Clientes**: `http://localhost:5173/clientes` - Lista de todos os clientes
- **Painel Administrativo**: `http://localhost:5173/admin` - Gerenciar clientes e fotos

### 2. Adicionar Novos Clientes

#### Método 1: Via Painel Administrativo
1. Acesse `/admin`
2. Clique em "Novo Cliente"
3. Digite o nome do cliente (ex: "Casamento João e Maria")
4. O sistema criará automaticamente uma pasta com o nome formatado

#### Método 2: Manualmente
1. Crie uma pasta em `src/assets/clientes/`
2. Use o nome do cliente como nome da pasta (ex: `casamento-joao-maria`)
3. Adicione as fotos na pasta
4. As fotos aparecerão automaticamente na galeria

### 3. Estrutura de Pastas

```
src/assets/clientes/
├── casamento-ana-joao/
│   ├── foto1.jpg
│   ├── foto2.jpg
│   └── foto3.jpg
├── formatura-maria/
│   ├── formatura1.jpg
│   └── formatura2.jpg
└── evento-empresa-xyz/
    └── evento1.jpg
```

### 4. URLs dos Clientes

Cada cliente tem uma URL única:
- `http://localhost:5173/cliente/casamento-ana-joao`
- `http://localhost:5173/cliente/formatura-maria`
- `http://localhost:5173/cliente/evento-empresa-xyz`

## 📱 Funcionalidades

### Para os Clientes

#### Visualização
- **Galeria Responsiva**: Funciona em desktop, tablet e mobile
- **Lightbox**: Clique na foto para ver em tela cheia
- **Navegação**: Use as setas para navegar entre fotos

#### Download
- **Download Individual**: Clique no ícone de download em cada foto
- **Download Selecionadas**: 
  1. Clique em "Selecionar Fotos"
  2. Selecione as fotos desejadas
  3. Clique em "Baixar Selecionadas"
- **Download Todas**: Clique em "Baixar Todas" para baixar todas as fotos

### Para o Fotógrafo (Admin)

#### Gerenciamento
- **Visualizar Clientes**: Veja todos os clientes e quantas fotos cada um tem
- **Estatísticas**: Total de clientes e fotos
- **Ações Rápidas**: Ver galeria, excluir cliente
- **Criar Clientes**: Interface simples para adicionar novos clientes

## 🎨 Personalização

### Modo Escuro/Claro
- Toggle disponível no canto superior direito
- Preferência salva no navegador

### Cores e Estilo
- Baseado em Tailwind CSS
- Cores principais: Indigo, Gray, White
- Animações suaves com Framer Motion

## 📁 Formatos Suportados

- **Imagens**: JPG, JPEG, PNG
- **Tamanhos**: Qualquer tamanho (otimizado automaticamente)
- **Nomes**: Use nomes descritivos para facilitar a organização

## 🔧 Configuração Técnica

### Dependências Principais
- React 19
- React Router DOM
- Framer Motion
- Tailwind CSS
- Lucide React (ícones)

### Estrutura de Arquivos
```
src/
├── components/
│   ├── ClientGallery.jsx      # Galeria individual do cliente
│   ├── ClientList.jsx         # Lista de todos os clientes
│   └── AdminPanel.jsx         # Painel administrativo
├── assets/
│   └── clientes/              # Pastas dos clientes
└── App.jsx                    # Aplicação principal
```

## 🚀 Deploy

### Build para Produção
```bash
npm run build
```

### Deploy no Netlify/Vercel
1. Conecte seu repositório
2. Configure o build command: `npm run build`
3. Configure o publish directory: `dist`
4. Deploy automático a cada push

### Configuração de Rotas
Para SPAs, configure redirecionamentos:
- **Netlify**: Adicione `_redirects` com `/* /index.html 200`
- **Vercel**: Crie `vercel.json` com configuração de rewrites

## 📞 Suporte

### Problemas Comuns

1. **Fotos não aparecem**: Verifique se estão na pasta correta e formato suportado
2. **Download não funciona**: Verifique se o navegador permite downloads
3. **URLs não funcionam**: Verifique se o servidor está configurado para SPAs

### Logs e Debug
- Abra o console do navegador (F12) para ver erros
- Verifique se as imagens estão sendo importadas corretamente
- Teste em diferentes navegadores

## 🔄 Atualizações Futuras

### Funcionalidades Planejadas
- [ ] Upload de fotos via interface web
- [ ] Compressão automática de imagens
- [ ] Sistema de permissões por cliente
- [ ] Notificações por email
- [ ] Integração com Google Drive/Dropbox
- [ ] Watermark automático
- [ ] Estatísticas de visualização

### Melhorias Técnicas
- [ ] Cache de imagens
- [ ] Lazy loading otimizado
- [ ] PWA (Progressive Web App)
- [ ] API REST para gerenciamento
- [ ] Banco de dados para metadados

---

## 🎯 Resumo Rápido

1. **Criar cliente**: Pasta em `src/assets/clientes/nome-do-cliente/`
2. **Adicionar fotos**: Coloque as fotos na pasta do cliente
3. **Compartilhar**: Envie a URL `/cliente/nome-do-cliente` para o cliente
4. **Gerenciar**: Use `/admin` para ver estatísticas e gerenciar clientes

**Pronto! Seu sistema de galeria para clientes está funcionando! 🎉**

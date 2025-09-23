## Para o outro site: como integrar Currículo e Outros Projetos

Este pacote contém tudo o que você precisa para levar a página de Currículo e as atualizações da página de Outros Projetos para outro site Vite + React idêntico.

### Conteúdo
- `components/Resume.jsx`: componente de Currículo.
- `components/Projects.jsx`: seção "Outros Projetos" com filtros, skeleton e hover.
- `data/resume.json`: conteúdo do currículo (dados pessoais, resumo, habilidades, educação).
- `assets/projects/`: textos e imagens de projetos (inclui The Friday Night Club).
- `assets/biography/`: fotos usadas no currículo/contatos.

### Requisitos
- React 18+
- Vite 4+ (ou 5/6)
- Tailwind CSS (classes utilitárias usadas) e framer-motion

### Instalação de dependências
```
npm i framer-motion
```

### Passo a passo
1) Copie a pasta `@paraosite/` para a raiz do seu outro projeto.

2) Mova o conteúdo para os locais corretos no outro projeto:
   - Copie `@paraosite/components/Resume.jsx` para `src/components/Resume.jsx`.
   - Copie `@paraosite/components/Projects.jsx` para `src/components/Projects.jsx`.
   - Copie `@paraosite/data/resume.json` para `src/data/resume.json`.
   - Mescle as pastas de assets:
     - `@paraosite/assets/projects/**` -> `src/assets/projects/**`
     - `@paraosite/assets/biography/**` -> `src/assets/biography/**`

3) Garanta que o Tailwind esteja configurado e que as classes utilitárias existam.

4) Integre as rotas/abas:
   - Onde você gerencia as rotas/tabs, importe e use:
```
import Resume from './components/Resume'
import Projects from './components/Projects'
```

5) Certifique-se de ter as utilidades globais usadas:
   - `import.meta.glob` para carregar `src/assets/projects/**/*.txt` com `{ eager: true, query: '?raw', import: 'default' }`.
   - Imagens da biografia em `src/assets/biography/`.

6) Acessibilidade e interações:
   - Copie os atributos `aria-label` e estados de foco conforme já presentes nos componentes.

### Observações
- O botão de baixar PDF espera o arquivo em `public/curriculo-ricardo-freschi.pdf`.
- Para o card do TikTok (The Friday Night Club), deixe a imagem em `src/assets/projects/friday-night-club/Friday-BG.jpg`.
- As imagens da galeria/projetos são randomizadas a cada carregamento.



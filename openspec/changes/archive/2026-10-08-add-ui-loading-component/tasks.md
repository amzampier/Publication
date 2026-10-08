# Tasks

## 1. CSS da borda em degradê (`app/assets/css/main.css`)

- [x] 1.1 Adicionar a classe `.ds-loading` com `::before` usando
      `conic-gradient(#112051, #0364f7, #4ed813, #112051)`, `@keyframes` de rotação contínua
      (apenas `transform: rotate`) e media query `prefers-reduced-motion` parando a rotação —
      verificação: `main.css` contém a classe, o keyframes e a media query, com as três cores na
      ordem Navy → Estrutural → Accent.

## 2. Componente `UiLoading`

- [x] 2.1 Criar `app/components/ui/Loading.vue` com `Teleport to="body"`, backdrop
      `fixed inset-0 z-[70]` + `bg-zinc-900/50 aria-hidden`, caixa `.ds-loading` com painel
      interno branco, ícone `LoaderCircle` à esquerda (`h-5 w-5 animate-spin
      text-brand-structure motion-reduce:animate-none`) e mensagem à direita — verificação:
      `npm run build` compila, o componente resolve como `UiLoading` e um grep por
      `#112051|#0364f7|#4ed813` em `Loading.vue` não encontra ocorrências.
- [x] 2.2 Implementar as props `message` (default `"Carregando…"`) e `size?: 'sm' | 'md' | 'lg'`
      (default `md`), a acessibilidade (`role="status"` + `aria-live="polite"` na mensagem,
      `aria-busy`, `no-print`) e a trava de `body.overflow` no mount com cleanup no unmount
      (guarda de SSR como a do `UiModal`) — verificação: `npm run build` compila e a inspeção do
      template confirma atributos, props e limpeza da trava.
- [x] 2.3 Documentar o componente em `docs/01 - design_system.md`: nova seção **§5.17 UiLoading
      - seção 18 do `/design`** (tabela de props, visual, backdrop/camada, acessibilidade, exemplo
      de uso) e atualizar o Sumário "(5.1-5.16)" → "(5.1-5.17)" com o item 5.17 — verificação: o
      doc contém §5.17 e a tabela de props coincide com as de `Loading.vue`.
- [x] 2.4 Ampliar `Loading.vue`: ícone maior na escala toda (`sm=h-5`, `md=h-6`, `lg=h-8`), props
      opcionais `current?: number` e `total?: number` que montam o bloco de progresso (barra
      track `slate-200` + fill no degradê da marca via tokens `from-brand-primary
      via-brand-structure to-brand-accent`, contador pt-BR à esquerda e % inteiro à direita,
      `transition-[width]` com `motion-reduce:transition-none`) e `role="progressbar"` com
      `aria-valuenow/min/max/valuetext` — verificação: `npm run build` compila, grep por
      `#112051|#0364f7|#4ed813` em `Loading.vue` não encontra ocorrências e sem as props o
      layout permanece a linha atual.

## 3. Vitrine `/design` — seção 18

- [x] 3.1 Adicionar `{ id: 'loading', label: '18. Loading (UiLoading)' }` em `secoes`, importar o
      ícone do header da seção no bloco de imports e criar a `<section id="loading">` após a
      seção 17 (linha atual 2723), no mesmo padrão das demais (header com badge, descrição) —
      verificação: `/design` lista "18. Loading (UiLoading)" no índice lateral e a seção renderiza.
- [x] 3.2 Implementar a demonstração: botão que monta o `UiLoading` com mensagem demonstrativa e
      auto-fecho via `setTimeout` (~3,5 s) com `clearTimeout` no unmount — verificação: clicar no
      botão exibe o overlay real e ele se encerra sozinho, devolvendo o controle da página.
- [x] 3.3 Confirmar que a nova seção não produz overflow horizontal em 320, 375, 768, 1024 e
      1440px — verificação: `document.scrollWidth <= window.innerWidth` em cada largura. ✓ em
      todas; dois bugs **pré-existente** da vitrine que violavam a spec `vitrine/spec.md` foram
      corrigidos em correção direta (sem artefato novo): (a) 1024 vazava 8px — header do
      `UiCheckCard` sem `flex-wrap` empurrava o checkbox para fora do card + grid da BLOCO 4 da
      seção 11 com cards de 91px; (b) 640 vazava 7px — `div.shrink-0` dos code-pills de cabeçalho
      segurava max-content em linha quebrada. Sweep exaustivo 320→1744px passo 1 = **0 falhas**
      (a seção 18 não contribui com overflow em nenhuma largura).
- [x] 3.4 Atualizar a seção 18 com o segundo botão "Abrir com progresso" (monta com
      `:current`/`:total` = 5.000, incremento via `setInterval` ~100 ms, encerrado junto do
      auto-fecho de ~3,5 s e limpo no `unmount`), manter o botão simples e atualizar a descrição
      e o bloco "Uso" com o exemplo das novas props — verificação: clicar em cada botão mostra o
      overlay correspondente (sem/com barra contando) e a página volta a ficar utilizável.

## 4. Verificação final (integração)

- [x] 4.1 `npm run build` completa sem erros.
- [x] 4.2 Conferência visual em `http://localhost:3000/design` seção 18: borda girando na ordem
      Navy → Estrutural → Accent, ícone girando à esquerda, backdrop bloqueando clique e rolagem,
      `Escape` sem fechar, overlay por cima de um modal aberto, impressão sem o overlay
      (`no-print`) e movimento reduzido sem rotações. ✓ via CDP+screenshots: backdrop
      `rgba(24,24,27,0.5)` cobrindo a viewport, `z=70 > z=60` do modal, impressão `display:none`,
      movimento reduzido sem transição/rotação, toast atrás do backdrop, progresso com
      `role="progressbar"` + contador pt-BR e fill crescente.
- [x] 4.3 `openspec validate "add-ui-loading-component" --strict` sem erros.
- [x] 4.4 Atualizar `docs/01 - design_system.md` após a ampliação: §5.17 (props `current`/`total`,
      escala do ícone, bloco de progresso com degradê/contador/`role="progressbar"`, exemplo
      novo) e a §2 (incluir a barra de progresso do `UiLoading` entre as superfícies com degradê)
      — verificação: doc espelha as props e o visual de `Loading.vue` e a regra de degradê não
      contradiz a spec de `brand-tokens`.

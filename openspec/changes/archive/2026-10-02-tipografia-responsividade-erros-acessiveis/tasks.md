# Tasks

## 1. Tipografia oficial (BUG-02 · specs `design-system/typography`)

- [x] 1.1 Declarar em `nuxt.config.ts` → `app.head` os `preconnect` (`fonts.googleapis.com`, `fonts.gstatic.com`) e o link do Google Fonts com Plus Jakarta Sans (400;500;600;700) e JetBrains Mono (500;700) em `display=swap` — verificar com dev server rodando: `curl -s http://localhost:3000 | findstr /i "fonts.googleapis jakarta jetbrains"` retorna ocorrências nas rotas `/`, `/admin/configuracoes-globais` e `/design`
- [x] 1.2 Estender `tailwind.config.js` → `theme.extend.fontFamily` (`sans` = Plus Jakarta Sans, `mono` = JetBrains Mono) — verificar: CSS gerado (build ou `/_nuxt/*.css`) contém `Plus Jakarta Sans` **e** `JetBrains Mono`, e `getComputedStyle(document.body).fontFamily` em qualquer página contém `Plus Jakarta Sans`
- [x] 1.3 Conferir `docs/01 - design_system.md` §1 (linha 53) contra o mecanismo implementado — verificar: o texto descreve exatamente o que `nuxt.config.ts` faz (atualizar a linha apenas se o mecanismo adotado divergir)
- [x] 1.4 Conferir visualmente a seção 1 da vitrine `/design` — verificar: os blocos rotulados "Plus Jakarta Sans"/"JetBrains Mono" renderizam com essas famílias (inspector: computed font-family)

## 2. Shell responsivo (BUG-03 · spec `design-system/layout-navigation`)

- [x] 2.1 Em `useSidebarExpandida.ts`, adicionar init de primeira carga via `matchMedia('(min-width: 1024px)')` no cliente (menor que `lg` → recolhida) com flag de preferência manual que passa a prevalecer após o primeiro toggle, mantendo `true` como valor SSR — verificar: carga em 375px inicia recolhida; após toggle manual, redimensionar não reseta o estado; em ≥1024px inicia expandida
- [x] 2.2 Em `app/layouts/admin.vue` + `app/components/layout/AppSidebar.vue`, implementar o modo drawer abaixo de `lg` (sidebar `fixed` sobre o conteúdo com backdrop clicável; `main` com largura total) — verificar a 375px com sidebar expandida: sem barra de rolagem horizontal no conteúdo e o backdrop fecha a sidebar ao ser clicado
- [x] 2.3 Em `app/components/configuracoes/Cabecalho.vue`, aplicar `flex-wrap` real com `min-w-0` no bloco de título e `w-full sm:w-auto` no botão "Salvar Alterações Globais" — verificar a 375px: botão visível sem corte e sem overflow horizontal, mesmo com a sidebar expandida
- [x] 2.4 Na tela `admin/configuracoes-globais`, dar rolagem horizontal à barra de abas abaixo de `sm` (container com `overflow-x-auto`) — verificar a 375px: as 4 abas acessíveis por rolagem, sem quebrar em ~4 linhas; a 768px: abas íntegras
- [x] 2.5 Verificar em 768px e 1024px que abas, cards e tabela renderizam íntegros e que o toggle do header mantém `aria-expanded`/`aria-controls` corretos em qualquer largura; conferir tooltips do rail a 375px não cortados
- [x] 2.6 Documentar o comportamento responsivo (drawer abaixo de `lg`, estado inicial recolhido em tela estreita, prevalência da escolha manual) em `docs/03 - Header e Sidebar.md` e `docs/04 - Configurações Gerais.md` onde couber — verificar: os textos descrevem a implementação entregue

## 3. Mensagem de erro acessível (BUG-04 · spec `design-system/form-control-states`)

- [x] 3.1 Em `app/components/ui/Input.vue`, renderizar a mensagem de erro como texto persistente abaixo do campo (`v-if="error"`, `role="alert"`, id estável, `aria-describedby` no controle) mantendo ícone + tooltip — verificar na vitrine `/design` §2/§6/§7: o nó de texto com a mensagem existe no DOM sem hover e está presente no accessibility tree
- [x] 3.2 Aplicar o mesmo padrão em `app/components/ui/Select.vue` — verificar: mensagem abaixo do gatilho no DOM sem hover, com as mesmas classes e `role="alert"`
- [x] 3.3 Aplicar o mesmo padrão em `app/components/ui/DatePicker.vue` — verificar: mensagem abaixo do campo no DOM sem hover; comparar os 3 componentes: mesma estrutura, mesmas classes e mesma identidade `rose-700`
- [x] 3.4 Revisar `docs/01 - design_system.md` (estados de erro/§4) e demais menções ao tooltip de erro — verificar: nenhum texto ainda descreve a mensagem como tooltip-only; atualizar para o padrão persistente se houver

## 4. Verificação integrada

- [x] 4.1 Rodar `npm run build` e verificar conclusão sem erro
- [x] 4.2 Com dev server rodando, executar a checagem SSR/HTML: `head` com links de fonte nas 3 rotas (1.1), CSS com as famílias (1.2) e mensagem de erro no DOM da vitrine (3.1)
- [x] 4.3 Conferência visual final a 375px / 768px / 1024px em `/admin/configuracoes-globais` e `/design` — verificar: critérios de aceite do BUG-02, BUG-03 e BUG-04 do `docs/RL01` atendidos (sem overflow horizontal a 375px, fontes oficiais, erro anunciável)
- [x] 4.4 Atualizar `docs/RL01 - Relatório de Responsividade.md`: BUG-02/03/04 → CORRIGIDO com evidência, critérios de aceite marcados, checklist §6.1, tabela de severidade e veredito do gate recalculados

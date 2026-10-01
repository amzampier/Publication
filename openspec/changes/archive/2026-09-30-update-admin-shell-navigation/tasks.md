# Tasks — update-admin-shell-navigation

## 1. Fonte de navegação (`app/config/navigation.ts`)

- [x] 1.1 Substituir `sessoes` pelos três grupos canônicos (Publicações · Cadastros · Administração, 9
      itens, ícones `BookOpen`/`Newspaper`/`FileText`/`Handshake`/`Boxes`/`Users`/`ShieldCheck`/`ScrollText`/`Settings`),
      mantendo `itemRaiz` — verificando com `npm run build` e conferindo em `http://localhost:3000` que a
      sidebar real renderiza a árvore nova com as sessões abertas por padrão
- [x] 1.2 Trocar `accountMenuItens` (Gestão de Auditoria `ScrollText` cor `#2dd4bf` no lugar de
      "Troca de Filial / Empresa"), remover `empresaAtiva` e o import `ArrowLeftRight` — verificando com
      `Select-String -Path app\**\*.ts,app\**\*.vue -Pattern "empresaAtiva|Troca de Filial|ArrowLeftRight"`
      sem resultados e com o menu do Account em `/` exibindo 6 itens entre 2 divisores
- [x] 1.3 Atualizar `docs/01 - design_system.md` §3.3 (item raiz "Painel Executivo" + as três sessões com
      os itens exatos) — verificando que o texto lista os mesmos 9 itens exibidos em `/`

## 2. Header (`app/components/layout/AppHeader.vue`)

- [x] 2.1 Trocar o logo `FinancePro` por `Publications` e remover o bloco "Matriz/Filial", o separador
      `#f59e8b ml-[3cm]` e o import de `empresaAtiva` — verificando com `npm run build` e em `/` que não
      restam "FinancePro"/"Matriz/Filial", que a zona esquerda fica toggle + logo e que o sino de
      notificações continua abrindo e dispensando itens
- [x] 2.2 Atualizar `docs/01 - design_system.md` §3.1 (nome `Publications`; zona direita = sino +
      bloco Account) e §3.2 (ordem dos 6 itens com 2 divisores, largura `w-56`) — verificando que a
      documentação descreve exatamente o menu renderizado em `/`

## 3. Vitrine `/design` §14 (`app/pages/design.vue`)

- [x] 3.1 Fazer a seção 14 importar `sessoes`, `itemRaiz`, `conta`, `accountMeuPerfil`, `accountMenuItens`
      e `accountEncerrarSessao` de `config/navigation.ts`, removendo `sidebarGrupos` e o
      `accountMenuItens` locais, e renderizar o item raiz acima das sessões — verificando em
      `http://localhost:3000/design` que a árvore do demo é idêntica à do shell em `/`
- [x] 3.2 Alinhar o restante do demo ao shell real: logo `Publications` com ícone `Building2`, menu
      `w-56` com dois divisores e rótulo "Encerrar Sessão" (hoje "Sair"), ícones dos itens iguais aos do
      `navigation.ts` — verificando visualmente lado a lado com `/`
- [x] 3.3 Conferir `docs/03 - Header e Sidebar.md` (§3, §5 e §10) contra o comportamento implementado,
      ajustando qualquer descrição que diverja do que `/` e `/design` exibem

## 4. Verificação integrada

- [x] 4.1 `npm run build` completa sem erro após todas as alterações
- [x] 4.2 Inspeção visual (CDP) em `/`: árvore nova, item raiz, rail com 10 tooltips e divisores entre
      sessões, menu do Account com a ordem da spec, ausência de textos de empresa/filial e sino intacto
- [x] 4.3 Inspeção visual (CDP) em `/design` §14: demo espelha o shell (mesma árvore, mesmo menu,
      mesmas larguras `w-52`/`w-[46px]`) e nenhum tooltip aparece com a sidebar expandida
- [x] 4.4 `openspec validate --specs` passa (capability `design-system/layout-navigation` válida) e
      `openspec status --change update-admin-shell-navigation` mostra todos os artefatos concluídos

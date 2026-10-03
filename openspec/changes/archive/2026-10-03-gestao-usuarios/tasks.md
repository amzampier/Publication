# Tasks

## 1. Navegação

- [x] 1.1 Adicionar `to: '/admin/gestao-usuarios'` aos dois itens "Gestão de Usuários" (sessão Administração de `sessoes` e `accountMenuItens`) em `app/config/navigation.ts` — verificar: o arquivo contém a rota nos 2 itens e, no dev server, clicar em cada um navega para a rota com o item da sidebar ativo.

## 2. Dados de demonstração

- [x] 2.1 Criar `app/components/usuarios/useUsuariosDemo.ts` com os tipos (`UsuarioDemo`, `PerfilUsuario`), a lista de perfis demo (Administrador, Editor, Revisor, Leitor), ~16 usuários cobrindo todos os perfis e os status Ativo/Inativo (incluindo pelo menos um sem último acesso para exibir "-"), `filtros` em `useState`, `usuariosFiltrados` derivado e formatador de data de último acesso — espelho do `useAuditoriaDemo` — verificar: `npm run build` compila sem erro e o composable exporta o conjunto completo consumido pelos próximos grupos.

## 3. Componentes de domínio

- [x] 3.1 Criar `app/components/usuarios/Cabecalho.vue` (`<UsuariosCabecalho>`): tile `Users` `#b070ef`, título "Gestão de Usuários" + subtítulo, `UiButton` primary "Novo Usuário" (toast "em breve" via `useToast`) e menu "Exportar" (`UiButton` outline + `ChevronDown`, `role=menu`, fecha por `Escape`/clique fora) com "Exportar em CSV" e "Download em PDF" — verificar: no dev server, "Novo Usuário" exibe o toast sem abrir modal, o menu abre/fecha pelos dois gatilhos e o CSV baixa com as colunas Nome, E-mail, Perfil, Status, Último acesso.
- [x] 3.2 Criar `app/components/usuarios/Kpis.vue` (`<UsuariosKpis>`): 4 `UiKpi` em `grid sm:grid-cols-2 lg:grid-cols-4` derivados de `usuariosFiltrados` — "Total de usuários", "Ativos", "Inativos" e "Perfis distintos" — verificar: os valores batem com a base de demonstração (contagens manuais conferem).
- [x] 3.3 Criar `app/components/usuarios/Tabela.vue` (`<UsuariosTabela>`): `UiDataTable` com `show-filters`/`filters-count`/`@open-filters` (toast "em breve"), colunas Nome, E-mail, Perfil (`UiBadge`), Status (`UiBadge`: Ativo `done`, Inativo `neutral`) e Último acesso, slot `#actions` com olho e lápis (tooltip + `aria-label` + toast "em breve") — verificar: busca filtra as linhas, badges distinguem perfil/status, os 4 gatilhos (Filtros, olho, lápis) exibem toast sem modal e a tabela não abre rolagem horizontal em janela ≥ ~1280px.
- [x] 3.4 Criar `app/components/usuarios/gerarPdfUsuarios.ts`: gera `usuarios.pdf` em A4 paisagem com `jspdf` + `jspdf-autotable` no modelo do `gerarPdfAuditoria` (logo de login via `useLogomarcaLogin` à esquerda, título "Relatório de Gestão de Usuários", colunas do conjunto vigente, rodapé "Página X de Y") — verificar: "Download em PDF" baixa o arquivo com as colunas e sem chamar `window.print()`.

## 4. Página e integração da rota

- [x] 4.1 Criar `app/pages/admin/gestao-usuarios.vue` com `definePageMeta({ layout: 'admin' })`, padding `p-4 sm:p-6 lg:p-8`, container `mx-auto max-w-7xl` e composição `UsuariosCabecalho` → `UsuariosKpis` → `UsuariosTabela` (page fina, só coordenação) — verificar: `npm run build` passa e a rota renderiza com o shell (header + sidebar) em `http://localhost:3000/admin/gestao-usuarios`.

## 5. Documentação do módulo

- [x] 5.1 Criar `docs/06 - Gestão de Usuários.md` no gabarito do `docs/05` (cabeçalho com versão/escopo/arquivos-fonte e autoridades; sumário; visão geral e rota; estrutura da página/componentização; componentes de domínio; comportamento dos toasts "em breve" e exportação; dados demo da fase 1; navegação até a tela; vitrine `/design` inalterada; specs da change `gestao-usuarios`; verificação; pendências da fase 2 — modais de cadastro/detalhe/filtros) — verificar: as seções espelham o `docs/05`, os links internos apontam para arquivos que existem e o conteúdo reflete a implementação real.

## 6. Verificação integrada

- [x] 6.1 Executar `npm run build` e confirmar conclusão sem erro (único gate de verificação do repo — não há lint/teste) — verificar: exit code 0.
- [x] 6.2 Checagem visual no dev server: rota com shell e item da sidebar ativo; navegação pelos 2 atalhos (sidebar e menu da conta); KPIs corretos; busca/badges/paginação da tabela; toasts de Novo Usuário/Filtros/ações de linha; CSV e PDF baixando; ausência de `UiModal` na página — verificar: todos os cenários da spec `gestao-usuarios` observados em `http://localhost:3000`.

## 7. Ajustes de fase 1 (pré-sincronização)

- [x] 7.1 `Cabecalho.vue`: inverter a ordem dos botões do cabeçalho (**Relatórios** à esquerda, **Novo Usuário** à direita) e renomear o gatilho "Exportar" → "Relatórios" (aria-label do menu vira "Opções de relatórios"; itens do menu inalterados) — verificar: no dev server, "Relatórios" aparece antes de "Novo Usuário" e o menu continua baixando CSV/PDF.
- [x] 7.2 `DataTable.vue` + `Tabela.vue`: criar slot opt-in `#filtersLeft` imediatamente à esquerda do botão Filtros e consumi-lo com botão de ícone `Import` + `UiTooltip` "Importar Novos Usuários" → toast "em breve" — verificar: o tooltip aparece no hover e o clique exibe o toast sem modal; nenhum outro consumidor do `UiDataTable` muda (slot vazio por padrão).
- [x] 7.3 `Tabela.vue`: trocar as ações de linha (olho/lápis) por **enviar e-mail (`Mail`), bloquear (`Ban`), editar (`Pencil`), excluir (`Trash2`)**, com ícones menores (`h-3.5 w-3.5`, `p-0.5`), tooltip + `aria-label` próprios e toast "em breve" em cada um — verificar: os 4 ícones aparecem na coluna Ações, cada um dispara seu toast e a tabela segue sem rolagem horizontal ≥ ~1280px.
- [x] 7.4 Atualizar a spec delta (`spec.md`: importar na toolbar, ações de linha renomeadas, menu "Relatórios"), o `docs/06` e o `docs/01` §5.11 (slot `filtersLeft`) para refletir a implementação real — verificar: `openspec validate` passa e nenhuma menção a "Exportar" como nome de botão, "olho" ou "ver detalhes" permanece nos documentos da change.
- [x] 7.5 Verificação integrada dos ajustes: `npm run build` (exit 0) + checagem CDP no dev server cobrindo ordem dos botões, tooltip Importar, 7 gatilhos de toast, 4 ações de linha, CSV/PDF e ausência de `UiModal` — verificar: todos os checks em verde.

## 8. Ajustes finos (pré-sincronização)

- [x] 8.1 `Tabela.vue`: ícone **Importar fora do `UiButton`** (plain `<button>` só com o ícone) que **muda de cor no hover** (`text-slate-500` → `text-brand-primary` + `bg-slate-100`), mantendo tooltip "Importar Novos Usuários" e toast — verificar: hover real altera a cor computada e o clique dispara o toast.
- [x] 8.2 `Tabela.vue`: ações de linha com **gap +3px** (`gap-[7px]`), **cores semânticas** (convite `sky-600`, bloquear `amber-600`, editar `brand-focus` `#1a9e07`, excluir `rose-700`), ícone `MailCheck` com tooltip **"Enviar o Convite"** e `Lock` (cadeado) no bloquear — verificar: cores computadas corretas, gap 7px e 4 toasts.
- [x] 8.3 `Cabecalho.vue` + `gerarPdfFichaCadastral.ts`: gatilho do menu com ícone **`NotebookText`**; menu "Relatórios" = **Ficha Cadastral** (novo PDF retrato, 1 página/usuário), **Relação Completa** (antes "Download em PDF"), **divisor**, **Exportar em CSV** — verificar: 3 itens + divisor no `role="menu"`, os 3 downloads baixam arquivos e nenhum usa `window.print()`.
- [x] 8.4 Atualizar spec delta (`spec.md`), `docs/06`, `proposal.md` e `design.md` (D3/D4) para refletir ícone, gap/cores e o novo menu de relatórios — verificar: `openspec validate` passa e não restam menções a "Download em PDF", `Mail`/`Ban` nas ações ou "Enviar e-mail".
- [x] 8.5 Verificação integrada dos ajustes finos: `npm run build` (exit 0) + checagem CDP cobrindo hover do Importar, cores/gap das ações, menu de 3 relatórios + divisor, downloads (`usuarios.csv`, `usuarios.pdf` 16 páginas?, `ficha-cadastral.pdf` 16 páginas), 7 toasts e ausência de `UiModal` — verificar: todos os checks em verde.



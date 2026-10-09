# Tasks

## 1. Estado de filtros no composable

- [x] 1.1 Em `app/components/perfis/usePerfisDemo.ts`: adicionar `FiltrosPerfis`
      (`perfil`/`situacao`), `useState('perfis-filtros')`, `perfisFiltrados`,
      `filtrosAtivosCount` (0..2), `limparFiltros` e opções dos selects (nomes da base em
      pt-BR; Ativo/Inativo/Bloqueado) — verificar: `npm run build` exit 0 e os símbolos
      exportados/re-exportados por `usePerfisDemo()` (grep no ficheiro).
- [x] 1.2 Fazer `linhas`, `totalPermissoesConcedidas`, `totalPermissoesPossiveis` e
      `usuariosPorPerfil` derivarem de `perfisFiltrados` — verificar: `npm run build`
      exit 0 e nenhum consumidor quebrado (grep de `usePerfisDemo(` nos consumidores).

## 2. Modal de filtros e toolbar

- [x] 2.1 Criar `app/components/perfis/Filtros.vue` no molde de `UsuariosFiltros`
      (sessões "Perfil" e "Status", rascunho na abertura, Limpar/Cancelar/Aplicar) —
      verificar: `npm run build` exit 0 e componente presente (grep).
- [x] 2.2 Em `perfis/Tabela.vue`: `show-filters` + `:filters-count="filtrosAtivosCount"`
      + emit `open-filters` + `:data` sobre as linhas filtradas — verificar: HTML SSR de
      `/admin/perfis-acesso` contém o botão "Filtros" e o `role="dialog"` continua ausente
      (modal fechado).
- [x] 2.3 Em `pages/admin/perfis-acesso.vue`: estado `filtrosAbertos`, `@open-filters` e
      `<PerfisFiltros>` — verificar: comportamento manual no dev server (abrir modal,
      Aplicar/Cancelar/Limpar, badge 0..2) e `npm run build` exit 0.
- [x] 2.4 Atualizar `docs/07` §5 (remover "Sem botão Filtros…") e documentar o novo
      modal na seção dos componentes — verificar: grep nas linhas atualizadas sem a frase
      antiga.

## 3. KPIs sobre o conjunto filtrado

- [x] 3.1 Em `perfis/Kpis.vue`: migrar os cinco KPIs para `perfisFiltrados` (conjunto
      vazio → Total 0, Permissões `0/0`, badge `neutral`) — verificar: com Status =
      Bloqueado aplicado os KPIs exibem 0/0 e, ao limpar, voltam a 171/396 (dev server).
- [x] 3.2 Atualizar `docs/07` (seção de KPIs) para registrar a reação aos filtros —
      verificar: grep da menção nova.

## 4. Exportação (menu Relatórios)

- [x] 4.1 Criar `app/components/perfis/gerarPdfPerfis.ts` no molde de
      `gerarPdfUsuarios` (A4 paisagem + autotable + logo, colunas Nome/Descrição/Status/
      Usuários/Permissões, `perfis.pdf`) — verificar: `npm run build` exit 0.
- [x] 4.2 Em `perfis/Cabecalho.vue`: menu "Relatórios ▾" (role=menu, click-outside, Esc)
      à esquerda de "Novo Perfil" com "Relação de perfis" e "Exportar em CSV"
      (`perfis.csv`, `;` + BOM) sobre `perfisFiltrados` — verificar: download dos dois
      arquivos no dev server, com filtro aplicado contendo só o conjunto filtrado.
- [x] 4.3 Atualizar `docs/07` (seção do cabeçalho/exportação) + linha de change-log
      **v1.5.0** — verificar: grep do changelog e das seções novas.

## 5. Verificação de integração

- [x] 5.1 `openspec validate "perfis-acesso-filtros-exportacao" --strict` e
      `openspec validate --specs` — verificar: ambos com 0 falhas.
- [x] 5.2 `npm run build` final + smoke SSR (`/admin/perfis-acesso`, `/admin/gestao-usuarios`,
      `/design` → 200) — verificar: exit 0 e os três códigos 200.
- [x] 5.3 Conferência visual no dev server (375/768/1280): botões no padrão das irmãs,
      filtros → tabela/KPIs/exportações, menu Relatórios, nenhum regresso nas demais
      telas — verificar: OK do usuário.

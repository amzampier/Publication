# Tasks

## 1. Composable: critério de usuário

- [x] 1.1 Estender `FiltrosUsuarios` com `usuario: string` (`''` = todos) em
      `app/components/usuarios/useUsuariosDemo.ts`: predicado `f.usuario && u.nome !== f.usuario`
      em `usuariosFiltrados`, `filtrosAtivosCount` contando os três critérios e `limparFiltros`
      zerando os três · **verificação:** `npm run build` compila e um filtro por nome aplicado no
      `useState('usuarios-filtros')` reduz `usuariosFiltrados` (grep do predicado no arquivo).
- [x] 1.2 Adicionar o computed `opcoesUsuarios` (nomes distintos de `usuarios`, ordenados com
      `localeCompare(…, 'pt-BR')`, no molde de `useAuditoriaDemo.ts:147`) e exportá-lo pelo
      composable · **verificação:** `npm run build` compila e as opções derivam da base reativa
      (criar um usuário acrescenta opção; excluir remove).
- [x] 1.3 Atualizar `docs/06 - Gestão de Usuários.md` §3.5 (tipo `FiltrosUsuarios` com
      `usuario`, predicado, contador, `limparFiltros` e `opcoesUsuarios`) · **verificação:**
      a seção descreve exatamente os campos e a ordenação implementados no arquivo.

## 2. Tabela: `@open-filters` deixa de toastar

- [x] 2.1 Em `app/components/usuarios/Tabela.vue`: `@open-filters` deixa de chamar
      `avisoProximaEtapa('Filtros')` e passa a emitir para a página (emit tipado junto de
      `editar`/`excluir`) · **verificação:** `npm run build` compila e não resta nenhum
      `avisoProximaEtapa('Filtros')` no arquivo (grep).
- [x] 2.2 Atualizar `docs/06 - Gestão de Usuários.md` §3.3 (o botão Filtros do `UiDataTable` agora
      emite `@open-filters` para a página em vez de toastar) e §5.5 (linha "Filtros" sai da tabela
      de gatilhos com toast; contagem cinco → **quatro**: Importar, Convite, Bloquear, CEP)
      · **verificação:** a contagem de §5.5 confere com os `avisoProximaEtapa` restantes em
      `Tabela.vue` e no formulário (grep).

## 3. Modal de filtros e coordenação na página

- [x] 3.1 Criar `app/components/usuarios/Filtros.vue` (`UsuariosFiltros`), espelho de
      `app/components/auditoria/Filtros.vue` (design D2/D3): `UiModal size="sm"` título "Filtros
      de Usuários", subtítulo "Usuário, perfil e status", `:icon="Funnel"`; sessões
      `UiModalSection` **"Usuário"** (`User`, `UiSelect` de `opcoesUsuarios`, placeholder "Todos
      os usuários") e **"Perfil e Status"** (`ShieldCheck`, `UiSelect` de perfis e de status com
      placeholders próprios); rascunho espelhado no `watch` de `modelValue`; `aplicar()` grava e
      fecha, `cancelar()` só fecha, `limpar()` zera rascunho + composable mantendo o modal aberto;
      rodapé `Limpar Filtros` (outline, esq.) / `Cancelar` + `Aplicar` (dir.) · **verificação:**
      `npm run build` compila e o componente é importável como `UsuariosFiltros` (auto-import do
      prefixo `Usuarios*`).
- [x] 3.2 Em `app/pages/admin/gestao-usuarios.vue`: estado `filtrosAbertos: ref(false)`,
      `<UsuariosFiltros v-model="filtrosAbertos" />` na árvore e `@open-filters` da tabela
      abrindo-o (mesma coordenação de `modalAberto`/`exclusaoAberta`, design D1) ·
      **verificação:** comportamento observável no dev server
      (`http://localhost:3000/admin/gestao-usuarios`): o clique em "Filtros" abre o modal sem
      toast; Aplicar filtra tabela, recalcula os 4 KPIs e atualiza o badge (0–3, só após
      Aplicar/Limpar — design D6); Cancelar/`Escape`/`X` descartam o rascunho; "Limpar Filtros"
      zera tudo com o modal aberto; CSV e PDFs saem sobre o conjunto filtrado; combinação sem
      correspondência mostra o estado vazio da `DataTable`.
- [x] 3.3 Documentar o modal em `docs/06 - Gestão de Usuários.md`: §1 (o "Filtros" sai da lista
      de gatilhos com toast), §2 (a árvore da página ganha `<UsuariosFiltros v-model>`), nova
      subseção de `Filtros.vue` em §3 no molde do `docs/05` §3.3 (seções, rascunho, rodapé,
      badge) e §5.5 "superfícies complementares" (a UI dos filtros estruturais chegou; badge
      reflete o estado aplicado; exportação opera sobre o conjunto vigente filtrado) ·
      **verificação:** nenhum trecho de `docs/06` contradiz o código (§1/§2/§3.3/§5.5 já
      ajustados).

## 4. Verificação de integração

- [x] 4.1 Concluir `docs/06 - Gestão de Usuários.md` §10 (tabela OpenSpec apontando a change
      `gestao-usuarios-modal-filtros` com os deltas de `gestao-usuarios`), §11 (cenários:
      abertura sem toast, Aplicar com recálculo de KPIs/badge/exportação, Cancelar descartando,
      Limpar zerando com modal aberto, estado vazio, **quatro** toasts remanescentes) e §12
      (remover "Filtros de perfil/status" das pendências) · **verificação:** números e contagens
      de §10/§11/§12 batem com o comportamento observado.
- [x] 4.2 `npm run build` final sem erros + checagem dos cenários do delta
      `specs/gestao-usuarios/spec.md` no dev server (abertura, aplicar, rascunho descartado,
      limpar, X do select, badge só com estado aplicado, conjunto vazio, recarga) e regressão dos
      modais da Auditoria (Filtros/Detalhe) e dos modais de usuário (cadastro com câmera
      empilhada e exclusão) · **verificação:** build verde e checklist observado; o **QA completo
      da tela fica para a liberação do usuário** (rodar somente com a construção toda concluída).

## 5. BUG-01: "Informações de Cadastro" somente na edição (escopo acrescentado)

- [x] 5.1 `app/components/usuarios/Formulario.vue`: manter/restaurar `v-if="modo === 'editar"`'
      na seção "Informações de Cadastro" (a criação abre com os blocos 1–3, sem a seção) e
      remover o computed morto `textoAuxiliarData` + `:helper-text` dos dois `UiInput` ·
      **verificação:** criação não exibe a seção; edição continua exibindo com as datas.
- [x] 5.2 `docs/06 - Gestão de Usuários.md`: §3.4 (tabela: "somente na edição" + "a criação não
      exibe esta seção"; bullet idem) e §5.1 (criação descrita com os três blocos, sem datas) ·
      **verificação:** nenhuma parte de §3.4/§5.1 menciona "Preenchidos ao salvar" ou datas na
      criação; nenhum trecho contradiz o código.
- [x] 5.3 Delta desta change (`specs/gestao-usuarios/spec.md`): acrescentar o MODIFIED
      requirement "O modal de usuário reúne os blocos de cadastro" — bloco "Informações de
      Cadastro" somente na edição, cenário de criação sem a seção, demais cenários preservados ·
      **verificação:** `openspec validate gestao-usuarios-modal-filtros --type change` aprova.

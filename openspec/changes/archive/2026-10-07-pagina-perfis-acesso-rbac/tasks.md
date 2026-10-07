# Tasks

## 1. Estado e matriz de permissões

- [x] 1.1 Criar `app/components/perfis/usePerfisDemo.ts` com os tipos (`PerfilDemo`,
      `ModuloId`, `Acao`), `MODULOS` (11), `ACOES` (4) e `EXTRAS` (5), o `MATRIZ_SEED` com as
      regras por perfil do design D2 (incluindo *Auditoria × Revisor = visualizar + exportar*)
      e os helpers de contagem — verificação: `npm run build` compila sem erro e os helpers
      retornam 99/45/21/6 e total 171 (conferidos na tarefa 2.2/5.2)
- [x] 1.2 Ligar o estado a `useState('perfis-base')` com os 4 perfis demo (nome, descrição,
      status `Ativo`, matriz) e derivar em `computed` a contagem de usuários por perfil a
      partir de `useUsuariosDemo().usuarios` — verificação: `npm run build` OK e a base se
      restaura na recarga (tarefa 5.2), com contagens de usuários 2/5/4/5

## 2. Componentes de domínio

- [x] 2.1 Criar `app/components/perfis/Cabecalho.vue` (`<PerfisCabecalho>`): tile
      `ShieldCheck` `#f5b302`, título "Perfis de Acesso (RBAC)", subtítulo e `UiButton`
      primary "Novo Perfil" emitindo `@novo` — verificação: `npm run build` OK e o componente
      renderiza na página com a identidade do módulo (tarefa 5.2)
- [x] 2.2 Criar `app/components/perfis/Kpis.vue` (`<PerfisKpis>`): 4 `UiKpi` (Total de perfis
      `#f5b302`/`ShieldCheck`, Ativos `#047857`, Inativos `#64748b`, Permissões concedidas
      `#112051`/`KeyRound`) derivados do conjunto vigente — verificação: `npm run build` OK e
      os valores exibidos são 4, 4, 0 e 171/396 (tarefa 5.2)
- [x] 2.3 Criar `app/components/perfis/Tabela.vue` (`<PerfisTabela>`): `UiDataTable` **sem**
      `show-filters`, colunas Nome, Descrição, Usuários, Permissões (`n/99`), Status (badge) e
      Ações, com slots de badge e ações (`KeyRound`/`Pencil`/`Trash2` com tooltip e
      `aria-label`) emitindo `@editar`, `@excluir`, `@permissoes` — verificação: `npm run build`
      OK e as 6 colunas cabem sem rolagem horizontal a ~1280px (tarefa 5.2)

## 3. Página e navegação

- [x] 3.1 Criar `app/pages/admin/perfis-acesso.vue` com `definePageMeta({ layout: 'admin' })`,
      container `mx-auto max-w-7xl`, composição dos três componentes e handlers dos emits que
      exibem o toast "funcionalidade disponível na próxima etapa" **sem abrir nenhum modal** —
      verificação: `npm run build` OK e a rota `/admin/perfis-acesso` renderiza com shell e os
      4 gatilhos (Novo Perfil, Editar, Excluir, Permissões) mostram toast com zero `UiModal`
      (tarefa 5.2)
- [x] 3.2 Editar `app/config/navigation.ts`: adicionar `to: '/admin/perfis-acesso'` ao item
      `perfis-rbac` da sidebar e ao item do menu da conta, unificando o rótulo da conta para
      "Perfis de Acesso (RBAC)" — verificação: `npm run build` OK; clicar em cada item navega
      para a rota (menu da conta fecha), o item da sidebar fica ativo inclusive por URL direta
      (tarefa 5.2)

## 4. Documentação

- [x] 4.1 Criar `docs/07 - Perfis de Acesso (RBAC).md` com as 12 seções canônicas de
      `docs/05`/`docs/06` mais a seção "Matriz de permissões (normativa)" (regras por perfil,
      tabela 11 × 9 por perfil, contagens 99/45/21/6 e 171/396, declaração de fonte para o
      modal da fase 2) — verificação: sumário completo e contagens conferidas contra os valores
      exibidos na tela (tarefa 5.2)
- [x] 4.2 Atualizar `docs/01 - design_system.md` §3.2 (item do menu do Account passa a
      "Perfis de Acesso (RBAC)") — verificação: `grep` no `docs/01` sem ocorrência de
      "Configuração de Perfis"
- [x] 4.3 Atualizar `docs/03 - Header e Sidebar.md` e `docs/05 - Gestão de Auditoria.md`
      (rótulo unificado e itens da Administração com rota) — verificação: `grep` nos dois
      documentos sem menção de RBAC "sem rota" nem do rótulo antigo
- [x] 4.4 Atualizar `docs/06 - Gestão de Usuários.md` §12 (a pendência "Módulo Perfis (RBAC):
      tela própria (item de navegação já reservado, ainda sem rota)" passa a registrar a rota
      entregue e remeter à fase 2) — verificação: `grep` no `docs/06` sem "ainda sem rota"

## 5. Verificação integrada

- [x] 5.1 Rodar `npm run build` completo e `openspec validate "pagina-perfis-acesso-rbac"
      --strict` — verificação: build sem erros e change validado
- [x] 5.2 Conferência visual em `http://localhost:3000`: `/admin/perfis-acesso` com shell e
      item da sidebar ativo; KPIs 4/4/0/171/396; tabela com 6 colunas, busca funcionando e
      valores 99/99 · 45/99 · 21/99 · 6/99 e 2/5/4/5; os 4 gatilhos com toast e nenhum modal;
      recarga restaura a base; `/admin/gestao-usuarios` e `/design` inalterados — verificação:
      checklist visual aprovado (1280px e 375px)
- [x] 5.3 Conferir a consistência `docs/07` ↔ tela (contagens e regras) e as cross-references
      dos `docs/01`, `03`, `05`, `06` — verificação: matriz do documento reproduz
      99/45/21/6 e 171/396

> **QA:** roda depois deste change, como passo separado (comando do usuário) — não faz parte
> destas tasks.

## 6. Ajustes pós-QA (Lote A)

- [x] 6.1 Grade de KPIs `sm:grid-cols-2 xl:grid-cols-4` em `Kpis.vue` (resolve UX-M1: valor
      `171/396` truncado entre 1024–1099px) — verificação: sem truncamento de título/valor a
      1024px e 4 colunas a 1280px
- [x] 6.2 Colunas numéricas `align: 'right'` em `Tabela.vue` (UX-B1) — verificação: th/td
      alinhados à direita na tabela
- [x] 6.3 Legenda de `n/99` no subtitle da tabela (UX-B2) — verificação: subtitle exibe
      "ações concedidas de 99 (11 módulos × 9 ações)"
- [x] 6.4 Correções do `docs/07` (DOC-1 autoridade de comportamento, DOC-3 prosa do Revisor,
      DOC-4 nome da seção 14) e do `design.md` (DOC-6 nome da constante) — verificação: greps
      sem os textos antigos
- [x] 6.5 Spec: "requisição de dados (API)" no lugar de "requisição HTTP"/"chamada de rede"
      (BUG-01) — verificação: `openspec validate --strict` OK
- [x] 6.6 Rebuild + reexecução da checagem CDP (27 verificações) após o Lote A — verificação:
      build OK e 27/27
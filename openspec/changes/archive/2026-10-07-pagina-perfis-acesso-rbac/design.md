# Design

## Context

A fase 1 da página de Perfis de Acesso (RBAC) entra num projeto que já tem três telas
administrativas construídas sobre o mesmo padrão (`gestao-usuarios`, `auditoria`,
`configuracoes-globais`): página fina orquestrando componentes de domínio em
`app/components/<modulo>/`, base de demonstração em `useState` sem `server/`, e um contrato de
transição em que gatilhos sem modal avisam por toast. O item de navegação "Perfis de Acesso
(RBAC)" já existe no shell (`app/config/navigation.ts:97` e `:119`) mas sem `to` — é o único
item da sessão Administração sem rota. O modelo normativo de permissões vive no `docs/02` §3.5
(4 ações booleanas fixas + 5 `permissoes_extras`, por `modulo` × `acao`) e ainda não tem
representação em tela nem em documentação de módulo. Ver `proposal.md` para a motivação e
`specs/perfis-acesso/spec.md` para os requisitos.

## Goals / Non-Goals

**Goals:**

- Página `/admin/perfis-acesso` completa para a fase 1: rota, navegação, KPIs, tabela e
  ações em toast — verificável por build + conferência visual antes da QA.
- Uma única fonte de verdade para a matriz de permissões, compartilhada entre a contagem da
  tela e o `docs/07`.
- Reuso integral do kit existente; nenhum componente novo e nenhuma mudança de `docs/01` §5.

**Non-Goals:**

- Modais (CRUD de perfil, filtros, permissões) — fase 2; a página não terá nenhum `UiModal`.
- Componente novo de kit (o toggle de permissão só nasce com o modal da fase 2).
- Qualquer requisição HTTP, `server/` ou persistência além do `useState` (descartado na
  recarga, por definição da fase).
- Alterar a base ou os tipos de `useUsuariosDemo` (só leitura).

## Decisions

### D1 — Página fina orquestradora, com emits para a fase 2

A página `app/pages/admin/perfis-acesso.vue` declara `definePageMeta({ layout: 'admin' })` e
apenas compõe `PerfisCabecalho`, `PerfisKpis` e `PerfisTabela`, mantendo **zero estado de
modal**. Cabecalho e Tabela **emitem** (`@novo`, `@editar`, `@excluir`, `@permissoes`) e a
página responde com o toast de transição.

- *Alternativa descartada:* chamar `toast` dentro dos componentes de domínio — mais curto hoje,
  mas quando os modais chegarem a página precisará retomar exatamente esses emits e os
  componentes seriam reescritos; o padrão de `gestao-usuarios` (página dona do estado de
  coordenação) já é a convenção do projeto (`docs/06` §2).
- *Alternativa descartada:* página monolítica — proibida pelo `docs/02` §2.2 (componentização
  obrigatória).

### D2 — Matriz semeada em `usePerfisDemo` como única fonte das contagens

`usePerfisDemo.ts` exporta `MODULOS` (11 ids/labels vindos da árvore da sidebar), `ACOES`
(4 fixas) e `EXTRAS` (5), mais `MATRIZ_SEED: Record<PerfilId, Record<ModuloId, Acao[]>>`
construído a partir de constantes por regra (ex.: `CONTEIDO_EDITOR =
['visualizar','criar','alterar','publicar','arquivar','download','exportar']`), espelhando
1:1 as regras por perfil do `docs/07`. `contarPermissoes(perfil)` deriva `n/99` (99 = 11 × 9)
e o total concedido (171) deriva da soma.

- *Alternativa descartada:* campo `permissoes` digitado no registro do perfil — cria duas
  fontes de verdade (registro × regras do doc), não é verificável contra o `docs/07` e não
  corresponde ao modelo `perfil_permissoes` do `docs/02`.
- *Alternativa descartada:* grade booleana completa `Record<Acao, boolean>` — 396 entradas
  declarativas; o array de ações aplicáveis por módulo é mais curto, mais legível na QA e
  reproduz exatamente as regras do documento.

**Reconciliação registrada:** a célula *Gestão de Auditoria × Revisor* inclui `exportar`
(`visualizar` + `exportar`). A tabela de regras apresentada na exploração mostrava só
`visualizar`, o que daria 20/99; os totais aprovados no plano (`21/99` e KPI `171/396`) são o
contrato, e `exportar` de auditoria é coerente com o papel de revisor. O `docs/07` nasce com
essa célula já com `exportar`.

### D3 — Coluna "Usuários" deriva da base de usuários vigente

`usePerfisDemo` importa `useUsuariosDemo().usuarios` e conta por `perfil`
(2/5/4/5 na base demo), em `computed`. Nenhum número de usuários é fixado no template.

- *Alternativa descartada:* duplicar a base ou fixar as contagens — a contagem divergiria
  quando um usuário fosse criado/excluído em `/admin/gestao-usuarios` na mesma sessão.
- *Ciclo de imports:* `usuarios/` não importa `perfis/` — dependência de um só sentido.

### D4 — Rota e navegação

`to: '/admin/perfis-acesso'` nos dois itens de `app/config/navigation.ts` (sidebar
`perfis-rbac` e item do menu da conta), com o rótulo da conta unificado para **"Perfis de
Acesso (RBAC)"**. A mudança de rótulo altera um requisito canônico de
`design-system/layout-navigation` (delta `MODIFIED` nesta change) e as documentações
`docs/01` §3.2, `docs/03` e `docs/05`. A vitrine `/design` seção 14 lê a mesma fonte de
configuração, então espelha a mudança sem edição adicional (requisito "Fonte única").

- *Alternativa descartada:* manter os dois rótulos diferentes — a divergência já existe só
  porque a tela nunca existiu; com a página pronta, manter "Configuração de Perfis (RBAC)" no
  menu da conta quebraria a unificação seguida para Usuários e Auditoria (`docs/06` §7).

### D5 — Sem componente de kit novo nesta fase

Tudo que a fase 1 precisa já existe: `UiButton`, `UiBadge`, `UiKpi`, `UiDataTable`,
`UiTooltip`. A identidade do módulo usa o tile `ShieldCheck` `#f5b302` já reservado no
`docs/01`. O único candidato a componente novo (toggle/switch de permissão) nasce com o modal
da fase 2, momento em que entra com spec `design-system/*`, seção em `docs/01` e seção na
vitrine `/design` — fora do escopo aqui.

### D6 — `docs/07` espelha a estrutura de `05`/`06` mais uma seção normativa

`docs/07 - Perfis de Acesso (RBAC).md` usa as 12 seções canônicas (Visão geral e rota →
Pendências) e insere a seção **Matriz de permissões (normativa)** logo após os dados de
demonstração: regras por perfil, uma tabela 11 × 9 por perfil e as contagens. As cross-
references desatualizadas (`docs/06` §12 "ainda sem rota", `docs/05` §7, `docs/03`) são
corrigidas no mesmo change para não propagar a informação de que o item não tem rota.

### D7 — Status do perfil

Cada perfil demo nasce `Ativo` (os 4 são os perfis canônicos em uso pelos 16 usuários da base;
marcar um como Inativo contradiz a atribuição existente). O campo existe desde a fase 1 para o
badge e para o CRUD futuro; na base demo o KPI "Inativos" exibe `0` — valor esperado, não bug.

## Risks / Trade-offs

- **Contagem da tela divergir do `docs/07`** (duas fontes escritas à mão) → a matriz no
  composable é a fonte executável; o documento é escrito a partir das mesmas regras e o
  requisito `docs/07`/consistência da spec torna a divergência um falha de QA — conferir
  99/45/21/6 e 171/396 na verificação.
- **Seis colunas estourarem a largura em ~1280px** → seguir os `minWidth` da tabela de
  usuários (coluna Descrição é a única elástica) e conferir sem rolagem horizontal na
  verificação, inclusive ao trocar de página.
- **Dependência cross-module (`perfis` → `usuarios`)** → se `useUsuariosDemo` mudar de
  caminho/nome, só `usePerfisDemo` quebra; import é de leitura e sem ciclo.
- **Renomear o item do menu da conta invalida menções antigas** → deltas e docs
  (`docs/01`/`03`/`05`) atualizados no mesmo change; QA de documentação deve checar o rótulo.
- **`Inativos = 0` na demo ser confundido com defeito** → registrado em D7 e no `docs/07`
  (dados de demonstração) como comportamento esperado.

## Migration Plan

Não há backend nem dados externos: o change é código de página + docs + um delta de spec.
Deploy = `npm run build` normal; rollback = reverter os commits (nenhuma migração, nenhum
estado a desfazer). A navegação antiga (item sem rota) deixa de existir no mesmo commit em que
a rota nasce, então não há janela com item apontando para rota inexistente.

## Open Questions

Nenhuma — rota, rótulo, matriz (45/21/6, 171/396), KPIs (Total · Ativos · Inativos ·
Permissões concedidas), escopo sem modais e estrutura do `docs/07` foram decididos com o
usuário durante a exploração.

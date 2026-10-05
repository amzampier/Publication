# Design

## Context

O módulo de Gestão de Usuários já tem toda a canalização de filtros pronta, menos a torneira:
`useUsuariosDemo.ts` expõe `FiltrosUsuarios { perfil, status }` (`''` = todos),
`usuariosFiltrados`, `filtrosAtivosCount` e `limparFiltros`, e todos os consumidores — `Kpis.vue`,
`Tabela.vue`, CSV e PDFs do `Cabecalho.vue` — já leem o conjunto filtrado. O único ponto pendente
é `Tabela.vue:59`, que ainda responde ao evento `open-filters` do `UiDataTable` com um toast de
"próxima etapa". A Auditoria irmã já opera o modal de filtros completo
(`app/components/auditoria/Filtros.vue`), cujo padrão (rascunho + rodapé Limpar/Cancelar/Aplicar)
está documentado em `docs/05` §3.3 e foi auditado em QA. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**

- Entregar o modal de filtros de Usuário (nome) / Perfil / Status reapresentando apenas componentes
  já existentes do kit, no mesmo contrato visual e comportamental do modal de filtros da Auditoria.
- Estender o composable para o critério de usuário sem quebrar nenhum consumidor existente.
- Manter o badge `filtersCount` do `UiDataTable` coerente com o estado aplicado.

**Non-Goals:**

- Criar ou alterar qualquer componente de kit (`docs/01` intocado; nenhuma spec
  `design-system/*` muda).
- Filtro multi-seleção por campo (mantém-se seleção única, `string` por critério).
- Filtro por período/último acesso, departamento ou função (campos fora do escopo acordado).
- Tocar em Importar, Convite, Bloquear ou ViaCEP (seguem com toast de transição).

## Decisions

**D1 — A página é dona do estado de coordenação.** `gestao-usuarios.vue` ganha
`filtrosAbertos: ref(false)` e renderiza `<UsuariosFiltros v-model="filtrosAbertos" />`; a
`Tabela.vue` apenas repassa `@open-filters` para a página. É o mesmo arranjo de `modalAberto`,
`exclusaoAberta` e de `auditoria.vue:27` — nenhum componente de domínio abre modal por conta
própria (docs/06 §2). *Alternativa descartada:* o `Tabela.vue` montar o modal internamente —
quebraria a convenção de que a página coordena todos os diálogos.

**D2 — Espelho literal do `Filtros.vue` da Auditoria.** Estrutura, rodapé e ciclo de vida do
rascunho são copiados do irmão: `watch(modelValue)` espelha o estado aplicado ao abrir;
`aplicar()` grava e fecha; `cancelar()` só fecha; `limpar()` zera rascunho + composable mantendo o
modal aberto; `UiModal size="sm"` com `:icon="Funnel"`. *Alternativa descartada:* componente de
filtro genérico compartilhado entre módulos — só existem dois consumidores com campos distintos,
e a indireção não paga o custo de mais uma abstração no kit (regra "nunca crie botão/campo
paralelos" não exige generalizar composição de domínio).

**D3 — Seções do corpo.** Duas `UiModalSection`: **"Usuário"** (ícone `User`, um `UiSelect`) e
**"Perfil e Status"** (ícone `ShieldCheck`, dois `UiSelect` empilhados com `label`). Motivo:
"Usuário" é um critério de entidade (como "Usuário" da Auditoria) e Perfil/Status são os dois
critérios de classificação já existentes; três seções de um campo cada ficariam espichadas,
uma seção única perderia o agrupamento semântico (mesma decisão de agrupar "Ação e Recurso" na
Auditoria).

**D4 — Três `UiSelect`, nada de `UiSegmented`/chips.** Os dois módulos de filtro do projeto
usam `UiSelect` com placeholder "Todos…" e `clearable`; manter o padrão torna os dois modais
irmãos visuais e a spec nova descreve o mesmo contrato do módulo irmão. Para `UiSegmented`
(2 opções de Status) seria preciso um segmento extra "Todos" porque o controle não tem
"desmarcar" — comportamento novo de consumo sobre kit existente, e a primeira divergência entre
os dois modais de filtro.

**D5 — `opcoesUsuarios` deriva da base completa (`usuarios`), não do conjunto filtrado.** Se
derivasse do conjunto filtrado, aplicar filtro de Status "Inativo" esconderia do select de
Usuário todos os ativos — o usuário não conseguiria montar a combinação que quer. Ordenação
`localeCompare(…, 'pt-BR')`, mesmando padrão de `useAuditoriaDemo.ts:147`. O valor gravado é o
`nome`; o predicado compara `u.nome === f.usuario`.

**D6 — Badge reflete o estado aplicado, não o rascunho.** `filtersCount` continua lendo
`filtrosAtivosCount` do composable, que só muda em `aplicar()`/`limpar()`. Alterações feitas no
rascunho e descartadas por Cancelar nunca fluctuam o badge (cenário "Badge conta somente o estado
aplicado" da spec).

**D7 — Sem delta de spec em `design-system/*`.** O modal abre em nível único (empilhamento de
`design-system/modais` já cobre o caso de uso), os controles usados já têm specs vigentes e a
vitrine `/design` não muda (seção 13 segue como demo de toolbar, mesmo formato da Auditoria).

## Risks / Trade-offs

- **Nome como chave do filtro** → renomear um usuário com o filtro de Usuário aplicado deixa o
  predicado sem correspondência (conjunto vazio indevido). Aceito na fase em memória: renomear é
  raro na demo, a base é restaurada na recarga e o cenário "Conjunto filtrado vazio" cobre o
  sintoma com estado vazio legível em vez de erro.
- **Duplicação de código entre os dois `Filtros.vue`** → aceito e consciente: são ~120 linhas de
  composição cada, e a duplicação de domínio é preferível a uma abstração de kit prematura. Se um
  terceiro módulo de filtro surgir, a extração vira decisão explícita.
- **Contagem de toasts em `docs/06` §5.5/§11** (cinco → quatro) é fácil de deixar solta → tarefa
  de documentação dedicada no tasks.md, com verificação por grep dos `avisoProximaEtapa`
  restantes.
- **`UiSelect` com 16+ opções** → o select já tem busca interna normalizando acento/maiúsculas;
  criar usuário novo adiciona opção automaticamente (base reativa), excluir remove.

## Migration Plan

Não aplicável — fase em memória, sem persistência, sem API e sem dados de produção. A mudança é
aditiva na UI e o rollback é remover o componente e o wire (o composable tolera `usuario: ''`).

## Open Questions

Nenhuma — escopo, controles e comportamento foram definidos na exploração (Opção A + usuário por
nome, Linha 1 com três `UiSelect`).

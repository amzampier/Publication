# Proposal

## Why

O botão "Filtros" da tabela de Gestão de Usuários é o último controle estrutural da tela ainda
presa no toast "funcionalidade disponível na próxima etapa": o composable já modela os filtros
(`FiltrosUsuarios`, `usuariosFiltrados`, `filtrosAtivosCount`) e KPIs, tabela, CSV e PDFs já
operam sobre o conjunto filtrado, mas a UI não chegou — o filtro é invisível e inalcançável.
A Auditoria irmã já tem exatamente esse modal (`auditoria/Filtros.vue`), então o padrão está
provado e falta replicá-lo.

## What Changes

- **Modal de filtros** (componente de domínio `app/components/usuarios/Filtros.vue`) composto
  pelos componentes já existentes: `UiModal size="sm"` com título "Filtros de Usuários", ícone
  `Funnel` e duas `UiModalSection` — **"Usuário"** (select do usuário por **nome**) e **"Perfil e
  Status"** (dois `UiSelect`), todos com estado vazio `''` = "todos" (placeholder "Todos…") e o
  padrão de rascunho da Auditoria: ao abrir espelha o estado vigente, **Aplicar** grava e fecha,
  **Cancelar**/`Escape`/`X` descartam, **Limpar Filtros** zera rascunho e composable com o modal
  aberto. Rodapé idêntico ao irmão: "Limpar Filtros" à esquerda; "Cancelar" + "Aplicar" à direita.
- **Composable estendido:** `FiltrosUsuarios` ganha `usuario: string`; `usuariosFiltrados` ganha
  o predicado de nome; `filtrosAtivosCount` conta até 3; `limparFiltros` zera os três; novo
  `opcoesUsuarios` (nomes distintos da base, ordenados em pt-BR).
- **Wire do gatilho:** o `@open-filters` da `Tabela.vue` deixa de exibir toast e passa a abrir o
  modal (coordenação na página, como já fazem Formulario e Exclusao); o botão continua exibindo
  o badge `filtersCount` com a quantidade de filtros aplicados.
- **Recálculo sem toque extra:** KPIs, tabela e exportações (CSV/PDF) já consomem
  `usuariosFiltrados` — recalculam sozinhos ao aplicar/limpar filtros.
- **Documentação completa:** `docs/06` (§1, §2 árvore da página, §3.5 composable, nova subseção
  do modal, §5.5 com **quatro** toasts remanescentes, §10, §11 e §12); `docs/01` permanece
  intocado — nenhum componente de kit é criado ou alterado.
- **BUG-01 resolvido como comportamento definido — "Informações de Cadastro" somente na
  edição (escopo acrescentado durante o apply/QA desta change):** a QA inicial sinalizou que a
  criação não exibia o bloco, mas a definição correta é que **a criação não deve exibir a
  seção** (modal com os blocos 1–3 apenas). O código `Formulario.vue` foi mantido/restaurado
  com `v-if="modo === 'editar'"` (removido o `textoAuxiliarData` morto), `docs/06` §3.4/§5.1
  passaram a dizer "somente na edição" sem contradição, e o delta desta change passa a conter
  também o MODIFIED requirement "O modal de usuário reúne os blocos de cadastro" — a spec
  principal exigia o bloco na criação, e o delta é o veículo OpenSpec para corrigi-lo.
- **Contrato de transição preservado nos demais gatilhos:** Importar, Enviar o Convite,
  Bloquear e o ícone do CEP continuam com toast de "próxima etapa" e nenhum modal aberto.

## Capabilities

### New Capabilities

_Nenhuma capability nova._

### Modified Capabilities

- `gestao-usuarios`: o requirement dos gatilhos de fase 1 perde o "botão Filtros" de sua lista
  de controles com toast (ele passa a abrir o modal de filtros; Importar, Convite, Bloquear e CEP
  seguem com toast) e a spec ganha um requirement novo descrevendo o modal de filtros — as duas
  seções, os três `UiSelect` com `''` = todos, o rodapé Limpar/Cancelar/Aplicar, o padrão de
  rascunho, o badge com a contagem de filtros ativos e a tabela/KPIs/exportação refletindo o
  conjunto filtrado, tudo em memória e sem requisições de rede. O requirement de KPIs **não**
  sofre delta: seu cenário "Conjunto alterado recalcula os KPIs" já prevê explicitamente o
  "filtro do módulo".

## Impact

- **Componentes de domínio:** novo `app/components/usuarios/Filtros.vue`; alterados
  `app/components/usuarios/useUsuariosDemo.ts` (tipo `FiltrosUsuarios`, predicado, contador,
  `limparFiltros`, `opcoesUsuarios`), `app/components/usuarios/Tabela.vue` (`@open-filters` deixa
  de toastar e repassa o evento), `app/pages/admin/gestao-usuarios.vue` (coordenação do novo
  modal — estado `filtrosAbertos`) e, pelo BUG-01,
  `app/components/usuarios/Formulario.vue` (bloco "Informações de Cadastro" confirmado como
  somente edição; helper-text morto removido).
- **Componentes de kit:** nenhum. `UiModal`, `UiModalSection`, `UiSelect`, `UiButton` e o badge
  do `UiDataTable` são apenas compostos — nenhuma spec de `design-system/*` sofre delta
  (`design-system/modais` já cobre empilhamento e não se aplica: o modal abre em nível único).
- **Documentação:** `docs/06 - Gestão de Usuários.md` (seções 1, 2, 3.5, nova subseção do modal,
  5.5 com quatro toasts, 10, 11 e 12). `docs/01 - design_system.md` intocado. Vitrine `/design`
  sem mudança (a seção 13 segue como demo de toolbar).
- **Fora de escopo:** Importar, Enviar o Convite, Bloquear e ViaCEP (seguem com toast);
  `docs/02` intocado; nenhum endpoint em `server/`; filtros multi-seleção (mantém-se seleção
  única por campo); busca textual livre continua sendo responsabilidade da `UiDataTable`.

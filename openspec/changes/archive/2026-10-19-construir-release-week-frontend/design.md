# Design: construir-release-week-frontend

## Context

Ver `proposal.md - Why`. Estado relevante já verificado no código:

- `release_week` existe no schema (`server/migration/01_create_tables.sql` §13) com `status` ENUM de
  quatro valores e **sem** coluna de arquivamento; `entregas_itens.release_id` referencia a release
  (`ON DELETE CASCADE`), então "possuir itens" é a relação que hoje impede exclusão.
- O item `release-week` já está em `app/config/navigation.ts` (ícone `Rocket`, `#1a9e07`) sem `to`.
- O catálogo RBAC `release-week` já existe (`app/config/perfis.ts`, `server/utils/perfis.ts`) com
  `visualizar/criar/alterar/excluir/publicar/arquivar/importar/filtrar/buscar/download/exportar`.
  **Não há `clonar`** — a clonagem usa a permissão `criar`.
- O padrão de módulo é o de `docs/10`/`docs/11`: página fina + componentes em pasta própria +
  `use*Modelo` + `gerarPdf*` + doc `NN - Módulo ...md`.
- O `UiDataTable` só expande **grupos** hoje; não há expansão de linha nem menu de ações de linha.
- `UiBadge` tem as variantes `done/reconciled/pending/inReview/blocked/neutral` e aceita `slot` para o
  rótulo.

## Goals / Non-Goals

**Goals:**
- Entregar a página de Release Week navegável e "viva" com dataset em memória, exercitando todas as
  ações sem backend.
- Adicionar ao kit, de forma reutilizável, o menu de ações e a expansão de linha.
- Fixar o contrato do modelo (campos, `arquivada`, itens) para a fase backend.

**Non-Goals:**
- Backend, API, migration/seed, coluna física de arquivamento, RBAC server-side e importação
  funcional (só o ícone).
- Regra de "datas sempre segundas-feiras": fica para a validação de backend (a UI valida
  presença/formato).

## Decisions

### D1 — Dataset em memória como `useState` de rascunho
`useReleaseWeekModelo` mantém `ReleaseWeekModelo[]` e `ItemRelease[]` em `useState`, semeados com
exemplos no primeiro acesso. Todas as ações (incluir/editar/clonar/publicar/arquivar/excluir) mutam
esses arrays; recarregar a página restaura o conjunto inicial e nada vai ao banco.

- **Por que:** decisão explícita do usuário para a fase 1; permite clicar e validar o fluxo sem
  backend/seed.
- **Alternativa descartada:** contract-first vazio (precedente de Softwares) — não permitiria
  exercitar as ações agora.
- **Dívida registrada:** na fase backend, o modelo troca o array pela resposta de `GET /api/release-week`
  e `arquivada` vira coluna (ou soft delete) no banco; o array de itens vem de `entregas_itens`.

### D2 — Expansão de linha aditiva no `UiDataTable`
Novas props/slots **opcionais** (padrão desligado):
`expandable` (habilita os controles `+`/`−`), `v-model:expanded` (chaves das linhas abertas),
`rowKey` (default `id`) e `expandLabel`; slots `#expandHeader` (conteúdo do cabeçalho da coluna de
expansão — onde a página coloca a flag) e `#expanded="{ row }"` (conteúdo da linha expandida).

- Renderização: quando há slot `expandHeader` **ou** `expandable`, uma coluna líder é adicionada; o
  header usa `#expandHeader` e cada linha usa o controle com `aria-expanded`. A linha expandida é um
  `<tr>` de largura total logo abaixo.
- **Por que não um componente de tabela paralelo:** reuso do kit (AGENTS) e comportamento consistente.
- **Restrição dura:** nenhuma função existente é removida ou alterada (modo servidor, ordenação
  acessível, agrupamento, paginação, busca, filtros, `#actions`, estado vazio). A expansão fica fora
  de ordenação e de agrupamento.
- **Risco de clipping:** o `UiActionMenu` e o `#expanded` vivem dentro do container da tabela; se o
  container tiver `overflow`, posicionar o menu com a mesma estratégia do `UiSelect` (popover) ou
  `Teleport` para o `body`.

### D3 — `UiActionMenu` novo no kit
Componente de menu suspenso por linha: gatilho com ícone, `items` (`id`, `label`, `icon`, `tone`,
`disabled`, `reason`), `aria-haspopup="menu"`/`aria-expanded`, `role="menu"/"menuitem"`, navegação
por setas cíclica, `Enter`/`Space` aciona, `Escape`/clique-fora fecha devolvendo o foco ao gatilho.
Itens desabilitados usam `aria-disabled` e expõem o motivo (`title`/texto acessível).

- **Uso na Release Week:** **Editar** e **Excluir** ficam como ícones inline à esquerda dos três
  pontinhos (ações frequentes; Excluir desabilitado com motivo quando há itens); o menu agrupa as
  ações de fluxo **Clonar/Publicar/Arquivar**.
- **Por que:** as ações destrutivas/frequentes ficam a um clique, e o menu acomoda as ações de
  fluxo sem poluir a linha. Molde visual: menu do Account já existente.
- **Alternativa descartada:** esconder todas as 5 ações no menu (mais cliques para editar/excluir).

### D4 — Status e `arquivada`
`status` continua sendo o fluxo editorial de 4 valores; **`arquivada` é booleano** separado. A lista e
os KPIs excluem `arquivada === true`. `UiBadge` ganha variantes semânticas `aberta`, `publicado` e
`arquivado` (além do mapa existente), atualizando `docs/01 §5.2` e a vitrine.

- **Por que booleano:** arquivar não é etapa do fluxo editorial e precisa "sumir da lista" sem apagar;
  no banco futuro vira coluna dedicada (ou `arquivado_em`), não um valor do ENUM.

### D5 — Clonar reutiliza o Formulario
`Clonar` abre o **mesmo** `Formulario` em modo criação com um `prefill` (`versao`, `release`,
`destaqueSemana`); `codigo`, `nome`, `semana`, `ano`, `mes`, datas, `status` e `descricao` vazios e
status `Aberta`. Nada é copiado de itens nem gravado antes de salvar.

- **Por que:** um único componente de formulário evita divergência de campos; a diferença é só o
  `prefill`.

### D6 — Guarda de exclusão
`podeExcluir(week) = !week.arquivada && itensDa(week.id).length === 0`. O item "Excluir" do menu fica
`disabled` com `reason` ("Release arquivada" / "Release com itens vinculados"); a confirmação só
existe quando permitido.

### D7 — Importação apenas affordância
Ícone `Import` à esquerda de "Filtros", sem modal/parser/requisição. O handler é intencionalmente
inerte nesta fase e a pendência fica registrada no `docs/12` e em `tasks.md`.

## Risks / Trade-offs

- [Dataset em memória não persiste e some no F5] → Esperado e documentado no `docs/12`; a tela deixa
  claro que é rascunho da fase frontend até o backend.
- [Expansão de linha pode regredir modos existentes do `UiDataTable`] → Implementação estritamente
  aditiva e desligada por padrão; verificação manual das telas que usam a tabela (Softwares,
  Parceiros, Usuários, Perfis, Auditoria) nos gates.
- [`UiActionMenu` recortado pelo overflow da tabela] → Posicionamento tipo popover/`Teleport`;
  validar em `/design` e na página.
- [Guarda de exclusão só conhece os itens do dataset em memória] → Na fase backend a checagem real é
  por FK/consulta; o contrato já prevê "sem itens/relacionamentos".

## Migration Plan

Sem migration de banco (fase frontend). Ordem de implementação:
1. Kit (`UiActionMenu`, variantes do `UiBadge`, expansão aditiva do `UiDataTable`) + `/design` +
   `docs/01`.
2. `useReleaseWeekModelo` (dataset em memória, regras, derivados).
3. Componentes de domínio + página + navegação.
4. `docs/12` + testes dos validadores.
Rollback: remover a rota/componentes e o ícone/rota da sidebar; o kit mantém apenas adições opcionais.

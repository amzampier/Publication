# Design

## Context

Fase 1 em memória; a tela `/admin/perfis-acesso` já usa `UiDataTable` com `show-header-top`
(busca) e carece de `show-filters` e de exportação (`docs/07` §5). Os dois controles já
existem prontos no projeto: o kit `UiDataTable` publica `showFilters`/`filtersCount`/
`open-filters` + slot `filtersLeft` (`docs/01` §DataTable), e `gestao-usuarios` tem os
moldes de modal de filtros, menu de relatórios no cabeçalho e geradores CSV/PDF
(`UsuariosFiltros`, `UsuariosCabecalho`, `gerarPdfUsuarios`). Motivação em
`proposal.md`; requisitos em `specs/perfis-acesso/spec.md`.

## Goals / Non-Goals

**Goals:**
- Espelhar 1:1 o padrão de `gestao-usuarios` (Zona A = cabeçalho com menu "Relatórios";
  Zona B = toolbar com botão "Filtros"), com decoupling igual (a página é dona do estado
  dos modais).
- Estado de filtros no composable, compartilhado por tabela, KPIs e cabeçalho.
- Zero dependências novas, zero mudança de kit, zero mudança de vitrine.

**Non-Goals:**
- Importação de perfis (não existe hoje; `filtersLeft` fica vazio — mesma composição da
  Auditoria).
- Filtros por faixa de permissões, por vínculo de usuários ou busca dentro do modal.
- Backend/persistência (bloco C), alterações de kit ou de outros módulos.

## Decisions

1. **Colocação dos botões** — menu "Relatórios" no `Cabecalho` à esquerda de "Novo
   Perfil"; "Filtros" na toolbar do `UiDataTable` via props do kit.
   *Alternativas:* ambos na toolbar (repete padrão e bagunça a hierarquia título-da-página
   × título-da-tabela); export como botão simples de ícone (perde o ponto de extensão já
   usado pelas duas irmãs). Decisão 13 de `docs/05` é o precedente registrado.

2. **Estado no composable `usePerfisDemo`** — `FiltrosPerfis { perfil: string; situacao:
   string }` em `useState('perfis-filtros')`, mais `perfisFiltrados`, `filtrosAtivosCount`
   (0..2) e `limparFiltros()`.
   *Alternativa:* estado na página + prop drilling (repete 4 cadeias e diverge de
   `useUsuariosDemo`, que é a fonte espelhada). Critérios de filtro incidem sobre o
   registro (`nome`/`situacao`), então `perfisFiltrados` deriva de `perfis` e os
   `linhas`/KPIs passam a computar a partir dele.

3. **Molde do modal de filtros** — cópia adaptada de `UsuariosFiltros`: sessões "Perfil"
   (nomes da base em pt-BR) e "Status" (Ativo/Inativo/Bloqueado); rascunho sincronizado na
   abertura; Limpar/Cancelar/Aplicar no rodapé. `''` = todos e `X` do `UiSelect` limpa.

4. **Menu "Relatórios"** — mini-menu `role="menu"` escrito à mão (click-outside + Esc +
   `aria-haspopup`/`aria-expanded`), como `UsuariosCabecalho`/`AuditoriaCabecalho` — não
   há componente de dropdown no kit. Itens: "Relação de perfis" (PDF) · divisor ·
   "Exportar em CSV", exportando sobre `perfisFiltrados`.

5. **PDF** — novo `perfis/gerarPdfPerfis.ts` clonando a estrutura de `gerarPdfUsuarios`
   (jsPDF A4 paisagem + `jspdf-autotable` + `rasterizarLogo` de `useLogomarcaLogin`),
   colunas Nome/Descrição/Status/Usuários/Permissões, arquivo `perfis.pdf`.
   *Alternativa:* parametrizar `gerarPdfUsuarios` em um util compartilhado (reduz cópia,
   mas toca código testado de outro módulo sem ganho de comportamento — preferimos ficheiro
   isolado; se um terceiro relatório aparecer, extrair na hora).

6. **CSV** — mesma receita da irmã: `;`, BOM UTF-8, aspas duplicadas escapadas,
   cabeçalho Nome;Descrição;Status;Usuários;Permissões, arquivo `perfis.csv`.

7. **KPIs sobre o conjunto filtrado** — `PerfisKpis` migra dos `perfis` para
   `perfisFiltrados` (cenário novo na req MODIFIED); conjunto vazio → Total 0 e
   Permissões `0/0` com badge `neutral` (variante já existente para 0).

8. **Coordenação** — a página ganha `filtrosAbertos` e repasse `@open-filters` →
   `<PerfisFiltros>`; idêntico ao par `gestao-usuarios.vue`/`auditoria.vue`. A tabela
   emite `open-filters` e seus dados viram `perfisFiltrados`; a busca do kit permanece
   visual (req vigente "busca é visual" não muda).

## Risks / Trade-offs

- [Duplicação entre `gerarPdfUsuarios` e `gerarPdfPerfis`] → ficheiros pequenos e
  isolados; extração para util comum fica registrada como gatilho (3º relatório).
- [KPIs passam a reagir a filtros — mudança visual sensível] → é exatamente o comportamento
  de `gestao-usuarios` e o novo cenário da spec; `docs/07` §3.4/§5 atualizados no mesmo
  change.
- [Busca textual × filtro estrutural podem parecer redundantes] → contrato já separado
  pela spec (busca = visual; filtro = conjunto vigente) e documentado em `docs/07` §5.
- [Cabeçalho com 3 elementos em 375px] → wrapper `flex-col sm:flex-row w-full` já existe
  no `PerfisCabecalho` (mesmo do irmão); menu cai empilhado em `sm` sem quebra.
- [Conjunto filtrado vazio quebra KPIs com divisão por zero] → denominador `perfis × 99`
  vira 0 → render `0/0` e variante `neutral` (cenário da spec).

## Migration Plan

Fase 1 em memória: implantação trivial (bundle novo), rollback = reverter o commit. Sem
dados, sem persistência, sem contrato de API.

## Open Questions

Nenhuma — colocações, campos de filtro, comportamento dos KPIs e itens do menu foram
decididos com o usuário na exploração (ver `proposal.md`).

# Design

## Context

A opção "Listar em PDF" chama `window.print()` (`AuditoriaCabecalho`) e o diálogo mostra a página crua, sem formato de relatório. O logo de login vive em refs **locais** de `AbaLogomarcas.vue` (só o do header é compartilhado via `useLogomarcaHeader`), então a Auditoria não consegue vê-lo; `package.json` não tem lib de PDF (só nuxt/vue/tailwind/lucide) e a spec principal `auditoria` não existe (o archive anterior foi feito sem sync). Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Download de `auditoria.pdf` real (A4 paisagem) com logo de login + título, filtros vigentes, colunas/registros filtrados e paginação
- Logo de login como estado compartilhado (composable espelho do header)
- Spec principal `auditoria` recriada (ADDED) com o requirement de exportação no formato novo
- `docs/05` coerente; `window.print()` removido desta tela

**Non-Goals:**
- Alterar o CSV, o kit de componentes ou as specs de outros domínios
- Remover o `@media print` de `main.css` (outros consumidores/futuro)
- Logo de fallback (favicon) — sem logo, o PDF sai só com o título (decisão do usuário)
- Escopo de dados: mesmos `registrosFiltrados` em memória (fase 1)

## Decisions

1. **jsPDF v4 + jspdf-autotable v5** como dependências novas (aprovadas pelo usuário) — autoTable resolve paginação de tabela com repetição do cabeçalho de colunas e `didDrawPage` para rodapé; `save()` gera um `<a download>` interceptável nos testes; fontes padrão (Helvetica/WinAnsi) cobrem os acentos pt-BR sem embutir fontes. *Alternativas:* pdfmake (rejeitado — bundle de fontes maior e costuma exigir ajuste de config no Vite); reimprimir via `window.print` com CSS (rejeitado pelo usuário — sem estrutura de relatório e não gera arquivo); gerador manual de PDF (inviável para tabela paginada).

2. **`useLogomarcaLogin` espelhando `useLogomarcaHeader`** — novo `app/composables/useLogomarcaLogin.ts` com `useState('logomarca-login-caminho'/'-preview')`; `AbaLogomarcas.vue` troca as refs locais `logoLogin`/`previewLogin` pelo composable (mesma mecânica de watch já existente). *Alternativa:* ler o estado interno do painel (rejeitada — refs locais morrem na troca de aba; espelhar o header é o padrão do repositório).

3. **Gerador `gerarPdfAuditoria.ts`** (função pura, sem Vue): `new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })` (297×210mm); margens 10mm; bloco de cabeçalho na primeira página — logo rasterizada à esquerda (≈18mm de altura, proporção preservada), à direita o título "Relatório de Gestão de Auditoria" + "Gerado em dd/mm/aaaa hh:mm"; abaixo, os **filtros vigentes** ("Período: … · Usuário: … · Ação: … · Recurso: …" ou "Sem filtros aplicados"); linha divisória em `#112051`; `autoTable` a partir do fim do cabeçalho com colunas Data/Hora, Usuário, Ação, Recurso, Detalhes (larga), IP — `headStyles` navy `#112051`/branco (igual ao `UiDataTable`), `styles` Helvetica 8–9pt, `margin` lateral 10mm, `didDrawPage` desenhando o rodapé "Página X de Y" em todas as páginas (X/Y via `autoTable.previous`/`pageNumber`); `didParseCell` não é necessário (dados são texto puro). Download por `doc.save('auditoria.pdf')`.

4. **Logo:** se `preview` é `dataURL` → rasteriza (`Image` + canvas → PNG dataURL) e `doc.addImage` (cobre PNG/JPG e SVG via canvas); se for caminho remoto → `fetch` com `try/catch` (falha → segue sem logo); vazio/"Marca padrão" → sem imagem, só o título (decisão do usuário). Assíncrono: o gerador é `async` e o `Cabecalho` aguarda antes do `save`.

5. **Menu e rótulos:** item **"Download em PDF"** (palavra do usuário) no lugar de "Listar em PDF"; arquivo **`auditoria.pdf`**; filtros do PDF = estado **vigente** do composable (mesma base do CSV); rótulos construídos no gerador a partir de `FiltrosAuditoria` + `periodoRotulo` (recebidos como parâmetros pelo `Cabecalho`).

6. **Spec capability `auditoria` como ADDED novo** — a main spec nunca existiu (archive sem sync); copiar os 9 requisitos do delta **arquivado** com o requirement de exportação reescrito evita MODIFIED sobre main inexistente (que bloquearia o sync no próximo archive).

7. **Header da tabela: sem tooltip, cursor `pointer` e seta visível (revisão do usuário)** — após uma primeira iteração com `UiTooltip` na coluna (que o clamp do próprio tooltip prendia dentro da célula por causa do `overflow` do `truncate`), o usuário pediu **remover o tooltip da coluna**: saem os `title` nativos do `th` e do handle e não há balão algum na header (as dicas vivem na faixa "Arraste um cabeçalho de coluna para agrupar" e no `docs/01`). O cursor da coluna passa de mão aberta (`cursor-grab`) para **mão apontando** (`cursor-pointer`), mantendo `draggable`/redimensionamento funcionais. A seta `ArrowUpDown` sai de `h-2.5 … opacity-30` para `h-3 w-3 text-white/85 stroke-[2.5]` com hover em `brand-accent` — sempre visível sobre o navy. *Alternativas descartadas:* restaurar `title` nativo (rejeitado — o usuário apontou o "tooltip padrão" como errado); manter o `UiTooltip` reposicionado (rejeitado — pedido explícito de remoção); `cursor-grab` no drag (rejeitado — usuário não quer a mão aberta).

## Risks / Trade-offs

- [Dependência nova no `package.json`] → aprovada explicitamente; `peerDependencies` do autotable cobrem `jspdf ^4`; build é o gate.
- [Logo em SVG puro não é suportável pelo jsPDF] → rasterização via canvas resolve.
- [Acentos/traços especiais (en dash "–") nas fontes padrão] → o rótulo de período no PDF usa hífen simples quando composto pelo gerador (o composable mantém o "–" só na UI).
- [autoTable corta linhas longas de "Detalhes"] → coluna larga em paisagem + `overflow: 'linebreak'` no estilo da célula.
- [Filtros do PDF divergem da tabela se o estado mudar entre clique e geração] → geração síncrona sobre o snapshot `registrosFiltrados` no momento do clique (mesma semântica do CSV).

## Migration Plan

`npm i jspdf jspdf-autotable` → composable → gerador → menu → docs → build → CDP (download, paisagem, sem print) + conferência visual do PDF gerado. Rollback = reverter o commit e remover as 2 deps.

## Open Questions

*(nenhuma — dependência, fluxo, fallback de logo e rótulos fechados com o usuário.)*
# Proposal

## Why

A opção "Listar em PDF" da Gestão de Auditoria chama apenas `window.print()`: abre o diálogo de impressão do navegador sem nenhum formato de relatório (sem cabeçalho, sem logo, sem título, sem filtros, sem paginação) — o usuário não vê o que será impresso. O pedido é trocar a impressão por um **arquivo `auditoria.pdf` baixável**, em folha **paisagem**, com cabeçalho (logo de login + título), filtros vigentes, colunas/registros e paginação.

## What Changes

- **Nova dependência:** `jspdf` (v4) + `jspdf-autotable` (v5) — geração de PDF com tabela paginada e repetição de cabeçalho de colunas.
- **Logo de login compartilhado:** novo composable `app/composables/useLogomarcaLogin.ts` (espelho do `useLogomarcaHeader`); o bloco da logo de login em `AbaLogomarcas.vue` deixa de usar refs locais e passa a usar o composable — a página de Auditoria passa a enxergar a logo configurada em Configurações (e ela sobrevive à troca de aba, como a do header).
- **Gerador de relatório:** `app/components/auditoria/gerarPdfAuditoria.ts` — jsPDF A4 **paisagem** + autoTable: cabeçalho com a logo de login à esquerda (rasterizada via canvas; sem logo ou caminho sem arquivo → só o título), título "Relatório de Gestão de Auditoria" + "Gerado em …" à direita, **filtros vigentes** abaixo, linha divisória, colunas (Data/Hora, Usuário, Ação, Recurso, Detalhes, IP) com head navy repetido a cada página, rodapé "Página X de Y" e `save('auditoria.pdf')` — **`window.print()` removido**.
- **Menu Exportar:** item "Listar em PDF" → **"Download em PDF"** (rotulo do usuário).
- **Ajustes finais da `UiDataTable` (pedido do usuário):** a header fica **sem tooltip** (saem os `title` nativos do th e do handle, sem `UiTooltip` na coluna — as dicas continuam na faixa "Arraste um cabeçalho de coluna para agrupar"), o cursor da coluna vira **mão apontando** (`cursor-pointer`, sem `cursor-grab`/mão aberta) e a seta de ordenação padrão ganha mais peso/contraste (`h-3`, `stroke-[2.5]`, sem `opacity-30`).
- **Documentação:** `docs/05 - Gestão de Auditoria.md` atualizado (§3.1, §5, §8, §11 e escopo) e `docs/01` §5.11 (tooltip da header).
- **Spec `auditoria`:** capability **nova** (ADDED) — a spec principal nunca foi criada (o archive da change anterior foi feito sem sync), então esta change a recria com os nove requisitos da página, com o requirement de exportação já no formato novo (CSV + download de PDF).

## Capabilities

### New Capabilities

- `auditoria`: comportamento completo da página de Gestão de Auditoria (rota/shell, navegação, KPIs, filtros em modal, tabela, detalhe, **exportação: CSV + download de PDF estruturado em paisagem**, fase 1 sem persistência, rodapé de retenção) — recriação da spec principal ausente, com o requirement de exportação atualizado para o download em PDF.

### Modified Capabilities

*(nenhuma — compartilhar o estado da logo de login não altera comportamento specado de `configuracoes-globais`; nenhum outro requisito muda.)*

## Impact

- **Dependências:** `package.json` + `package-lock.json` ganham `jspdf` e `jspdf-autotable` (aprovação do usuário).
- **Código:** novos `app/composables/useLogomarcaLogin.ts` e `app/components/auditoria/gerarPdfAuditoria.ts`; alterados `app/components/configuracoes/AbaLogomarcas.vue` (bloco do login → composable), `app/components/auditoria/Cabecalho.vue` (item do menu + handler; `window.print()` sai) e `app/components/ui/DataTable.vue` (tooltip da header via `UiTooltip` + ícone de ordenação com mais peso).
- **Specs:** delta `specs/auditoria/spec.md` (ADDED — cria a spec principal).
- **Docs:** `docs/05` (relatório PDF, menu, verificação).
- **Fora de escopo:** CSV (inalterado), kit de componentes, `configuracoes-globais`/specs de outros domínios, CSS `@media print` (continua existindo, só não é mais usado por esta tela).
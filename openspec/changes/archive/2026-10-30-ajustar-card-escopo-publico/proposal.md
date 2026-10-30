# Proposal

## Why

O card da chamada na página pública do Escopo mistura os metadados e deixa o parceiro no lado
direito, sem exibir a data efetiva de publicação. O título também é apenas texto solto, sem o
destaque visual que o restante da aplicação usa nos cabeçalhos de modal.

## What Changes

- Reorganizar o topo do card na ordem da esquerda para a direita: **número da chamada, parceiro,
  tipo, impacto e sistema**; o parceiro deixa de ficar no lado direito.
- Exibir no lado direito a **data efetiva de publicação** (`publicadoEm`), formatada em
  `dd/mm/aaaa`.
- Envolver o título em um container com o mesmo degradê do cabeçalho de modal
  (`from-brand-primary to-brand-structure`) e borda esquerda accent (`brand.accent`), com texto
  branco legível.
- Envolver a descrição em um container com borda verde (`brand.focus`) e a solução em um container
  com borda em `brand.structure`, ambos visualmente delimitados.
- Exibir o **título do manual** (`manualTitulo`) acima das ações e dar ao link **“Documentação
  Externa”** o tratamento de ação primária do design system; o link de vídeo permanece secundário.
- Alinhar as **tags à direita**, precedidas do rótulo **“Tags:”**.
- Destacar o card quando o **impacto for Crítico**: moldura rose com barra de 4px na borda
  esquerda, anel/sombra e badge
  `critico` com `AlertTriangle` e o texto “Impacto: Crítico”; os demais impactos permanecem
  neutros. O destaque não depende apenas de cor.
- Manter **todos** os chips de sistema da chamada; uma chamada com múltiplos softwares continua
  exibindo todos, sem perda de informação.
- Expor `manualTitulo` em `PublicoChamadaEscopo` e no item da lista pública; o `PublicoEscopoDetalhe`
  e `publicadoEm` permanecem inalterados.
- Atualizar a regra de degradê do design system (`brand-tokens`), `docs/01` §2.1/§3.6 e
  `AGENTS.md` para permitir o container do título como superfície com o degradê do cabeçalho de
  modal e a borda accent.
- Atualizar a vitrine `/design` (seção 30), `docs/19` e `docs/21`.
- Nenhuma migration, nenhuma alteração na sidebar, na navegação pública ou na paginação.

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `escopo-publico`: o card passa a exibir os metadados na ordem definida, a publicação do escopo no
  lado direito e o título em um container com degradê e borda accent.
- `design-system/brand-tokens`: o container do título dos cards da página pública de Escopo passa a
  ser uma superfície de degradê permitida, com a mesma receita do cabeçalho de modal e a borda
  esquerda accent.

## Impact

- **Shared:** `shared/publico.ts` (`PublicoChamadaEscopo.manualTitulo` e helper `varianteImpacto`).
- **Server:** `server/utils/publico.ts` (seleção de `manual_titulo` no item).
- **App:** `app/components/ui/Badge.vue` (variante `critico`),
  `app/pages/escopos/[id].vue` (prop `publicacao`),
  `app/components/publico/EscopoChamadaCard.vue` (novo topo, bloco direito, container do título,
  containers de descrição/solução, título do manual, botão primário, tags à direita e destaque
  crítico) e `app/pages/design.vue` (demo da seção 30 e badge `critico`).
- **Docs:** `docs/19`, `docs/21`, `docs/01` §2.1/§3.6/§5.2 e `AGENTS.md`.
- **Specs:** delta de `design-system/brand-tokens` para a nova superfície de degradê.
- **Testes:** `varianteImpacto` em `tests/publico-escopo.test.ts`; verificação manual do layout,
  do container do título e do destaque crítico.
- **Dependências:** nenhuma nova.

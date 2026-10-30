# Design

## Context

Ver `proposal.md` — Why. O card atual (`app/components/publico/EscopoChamadaCard.vue`) recebe
`PublicoChamadaEscopo` e monta o topo com código, tipo, impacto, softwares e parceiro à direita; o
título é um `h3` solto. `publicadoEm` já está em `PublicoEscopoDetalhe`, então não há mudança de API.
O cabeçalho de modal (`UiModal`) usa `bg-gradient-to-r from-brand-primary to-brand-structure`,
`border-l-[2.5px] border-l-brand-accent` e texto branco.

## Goals / Non-Goals

**Goals:**

- Reordenar os metadados do topo e levar a publicação para o lado direito.
- Dar ao título o container com o degradê do cabeçalho de modal e a borda esquerda accent.
- Manter todos os sistemas da chamada como chips.
- Manter a página responsiva e acessível, sem migration.

**Non-Goals:**

- Exibir período do escopo (o pedido atual é somente a data de publicação).
- Alterar o cabeçalho do escopo, a sidebar, a paginação ou a lista de chamadas.
- Expor `data_publicacao` editorial; a data pública é `publicadoEm`.
- Criar um seletor de sistema dentro do card.

## Decisions

### D1. Ordem e blocos do topo

O topo do card passa a ser um container `flex flex-wrap items-start justify-between gap-3`:

- **Esquerda:** `#chamada`, `Parceiro: {nome}`, badge de tipo (`UiBadge`), badge de impacto
  (`UiBadge neutral` + `Gauge`) e chips de sistema (todos os `softwares` da chamada).
- **Direita:** bloco `flex flex-col` com “Publicado em: {publicadoEm}”, usando `text-[11px]`,
  `text-slate-500` e valor em `font-medium`.
- No desktop o bloco da direita fica alinhado à direita (`sm:items-end`); no mobile ele ocupa a
  largura e fica alinhado à esquerda.
- O parceiro deixa de usar `sm:ml-auto` e passa a integrar o grupo da esquerda.
- O título do manual (`manualTitulo`) aparece no rodapé como **“Manual: {título}”**, acima das ações,
  quando existir.
- “Documentação Externa” usa o tratamento de ação primária (degradê `brand.primary` →
  `brand.structure`, texto branco); “Ver vídeo” permanece outline.
- As tags ficam alinhadas à direita, precedidas do rótulo **“Tags:”**, com os chips quebrando linha.
- Descrição, solução, evidências e rodapé permanecem na ordem atual. O rodapé “Liberada em” continua
  sendo a data da chamada; “Publicado em” é a data do escopo.

### D2. Container do título e blocos de conteúdo

O `h3` do título passa a ficar dentro de:

```html
<div
  class="mt-4 flex items-center rounded-lg border-l-[2.5px] border-l-brand-accent bg-gradient-to-r from-brand-primary to-brand-structure px-4 py-3"
>
  <h3 class="min-w-0 text-base font-bold leading-snug text-white">
    {{ chamada.titulo }}
  </h3>
</div>
```

- Reutiliza a receita do `UiModal`: `from-brand-primary to-brand-structure` e
  `border-l-[2.5px] border-l-brand-accent`.
- O container usa `rounded-lg` (o modal usa `rounded-t-xl` porque é o topo do painel); dentro do
  card, os quatro cantos arredondados preservam a leitura.
- O título em `text-white` sobre o degradê mantém contraste; títulos longos quebram linha.
- A descrição ganha `mt-3` depois do container e fica em
  `rounded-lg border border-brand-focus/40 bg-slate-50/50 p-3`; a solução fica em
  `rounded-lg border border-brand-structure/40 bg-slate-50/70 p-3`. As bordas usam tokens existentes
  (`brand.focus` e `brand.structure`), sem novo token; no tema escuro usam `/50`.
- O label “DESCRIÇÃO” continua em `text-slate-500`; o label “SOLUÇÃO” idem. A distinção visual vem
  das bordas e do fundo leve.
- A divisória entre as evidências e o rodapé (manual e ações) usa `border-t border-brand-accent`
  (`#4ed813`, o mesmo verde accent do container do título), com `dark:border-brand-accent/70`.

Como o container do título cria uma nova superfície com degradê, o change inclui o delta de
`design-system/brand-tokens` e atualiza `docs/01` §2.1/§3.6 e `AGENTS.md`.

### D3. Destaque do impacto crítico

- `critico = computed(() => props.chamada.impacto === 'Crítico')`.
- Card crítico: `border-rose-300 border-l-4 border-l-rose-700 shadow-md ring-1 ring-rose-700/20` no
  claro; no escuro, `dark:border-rose-800 dark:border-l-rose-400 dark:ring-rose-500/20`. A barra
  fica na **borda esquerda**, acompanhando os cantos superior e inferior do card com o `rounded-2xl`
  (sem faixa no topo). Os demais cards mantêm `border-slate-200`/hover atual.
- Impacto crítico usa uma nova variante `critico` no `UiBadge`: `bg-rose-50 border-rose-200
  text-rose-700`, ícone `AlertTriangle` e classes `dark:bg-rose-950/40 dark:border-rose-900
  dark:text-rose-300`; sem pulso. O slot mantém **“Impacto: Crítico”**. Os demais impactos seguem
  `variant="neutral"` + `Gauge`.
- `varianteImpacto(impacto)` em `shared/publico.ts` mapeia `Crítico` → `critico` e os demais →
  `neutral`, com teste em `tests/publico-escopo.test.ts`.
- `rose-700` já é o token documentado para **“Erro & Alerta — alertas críticos”**; não há token
  novo. A barra/anel são reforço visual; o texto e o ícone carregam a informação.
- Trade-off aceito: uma chamada `Correção` + `Crítico` exibirá dois badges rose (tipo e impacto).
  Se isso incomodar, a alternativa futura é manter o impacto neutro e deixar só a moldura/barra.

### D4. Publicação vem do escopo e é passada por prop

A página calcula:

```ts
const publicacao = computed(() =>
  escopo.value?.publicadoEm ? formatarData(escopo.value.publicadoEm) : ''
)
```

e passa `:publicacao="publicacao"` para cada card. O card recebe a string já formatada e mantém
`publicacao?: string` opcional; sem o prop, o bloco da direita não é renderizado. `PublicoChamadaEscopo`
ganha `manualTitulo`; a consulta da lista seleciona `e.manual_titulo` e mapeia o campo. O
`PublicoEscopoDetalhe`, a paginação e a navegação não mudam. `formatarData` extrai o prefixo
`AAAA-MM-DD` do timestamp, sem deslocamento de fuso.

### D5. Layout e acessibilidade

- O bloco da direita é texto visível, com o rótulo “Publicado em”; não depende de cor.
- O grupo da esquerda pode quebrar em mais de uma linha; o bloco da direita tem `shrink-0` no
  desktop e `w-full` no mobile.
- O card mantém `min-w-0` e os chips quebram linha; nenhuma largura entre 320px e 1440px pode gerar
  overflow horizontal.
- A ordem de leitura acompanha a ordem visual: código, parceiro, tipo, impacto, sistema, publicação.
- O `demo` do `/design` passa o mesmo prop para manter a vitrine fiel.

### D6. Documentação e verificação

- `docs/21`: anatomia do card, regras, container do título e checklist.
- `docs/01` §2.1/§3.6/§5.2 e `AGENTS.md`: registrar o container do título como superfície de
  degradê permitida e a variante de badge `critico`.
- `app/pages/design.vue`: a seção 30 passa `publicacao` ao card e a vitrine de badges exibe
  `critico`.
- Verificação manual: card com publicação, card sem o prop, múltiplos sistemas, 390px/1440px, tema
  escuro, container do título, containers de descrição/solução, título do manual, botão primário,
  tags à direita, card crítico/não crítico e `/design`.
- Gates: `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`.

## Risks / Trade-offs

- **Nova superfície de degradê** → O container do título reutiliza a receita do modal, mas é uma
  superfície nova. Mitigação: delta de `brand-tokens` e atualização de docs/01/AGENTS no mesmo
  change.
- **Título longo no container** → O `h3` usa `min-w-0` e quebra linha; validar com títulos longos.
- **Card mais largo no topo** → O grupo da esquerda usa `flex-wrap`; o bloco da direita desce no
  mobile.
- **Data de publicação ambígua** → A UI usa “Publicado em” e `publicadoEm`; o rodapé continua
  “Liberada em” para a chamada.
- **Prop opcional** → Sem `publicacao`, o bloco da direita não aparece; o card e a vitrine não
  quebram.

## Migration Plan

- Nenhuma migration.
- Deploy do código + docs/vitrine. Rollback: remover o container do título, o bloco da direita e o
  prop `publicacao`; nenhum dado é alterado.
- Compatibilidade: a lista paginada, a navegação, a sidebar e o DTO público permanecem iguais.

## Open Questions

Nenhuma pendente. A ordem, a data pública, o uso de todos os sistemas, o container do título e a
localização do bloco direito foram confirmados.

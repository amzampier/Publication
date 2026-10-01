# Design

## Context

A motivação está em `proposal.md` (Why). O que condiciona a abordagem:

- `app/assets/css/main.css` existe e contém as três regras mortas — `.ds-bottom-clip` (o `clip-path` do recorte), `@media print` e `.scrollbar-discreta` — mas nenhum arquivo a importa: `nuxt.config.ts` não declara `css`, e o `@nuxtjs/tailwindcss@6.14.0` tem `cssPath` default `join(dir.assets, "css/tailwind.css")`, caminho relativo da era Nuxt 3 que não existe em Nuxt 4 (`srcDir = app/`). O `resolveCSSPath` cai no `node_modules/tailwindcss/tailwind.css`.
- O mecanismo de destaque já está escrito e documentado (docs §2.2): overlay `border-2` com `-inset-[1px]` recortado por `.ds-bottom-clip`. Ele não está quebrado — apenas nunca teve efeito, porque a classe de CSS não existia.
- docs §4.4 proíbe hex divergente para estados compartilhados: *"derivar sempre dos tokens da seção 2"*.

## Goals / Non-Goals

**Goals:**
- Fazer a folha do projeto ser a folha servida, restaurando o recorte (e, de quebra, impressão e scrollbar).
- Verde de foco/abertura = `#1a9e07` via token, em todos os controles (Nível 1).
- Vermelho de validação = `rose-700` (`#be123c`) em `Input`, `Select` e `DatePicker`, com o `DatePicker` migrando de contorno total para recorte de base.
- Swatch e documentação passam a coincidir com a classe aplicada.

**Non-Goals:**
- `lime-500` em estados **ativos** (checkbox marcado, drag de `UploadFiles`/`DataTable`, filete do `Modal`, borda-l da linha expandida) e em elementos **decorativos** (ícones, dots, badges) permanecem — Nível 2 e 3, decididos como fora de escopo.
- Não refactorar o mecanismo de destaque (não migrar overlay → `focus-within:border-b-2`).
- Não alterar a mensagem de erro (segue no tooltip) nem a altura `h-[34px]` do gabarito.
- Não instalar linter, teste ou typecheck: a verificação continua sendo `npm run build` + inspeção visual.

## Decisions

**D1 — Restaurar via `tailwindcss.cssPath`, não via `css: []`.**
`nuxt.config.ts` ganha `tailwindcss: { cssPath: '~/assets/css/main.css' }`.
*Alternativas descartadas:* (a) `css: ['~/assets/css/main.css']` — o módulo continuaria injetando o fallback e as diretivas `@tailwind` ficariam duplicadas no bundle; (b) renomear `main.css` → `tailwind.css` — funciona sem config, mas quebra as referências de caminho em `docs/01` §2.2 e abandona um nome já estabelecido; (c) `cssPath: false` + `css: []` — depende de dois acoplamentos no lugar de um. O `resolvePath` do kit resolve alias `~` contra o `srcDir`, então o caminho existe e o módulo injeta a folha **no lugar** do fallback.

**D2 — Token `brand.focus` em vez de hex inline ou cor de primeiro nível.**
`tailwind.config.js` → `theme.extend.colors.brand.focus = '#1a9e07'`, gerando `border-brand-focus`, `ring-brand-focus/30`, `outline-brand-focus`.
*Alternativas descartadas:* (a) `border-[#1a9e07]` — viola docs §4.4 (nenhum hex divergente em estados compartilhados) e repetiria o hex em 16 pontos; (b) cor top-level `focus` — a mesma §4.4 manda derivar dos tokens da seção 2, que são os `brand.*`. O nome `focus` (e não `accent-dark`) espelha o título de docs §2.2, "Foco canônico verde `#1a9e07`".

**D3 — Escopo Nível 1 (foco/abertura).**
Só trocam as classes que descrevem foco visível, foco de campo, abertura de gatilho ou anel/contorno `focus-visible`. Verde em superfícies ativas e decorativas fica intocado, conforme decisão do usuário.

**D4 — Mecanismo de destaque preservado; `DatePicker` é a exceção.**
`Input` e `Select` continuam com overlay + `.ds-bottom-clip`. O `DatePicker`, que hoje usa `border-rose-400` na borda inteira, passa a espelhar o `Select`: classe `border-slate-200 border-b-rose-700 border-b-[1.5px]` no gatilho **mais** o overlay `.ds-bottom-clip` — a combinação é o que garante o arco inferior inteiramente vermelho, já que sem overlay o arco mistura a lateral de repouso com a base de erro.
*Alternativa descartada:* só `border-b-2 border-b-rose-700` no gatilho — mais simples, mas o canto arredondado passaria a exibir duas cores distintas no mesmo arco.

**D5 — `rose-700` como classe Tailwind pronta, sem token novo.**
A paleta de docs §2.1 já mapeia cores oficiais para classes Tailwind (`bg-rose-700`, `bg-emerald-700`…). Corrigir o hex documentado para `#be123c` resolve a inconsistência no ponto em que ela existe (a linha da paleta), em vez de criar um `brand.error` que nenhum outro ponto da paleta usa.

**D6 — Hover do ícone de erro: `rose-800`.**
Com a base em `rose-700`, o hover precisa escurecer, não clarear — `hover:text-rose-600` passaria a ser mais claro que o normal.

**D7 — Recorte calibrado para o raio.**
`.ds-bottom-clip` usa `inset(calc(100% - 9px) 0 0 0)` enquanto `rounded-lg` tem raio de 8px: a faixa visível começa 1px acima do início do arco e pode deixar um filete reto nas laterais. Se aparecer na inspeção visual, o valor vira `calc(100% - 8px)`, que começa exatamente no arco. Definido como verificação (tarefa dedicada), não como mudança automática.

## Risks / Trade-offs

- **Restaurar `main.css` tem alcance maior que o `Input`.** Qualquer regra da folha volta a valer de uma vez, inclusive `@media print` (`.fp-shell`) e `.scrollbar-discreta` global. → Mitigação: inspecionar impressão e `AppHeader` além da seção 5 do `/design` depois da troca.
- **`-inset-[1px]` + faixa de 9px pode deixar um filete de 1px no canto.** → Mitigação: D7, tarefa de verificação visual com ajuste pontual do `clip-path` se necessário.
- **Sem linter/teste, o risco de regressão é visual.** → Mitigação: `npm run build` como gate e percorrer os cards 1..6 da seção 5 (foco permanente, erro, ícones, mono) mais `Select`, `DatePicker` e checkbox.
- **Escopo deliberadamente incompleto.** A docs §5.12 descreve o filete do modal como `#1a9e07`, mas o código continua `lime-500` (Nível 2, fora de escopo). → Registrado aqui como divergência conhecida para não ser lida como regressão.

## Migration Plan

Sem migração de dados ou de contrato externo. Sequência: `nuxt.config.ts` → token → verde (16 pontos) → vermelho (9 pontos) → paleta/docs → verificação. Rollback = reverter a linha de `cssPath` (o resto da mudança é inóquo sem a folha carregada).

## Open Questions

Nenhuma. As decisões de escopo (Nível 1) e de cor (`#1a9e07`, `rose-700`/`#be123c`) foram tomadas com o usuário durante a exploração.

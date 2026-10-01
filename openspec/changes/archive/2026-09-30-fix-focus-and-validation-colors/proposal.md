# Proposal

## Why

O destaque de foco do `Input` (e de todos os controles) pinta a borda **nos quatro lados** em vez de apenas na borda inferior com os cantos arrendondados, porque `app/assets/css/main.css` **nunca é carregada**: o `@nuxtjs/tailwindcss` procura por padrão `assets/css/tailwind.css` (caminho da era Nuxt 3), esse arquivo não existe, e o módulo cai silenciosamente no `node_modules/tailwindcss/tailwind.css`. Sem a folha, a classe utilitária `.ds-bottom-clip` (o `clip-path` que recorta o overlay) não existe — provado pelo `<link>` servido em `localhost:3000` e pela ausência total de `ds-bottom-clip`, `@media print` e `scrollbar-discreta` no CSS do build. Em paralelo, o código usa `lime-500` (`#84cc16`) como verde de foco e `rose-500`/`rose-600`/`rose-400` como vermelho de erro, enquanto a fonte da verdade (docs §2.2, §4.4 e o texto da seção 5 do `/design`) declara `#1a9e07` como foco canônico e `bg-rose-700` como vermelho oficial de validação.

## What Changes

- **Restauração do carregamento de `main.css`**: `nuxt.config.ts` passa a declarar `tailwindcss.cssPath = '~/assets/css/main.css'`, fazendo o módulo injetar a folha do projeto no lugar do fallback (sem duplicar as diretivas `@tailwind`). É a condição para `.ds-bottom-clip` existir e o recorte voltar a valer — em dev **e** em build.
- **BREAKING (visual)** Novo token `brand.focus` = `#1a9e07` em `tailwind.config.js`; o verde de foco/abertura deixa de ser `lime-500` (`#84cc16`) nos 16 pontos de foco/abertura de controles: overlay do `Input`, `Select` (aberto, chevron e busca interna), `DatePicker` (aberto), anéis `focus-visible` de `Checkbox`, `CheckChip`, `CheckCard`, `UploadFiles`, `CameraWeb` e `AppHeader`, busca da `DataTable` e os 3 inputs de demonstração do `/design`.
- **BREAKING (visual)** Vermelho de validação unificado em `rose-700` (`#be123c`) em **todos os controles**: overlay, label e ícone de erro de `Input` e `Select`, e — única **mudança de forma** — o erro do `DatePicker`, que hoje pinta a borda inteira (`border-rose-400`) e passa a usar só a borda inferior com os cantos, espelhando o tratamento do `Select`.
- **Correção da paleta**: o par `hex #b91c1c` + classe `bg-rose-700` é inconsistente (`#b91c1c` é `red-700`; `rose-700` é `#be123c`). O hex documentado e exibido no swatch passa a `#be123c`.
- **Atualização de `docs/01 - design_system.md`**: §2.1 (hex do vermelho), §2.2 (as três bullets citam `border-lime-500`/`ring-lime-500`/`border-rose-500` como implementação), §5.3 Input, §5.7 Select, §5.8 DatePicker.
- **Efeito colateral corretivo**: voltam a valer os estilos de impressão (`@media print` + regras do `.fp-shell`) e o `.scrollbar-discreta` global, ambos mortos pela mesma causa.

## Capabilities

### New Capabilities
- `design-system/form-control-states`: forma e cor dos estados visuais dos controles de formulário — destaque de foco/abertura recortado na borda inferior e nos dois cantos arredondados inferiores, verde canônico `#1a9e07`, estado de erro com o mesmo recorte em `rose-700` e precedência sobre o foco, e a garantia de que a utilidade de recorte resolve na folha de estilo servida.

### Modified Capabilities
- `design-system/brand-tokens`: o requisito de exposição de tokens ganha `brand.focus` (`#1a9e07`) além dos quatro atuais; o requisito da paleta oficial passa a fixar o vermelho de erro/validação em `rose-700` = `#be123c`.

## Impact

**Arquivos alterados**

| Área | Arquivos |
| --- | --- |
| Carregamento do CSS (causa raiz) | `nuxt.config.ts` |
| Token do verde | `tailwind.config.js` |
| Verde Nível 1 — foco/abertura (16 pontos) | `Input.vue:78`, `Select.vue:258/301/349`, `DatePicker.vue:156`, `Checkbox.vue:152-153`, `CheckChip.vue:116`, `CheckCard.vue:112`, `UploadFiles.vue:121`, `CameraWeb.vue:219`, `DataTable.vue:526`, `layout/AppHeader.vue:98/136/207`, `design.vue:1267/1277/1286` |
| Vermelho de validação (todos os controles) | `Input.vue:60/84/124`, `Select.vue:256/309/322`, `DatePicker.vue:154` (forma) `/187`, `design.vue:950` |
| Paleta | `design.vue:164-165` (hex + `bgClass` do swatch) |
| Documentação | `docs/01 - design_system.md` §2.1 L81, §2.2 L97-99, §5.3 L275-276, §5.7 L411, §5.8 L441 |

**Riscos e observações**

- Restaurar `main.css` tem alcance maior que o `Input`: qualquer regra da folha volta a valer de uma vez. É intencional, mas a inspeção pós-mudança deve conferir também o `@media print` e o `AppHeader`.
- `DatePicker.vue:154` é a única troca de **forma** (borda inteira → só inferior); as demais são de cor ou já usam o recorte.
- Fora de escopo, por decisão: `lime-500` em estados **ativos** (checkbox marcado, drag de `UploadFiles`/`DataTable`, filete do `Modal`, borda-l da linha expandida) e em elementos **decorativos** (ícones, dots, badges). A docs §5.12 já descreve o filete do modal como `#1a9e07` — divergência que permanece registrada.
- Verificação limitada ao `npm run build` (único check real do repositório) e à inspeção visual da `/design` — não há lint, teste ou typecheck instalado.

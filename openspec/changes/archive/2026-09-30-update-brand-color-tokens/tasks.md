# Tasks

## 1. Tokens de marca no Tailwind

- [x] 1.1 Adicionar `colors.brand` em `tailwind.config.js` (`primary: '#112051'`, `structure: '#0364f7'`, `accent: '#4ed813'`, `primary-raised: '#1b2e6b'`) e verificar que a compilação passa a gerar regra para `.bg-brand-primary` contendo `rgb(17 32 81 …)` — hoje a busca por `brand` no CSS de saída é `0`.
- [x] 1.2 Verificar que as variantes de opacidade e estado também passam a existir: buscar no CSS gerado as classes `.bg-brand-structure\/10`, `.bg-brand-structure\/60` e `.hover\:bg-brand-primary-raised` e confirmar que nenhuma delas ficou sem regra. (`.active\:bg-brand-primary-sunk` foi removido do escopo junto com o token `brand.primary-sunk`, que ficou sem consumo — ver `design.md` D4.)

## 2. Degradê em botão primário e cabeçalho de modal

- [x] 2.1 Trocar a variante `primary` de `app/components/ui/Button.vue:37` para `bg-gradient-to-r from-brand-primary to-brand-structure hover:brightness-110 active:brightness-95 text-white shadow-xs` (removendo `bg-brand-primary`, `hover:bg-brand-primary-raised`, `active:bg-brand-primary-sunk`) e verificar que o botão primário renderiza degradê de `#112051` à esquerda a `#0364f7` à direita e que hover/active mantêm o degradê.
- [x] 2.2 Trocar o cabeçalho de `app/components/ui/Modal.vue:150` de `bg-brand-primary` para `bg-gradient-to-r from-brand-primary to-brand-structure`, preservando `border-l-[2.5px] border-l-lime-400` até a task 3.2, e verificar que o modal aberto exibe o degradê no cabeçalho.
- [x] 2.3 Verificar a exceção do degradê: buscar `bg-gradient` em `app/components/` e confirmar exatamente 2 ocorrências (`Button.vue` e `Modal.vue`), com cabeçalho da `DataTable`, tooltip, checkbox, calendário e menus dark permanecendo em cor sólida.

## 3. Migração do accent nos componentes

- [x] 3.1 Substituir os 7 usos de `lime-400` por `brand-accent` em `app/components/ui/DataTable.vue` (badges, indicadores de agrupamento, handle de resize) e verificar que a busca por `lime-400` nesse arquivo retorna `0`.
- [x] 3.2 Substituir os 8 usos de `lime-400` por `brand-accent` nos demais componentes — `AppHeader.vue` (2), `CameraWeb.vue` (2), `Checkbox.vue`, `CheckCard.vue`, `CheckChip.vue`, `Modal.vue` (filete) — deixando `lime-300/500/50/200` intactos, e verificar que a busca por `lime-400` em `app/components/` retorna `0`.
- [x] 3.3 Verificar que o filete do modal e os badges da grid agora exibem `#4ed813` (e não mais `#a3e635` do `lime-400`), conferindo o CSS gerado de `.border-brand-accent` / `.bg-brand-accent`.

## 4. Vitrine `/design` — seção 2 e demais menções

- [x] 4.1 Atualizar os 3 swatches de `app/pages/design.vue` (`colorSwatches`, linhas ~137–195): `hex`, `bgClass`, `buttonClass` e `tailwindClass` para `#112051`/`bg-brand-primary`, `#4ed813`/`bg-brand-accent`, `#0364f7`/`bg-brand-structure`, mantendo o título do swatch 7 "Azul Estrutural (Estrutura Dark)" (D8), e verificar que os cards da seção 2 exibem os novos hexes.
- [x] 4.2 Atualizar os textos e valores remanescentes de `design.vue` — linhas 569 e 662 (identidade corporativa), 1804 (`UiKpi cor="#00259c"`), 1878 (`style="background-color:#00259c;"` → `bg-brand-primary`) e 2056 (menção do header do modal) — e verificar que nenhum desses pontos cita mais o hex antigo.
- [x] 4.3 Substituir os 9 usos de `lime-400` em `design.vue` (incluindo o `tailwindClass` do swatch de accent) por `brand-accent`, preservando `lime-500/15`, `lime-500/10`, `lime-300` e demais acompanhantes, e verificar que a busca por `lime-400` em `design.vue` retorna `0`.
- [x] 4.4 Verificar que a busca por `#00259c|#087df9|#49de10|lime-400` em `app/pages/design.vue` retorna `0` ocorrências.

## 5. Hexes avulsos fora da vitrine

- [x] 5.1 Trocar `style="background-color: #00259c"` por `bg-brand-primary` no cabeçalho de `app/components/layout/AppHeader.vue:93` e verificar que o header do app mantém fundo sólido após a troca.
- [x] 5.2 Atualizar o comentário de `app/components/ui/DataTable.vue:593` para citar `#112051`.
- [x] 5.3 Verificar que a busca por `#00259c` em `app/` retorna `0` ocorrências.

## 6. Documentação (fonte da verdade)

- [x] 6.1 Atualizar `docs/01 - design_system.md` §2 — tabela das 8 cores oficiais (hexes novos, coluna Tailwind do accent para `bg-brand-accent`, hexes de raised/sunk na linha 78), a regra `brand.primary` da linha 89 e a regra de accent em chrome escuro da linha 91 com o contraste recalculado para `#4ed813`.
- [x] 6.2 Atualizar as demais menções de `docs/01` — linhas 44, 108, 115, 123, 199, 355, 451, 508, 571, 574, 605, 606 e 649 — para os novos hexes, para `bg-brand-accent` e para a regra de degradê no botão primário e no cabeçalho do modal.
- [x] 6.3 Verificar que a busca por `#00259c|#087df9|#49de10|lime-400` em `docs/01 - design_system.md` retorna `0` e que a tabela §2 bate com os valores de `tailwind.config.js`.

## 7. Verificação de integração

- [x] 7.1 Rodar a busca de regressão global — `#00259c|#087df9|#49de10|lime-400` em `app/` e `docs/01` → `0`; e `brand` no CSS gerado de `.output/` → maior que `0`.
- [x] 7.2 Executar `npm run build` e confirmar exit code `0`.
- [x] 7.3 Subir `npm run dev` e inspecionar `http://localhost:3000/design`: swatches da seção 2 com os hexes novos, botão primário e cabeçalho de modal com degradê, cabeçalho da `DataTable` e item ativo da sidebar em cor sólida, sem erros no console.
- [x] 7.4 Rodar `openspec validate --change update-brand-color-tokens --strict` e `openspec status --change update-brand-color-tokens` confirmando todos os artefatos e tasks prontos.

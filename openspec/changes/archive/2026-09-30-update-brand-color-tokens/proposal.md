# Proposal

## Why

O design system define e usa `bg-brand-primary`, `bg-brand-structure`, `bg-brand-primary-raised` e `bg-brand-primary-sunk` em 44 pontos de 12 arquivos, mas `tailwind.config.js` está com `theme.extend: {}` **vazio** — a busca por `brand` em todo o CSS gerado resulta em **0 ocorrências**. Como resultado, o botão primário, o header do modal, a linha de cabeçalho da `DataTable`, o item ativo da sidebar, tooltip, checkbox e chips renderizam **sem cor de fundo**. Ao mesmo tempo, a paleta oficial precisa de sua primeira atualização visual e ganha uma regra nova de degradê.

## What Changes

- **Criação dos tokens `brand.*`** em `tailwind.config.js` (`brand.primary` `#112051`, `brand.structure` `#0364f7`, `brand.accent` `#4ed813`, `brand.primary-raised`) — é a condição para qualquer cor aparecer; hoje as classes não geram CSS.
- **BREAKING (visual)** Troca das três cores oficiais em componentes, vitrine e documentação: `#00259c` → `#112051`, `#087df9` → `#0364f7`, `#49de10` → `#4ed813`.
- **Regra nova de degradê**: botão primário (`Button.vue`) e header de modal (`Modal.vue`) passam a `bg-gradient-to-r from-brand-primary to-brand-structure` (esquerda `#112051` → direita `#0364f7`). Demais usos de `brand.primary` (DataTable, tooltip, checkbox, calendário, menus) permanecem **sólidos**.
- **Hover/active do botão primário** migra de `hover:bg-brand-primary-raised` / `active:bg-brand-primary-sunk` para `hover:brightness-110` / `active:brightness-95` sobre o degradê (sem derivar novos hexes de estado).
- **Migração do accent**: os 24 usos de `lime-400` (que renderiza `#a3e635`, nunca o `#49de10` divulgado) viram `bg-brand-accent` / `text-brand-accent` / `border-brand-accent`, em 8 arquivos — o que a seção 2 exibe passa a ser o que o app renderiza.
- **Remoção de hex inline**: `AppHeader.vue:93` e `design.vue:1878` deixam de usar `style="background-color:#00259c"` e passam para a classe tokenizada.
- **Atualização da vitrine `/design` seção 2**: swatches (`hex`, `bgClass`, `tailwindClass`), textos de identidade e demais menções aos hexes antigos.
- **Atualização de `docs/01 - design_system.md`**: tabela §2 (8 cores), regra de accent em chrome escuro com contraste recalculado para `#4ed813`, e as seções que citam os hexes antigos.

## Capabilities

### New Capabilities
- `design-system/brand-tokens`: cores oficiais da marca, tokens Tailwind correspondentes, quais superfícies receem cor sólida × degradê, estados de interação do botão primário, e o papel do accent sobre chrome escuro versus superfície clara.

### Modified Capabilities
<!-- Nenhuma: o projeto ainda não possui specs (`openspec list --specs` retorna vazio). -->

## Impact

**Arquivos alterados**

| Área | Arquivos |
| --- | --- |
| Tokens (origem das cores) | `tailwind.config.js` |
| Degradê + accent | `app/components/ui/Button.vue`, `app/components/ui/Modal.vue` |
| Migração `lime-400` → `brand-accent` (24 usos) | `DataTable.vue` (7), `app/pages/design.vue` (9), `AppHeader.vue` (2), `CameraWeb.vue` (2), `Checkbox.vue`, `CheckCard.vue`, `CheckChip.vue`, `Modal.vue` |
| Hex inline | `app/components/layout/AppHeader.vue:93`, `app/pages/design.vue:1878` |
| Menções a hexes | `app/pages/design.vue` (137, 147, 191, 569, 662, 1804, 2056), `app/components/ui/DataTable.vue:593` (comentário) |
| Documentação | `docs/01 - design_system.md` (9× `#00259c`, 4× `#49de10`, 2× `#087df9`, 6× `lime-400`) |

**Riscos e observações**

- Sem os tokens, o app hoje é *visivelmente quebrado* nessas superfícies — a mudança **corrigirá** isso de forma visível, não apenas trocará matizes.
- `brand-accent` passa a valer também em superfícies claras onde `lime-400` era usado (borda do `CheckCard`, hover do `Checkbox`, botões da `CameraWeb`, handle de resize da grid): `#4ed813` mantém contraste baixo sobre branco; os acompanhantes `lime-300/500/50/200` (hover e fundos) **não** são alterados nesta change.
- `brand.primary-raised` (`#1b2e6b`) permanece porque `CheckChip.vue:95` e `design.vue:532,1036,1297` o usam como fundo/hover fora do botão. `brand.primary-sunk` (`#0a1539`) foi **removido** durante a implementação: sua única referência era o `active:` do botão que migrou para filtro de brilho, e sem consumo o JIT não gera a classe (decisão registrada em `design.md` D4).
- Fora de escopo: pendências da fase shell (`navigation.ts` FinancePro, warning `NUXT_E4007`), acessibilidade e testes automatizados.

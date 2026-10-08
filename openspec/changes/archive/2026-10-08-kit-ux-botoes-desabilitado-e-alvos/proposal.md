# Proposal

## Why

A auditoria QA-ux deixou 4 achados baixos ainda abertos: **M-06** (`UiButton` outline é 2px
mais alto que o primary no mesmo `size` — Cancelar 34px × Salvar 32px), **M-07** (o estado
desabilitado dos controles não tem nenhum requisito em spec — `docs/01` já documenta o padrão
`slate-200`, mas `form-control-states` está mudo sobre ele), **M-08** (ações de linha em
18×18px, apertado para toque apesar da exceção WCAG 2.5.8) e **M-09** (o inventário do kit em
`docs/qa/05-qa-ux.md` lista 19 componentes e o diretório tem **25**).

## What Changes

- **M-06 — alturas uniformes do `UiButton`:** os `size` passam a altura fixa `h-7`/`h-8`/`h-10`
  (28/32/40px) no lugar do padding vertical, com a borda contida no box — as variantes
  `outline`/`danger`/`accent` (**-2px**) igualam o `primary` (**inalterado**) em todos os
  tamanhos. `docs/01` §5.1 ganha a nota de altura uniforme.
- **M-07 — spec do estado desabilitado:** novo requisito em
  `design-system/form-control-states` documentando o comportamento **já implementado** nos 5
  controles (`Input`, `Textarea`, `Select`, `DatePicker`, `Segmented`): fundo `slate-200`
  atenuado (`opacity-60`), `cursor-not-allowed`, **sem** hover nem foco (gatilho não focável) e
  seleção do `Segmented` em pílula branca legível. Sem mudança de código (já conforme).
- **M-08 — alvos de ação maiores:** botões de linha de `p-0.5` (18px) para `p-1.5` (**26px**,
  passa WCAG 2.5.8 sem exceção) em `perfis/Tabela.vue` **e** `usuarios/Tabela.vue` — este
  último tem o idêntico padrão com 4 botões; corrigir só um deixaria as duas listagens
  divergentes (escopo extra sinalizado aqui).
- **M-09 — inventário do doc de QA:** `docs/qa/05-qa-ux.md` §"Padrões conhecidos" atualizado
  de 19 para os **25** componentes reais (`UiChoiceCard`, `UiLoading`, `UiSegmented`,
  `UiSlider`, `UiTabs`, `UiTextarea` entram).

**Não entra:** MEL-01…MEL-04 do `RL01` · M-05 (badge pulsing = MEL-02, fila separada) ·
modal de permissões · backend.

## Capabilities

### New Capabilities

<!-- nenhuma -->

### Modified Capabilities

- `design-system/form-control-states`: **ADDED** — "Controles desabilitados mostram-se somente
  leitura de forma inequívoca" (fundo `slate-200` + `opacity-60` + `cursor-not-allowed` nos 5
  controles; sem hover/foco; seleção do `Segmented` legível; habilitados inalterados).

## Impact

- **Código:** `app/components/ui/Button.vue` (classes de `size`), `app/components/perfis/
  Tabela.vue` e `app/components/usuarios/Tabela.vue` (padding dos alvos de ação).
- **Docs:** `docs/01` §5.1 (altura uniforme), `docs/qa/05-qa-ux.md` (inventário 25).
- **Specs:** delta ADDED em `design-system/form-control-states`.
- **Sem** mudanças de API/server/deps; verificação = `npm run build` +
  `openspec validate --strict` + conferência visual (rodapé de modal com botões iguais,
  alvos maiores sem estourar a coluna Ações, vitrine seção 3).
- **Risco a conferir:** a coluna Ações (`w-20` preferido) expande com alvos maiores — validar
  que a tabela de perfis continua **sem rolagem horizontal a 1280px** (requisito da spec).

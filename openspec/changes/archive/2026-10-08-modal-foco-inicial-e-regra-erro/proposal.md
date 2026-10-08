# Proposal

## Why

A auditoria QA-ux (M-01 e M-04) apontou dois problemas de contrato no kit: o foco inicial do
`UiModal` cai no botão `X` do header (o primeiro `Enter` fecha o diálogo — péssimo para
formulários), e a spec `design-system/form-control-states` está **defasada** quanto à regra de
erro: ela exige "mensagem visível persistente abaixo do campo", enquanto a regra vigente —
implementada em todos os controles e documentada no `docs/01` §5.3 — é **ícone `AlertCircle`
rose-700 à direita DENTRO do componente + mensagem em tooltip no hover**, com a mensagem no
DOM (`sr-only`, `role="alert"`, `aria-describedby`) para leitores de tela.

## What Changes

- **`UiModal`: foco inicial no primeiro controle do corpo** (M-01) — ao abrir, o foco vai ao
  primeiro elemento focável **fora do header** (ex.: campo Nome de um formulário; `Cancelar` em
  diálogo de confirmação), com fallback para o `X` quando o corpo não tem focáveis. A armadilha
  Tab/Shift+Tab, `Escape`, o `X`, a devolução de foco ao gatilho e o empilhamento **não mudam** —
  o `X` segue alcançável por teclado (Shift+Tab a partir do primeiro campo).
- **Spec de erro alinhada à regra ícone+tooltip** (M-04) — sem mudança de código: os 5 controles
  (`Input`, `Textarea`, `Select`, `DatePicker`, `Segmented`) já implementam ícone+tooltip+`sr-only`
  e o `docs/01` §5.3 já documenta essa regra. Ajuste é **spec-only**:
  - `design-system/form-control-states`: requisito da mensagem de erro reescrito (regra
    ícone+tooltip+região viva; família inclui `Textarea` e `Segmented`) e cenário "A mensagem
    de erro continua no tooltip" sem a cláusula "texto persistente abaixo do campo".
  - `design-system/textarea`: cenários "O foco e o erro seguem a família" e "Erro anunciável
    sem mouse" passam a descrever ícone+tooltip+`sr-only`.
  - `gestao-usuarios`: statement do requisito de validação troca "mensagem de erro … abaixo do
    campo" pela regra ícone+tooltip (contradição com o comportamento implementado).
- **M-02 (correção visual correlata, docs-driven):** filete do rodapé do modal de `lime-500`
  (`#84cc16`) para `brand-focus` (`#1a9e07`), conforme `docs/01` §5.12.
- **M-03 (correção visual correlata, docs-driven):** label com erro dentro do modal passa a
  manter o peso fraco (`font-weight: 300`) do `.fp-modal-body`, preservando só a cor
  `rose-700` — hoje o erro escapa do seletor e volta ao `font-bold` (`docs/01` §5.12).

**Não entra:** mensagem de erro visível abaixo do campo (regra descartada pelo usuário — a
vigente é ícone+tooltip) · mudanças em `Input`/`Textarea`/`Select`/`DatePicker`/`Segmented`
(já conformes) · demais melhorias da QA-ux (M-05…M-09, fila separada).

## Capabilities

### New Capabilities

<!-- nenhuma -->

### Modified Capabilities

- `design-system/modais`: **ADDED** — "O modal entrega o foco inicial ao primeiro controle do
  corpo" (formulário → 1º campo; confirmação → ação segura do rodapé; sem focáveis no corpo →
  `X`; Shift+Tab do 1º campo chega ao `X`).
- `design-system/form-control-states`: **MODIFIED** — requisito "A mensagem de erro é
  persistente, anunciável e acessível sem mouse" reescrito como "O erro é exibido por ícone com
  tooltip e anunciado como região viva" (regra ícone+tooltip+`sr-only`, família com
  `Segmented`); cenário "A mensagem de erro continua no tooltip" remove a cláusula de texto
  abaixo do campo.
- `design-system/textarea`: **MODIFIED** — cenários "O foco e o erro seguem a família" e
  "Erro anunciável sem mouse" descrevem ícone+tooltip+`sr-only`.
- `gestao-usuarios`: **MODIFIED** — requisito "O formulário de usuário valida antes de gravar"
  troca "mensagem de erro persistente abaixo do campo" pela regra ícone+tooltip+região viva.

## Impact

- **Código:** `app/components/ui/Modal.vue` (foco inicial via `data-modal-header`, filete do
  footer, estilo escopo de labels) — único arquivo de código alterado.
- **Docs:** `docs/01 - design_system.md` §5.12 (foco inicial na linha 738; pesos de label na
  linha 742). Nada em §5.3 (já documenta ícone+tooltip).
- **Specs:** deltas nas 4 capabilities acima; sync em `openspec/specs/` no archive.
- **Sem** mudanças de API/server/deps; verificação = `npm run build` +
  `openspec validate --strict` + conferência visual (foco nos modais, filete `#1a9e07`, label
  de erro leve, ícone+tooltip nos 5 controles).

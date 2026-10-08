# Design

## Context

Ver `proposal.md` — Why. Estado atual relevante:

- `ui/Modal.vue` foca, ao abrir, `getFocusable().at(0)` — que é sempre o `X` do header
  (primeiro no DOM). A armadilha (`getFocusable`/`handleKeydown`) inclui o `X` e funciona bem.
- O estilo escopo `.fp-modal-body :deep(label:not([class*='text-rose']))` aplica
  `font-weight: 300` apenas a labels **sem** erro — label em erro cai no `font-bold` do
  `Input`.
- O filete do footer é `border-lime-500` (`#84cc16`); `docs/01:743` manda `#1a9e07`.
- Regra de erro já implementada e documentada: 5/5 controles (`Input`, `Textarea`, `Select`,
  `DatePicker`, `Segmented`) têm `AlertCircle` + `<Tooltip :content="error">` à direita
  **dentro** do controle + `<p role="alert" aria-describedby>` `sr-only`. `docs/01` §5.3 e
  `docs/07` §4 já descrevem isso; **só as specs** (form-control-states, textarea,
  gestao-usuarios) ainda exigem "texto visível abaixo do campo".

## Goals / Non-Goals

**Goals:**
- Foco inicial do `UiModal` no primeiro controle do corpo, sem tocar na armadilha, no
  empilhamento nem na devolução de foco.
- Specs de erro alinhadas à regra ícone+tooltip (zero código — já conforme).
- Filete do footer e peso de label em erro conforme `docs/01` (já documentado).

**Non-Goals:**
- Texto de erro visível abaixo do campo (regra descartada pelo usuário).
- Alterar qualquer template de `Input`/`Textarea`/`Select`/`DatePicker`/`Segmented`.
- Melhorias M-05…M-09 da QA-ux (fila separada) e foco inicial configurável por prop.

## Decisions

1. **Foco inicial: marcador `data-modal-header` + `find` fora do header.** No `watch` de
   abertura, o alvo passa a ser o primeiro focável **que não está dentro do header**; se não
   houver, `nodes.at(0)` (o `X`, fallback = comportamento atual); se não houver focável
   algum, `panelRef.focus()`. Alternativas descartadas: **prop `initialFocus`** (cada chamador
   teria que optar — o default errado persistiria na maioria dos modais); **focar o painel
   primeiro** (com `tabindex="-1"` o `Shift+Tab` sairia da armadilha — furo de a11y);
   **query posicional por CSS** (frágil ante reordenação do template).
   **A armadilha não muda**: `getFocusable` e `handleKeydown` continuam incluindo o `X`, então
   `Shift+Tab` do primeiro campo chega ao `X` naturalmente (o `X` segue teclável).

2. **M-04 = delta spec only, headers preservados.** Requisitos de erro são **MODIFIED** com o
   mesmo header (sem REMOVED+ADDED, para o sync casar por nome e não gerar churn). O cenário
   "Acessível apenas com teclado" é **removido** (sob a regra ícone+tooltip ele é falso: quem
   só usa teclado não lê o tooltip) e "Padrão idêntico nos três controles" vira "cinco
   controles" (inclui `Segmented`). `gestao-usuarios` muda só o statement; os 4 cenários
   ("erro persistente" genérico) ficam intactos. Motivo de não tocar código: verificado por
   grep/leitura que os 5 controles já cumprem a regra.

3. **M-02: `border-lime-500` → `border-brand-focus`** (1 classe, `Modal.vue:203`).
   `brand-focus` = `#1a9e07` é o token que o `docs/01:743` nomeia; alternativa
   `brand-accent` (`#4ed813`) descartada — o docs cita explicitamente `#1a9e07`.

4. **M-03: split do estilo escopo em duas regras** (sem `!important`):
   ```css
   .fp-modal-body :deep(label) { font-weight: 300; }
   .fp-modal-body :deep(label:not([class*='text-rose'])) { color: #64748b; }
   ```
   Especificidade (classe + atributo do `:deep` + elemento) vence as utilities
   `font-bold`/`font-semibold` do Tailwind (mesma técnica que já funciona hoje para o label
   comum). Label de erro fica `300` + `rose-700` (a cor vem da utility do próprio componente).
   Alternativa descartada: trocar `font-bold` no `Input` — mudaria labels **fora** de modal.

5. **Arquivo único de código:** tudo em `ui/Modal.vue` (header attr, foco, filete, estilo) —
   os demais controles intocados; docs só `docs/01` (§5.12 linhas 738 e 742).

## Risks / Trade-offs

- [Modal de confirmação agora foca `Cancelar` em vez do `X`] → Deliberado (default seguro);
  cenário coberto pela spec nova; conferir em exclusão de perfil/usuário.
- [Tooltip de erro é hover-only — em toque a mensagem só chega pelo leitor de tela] →
  Decisão explícita do usuário (regra do kit = ícone+tooltip); `sr-only role="alert"` cobre
  AT; registrado no cenário "Mensagem existe no DOM sem hover".
- [Foco inicial pode pousar em controle inesperado se o corpo ganhar um focável antes do
  formulário (ex.: busca interna)] → Regra "primeiro focável do corpo" é determinística e
  documentada; se um dia precisar de alvo explícito, aí sim entra prop.
- [`:deep(label)` vence utilities — se o Tailwind mudar a ordem de cascata das utilities não
  muda a especificidade] → Regra CSS convencional, mesmo mecanismo já validado hoje;
  conferir na vitrine (seção 15) e no modal de perfis com erro.
- [Arquivo único concentra 4 mudanças] → Cada uma é autocontida (attr/1 linha/2 regras/1
  classe); rollback por hunk se necessário.

## Migration Plan

Sem migração: frontend puro, sem server/API/deps. Rollback = reverter `ui/Modal.vue` e
`docs/01` (specs voltam pelo delta da change, que ainda não está syncada).

## Open Questions

<!-- nenhuma — foco inicial, regra de erro, filete e label foram decididos com o usuário -->

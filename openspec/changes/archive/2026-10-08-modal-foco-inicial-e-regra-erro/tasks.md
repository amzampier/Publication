# Tasks

## 1. `UiModal` — foco inicial, filete e label em erro

- [x] 1.1 M-01: em `app/components/ui/Modal.vue`, adicionar `data-modal-header` no div do
      header e trocar o foco inicial do `watch` de abertura para o primeiro focável **fora do
      header** (`find(el => !el.closest('[data-modal-header]')) ?? nodes.at(0)`), mantendo o
      fallback `panelRef.focus()` — **verificar:** `npm run build` e comportamento observado:
      abrir "Novo Perfil" (foco em Nome; 1º `Enter` **não** fecha), abrir Excluir (foco em
      "Cancelar"), `Shift+Tab` do 1º campo chega ao `X`, modal de texto puro foca o `X`
- [x] 1.2 M-02: em `app/components/ui/Modal.vue` (footer), trocar `border-lime-500` por
      `border-brand-focus` — **verificar:** `npm run build` e o filete do rodapé de qualquer
      modal com footer renderiza em `#1a9e07` (devtools: `borderTopColor rgb(26,158,7)`)
- [x] 1.3 M-03: no estilo escopo de `app/components/ui/Modal.vue`, separar em duas regras —
      `label` → só `font-weight: 300`; `label:not([class*='text-rose'])` → só
      `color: #64748b` — **verificar:** `npm run build` e, no modal de perfis com erro no
      Nome, o label fica **peso 300 + `rose-700`** (antes 700); label sem erro 300; labels
      de inputs **fora** de modal continuam `font-bold`
- [x] 1.4 M-01/M-03 docs: atualizar `docs/01 - design_system.md` §5.12 — linha 738 (foco
      inicial no primeiro controle do corpo; `X` pulado só no foco inicial e alcançável por
      `Shift+Tab`) e linha 742 (peso fraco **também em erro**, preservando só a cor
      `rose-700`) — **verificar:** os dois trechos refletem o comportamento medido em 1.1/1.3

## 2. Verificação final (integração)

- [x] 2.1 `npm run build` completa sem erros — **verificar:** exit code 0
- [x] 2.2 `openspec validate "modal-foco-inicial-e-regra-erro" --strict` passa —
      **verificar:** exit code 0 sem erros
- [x] 2.3 Conferência visual em `http://localhost:3000`: `/design` seção 15 (filete `#1a9e07`,
      foco inicial, labels) e seções 5/9/10/19 (ícone `AlertCircle` + tooltip em erro nos 5
      controles, sem texto abaixo); `/admin/perfis-acesso` (Novo foca Nome, Excluir foca
      Cancelar, label de erro leve); regressão modal de usuários + câmera empilhada (Tab
      preso, `Escape` só no topo, foco devolvido) — **verificar:** checklist executado sem
      divergência das specs; QA completa fica para depois (decisão do usuário)

# Tasks

## 1. Código e docs (M-06, M-08, M-09)

- [x] 1.1 M-06: em `app/components/ui/Button.vue`, trocar as classes de `size` por altura
      fixa — `sm`: `h-7 px-2.5 text-[11px] gap-1.5`, `md`: `h-8 px-3.5 text-xs gap-2`,
      `lg`: `h-10 px-5 text-sm gap-2.5` (remover `py-*`) — **verificar:** `npm run build` e,
      na vitrine seção 3 e no rodapé de um modal, "Cancelar" (outline) e "Salvar" (primary)
      medem a **mesma altura** (32px em `md`), `primary` inalterado, variantes `sm`/`lg` sem
      corte de texto
- [x] 1.2 M-06 docs: em `docs/01 - design_system.md` §5.1, documentar a altura uniforme por
      `size` (sm `h-7`/28px · md `h-8`/32px · lg `h-10`/40px, borda contida no box) —
      **verificar:** o texto reflete a medição da task 1.1
- [x] 1.3 M-08: em `app/components/perfis/Tabela.vue` **e**
      `app/components/usuarios/Tabela.vue`, trocar `p-0.5` → `p-1.5` nos botões de ação de
      linha (ícone `h-3.5` permanece; alvo 18px → **26px**) — **verificar:** `npm run build`
      e alvos medem ≥24px; a coluna Ações expande sem cortar botões e a tabela de perfis
      segue **sem rolagem horizontal a 1280px**
- [x] 1.4 M-09: em `docs/qa/05-qa-ux.md` §"Padrões conhecidos", atualizar o inventário do
      kit de 19 para os **25** componentes reais (adicionar `UiChoiceCard`, `UiLoading`,
      `UiSegmented`, `UiSlider`, `UiTabs`, `UiTextarea`) — **verificar:** a lista bate com
      `app/components/ui/*.vue` (25 arquivos)

## 2. Verificação final (integração)

- [x] 2.1 `npm run build` completa sem erros — **verificar:** exit code 0
- [x] 2.2 `openspec validate "kit-ux-botoes-desabilitado-e-alvos" --strict` passa —
      **verificar:** exit code 0 sem erros
- [x] 2.3 Conferência visual em `http://localhost:3000`: `/design` seção 3 (botões de todos
      os sizes/variantes sem corte), modal de perfis (Cancelar = Salvar em altura), listagens
      de perfis e usuários (alvos maiores, coluna Ações íntegra, **sem rolagem horizontal a
      1280px** em perfis) e regressão dos 5 controles desabilitados (vitrine seções 5/9/10) —
      **verificar:** checklist executado sem divergência das specs

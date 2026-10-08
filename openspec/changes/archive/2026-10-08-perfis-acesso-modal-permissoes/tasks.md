# Tasks

## 1. Kit: componente UiSwitch

- [x] 1.1 Criar `app/components/ui/Switch.vue` (`UiSwitch`): `v-model` binário (botão
      `role="switch"` + `aria-checked`), `label` opcional associada (clique alterna),
      `disabled` (nativo + fora do Tab), trilha `w-9 h-5` (`slate-300` desligada →
      `brand-focus #1a9e07` ligada) com knob branco deslizante e foco `brand-focus` —
      **verificar:** `npm run build` e o componente renderiza/alterna (clique, Space/Enter,
      clique no label) sem erro de auto-import
- [x] 1.2 Documentar o componente: nova seção **§5.19 UiSwitch** em
      `docs/01 - design_system.md` (+ entrada no Sumário) e nova seção **20. Switch
      (UiSwitch)** em `app/pages/design.vue` espelhando o componente real (ligado,
      desligado, desabilitado) — **verificar:** `http://localhost:3000/design` renderiza a
      seção 20 com os estados iguais aos do componente

## 2. Modal de permissões e orquestração

- [x] 2.1 Em `app/components/perfis/usePerfisDemo.ts`, adicionar
      `salvarPermissoes(base, id, permissoes): { base }` (puro, clone do perfil com a matriz
      nova — mesmo contrato de `salvarPerfil`) — **verificar:** `npm run build` e a
      contagem/`computed` deriva da nova matriz após a gravação
- [x] 2.2 Criar `app/components/perfis/Permissoes.vue` (`<PerfisPermissoes>`): `UiModal
      size="xl"` com nome do perfil + contador "n/99" global, **abas `UiTabs` pelas 4
      sessões** da sidebar, tabela-cartão de módulos (nome + descrição) × **4 ações fixas**
      em `UiSwitch` por célula + coluna **Funcionalidades** com **chips `UiCheckChip`
      clicáveis** (**sem atalhos de lote**), ícone/cor da fonte única (`config/navigation`),
      1ª coluna fixa no scroll, rascunho copiado na abertura, rodapé Cancelar/Salvar
      (Salvar → `salvarPermissoes` + `toast.success` + fecha; Cancelar/Escape/X descartam)
      — **verificar:** `npm run build` e os fluxos (abrir, trocar aba, alternar célula e
      chip, contador, salvar recalcula, descartar intacta) funcionam ao montar na página
- [x] 2.3 Orquestrar em `app/pages/admin/perfis-acesso.vue`: `@permissoes` chama
      `abrirPermissoes(perfil)` (resolve registro por `id`) e monta `<PerfisPermissoes>`,
      removendo `avisoPermissoesPendentes` (toast de transição) — **verificar:**
      comportamento observado: `KeyRound` abre o modal **sem** toast; salvar muda a
      contagem da linha e os KPIs (ex.: 171/396 muda); Cancelar/Escape mantêm; recarga
      restaura a matriz semeada; Admin editável
- [x] 2.4 Sincronizar `docs/07 - Perfis de Acesso (RBAC).md`: §1, §2 (+`Permissoes`), §3.7
      nova (o modal), §4 (`UiSwitch` no kit), §5 (Permissões abre modal — sem transição),
      §11 (deltas das 2 capabilities), §12 (checklist), §13 (remove "modal de permissões" e
      "componente toggle" das pendências) — **verificar:** seções existem e §13 não lista
      mais essas duas pendências

## 3. Verificação final (integração)

- [x] 3.1 `npm run build` completa sem erros — **verificar:** exit code 0
- [x] 3.2 `openspec validate "perfis-acesso-modal-permissoes" --strict` passa —
      **verificar:** exit code 0 sem erros
- [x] 3.3 Conferência visual em `http://localhost:3000`: `/design` seção 20 (UiSwitch),
      `/admin/perfis-acesso` (KeyRound abre modal com abas por sessão, matriz módulos × 4
      ações fixas + chips de Funcionalidades, contador; célula/chip; Salvar recalcula
      linha+KPIs com toast; Cancelar/Escape/X descartam; Admin editável; perfil novo 0/99
      configurável; 375px com rolagem interna da tabela;
      regressão dos modais de cadastro e exclusão) — **verificar:** checklist sem
      divergência das specs; QA completa só depois do OK do usuário

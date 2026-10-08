# Proposal

## Why

"Configurar permissões" (`KeyRound`) é a **única ação em transição** da tela de perfis —
exibe toast de "próxima etapa" — e a spec atual manda "nenhum `UiModal`" para esse controle
(passo 2). Sem ele o ciclo do RBAC está incompleto: cadastrar perfil → **configurar
permissões** → atribuir ao usuário. A matriz normativa da `docs/07` §7 (11 módulos × 9
ações = 99 por perfil) existe como documentação mas não é editável em lugar nenhum, e o kit
ainda não tem componente de interruptor (pendência registrada no `docs/07` §13).

## What Changes

- **Novo componente de kit `UiSwitch`** (`app/components/ui/Switch.vue`): interruptor
  binário com `v-model`, `label` opcional e `disabled`, `role="switch"` + `aria-checked`,
  foco `brand-focus`, estado ligado em verde canônico `#1a9e07` (sem novo `lime-*`). Entra
  pelas três portas da regra do repo: spec `design-system/switch` (capability nova), seção
  **§5.19** do `docs/01` e **seção 20** da vitrine `/design`.
- **Modal de permissões** (`perfis/Permissoes.vue`): `UiModal size="xl"` com os 11 módulos
  (nome + descrição) repartidos em **abas `UiTabs` pelas 4 sessões da sidebar** e
  tabela-cartão **módulos × as 4 ações fixas** (`visualizar`, `criar`, `alterar`,
  `excluir`) — um **`UiSwitch` por célula** — e coluna **Funcionalidades** com os 5
  **chips clicáveis** (`UiCheckChip`) das ações extras, **sem atalhos de seleção em lote**.
  Contador **"n/99" global** (independente da aba); **Salvar** grava em memória (matriz
  clonada) → coluna **Permissões** e KPIs recalculam + toast; **Cancelar/Escape/X**
  descartam; recarga restaura a matriz semeada. Sem toolbar de filtros (busca/segmentado
  ficam para a arquitetura futura da tela). Perfil **Administrador editável como os demais**
  (decisão do usuário) e perfil novo (0/99) pode ter a matriz preenchida.
- **`KeyRound` abre o modal**: o requisito "A ação de permissões avisa por toast e não abre
  modal" sai (REMOVED) e é substituído por "A ação de permissões abre o modal de
  configuração" (ADDED).
- **KPIs e contagens** acompanham: MODIFIED nos dois requisitos existentes — cenário de
  recálculo passa a incluir "edição de permissões" e novo cenário de que a coluna
  **Permissões** reflete a soma da matriz salva (continua derivada, nunca digitada).

**Não entra:** filtros e exportação da listagem (change 2 do bloco B) · backend/`server/` ·
atribuição de perfis a usuários (dropdown de `/admin/gestao-usuarios` segue fixo) ·
`padrao_sistema`/`cor_identificacao`.

## Capabilities

### New Capabilities

- `design-system/switch`: contrato do `UiSwitch` — `v-model`/`label`/`disabled`,
  `role="switch"` + `aria-checked`, alternância por teclado (Space/Enter), foco visível
  `brand-focus`, estado ligado `#1a9e07` com knob branco, desabilitado sem foco nem
  alternância, espelhamento na vitrine.

### Modified Capabilities

- `perfis-acesso`:
  - **REMOVED** "A ação de permissões avisa por toast e não abre modal" +
    **ADDED** "A ação de permissões abre o modal de configuração" (abre com a matriz do
    perfil, sem toast de próxima etapa).
  - **ADDED** "O modal de permissões configura a matriz do perfil" (abertura com abas por
    sessão e linhas nome+descrição, interruptores das 4 ações fixas com rascunho e contador
    global, Funcionalidades em chips clicáveis, salvar/descartar em memória, recarga, Admin
    editável, perfil novo 0/99 — **sem atalhos de lote**).
  - **MODIFIED** "Os KPIs refletem o conjunto vigente de perfis" — cenário de recálculo
    inclui edição de permissões.
  - **MODIFIED** "As contagens de permissões e de usuários são derivadas, nunca digitadas"
    — novo cenário: salvar a matriz recalcula a coluna Permissões.

## Impact

- **Código:** `app/components/ui/Switch.vue` (novo), `app/components/perfis/Permissoes.vue`
  (novo), `app/components/perfis/usePerfisDemo.ts` (helper de gravação da matriz),
  `app/pages/admin/perfis-acesso.vue` (troca toast → modal), `app/pages/design.vue`
  (seção 20).
- **Docs:** `docs/01` (§5.19 + sumário), `docs/07` (§1, §2, §3.7 nova, §4, §5, §11, §12, §13).
- **Specs:** nova capability `design-system/switch`; deltas em `perfis-acesso`.
- **Sem** mudanças de API/server/deps; verificação = `npm run build` +
  `openspec validate --strict` + conferência visual (QA completa continua para depois do
  OK do usuário).
- **Riscos:** tabela com coluna de chips em viewport estreita (scroll horizontal **interno**
  do modal); 44 switches + 55 chips (render trivial, mas conferir 375px); recálculo só no
  Salvar (rascunho isolado da base — nunca altera KPIs antes de confirmar).

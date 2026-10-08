# Proposal — perfis-acesso-modal-exclusao

## Why

A página `/admin/perfis-acesso` ainda está no contrato de transição da fase 1: o gatilho
"Excluir" da linha apenas exibe toast de "próxima etapa" (`perfis-acesso.vue:25`), enquanto a
exclusão de usuários já tem seu modal de confirmação (`gestao-usuarios`). Esta change entrega a
fase 2 da exclusão de perfis — modal de confirmação + guarda de vínculo que antecipa a
validação de integridade prevista para o banco (`docs/02` §3.5, `perfis` ← `usuarios`).

## What Changes

- **Novo componente de domínio** `app/components/perfis/Exclusao.vue` (`PerfisExclusao`) —
  modal de confirmação no mesmo molde de `usuarios/Exclusao.vue` (`UiModal size="sm"`,
  `UiModalSection`, rodapé `outline` + `danger`), apresentação pura: a página continua dona do
  estado e da gravação. Componentes do kit (`UiModal`, `UiModalSection`, `UiButton`) não mudam.
- **Guarda de vínculo na confirmação:** `Trash2` sempre abre o modal (corpo identifica o alvo
  com nome e contagem de usuários vinculados); ao clicar "Excluir" com vínculos, o modal fecha
  e um `toast.warning` informa o bloqueio sem tocar na base — espelho da restrição que o
  backend imporá. Só sem vínculos a remoção acontece.
- **Remoção em memória:** helper puro `excluirPerfil()` em `usePerfisDemo.ts`; confirmar sem
  vínculos remove o perfil (e sua matriz embutida), recalcula KPIs, exibe toast de sucesso e
  devolve o foco ao campo de busca da tabela (`focarBusca`, que passa a ser exposto por
  `perfis/Tabela.vue`).
- **Contrato de transição da fase 1 encerrado para "Excluir":** os gatilhos "Novo Perfil",
  "Editar" e "Permissões" continuam com toast de próxima etapa; "Excluir" deixa de exibi-lo.
- **Documentação sincronizada:** `docs/07 - Perfis de Acesso (RBAC).md` (§1, §2, §3, §5, §11,
  §12, §13) e o comentário de contrato em `perfis-acesso.vue`.

Sem mudança de comportamento do kit, sem alteração em `/admin/gestao-usuarios` nem na vitrine
`/design`. QA fica para etapa posterior (fora desta change).

## Capabilities

### New Capabilities

_(nenhuma)_

### Modified Capabilities

- `perfis-acesso`:
  - **MODIFIED** — requisito "As ações da fase 1 avisam por toast e não abrem modal": "Excluir"
    sai do alcance do toast de transição; "Novo Perfil", "Editar" e "Permissões" permanecem.
  - **ADDED** — requisito do modal de exclusão de perfil: abertura sempre que "Excluir" é
    acionado, identificação do alvo (nome e contagem de vínculos), aviso de irreversibilidade,
    rodapé `Cancelar`/`Excluir`, bloqueio na confirmação com vínculos (modal fecha + toast,
    base intacta), remoção em memória sem vínculos com recálculo de KPIs, toast de sucesso,
    devolução de foco à busca, descarte por Cancelar/Escape/`X`, exclusão irrestrita por papel,
    sem HTTP e descarte na recarga.

## Impact

- **Código:** `app/components/perfis/Exclusao.vue` (novo), `app/components/perfis/usePerfisDemo.ts`,
  `app/components/perfis/Tabela.vue`, `app/pages/admin/perfis-acesso.vue`.
- **Specs:** delta em `openspec/specs/perfis-acesso/spec.md` (1 MODIFIED + 1 ADDED).
- **Docs:** `docs/07 - Perfis de Acesso (RBAC).md`. `docs/01 - design_system.md` e vitrine
  `/design` inalterados (nenhum componente de kit criado ou alterado).
- **Fora de escopo:** demais modais da fase 2 (cadastro/edição, filtros, permissões),
  alterações em Gestão de Usuários, QA.

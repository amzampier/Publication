# Design

## Context

- A página (`app/pages/admin/perfis-acesso.vue`) está no contrato de transição da fase 1:
  `@excluir` chama `avisoProximaEtapa()` e nenhum `UiModal` existe na página. Os emits da
  `perfis/Tabela.vue` (`@permissoes`, `@editar`, `@excluir` com `LinhaPerfil`) já são o ponto
  de encaixe — nenhum componente de tabela precisa ser reescrito.
- Existe molde maduro: `app/components/usuarios/Exclusao.vue` (apresentação pura) +
  coordenação na página (`gestao-usuarios.vue` `abrirExclusao`/`confirmarExclusao`) + helper
  puro `excluirUsuario()`; blueprint completo na change arquivada
  `2026-10-04-gestao-usuarios-modal-exclusao` (decisões D1–D8).
- `LinhaPerfil` já carrega `usuarios`, derivado de `useUsuariosDemo().usuarios` por nome — a
  guarda de vínculo não precisa de nova consulta.
- Guarda de vínculo **na confirmação** (decisão revisada com o usuário): `Trash2` sempre abre
  o modal; o clique em "Excluir" é que é barrado com toast quando há vínculos. O modal fecha
  antes do toast e o corpo exibe a contagem de usuários vinculados, para o motivo do bloqueio
  ficar visível antes do clique.

## Goals / Non-Goals

**Goals:**

- Modal de exclusão de perfil no mesmo molde do de usuários, com guarda de vínculo antes de
  abrir.
- Remoção em memória com KPIs recalculados, toast de sucesso e foco devolvido à busca.
- Sincronizar `docs/07` e o delta de spec com o código no mesmo change.

**Non-Goals:**

- Demais modais da fase 2 (cadastro/edição, filtros, permissões).
- Componente genérico de confirmação no kit; alterar `UiModal`/`UiButton` ou a vitrine
  `/design`.
- Alterar Gestão de Usuários, o modelo desacoplado `usuarios.perfil` (string literal) ou
  qualquer backend/HTTP.
- QA (etapa posterior — gate desta change é `npm run build` + conferência visual).

## Decisions

**D1 — Componente de domínio novo `perfis/Exclusao.vue`, não reuso nem kit genérico.**
Espelho estrutural de `usuarios/Exclusao.vue`: props `modelValue` + `perfil: LinhaPerfil |
null`, emite `update:modelValue`/`confirmar`, `UiModal size="sm"` → `UiModalSection` → footer
`outline`+`danger`; página é dona do estado e da gravação.
*Alternativas descartadas:* reaproveitar `UsuariosExclusao` (acopla `perfis/` a `usuarios/`);
criar `UiConfirmacao` genérico e refatorar usuários (mexe numa página/spec congelada —
scope creep para ~60 linhas).

**D2 — Guarda de vínculo na confirmação, não na abertura.** `abrirExclusao(perfil)` sempre
define o alvo e abre o modal. Em `confirmarExclusao()`: fecha o modal e, se
`alvo.usuarios > 0`, `toast.warning('Perfis de Acesso (RBAC)', 'O perfil "X" não pode ser
excluído: existem usuários vinculados a ele.')` **sem tocar na base**; senão remove.
*Por que na confirmação:* o usuário pediu que o modal abra e o bloqueio venha do clique em
"Excluir" — o toast é o feedback da tentativa, e fechar junto dele evita cliques repetidos
gerando toasts empilhados. *Foco no bloqueio:* o `UiModal` devolve o foco ao `Trash2`
(original, ainda no DOM — a linha não saiu), sem `nextTick` especial.
*Alternativa descartada:* guarda antes de abrir (bloqueava o modal na semente toda — decisão
original superada).

**D3 — Foco: `defineExpose({ focarBusca })` em `perfis/Tabela.vue`.** O `Trash2` sai do DOM
com a linha e a devolução de foco do `UiModal` é no-op em nó detachado — mesmo racional de
`gestao-usuarios.vue`. `perfis/Tabela.vue` hoje não expõe nada; adicionar `ref` no `UiDataTable`
e encadear `focarBusca()`, copiando `usuarios/Tabela.vue:26-28`. Após confirmar:
`nextTick(() => tabelaRef.value?.focarBusca())`.

**D4 — Remoção por helper puro em `usePerfisDemo.ts`.** `excluirPerfil(base, id): { base }`
(`filter` imutável), espelho de `excluirUsuario`. A matriz de permissões vive dentro do objeto
do perfil (`PerfilDemo.permissoes`), então o filtro já a descarta — nenhum estado auxiliary
para limpar. Página grava: `perfis.value = excluirPerfil(...).base`.

**D5 — Sem type-to-confirm, sem desfazer, sem guarda por papel.** Segue D2/D3 arquivadas do
modal de usuários: botão "Excluir" habilitado desde a abertura; peso desproporcional para base
em memória e sem precedente no kit. A única trava é a guarda de vínculo (D2), que espelha
validação de banco.

**D6 — Comportamento do modal herda 100% do kit.** Backdrop não fecha no clique; `Escape`/`X`
fecham; focus-trap e devolução de foco do `UiModal`; empilhamento só no topo. Corpo: nome +
**contagem de usuários vinculados** + aviso `text-rose-700` com `AlertTriangle` — a descrição
do perfil ficou de fora do modal (decisão do usuário: identificação mínima), e a contagem
antecipa visualmente o motivo pelo qual "Excluir" pode ser barrado no clique.

**D7 — Kit e vitrine intocados.** Nenhum componente de kit criado/alterado ⇒ `docs/01` e
seções da vitrine `/design` não mudam; todo o delta de spec é em `perfis-acesso`.

## Risks / Trade-offs

- [Modal abre na semente mas a confirmação é sempre bloqueada (todos os perfis têm vínculos)]
  → Comportamento desejado: a guarda espelha a validação futura do banco e a contagem no
  corpo do modal torna o bloqueio previsível; caminho de exclusão real = zerar vínculos
  excluindo usuários em Gestão de Usuários (contagem derivada reage sem recarregar) ou
  perfis novos da fase 2 (nascem sem usuários).
- [Esquecer o `defineExpose` em `perfis/Tabela.vue`] → Foco morre após confirmar; tarefa
  explícita em tasks.md + checagem visual pós-exclusão.
- [docs/07 desatualizado (§1, §2, §3, §5, §11, §12, §13)] → Lista de seções vira tarefa com
  checklist; o requisito `perfis-acesso` de docs/07 como fonte normativa exige a sincronia.
- [Guarda usa `usuarios` derivado de nomes] → Se um usuário mudar de perfil por outra tela,
  a contagem reflete em `computed` sem recarregar; nenhum cache a invalidar.

## Migration Plan

Sem migração: frontend em memória, sem API. Rollback = reverter os 4 arquivos de código +
docs; a spec volta pelo archive inverso do change.

## Open Questions

Nenhuma — escopo, guarda, molde do componente e sincronia de docs estão decididos com o
usuário.

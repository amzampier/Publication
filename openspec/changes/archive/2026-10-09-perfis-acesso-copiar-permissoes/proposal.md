# Proposal

## Why

O modal de permissões hoje só permite editar a matriz célula a célula — configurar um perfil
parecido com outro exige 99 toques manuais. Copiar a matriz de um perfil para outro (importar
para o rascunho ou exportar para um colega) elimina esse trabalho repetitivo e é o passo natural
depois que o modal entregou interruptores, chips e abas.

## What Changes

- O rodapé do modal de permissões ganha **dois ícones de cópia alinhados à esquerda** (grupo
  `mr-auto` no slot `#footer`; `Cancelar`/`Salvar` continuam à direita):
  - **`ClipboardPaste` — copiar DE outro perfil:** abre um modal filho com a lista de perfis;
    a matriz escolhida **substitui o rascunho** (clone, sem merge) e só vale no **Salvar**.
  - **`ClipboardCopy` — copiar PARA outro perfil:** abre o mesmo modal filho; grava
    **imediatamente** no perfil alvo a **matriz salva** do perfil aberto (nunca o rascunho),
    com toast próprio; Cancelar/Escape/X do modal pai não desfaz a cópia.
- **Modal filho** `UiModal size="sm"` com `UiChoiceCard` por perfil candidato (nome,
  descrição, badge `n/99`), dentro de `role="radiogroup"`; o perfil atual **nunca** aparece
  na lista; base com um único perfil mostra estado vazio.
- Microrrefator: extrair `clonarMatriz()` em `usePerfisDemo.ts` (clone sem referência
  compartilhada, hoje inline no watch de abertura do modal).
- Documentação: `docs/07` (§3.7, §5, §11, §12 — versão 1.4.0) e `docs/01` §5.12 (grupo à
  esquerda no slot de rodapé).

## Capabilities

### New Capabilities

_(nenhuma — a mudança toda vive numa capability existente)_

### Modified Capabilities

- `perfis-acesso`: **ADDED** o requisito "O modal de permissões copia a matriz entre perfis"
  (rodapé com as duas ações de cópia, importar no rascunho com gravação só no Salvar,
  exportar imediato com a matriz salva e toast, seletor sem o perfil atual). Nenhum requisito
  existente muda: KPIs e contagens já cobrem recálculo por "edição da matriz de permissões".

## Impact

- **Código:** `app/components/perfis/Permissoes.vue` (rodapé, modal filho, handlers),
  `app/components/perfis/usePerfisDemo.ts` (export de `clonarMatriz`). Nenhuma mudança em
  `perfis-acesso.vue`, em `ui/Modal.vue` (kit intacto) nem na vitrine `/design` (não é
  componente novo de kit).
- **Ícones:** `ClipboardPaste`/`ClipboardCopy` de `@lucide/vue` (já existentes — sem
  dependência nova).
- **Specs:** delta só em `openspec/specs/perfis-acesso`; `design-system/modais` e
  `design-system/choice-card` são **usados**, não alterados (o empilhamento do modal filho
  já é coberto pelos 4 requisitos existentes).
- **Docs:** `docs/07` (fonte normativa — obrigatório), `docs/01` (1 linha em §5.12).
- **Verificação:** `npm run build` + `openspec validate --strict` + conferência visual em
  `http://localhost:3000/admin/perfis-acesso`.

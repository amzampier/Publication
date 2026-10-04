# Proposal

## Why

A exclusão de usuário é a última ação de linha ainda presa no toast "funcionalidade disponível
na próxima etapa": o ícone `Trash2` não faz nada de real e o CRUD em memória da fase 2 está
incompleto sem o ciclo destrutivo. Ação destrutiva pede confirmação explícita - o próprio guia de
QA/UX do projeto já exige "feedback visual em ações destrutivas (confirmação antes de excluir)".

## What Changes

- **Modal de confirmação de exclusão** (componente de domínio
  `app/components/usuarios/Exclusao.vue`) composto pelos componentes já existentes: `UiModal
  size="sm"` com título "Excluir Usuário", ícone `Trash2`, nome + e-mail do alvo e aviso de
  irreversibilidade; rodapé com **Cancelar** (`UiButton outline`) e **Excluir**
  (`UiButton danger`). Aberto pelo `Trash2` da linha, que deixa de exibir toast e passa a emitir
  `@excluir(usuario)`.
- **Gravação em memória:** `useUsuariosDemo.ts` ganha a função pura `excluirUsuario(base, id)`
  (mesmo padrão imutável de `salvarUsuario`); ao confirmar, a página remove o registro do
  conjunto vigente, os KPIs e a tabela recalculam e um `toast.success` de exclusão fecha o
  fluxo. Cancelar, `Escape` ou o `X` do cabeçalho descartam sem alterar a base.
- **Exclusão sem guarda:** irrestrita (qualquer usuário do conjunto); sem "desfazer"; em
  memória como todo o resto da fase 2, sem nenhuma requisição HTTP.
- **Foco após a exclusão:** a linha e o botão `Trash2` saem do DOM junto com o registro, então o
  foco vai ao **campo de busca da tabela** - `UiDataTable` ganha `defineExpose({ focarBusca })`
  (toque mínimo de kit, encadeado pela `UsuariosTabela`).
- **Contrato de transição preservado nos demais gatilhos:** Importar, Filtros, Enviar o Convite,
  Bloquear e o ícone do CEP continuam com toast de "próxima etapa" e nenhum modal aberto.
- **Documentação completa:** `docs/06` (seções 1, 2, 3.3, nova subseção do modal, 5.5 com cinco
  toasts remanescentes, 9, 10, 11 e 12), `docs/01` (§5.11 com o expose da busca e §5.12 com o
  rodapé admitindo a variante `danger`) e a vitrine `/design` §15 com a demo do modal de
  confirmação.

## Capabilities

### New Capabilities

_Nenhuma capability nova._

### Modified Capabilities

- `gestao-usuarios`: o requirement dos gatilhos de fase 1 perde o "excluir" de sua lista de
  controles com toast (ele passa a abrir o modal de confirmação; os outros cinco seguem com
  toast) e a spec ganha um requirement novo descrevendo o modal de exclusão — conteúdo do
  diálogo, confirmação que remove do conjunto com recálculo de KPIs e toast de sucesso,
  descarte por Cancelar/`Escape`/`X`, foco devolvido à busca da tabela e operação puramente em
  memória.

## Impact

- **Componentes de domínio:** novo `app/components/usuarios/Exclusao.vue`; alterados
  `app/components/usuarios/Tabela.vue` (emite `@excluir`, sai o toast),
  `app/components/usuarios/useUsuariosDemo.ts` (`excluirUsuario` pura) e
  `app/pages/admin/gestao-usuarios.vue` (coordenação do novo modal + foco na busca).
- **Componentes de kit:** apenas `app/components/ui/DataTable.vue` com
  `defineExpose({ focarBusca })` — mudança de API sem alteração de comportamento visual; nenhum
  requisito de spec do design-system é alterado (`design-system/modais` já cobre empilhamento e
  não sofre delta; a demo da vitrine obedece aos requisitos existentes de `vitrine`).
- **Documentação e vitrine:** `docs/06 - Gestão de Usuários.md`, `docs/01 - design_system.md`
  (§5.11, §5.12) e `app/pages/design.vue` (seção 15).
- **Fora de escopo:** Bloquear, Enviar o Convite, Importar, Filtros e ViaCEP (seguem com toast);
  `docs/02` intocado; nenhum endpoint em `server/`; nenhuma guarda de perfil na exclusão; nenhum
  mecanismo de desfazer/reciclagem.

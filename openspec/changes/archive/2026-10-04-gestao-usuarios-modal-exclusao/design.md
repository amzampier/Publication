# Design

## Context

A `UsuariosTabela` ainda despacha o `Trash2` para `avisoProximaEtapa` (toast), e a spec
`gestao-usuarios` (requirement dos gatilhos de fase 1) manda esse comportamento. O resto do
terreno já está pronto: `UiModal` oferece portal, backdrop non-click, focus-trap, devolução de
foco ao gatilho e largura `sm` (480px); `UiButton` já tem a variante `danger` (rose, sem uso em
rodapé de modal); `UiDataTable` já colapsa a página atual quando `totalEntries` cai
(`DataTable.vue:448-455`); KPIs derivam de `usuariosFiltrados` e recalculam sozinhos; e a
coordenação do modal de cadastro vive na página (decisão D1 da change anterior). Motivação em
`proposal.md`; comportamento exigido no delta `specs/gestao-usuarios/spec.md`.

## Goals / Non-Goals

**Goals:**

- Fechar o ciclo destrutivo do CRUD em memória com confirmação explícita reutilizando o kit
  existente (nenhum componente visual novo).
- Preservar o contrato de transição dos demais cinco gatilhos com toast.
- Devolver o foco a um ponto útil da tabela após a linha (e o gatilho) saírem do DOM.
- Atualizar toda a documentação atingida (`docs/06`, `docs/01`, vitrine §15).

**Non-Goals:**

- Guardas de exclusão (último Administrador, perfil protegido) e mecanismo de desfazer.
- Componente genérico de kit `UiConfirmacao` (Bloquear/Convite seguem fora desta change).
- Qualquer persistência, endpoint em `server/` ou alteração em `docs/02`.
- Mudança de comportamento do `UiModal`/`design-system/modais` (empilhamento já existe e o
  diálogo abre em nível único — o Trash2 só é clicável com a tabela livre).

## Decisions

**D1 — Componente de domínio, não kit.** Novo `app/components/usuarios/Exclusao.vue`
compondo `UiModal` + `UiModalSection` + `UiButton`, auto-importado como `UsuariosExclusao`.
*Alternativa descartada:* `UiConfirmacao` genérico de kit — ampliaria `docs/01` e criaria
componente novo sem segundo consumidor hoje (Bloquear/Convite ainda são toast).

**D2 — Confirmação simples, sem type-to-confirm.** Diálogo mostra identificação (nome no
header/subtítulo, e-mail no corpo) + aviso de irreversibilidade; "Excluir" habilitado desde a
abertura. *Alternativa descartada:* digitar o e-mail para habilitar — peso desproporcional para
uma base em memória e sem precedente no kit.

**D3 — Exclusão irrestrita.** Qualquer perfil (inclusive Administrador) é removível; nenhuma
regra de negócio nova. *Alternativas descartadas:* proteger o último Administrador ativo ou
bloquear perfis — a autorização RBAC real (`requirePermission`, `docs/02` §3.5) pertence ao
backend futuro.

**D4 — Feedback com `toast.success`.** `toast.success('Gestão de Usuários', 'Usuário excluído
com sucesso.')` — mesmo padrão de criar/editar; a ação destrutiva já teve confirmação no modal.
*Alternativa descartada:* `toast.danger` (o evento não é um erro) ou toast com nome do usuário
(mensagem longa sem ganho na listagem).

**D5 — Foco vai à busca da tabela.** `UiDataTable` expõe `focarBusca()`; `UsuariosTabela`
encadeia via ref; a página chama após o modal fechar. Mecânica em um único arquivo de kit: o
wrapper do `UiInput` de busca vira `ref` e `focarBusca()` faz `querySelector('input')?.focus()`
no próprio subtree (o `UiInput` não expõe `focus`, então a alternativa seria tocá-lo também).
*Alternativas descartadas:* deixar o foco cair no `body` (perda de foco visível para leitor de
tela) e focar a primeira ação de linha (alvo instável que muda com a linha excluída).
**Sequência:** o handler de confirmação fecha o modal e agenda o foco com `nextTick` — o watch
de fechamento do `UiModal` roda no flush `pre` antes do callback, sua devolução de foco ao
`Trash2` detachado é no-op silencioso, e o foco da busca vence.

**D6 — A página coordena; o componente é apresentação.** `gestao-usuarios.vue` mantém
`exclusaoAberta: ref(false)` e `usuarioExcluir: ref<UsuarioDemo | null>` (mesmo molde do modal
de cadastro); `UsuariosTabela` emite `@excluir(usuario)` e expõe `focarBusca()`; a página
executa a remoção, o toast e o foco, e `Exclusao.vue` emite apenas `confirmar` e
`update:modelValue`. *Alternativa descartada:* escrita dentro do componente (molde
`Formulario.vue`) — exigiria um emit extra só para o foco, que vive na página de qualquer forma.

**D7 — Remoção pura no composable.** `excluirUsuario(base, id): { base }` em
`useUsuariosDemo.ts`, imutável como `salvarUsuario` (filter por id; id inexistente devolve a
base intacta). A página atribui `usuarios.value = novaBase`. A exclusão é descartada na recarga
como todo o `useState('usuarios-base')` — sem código extra.

**D8 — Corpo do diálogo reaproveita `UiModalSection`.** O corpo `bg-slate-100` do `UiModal`
recebe um card branco `UiModalSection` (título + aviso, slot com e-mail em destaque e o aviso
de irreversibilidade), evitando texto solto sobre o cinza e mantendo o padrão dos demais
diálogos. O header mantém o degradê canônico do kit (regra do AGENTS: degradê só em
`Button primary`, header de modal e trilha do slider) — o sinal destrutivo vem do botão
`danger` e do conteúdo. *Alternativa descartada:* header rose para "modo perigo" — quebraria a
disciplina de degradê do design system.

## Risks / Trade-offs

- [Devolução de foco do `UiModal` compete com o foco na busca] → D5: `nextTick` após o
  fechamento garante ordem; o nó detachado não lança erro.
- [`docs/06` §5.5 afirma "seis toasts remanescentes" e lista Excluir] → tarefa obrigatória de
  doc: reduzir para cinco e ajustar §1, §3.3, §11 e §12.
- [O requirement antigo ainda manda toast no excluir] → delta MODIFIED no arquivo da change;
  após o archive a spec principal passa a exigir o modal.
- [`docs/01` §5.12 descreve rodapé como "outline + primary"] → atualizar a linha para admitir
  a variante `danger`, senão a doc contradiz a implementação.
- [Excluir a última linha da última página] → sem código novo: `UiDataTable` já colapsa a
  página; o cenário na spec existe justamente para travar a regressão.
- [Excluir todos os usuários] → tabela entra no estado vazio já existente
  (`DataTable.vue:852`) e KPIs zeram; comportamento aceitável e sem tratamento especial.

## Migration Plan

Não aplicável — base em memória, sem banco, sem API e sem mudança de contrato visível para
consumidores externos. Rollback = reverter o código; a recarga da página já restaura a semente.

## Open Questions

_Nenhuma — type-to-confirm, guarda de perfil e desfazer foram deliberadamente descartados (D2,
D3) e podem ser revistos apenas quando o backend real de usuários existir._

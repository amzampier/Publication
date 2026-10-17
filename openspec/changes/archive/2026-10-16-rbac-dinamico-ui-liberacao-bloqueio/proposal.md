# Proposal

## Why

A auditoria RL03 (`docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, achados `RL03-M-01` e
`RL03-M-02`) encontrou duas divergências na Área Administrativa: (1) a Gestão de Usuários **fixa os 4
perfis do seed** (`Administrador`, `Editor`, `Revisor`, `Leitor`) no modal de usuário, no modal de
filtros e na validação da importação — perfis customizados criados legitimamente em Perfis de Acesso
não podem ser atribuídos, filtrados nem importados, embora o servidor os aceite por nome
(`resolverPerfilId`/`perfilPorNome`); (2) a ação "Liberar" da aba Segurança responde `404 "Usuário não
encontrado."` quando a conta existe mas **já está limpa** (o `UPDATE` não altera linhas e
`affectedRows === 0`), confundindo o operador num clique duplo ou liberação concorrente.

## What Changes

- **Perfis dinâmicos na Gestão de Usuários:** o modal de usuário, o modal de filtros e a validação da
  planilha de importação passam a derivar as opções/validação de **Perfil** do cadastro de perfis de
  acesso (`perfis_acesso`), e não de uma lista fixa — perfis customizados (Ativos) tornam-se
  atribuíveis, filtráveis e importáveis.
- **Liberação de bloqueio idempotente:** `POST /api/seguranca/liberar` passa a responder sucesso
  (`200`) para uma conta existente já sem falhas/bloqueio, mantendo `404` somente para conta
  inexistente.
- **Sem `BREAKING`:** os quatro perfis do seed continuam listados (agora derivados do servidor); os
  demais comportamentos da importação, do modal e da aba Segurança permanecem.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `gestao-usuarios`: o requisito "O modal de filtros refina o conjunto vigente de usuários" passa a
  listar os **perfis cadastrados no sistema** (não os quatro fixos); e um novo requisito estabelece
  que perfis customizados são **atribuíveis** (modal de usuário) e **importáveis** (planilha),
  derivados de `perfis_acesso`.
- `configuracoes-globais`: novo requisito de que a **liberação de bloqueio é idempotente** — sucesso
  para conta existente já limpa, `404` apenas para conta inexistente.

## Impact

- **Frontend:** `app/components/usuarios/Formulario.vue`, `app/components/usuarios/Filtros.vue`,
  `app/components/usuarios/lerPlanilhaUsuarios.ts` e `app/components/usuarios/useUsuariosModelo.ts`
  (tipos/constantes) — consomem a lista de perfis do servidor (`opcoes.perfis`).
- **Backend:** `server/utils/auth.ts` (`limparFalhasLogin`) e/ou `server/utils/seguranca.ts`
  (`liberarBloqueio`) — idempotência da liberação; `server/api/seguranca/liberar/index.post.ts`
  (mantém o contrato). Nenhuma rota nova é necessária (a lista de perfis já é devolvida por
  `GET /api/usuarios`).
- **Banco:** nenhuma migration; usa `perfis_acesso` (já existente).
- **Fora de escopo:** os demais achados do RL03 (índices/expurgo, documentação e UX) pertencem a
  outras etapas.

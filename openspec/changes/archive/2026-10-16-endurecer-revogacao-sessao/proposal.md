# Proposal

## Why

A auditoria completa RL03 (`docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, achados
`RL03-C-01`, `RL03-A-01` e `RL03-B-17`) encontrou uma **falha crítica de revogação de sessão**: as
rotas de autenticação sob `/api/auth/*` são isentas do middleware global de sessão e as que operam
sob uma sessão existente (`GET /api/auth/seguro` e `POST /api/auth/trocar-senha`) não revalidam o
`token_version`. Resultado: um token de acesso **revogado por logout**, ainda dentro da validade
(~15 min), continua autenticando — e chega a **redefinir a senha da própria conta**. A capability
`revogacao-sessao` exige que a sessão seja validada no servidor a cada requisição autenticada, mas
essas rotas escapam à verificação. Aproveita-se o mesmo ciclo para endurecer a rotação do refresh
token, que hoje pode ser explorada em corrida (reuso concorrente do mesmo refresh).

## What Changes

- **Revogação nas rotas de autenticação:** as rotas sob `/api/auth/*` que operam sob uma sessão
  existente (`/api/auth/seguro`, `/api/auth/trocar-senha`) passam a validar a revogação no servidor
  (conta Ativa + `token_version` em dia), respondendo `401` para token revogado. As portas que
  **estabelecem/renovam** a sessão (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/esqueci-senha`)
  permanecem isentas, por não operarem sob sessão prévia.
- **Rotação de refresh atômica:** a renovação serializa a leitura/rotação do refresh token e passa a
  **rejeitar o reuso** de um refresh já rotacionado (resposta `401`), eliminando a corrida que
  poderia emitir duas sessões válidas do mesmo token.
- **Sem `BREAKING`:** o comportamento observável permanece o mesmo para sessões válidas; muda apenas
  o tratamento de tokens revogados/reutilizados.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `revogacao-sessao`: o requisito "O sistema valida a sessão no servidor a cada requisição
  autenticada" passa a explicitar que a validação abrange as rotas autenticadas do portal de
  autenticação (`/api/auth/seguro`, `/api/auth/trocar-senha`), com cenários de token revogado
  nesses dois endpoints.
- `login`: o requisito "A sessão é mantida por cookies HttpOnly com refresh rotativo…" passa a exigir
  que a rotação do refresh seja atômica (serializada no servidor) e que o reuso de um refresh já
  rotacionado seja recusado (`401`).

## Impact

- **Backend:** `server/api/auth/seguro/index.get.ts`, `server/api/auth/trocar-senha/index.post.ts`;
  `server/utils/auth.ts` (`getSessionUser`/`renovarSessao`/`rotacionarSessao`, `sessaoAtivaNoServidor`);
  possivelmente `server/middleware/auth-api.ts` (isenções).
- **Banco:** nenhuma migration nova prevista; usa `usuarios.token_version` (migration 09) e a tabela
  `sessoes` já existentes. A detecção de reuso pode exigir apenas consulta transacional (`FOR UPDATE`).
- **Contrato de API:** `GET /api/auth/seguro` e `POST /api/auth/trocar-senha` passam a responder `401`
  para sessão revogada (antes: `200`). `POST /api/auth/refresh` passa a responder `401` para refresh
  já rotacionado/reutilizado.
- **Fora de escopo:** os demais achados do RL03 (importação de usuários, RBAC dinâmico na UI, índices,
  expurgo, documentação e UX) pertencem a outras etapas e não são tratados aqui.

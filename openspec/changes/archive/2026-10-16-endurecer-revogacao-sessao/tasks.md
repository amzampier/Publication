# Tasks

## 1. Revogação de sessão nas rotas autenticadas do portal de autenticação

- [x] 1.1 Em `server/utils/auth.ts`, adicionar um helper único (ex.: `obterSessaoValida(event)`) que executa `getSessionUser(event)` e, quando houver sessão, confirma `sessaoAtivaNoServidor(sessao)`; se a validação falhar, chama `limparCookiesAuth(event)` e devolve `null`. Verificação: `npm run build` conclui sem erro e o helper é o único ponto de checagem usado pelas duas rotas do grupo.
- [x] 1.2 Em `server/api/auth/seguro/index.get.ts`, trocar `getSessionUser` pelo helper e responder `401` ("Sessão expirada ou revogada.") quando a sessão não for válida no servidor. Verificação: com o servidor de dev ativo, `GET /api/auth/seguro` com cookie de access pós-logout responde `401` (antes: `200 { usuario }`); com sessão válida responde `200`.
- [x] 1.3 Em `server/api/auth/trocar-senha/index.post.ts`, usar o helper no lugar de `getSessionUser` + checagem de `situacao`, mantendo a resposta `401` para sessão inválida/revogada e preservando a validação da senha atual. Verificação (E2E): cookie de access capturado antes do logout e reutilizado em `POST /api/auth/trocar-senha` com a senha atual correta responde `401` e **não** altera o hash; nova tentativa com sessão válida continua retornando `200 { ok: true }`.
- [x] 1.4 Garantir que o fluxo de senha provisória (`primeiro-acesso`) segue acessível. Verificação: sessão com `senha_provisoria = 1` autentica, `GET /api/auth/seguro` devolve a sinalização e `POST /api/auth/trocar-senha` conclui a troca (a validação de revogação não depende de `senha_provisoria`).

## 2. Rotação de refresh atômica e rejeição de reuso

- [x] 2.1 Em `server/utils/auth.ts` (`rotacionarSessao`), acrescentar `FOR UPDATE` ao `SELECT` do refresh (linhas ~176-181) mantendo a transação e o `try/catch` com `rollback`. Verificação: `npm run build` OK e a consulta passa a serializar no lock da linha em `sessoes`.
- [x] 2.2 Validar o comportamento de reuso e concorrência. Verificação (E2E, servidor ativo): (a) reutilizar um refresh já rotacionado em `POST /api/auth/refresh` responde `401`; (b) duas chamadas concorrentes com o mesmo refresh válido resultam em apenas uma `200` e a outra `401`, sem emitir duas sessões válidas.

## 3. Verificação integrada e documentação

- [x] 3.1 Rodar a verificação de build e a build de produção. Verificação: `npm run build` conclui sem erro.
- [x] 3.2 Executar o roteiro E2E consolidado da capability `revogacao-sessao` e do requisito de rotação. Verificação: token revogado (logout) → `401` em `/api/auth/seguro` e em `/api/auth/trocar-senha`; desativação de usuário → `401` na próxima requisição; sessão válida inalterada (login → usar app → F5 mantém acesso); refresh reutilizado/concorrente → `401`.
- [x] 3.3 Atualizar a documentação de autenticação (`docs/08 - Login de Autenticação.md`) descrevendo a validação de revogação também nas rotas `/api/auth/seguro` e `/api/auth/trocar-senha` e a atomicidade da rotação do refresh. Verificação: o trecho citado bate com o comportamento implementado e o `docs/08` permanece coerente com a sessão real.
- [x] 3.4 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md` marcando `RL03-C-01`, `RL03-A-01` e `RL03-B-17` como corrigidos (com a data e a change), no mesmo estilo dos encerramentos do RL02. Verificação: as três linhas constam como corrigidas na Etapa 1 do plano de correção.

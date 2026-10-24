# Tasks

## 1. Busca dedicada de e-mails

- [x] 1.1 Criar `GET /api/usuarios/emails` com `q` mínimo de 2, paginação limitada a 20 e retorno apenas de `id`/`email`/`nome`; verificar por teste de API que termo curto retorna `400`.
- [x] 1.2 Exigir `gestao-usuarios`/`visualizar` (e `buscar` com termo), sem expor a lista completa; verificar `401` sem sessão e `403` sem permissão.
- [x] 1.3 Atualizar o autocomplete de e-mail em Gestão de Usuários/Convite para consumir a nova rota com debounce; verificar que a tela não baixa a lista completa.
- [x] 1.4 Adicionar testes do endpoint (busca, paginação, permissão, campos mínimos) e atualizar `docs/06`; verificar que a matriz RBAC cita a rota.

## 2. Headers e CSRF

- [x] 2.1 Adicionar headers globais em `routeRules` (nosniff, Referrer-Policy, Permissions-Policy, X-Frame-Options e CSP compatível com TipTap); verificar em `/admin`, `/api` e `/design`.
- [x] 2.2 Adicionar HSTS condicional para produção HTTPS; verificar que dev HTTP não recebe HSTS.
- [x] 2.3 Criar middleware CSRF para métodos inseguros sob `/api/**`, com exceções de autenticação e validação Origin/Referer ou token de duplo envio; verificar `403` em origem cruzada e `200` em same-origin.
- [x] 2.4 Emitir cookie/token CSRF e enviar `X-CSRF-Token` pelo `useApiFetch`; verificar login, CRUD e editor sem regressão.
- [x] 2.5 Adicionar testes de headers/CSRF e atualizar `docs/02`/`docs/08`; verificar que as exceções estão documentadas.

## 3. Rate limit persistente

- [x] 3.1 Criar migration 34 com `rate_limit_contadores` (chave, janela, contagem, atualizado_em) e índice de limpeza; verificar aplicação idempotente.
- [x] 3.2 Trocar o contador em memória por UPSERT atômico no banco, mantendo a chave IP+rota e o cache de configuração; verificar concorrência com N chamadas paralelas.
- [x] 3.3 Implementar limpeza oportunista e fallback em memória quando o banco falhar; verificar que a autenticação não cai por falha do contador.
- [x] 3.4 Adicionar testes de janela, restart (nova instância), duas instâncias e fallback; verificar `429` e `200` nos limites.
- [x] 3.5 Atualizar `docs/02`/`docs/08` com a tabela, a limpeza e o rollback; verificar contra o SQL.

## 4. Integração

- [x] 4.1 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; registrar o número de testes e corrigir falhas.
- [x] 4.2 Executar E2E de login, CRUD autenticado, busca de e-mails, CSRF e rate limit; limpar dados de teste.
- [x] 4.3 Executar `openspec validate "reforcar-seguranca-e-infra" --type change --strict` e `openspec validate --specs`; verificar ambos válidos.
- [x] 4.4 Revisar `git status`/`git diff --stat` e confirmar que só a migration 34 foi adicionada, sem segredos ou artefatos.

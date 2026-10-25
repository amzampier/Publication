# Change: Corrigir bloqueadores do fechamento RL06

## Why

A reauditoria completa do RL06 (commit `ba8843f`) confirmou duas falhas Críticas, duas Altas e resíduos de integridade/segurança que impedem o aceite: a Esteira de Revisão responde 500 quando existe conteúdo pai com `publicado_em` preenchido; a hierarquia de perfil não é aplicada em criação, edição e convite de usuário; a busca FULLTEXT deixou de encontrar e-mail/código/substrings e responde 500 com termos que contêm hífens; e a saturação do pool responde 500 em vez de 503.

## What Changes

- Corrigir a conversão de `publicado_em`/datas do mysql2 na Esteira e no gate de visibilidade, aceitando `Date` e string sem perder itens.
- Aplicar `validarHierarquiaPerfil` nos caminhos de criação, edição e convite, inclusive para conta existente.
- Reconstruir o adaptador de busca: tokenização segura, FULLTEXT para texto, igualdade/prefixo indexável para e-mail/código e proteção contra operadores booleanos; preservar os campos pesquisáveis documentados.
- Mapear saturação de pool (`Queue limit reached`/`ER_CON_COUNT_ERROR`) para `503` com `Retry-After` também na sessão e no RBAC, não apenas no handler.
- Preservar `publicado_em` quando o conteúdo já está `Publicado` e a edição não muda o status.
- Incluir `criado_em`/`atualizado_em` na projeção da listagem/exportação de usuários.
- Exigir `pasta` na query para pré-autorizar uploads, impedindo que o destino no corpo postergue o `403` para depois do parse.
- Entregar e aplicar o usuário de banco de menor privilégio, removendo `ALL PRIVILEGES ... WITH GRANT OPTION` da conta da aplicação.
- Retirar da base os resíduos de QA agendados para publicação automática (`RW-52/2026` e chamada `0000545878`) antes do go-live.

## Impact

- Affected specs: `esteira-revisao`, `gestao-usuarios`, `busca-fulltext`, `seguranca-http`, `release-week`, `manuais-mensais`, `escopo-projetos`, `uploads`.
- Affected code: `server/utils/esteira-revisao.ts`, `server/utils/visibilidade-publica.ts`, `server/utils/usuarios.ts`, `server/utils/hierarquia.ts`, `server/api/usuarios/**`, `server/api/convite/index.post.ts`, `server/utils/busca.ts`, `server/utils/lancar-chamadas.ts`, `server/utils/audit.ts`, `server/middleware/auth-api.ts`, `server/utils/auth.ts`, `server/utils/permission.ts`, `server/utils/pool-error.ts`, `server/utils/release-week.ts`, `server/utils/manuais.ts`, `server/utils/escopo-projetos.ts`, `server/api/uploads/index.post.ts`, `scripts/db-least-privilege.sql`.
- Dados: limpeza operacional dos registros de QA (com aprovação e backup).
- Risco: mudanças em autorização, busca e disponibilidade; cobertura por testes de regressão e E2E obrigatória.

## Non-goals

- Performance do Painel/CSV/importação (change `otimizar-painel-esteira-entrega`).
- UX, acessibilidade e dívida documental ampla (change `fechar-ux-e-contratos-rl06`).
- Área Pública de conteúdo, 2FA, multi-tenant e envio real de e-mail.
# Design

## Context

O commit `ba8843f` entrega o RL06 com gates verdes, mas a reauditoria encontrou falhas de integração entre o banco (mysql2 retorna `DATETIME` como `Date`), a autorização dinâmica e o adaptador de busca. Ver `proposal.md - Why`.

## Goals / Non-Goals

**Goals:** eliminar os bloqueadores Críticos/Altos sem alterar o contrato editorial; manter RBAC e fronteira; cobrir cada correção com teste de regressão.

**Non-Goals:** redesenho de performance, UX ou documentação; mudanças de schema além das já existentes (31–35).

## Decisions

1. **Datas do banco**: criar um normalizador único (`dataIso`/`paraIso`) que aceite `Date`, string ISO e `YYYY-MM-DD HH:mm:ss`, usando `toISOString()` apenas quando o valor já é `Date`. Aplicar na Esteira e em `visibilidade-publica.ts` (funções JS). Alternativa descartada: `dateStrings: true` no pool, que mudaria o contrato de todas as rotas.
2. **Hierarquia**: chamar `validarHierarquiaPerfil` dentro dos utilitários `criarUsuario`, `atualizarUsuario` e `criarConvite`, não apenas nas rotas, para que qualquer novo caminho herde a regra. O convite existente deve validar o perfil do alvo e o perfil do ator.
3. **Busca**: separar em duas pernas (`MATCH ... AGAINST` para tokens textuais e `LIKE` prefixo indexável para e-mail/código) combinadas por `UNION ALL`/`OR` controlado; sanitizar tokens removendo operadores booleanos (`+ - @ * " ( ) ~ < >`) e aplicar `escaparLike`. E-mail completo e código com hífen passam pela perna de prefixo; software/parceiro/tags/release mantêm o campo pesquisável documentado.
4. **Pool**: mover o mapeamento de saturação para um error handler global do Nitro (ou middleware) que reconheça `ehSaturacaoDePool`, cobrindo sessão, RBAC e handlers; responder `503` + `Retry-After`.
5. **`publicado_em`**: gravar somente na transição para `Publicado`; em edição com status já `Publicado`, usar `COALESCE(publicado_em, ...)` em vez de `COALESCE(data, CURRENT_TIMESTAMP)`.
6. **Uploads**: exigir `pasta` na query; remover o fallback de autorização pelo corpo. O corpo pode continuar aceitando `pasta` por compatibilidade, mas a ausência na query responde `400` antes do parse.
7. **Grants**: aplicar `scripts/db-least-privilege.sql` em ambiente de teste e documentar o procedimento; a conta da aplicação passa a ser `publications_app`.

## Risks / Trade-offs

- [Busca mais restritiva] → cobrir com testes de e-mail, código, hífen, acento e termo curto; comparar contagens com o comportamento anterior.
- [503 global pode mascarar erros] → mapear apenas erros reconhecidos de fila/conexão; manter 500 para o restante.
- [Mudança de grants pode quebrar o boot] → testar em base descartável e manter rollback documentado.
- [Limpeza de dados de QA] → backup e confirmação do operador antes de arquivar/despublicar.

## Migration Plan

1. Aplicar correções de código e testes.
2. Rodar gates e E2E dos cinco bloqueadores.
3. Em ambiente de teste, criar `publications_app`, ajustar `.env` e validar boot/migrations/expurgo.
4. Fazer backup e remover/arquivar os resíduos `RW-52/2026` e `0000545878`.
5. Rollback: reverter o commit e restaurar o usuário de banco anterior; dados de QA só após backup.
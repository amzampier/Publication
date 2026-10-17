# Design

## Context

Ver `proposal.md - Why`. Estado atual (RL04 Etapa 4):

- `listarUsuarios`/`listarAuditoria` rodam 4 queries em `Promise.all` (página + agregado + 2 `DISTINCT` de opções); no agregado de auditoria o `COUNT(*)` e o `COUNT(DISTINCT usuario_nome)` ficam num único `SELECT` que varre a tabela (`type=ALL`).
- `seguranca.ts:144-148` filtra por `tentativas_falhas`/`bloqueado_ate` sem índice (`type=ALL; filesort`).
- A listagem de usuários projeta 25 colunas (`COLUNAS_LISTA`) para exibir 5.
- `registrarAuditoria` é aguardada no caminho da resposta.
- `mailer.ts` chama o Resend sem timeout.
- `db.ts` não define `timezone` na conexão.
- Expurgo é evento do MariaDB (migration 11); sem catch-up, o primeiro ciclo pode não ocorrer se o horário já passou quando o servidor sobe.

## Goals / Non-Goals

**Goals:** reduzir round-trips e custo por listagem; índice para a aba Segurança; evitar saturação do pool; tirar a auditoria do caminho da resposta; timeout no e-mail; timezone explícito; expurgo com catch-up; listagem enxuta — **sem mudar o comportamento observável**.

**Non-Goals:** busca por prefixo/FULLTEXT (M-12), exportação no servidor/streaming (M-13), paginação do endpoint de e-mails (B-24) — mudam contrato/resultado; reaproveitar a matriz no request (B-27) — já existe (`permission.ts` memoiza em `event.context`).

## Decisions

### D1 — Índice para a aba Segurança (migration aditiva 12)
`CREATE INDEX idx_usuarios_bloqueado_ate ON usuarios (bloqueado_ate);` (e, se útil, cobrir `tentativas_falhas`). Idempotente (o runner tolera `1061`). Alternativa: índice composto — desnecessário para a consulta atual.

### D2 — Agregado de auditoria por índice
Separar em duas consultas: `SELECT COUNT(*)` (servido por `idx_audit_data_hora_id`) e `SELECT COUNT(DISTINCT usuario_nome)` (adicionar `idx_audit_usuario` se ausente, na migration 12). KPIs idênticos. Alternativa: materializar KPIs — complexidade desnecessária.

### D3 — Cache das opções de filtro
Cache em memória com TTL curto (ex.: 30 s) para as `opcoes` (conjunto **não filtrado**, global) de Usuários e Auditoria, evitando 2 `DISTINCT` por listagem. Trade-off assumido: opções podem levar até o TTL para refletir um cadastro novo (aceitável; documentado). Alternativa: invalidar em cada escrita — mais acoplamento.

### D4 — Paralelismo do pool
Reduzir o número de conexões simultâneas por listagem (executar a página e o agregado sem disparar todas as queries de uma vez / limitar a 2–3 concorrentes), aliviando o `connectionLimit`. Mesmos resultados.

### D5 — Listagem enxuta + `GET /api/usuarios/:id`
Projetar na listagem apenas as colunas exibidas (`nome`, `email`, `perfil`, `situacao`, `ultimo_login`, `id`). Os blocos que hoje usam endereço/SMTP/avatar vêm do **detalhe por id**: novo `GET /api/usuarios/:id` (`gestao-usuarios/visualizar`) que devolve `buscarUsuarioTelaPorId`; o modal de edição busca o registro ao abrir. O modal continua com os mesmos campos.

### D6 — Auditoria fora do caminho da resposta
Dentro de `registrarAuditoria`, montar o trabalho de INSERT e, havendo `event.waitUntil` (Nitro), agendá-lo e retornar; senão, aguardar (fallback). Os chamadores seguem chamando `await registrarAuditoria(...)` (agora barato). Mantém o `try/catch` e o registro no fluxo normal.

### D7 — Timeout no envio de e-mail
`enviarEmail` passa `signal: AbortSignal.timeout(Number(process.env.MAIL_TIMEOUT_MS) || 10000)` ao `$fetch`, evitando requisição pendurada. Falha → erro (o `convite` responde `502`; a recuperação loga) como hoje.

### D8 — Timezone do pool explícito
Adicionar `timezone: process.env.DB_TIMEZONE || 'local'` ao pool e a env `DB_TIMEZONE`, **preservando** o comportamento atual por padrão ('local') e permitindo fixá-lo explicitamente em produção. Alternativa: cravar 'Z' — deslocaria os horários atuais (não é behavior-preserving).

### D9 — Expurgo com catch-up no boot
Nova `executarExpurgo()` em `server/utils/expurgo.ts` roda uma vez no boot (após `garantirEventScheduler`), best-effort, aplicando os mesmos `DELETE` dos eventos (sessões expiradas/revogadas, tokens vencidos, log de segurança da janela). Cobrir o caso de o horário agendado ter passado com o servidor fora.

### D10 — Observações (sem mudança de código de comportamento)
Documentar no `docs/02`/`docs/RL04`: `token_blacklist`/`tokens_acesso` sem uso (OBS-02), colunas de `configuracoes_limite_requisicao` sem uso (OBS-03), manutenção de `departamento_setor` vazio na importação conforme a spec (OBS-06) e a retenção de auditoria configurada (OBS-07).

## Risks / Trade-offs

- **Cache de opções (TTL)** → opções levemente defasadas (≤ TTL); documentado.
- **`waitUntil`** → em queda do processo logo após a resposta, o registro da trilha pode não persistir (idêntico a qualquer trabalho pós-resposta); aceitável.
- **`GET /:id`** → +1 requisição ao abrir a edição; em troca, listagem muito mais leve.
- **Timezone 'local'** → não muda nada hoje; o ganho é ter o controle explícito por env.
- **Migration 12** → aditiva e idempotente; sem DROP.

## Migration Plan

1. Migration 12 (índices `usuarios.bloqueado_ate` e, se necessário, `auditoria.usuario_nome`).
2. Backend: agregado de auditoria; cache de opções; paralelismo; `registrarAuditoria` via `waitUntil`; timeout no mailer; timezone do pool; `executarExpurgo` no boot.
3. Frontend + API: projeção da listagem + `GET /api/usuarios/:id` + fetch no modal de edição.
4. Verificar por `npm run build` + E2E: listagens/KPIs idênticos; aba Segurança por índice; modal de edição com os mesmos campos; `EXPLAIN` sem `table scan`.
5. **Rollback:** reverter os commits; a migration 12 é aditiva (o rollback documentado no arquivo remove os índices).

## Open Questions

Nenhuma pendente que altere specs, abordagem ou tarefas.
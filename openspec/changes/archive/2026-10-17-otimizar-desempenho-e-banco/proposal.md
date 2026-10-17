# Proposal

## Why

A varredura RL04 apontou gargalos de escala na Etapa 4 (Performance e banco) que não mudam o comportamento observável do sistema, mas encarecem listagens e escritas conforme a base cresce: fanout de ~6 queries por listagem, agregado de auditoria em full scan, falta de índice em `usuarios.bloqueado_ate` (aba Segurança), sobre-carga de colunas na listagem de usuários, paralelismo que satura o pool, `registrarAuditoria` aguardada no caminho da resposta, envio de e-mail sem timeout, ausência de `timezone` no pool e expurgo criado mas sem catch-up. São os itens RL04-M-10, M-11, M-14, M-15, M-16, B-23, B-25 e B-26, além do OBS-05 (timezone) e do acompanhamento dos OBS-02/03/06/07.

## What Changes

- **Índice em `usuarios.bloqueado_ate`** (migration aditiva 12) para a varredura da aba Segurança.
- **Agregado de auditoria**: separar `COUNT(*)` (varredura por índice) de `COUNT(DISTINCT usuario_nome)` (índice próprio), mantendo os mesmos KPIs.
- **Menos round-trips por listagem**: cachear as `opcoes` de filtro (mudam raramente) e reaproveitar a sessão já resolvida pelo middleware.
- **Pool sob concorrência**: reduzir o paralelismo por listagem (menos conexões simultâneas), preservando os mesmos resultados.
- **Listagem enxuta**: a listagem de usuários passa a projetar apenas as colunas exibidas; o detalhe da edição é obtido por um `GET /api/usuarios/:id` (novo) quando o modal abre — o modal continua exibindo os mesmos campos.
- **Auditoria fora do caminho da resposta**: `registrarAuditoria` roda após a resposta via `event.waitUntil` (sem perder o registro no fluxo normal).
- **Timeout no envio de e-mail**: `enviarEmail` ganha `AbortSignal`/timeout, evitando requisições penduradas no provedor.
- **Timezone do pool fixado**: conexão MySQL em um fuso explícito e consistente com o banco, sem deslocar os horários atuais.
- **Expurgo com catch-up**: além dos eventos diários (migration 11), executar o expurgo uma vez no boot, cobrindo o caso em que o horário agendado passou enquanto o servidor estava fora.
- **Observações**: documentar `token_blacklist`/`tokens_acesso` sem uso (OBS-02), colunas de `configuracoes_limite_requisicao` sem uso (OBS-03), a decisão de manter `departamento_setor` da importação como vazio conforme a spec (OBS-06) e a retenção de auditoria (OBS-07).

**Sem mudança de comportamento observável.** Ficam **fora** (por mudarem contrato/resultado): busca por prefixo/FULLTEXT (M-12), exportação gerada no servidor/streaming (M-13) e limite/paginação do endpoint de e-mails (B-24). O reaproveitamento da matriz no request (B-27) já existe (`permission.ts` memoiza por `event.context`).

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
<!-- Nenhuma: otimizações preservam o comportamento observável (skip_specs declarado). -->

## Impact

- **Backend:** `server/migration/12_indices_seguranca.sql` (novo), `server/utils/audit.ts` (agregado, `waitUntil`), `server/utils/usuarios.ts` (projeção + `GET /:id`), `server/api/usuarios/[id]/index.get.ts` (novo), `server/api/seguranca/**` (índice), `server/utils/{db,mailer,expurgo}.ts`, `server/utils/perfis.ts`/`permission.ts` (cache de opções/sessão), `nuxt.config.ts` (timezone do pool via env).
- **Frontend:** `app/components/usuarios/useUsuarios.ts` + `Formulario.vue` (buscar detalhe por id na abertura da edição).
- **Banco:** migration aditiva 12 (índice) — sem DROP; o runner tolera `1061` (índice já existe).
- **Documentação:** `docs/02` (timezone/índice) e `docs/RL04` (status da Etapa 4).
- **Dependências:** nenhuma.
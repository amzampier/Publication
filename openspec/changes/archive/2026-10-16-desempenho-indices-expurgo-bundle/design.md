# Design

## Context

Ver `proposal.md` para a motivação (RL03 Etapa 4).

Estado atual relevante (leitura somente):

- `server/utils/audit.ts:183` — `ORDER BY data_hora DESC, id DESC`; migration 01 tem
  `idx_audit_data_hora (data_hora DESC)` (sem `id`) → `Using filesort`.
- `server/utils/seguranca.ts:165-170` — `ORDER BY ocorrido_em DESC, id DESC`; migration 05 tem
  `idx_seguranca_eventos_ocorrido_em (ocorrido_em DESC)` → `filesort`.
- `server/utils/usuarios.ts:307-315` — `ORDER BY u.nome_completo ASC` sem índice em `nome_completo`;
  busca `(nome LIKE ? OR email LIKE ?)` com `%termo%`.
- Expurgo atual: apenas `ev_expurgo_auditoria` (migration 10). Não há DELETE de `sessoes`,
  `token_blacklist` nem `seguranca_eventos_login`.
- `server/migration-runner.ts` divide o `.sql` por `;` (naive) — um `CREATE EVENT ... DO BEGIN ... END`
  com vários statements internos quebraria o split; migrations atuais usam eventos de statement único.
- `server/utils/db.ts:16-34` — pool sem `connectTimeout`/`acquireTimeout` (já tem `dbPoolLimit`/
  `dbPoolQueueLimit`).
- `server/utils/audit.ts:120` — `detalhes.slice(0, 16_000_000)`.
- Geradores de PDF (`usuarios/gerarPdfUsuarios.ts`, `usuarios/gerarPdfFichaCadastral.ts`,
  `auditoria/gerarPdfAuditoria.ts`, `perfis/gerarPdfPerfis.ts`) importam `jspdf`/`jspdf-autotable`
  estaticamente; os `Cabecalho.vue` importam os geradores estaticamente.

## Goals / Non-Goals

**Goals:**
- Eliminar `filesort`/full-scan das listagens de auditoria/segurança/usuários (índices).
- Impedir crescimento indefinido de `sessoes`/`token_blacklist`/`seguranca_eventos_login` (expurgo).
- Tirar o `jspdf` do bundle inicial das telas de usuários/auditoria/perfis.
- Endurecer o pool e limitar `detalhes`; reduzir desperdício de escrita (menores).

**Non-Goals:**
- Não alterar resultados/contratos de API nem a atomicidade da importação.
- Não migrar dados existentes (índices/eventos são aditivos).
- Não tratar os demais achados do RL03 (documentação/UX).

## Decisions

### D1 — Índices compostos aditivos (migration 11)
Adicionar `idx_audit_data_hora_id (data_hora DESC, id DESC)`,
`idx_seguranca_ocorrido_id (ocorrido_em DESC, id DESC)` e `idx_usuarios_nome (nome_completo)`. Os
índices compostos casam exatamente com os `ORDER BY` existentes, eliminando o `filesort` sem
alterar a ordenação. São `CREATE INDEX` simples (statement único), cujo errno `1061` o runner já
tolera — não há `DROP` (migrações não destrutivas).

- **Por que não** remover o desempate `id DESC` dos `ORDER BY`: mudaria a estabilidade/contrato da
  paginação; o índice composto resolve sem tocar no comportamento.

### D2 — Expurgo por eventos de statement único (migration 11)
Três eventos diários (`ev_expurgo_sessoes`, `ev_expurgo_token_blacklist`,
`ev_expurgo_seguranca_login`), cada um com um único `DELETE`, agendados a ~03:10 (após o de
auditoria às 03:00) e criados com `CREATE EVENT IF NOT EXISTS`. Retenções fixas (constantes):
- `sessoes`: `(revogado_em IS NULL AND expira_em < NOW(6)) OR (revogado_em IS NOT NULL AND revogado_em < NOW(6) - 1 DAY)`.
- `token_blacklist`: `expira_em < NOW(6)`.
- `seguranca_eventos_login`: `ocorrido_em < NOW(6) - 90 DAY`.

- **Por que 3 eventos:** o runner divide por `;`; um `BEGIN…END` com múltiplos `DELETE` quebraria o
  parser. Três eventos de statement único seguem exatamente o padrão do migration 10.
- **Por que 90 dias (fixo):** não há UI/config para a retenção do log de segurança; janela fixa
  razoável, documentada como decisão. (Suposição registrada — a retenção de auditoria continua
  configurável via `dias_retencao_auditoria`.)

### D3 — jspdf lazy nos 4 geradores
Converter os imports estáticos em `await import('jspdf')` / `await import('jspdf-autotable')`
**dentro** da função exportada, mantendo o mesmo API (`jsPDF`, `autoTable(doc, …)`). Os
`Cabecalho.vue` continuam importando os geradores (agora sem puxar o `jspdf`); o chunk pesado só
carrega no clique de exportar.

### D4 — Pool com timeouts configuráveis
Adicionar `connectTimeout` e `acquireTimeout` ao `createPool`, lidos de `DB_CONNECT_TIMEOUT`/
`DB_ACQUIRE_TIMEOUT` (ms) com defaults razoáveis (ex.: 10s cada). Não muda o comportamento em
condições normais; evita espera indefinida em saturação.

### D5 — Teto de `detalhes` e escritas menores
- `detalhes`: reduzir o teto de `16_000_000` para `8_000` (8 KB) em `audit.ts`.
- `salvarMatriz`/`copiarMatriz`: um único INSERT multi-row em vez de loop por módulo.
- `carregarVinculos`: contagem só quando necessária (listagem), não a cada `buscarPerfil`.
- `migrarSenhasSmtp`: um único `UPDATE` (batch) em vez de N updates no boot.

## Risks / Trade-offs

- **[Janela fixa do log de segurança (90 dias)]** → perda de eventos muito antigos; aceitável e
  intencional (não há requisito de retenção indefinida). Documentado.
- **[Evento requer privilégio EVENT + scheduler]** → já é o caso do expurgo de auditoria; o boot
  garante o scheduler best-effort. Se indisponível, o expurgo simplesmente não roda (não quebra o app).
- **[Índices novos]** → custo de escrita marginal e espaço; ganho de leitura nas listagens.
- **[jspdf dinâmico]** → import async adiciona um `await` no clique; sem impacto funcional.

## Migration Plan

- Migration `11_indices_e_expurgo.sql` aditiva (índices + eventos), rollback comentado ao final
  (`DROP INDEX`/`DROP EVENT`).
- Deploy de código + migration; rollback = reverter código e executar o bloco de rollback manual.

## Open Questions

(nenhuma)

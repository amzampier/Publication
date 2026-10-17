# Design

## Context

Ver `proposal.md` para a motivação (RL03 Etapa 7).

Estado atual relevante (leitura somente):

- `server/migration/02_seed.sql:48` — linha do Editor em `release-week`:
  `pode_visualizar=1, pode_incluir=1, pode_editar=1, pode_excluir=0, extras=["publicar","arquivar","download","exportar"]`
  (o seed totaliza **45/99** para o Editor). O banco de desenvolvimento está em **42/99**: essa linha
  perdeu as 3 ações fixas e mantém só os extras.
- `server/utils/audit.ts` — `ipDoCliente(event)` usa `getRequestIP(event, { xForwardedFor: trust })`;
  no runtime de dev o IP saiu `0.0.0.0` (fallback), o que precisa ser revalidado em produção.
- Erros de rota usam `createError`; o Nitro em produção geralmente omite `stack` (em dev, inclui) —
  validar no build.
- Migration 01 — `entregas_itens.release_id → release_week` `ON DELETE CASCADE`;
  `historico_esteira_revisao.entrega_item_id → entregas_itens` `ON DELETE RESTRICT`.

## Goals / Non-Goals

**Goals:**
- Restaurar o dado do Editor ao estado do seed (45/99) sem migration.
- Confirmar o comportamento de produção (IP e ausência de `stack`).
- Deixar registrado o plano de `CASCADE`×`RESTRICT` para o conteúdo público.

**Non-Goals:**
- Não implementar o conteúdo público (roadmap) nem alterar o schema.
- Não alterar a matriz de outros perfis (Admin 99 / Revisor 21 / Leitor 6 devem permanecer).

## Decisions

### D1 — Restauração do Editor por operação pontual (sem migration)
Re-gravar a matriz do Editor conforme o seed (via `PUT /api/perfis/:editorId/permissoes` com a matriz
do seed, ou um `UPDATE` pontual da linha `release-week` para `1,1,1,0` + extras do seed). A migration
`02_seed.sql` usa `INSERT` (ignorado em duplicidade), então reexecutá-la **não** corrige a linha
existente — a correção precisa ser explícita.

- **Por que não** criar migration de re-seed: a matriz é editável pelo administrador; uma migration
  que sobrescreve valores legítimos seria destrutiva. A divergência é resíduo de QA.
- **Verificação:** `GET /api/perfis` → Editor 45/99 (Admin 99, Revisor 21, Leitor 6). Se a divergência
  reaparecer sem edição manual, reabrir como bug de código (conforme o RL03).

### D2 — Verificação de produção (B-21/22)
Subir o build de produção (`.output`) e exercitar uma rota de erro (`401`/`400`) para confirmar que a
resposta **não** traz `stack`, e conferir o `ip` registrado na trilha/log de segurança (deve ser o IP
da conexão, não `0.0.0.0`). Se o IP continuar vazio em produção, registrar como achado/follow-up —
sem alterar código sem causa reproduzível.

### D3 — Nota de arquitetura `CASCADE`×`RESTRICT` (M-14)
Registrar em `docs/02` (seção de migrations/modelo) que excluir uma `release_week` cascateia para
`entregas_itens`, mas é bloqueada (`errno 1451`) pelo `ON DELETE RESTRICT` de
`historico_esteira_revisao`; ao implementar a exclusão de releases no futuro, decidir entre apagar o
histórico antes (transação) ou trocar a FK para `CASCADE`/`SET NULL`.

## Risks / Trade-offs

- **[Editar o dado errado]** → restaurar apenas a linha `release-week` do Editor para o seed; validar
  os 4 totais.
- **[Verificação de produção exige DB]** → se o ambiente não permitir, registrar a limitação e a
  evidência parcial (build + inspeção do handler de erro do Nitro).

## Migration Plan

- Sem migration. Restauração de dado operacional + documentação.
- Verificação: `GET /api/perfis` (totais) + build de produção + `openspec validate --specs`.

## Open Questions

(nenhuma)

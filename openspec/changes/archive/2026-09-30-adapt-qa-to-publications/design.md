# Design

## Context

Ver `proposal.md` (Why) para a motivação. Estado atual verificado no repositório:

- 8 documentos em `docs/qa/` (2.7–6.9 KB cada; `00` é a base compartilhada obrigatória) e 8 definições de agente em `.opencode/agent/` (`qa.md` orquestrador + 7 especialistas, todos com `permission.edit: deny`), registrados como subagentes do opencode (qa-banco, qa-documentacao, qa-execucao, qa-funcional, qa-performance, qa-seguranca, qa-ux).
- 45 matches de resíduo FinancePro/multi-tenant em `docs/qa/` (identidade, severidade, etapas 2/3/6/7/9, matriz de aprovação) + ocorrências equivalentes nos 8 agentes.
- Fatos que **já batem** com `docs/01`/`docs/02` e serão preservados: JWT/cookie HttpOnly + refresh rotativo + blacklist, bcrypt cost 12, `requirePermission(event, modulo, acao)` + `perfil_permissoes`/`permissoes_extras` sem bypass, `PUBLIC_ROUTES`/`PUBLIC_PREFIXES`, Zod, queries parametrizadas, migrations `server/migration/` + `_migrations`, pool `connectionLimit: 10`/`queueLimit: 50`, regra de maturidade ("escopo não aplicável" nunca é FAIL), formato de relatório, matriz de aprovação e as 9 etapas do processo.
- Fatos divergentes corrigíveis só em doc: `USE financepro;` (03 L22), lista de 17 componentes (05 L34 — o diretório tem **19**, incluindo `UiModal`/`UiModalSection`), variantes de toast `success, error, warning, info` (05 L35 — o real é `success | warning | danger | info` em `app/composables/useToast.ts:3`).
- `openspec/specs/` está vazio (só `.gitkeep`) — nenhum capability auditável hoje; os docs de QA já derivam inventário via `openspec list --specs`, mas não tratam o caso vazio.
- Não há `server/`, nem auth/banco implementados — a regra de maturidade dos docs já cobre isso.

## Goals / Non-Goals

**Goals:**

- Migrar toda a base de QA de "isolamento multi-tenant" para **fronteira Área Pública × Área Administrativa + RBAC**, preservando processo, formato e matriz de aprovação.
- Corrigir fatos stale (componentes, variantes de toast, nome do banco) e dar tratamento ao inventário de specs vazio.
- Manter os docs no nível de **processo** (decisão do usuário, Opção A): nenhum fato de domínio além de exemplos pontuais — a fonte de verdade continua sendo specs + `docs/01` + `docs/02`.

**Non-Goals:**

- Alterar qualquer arquivo de código (`app/**`, `server/**`) — inclusive o resíduo FinancePro em `app/pages/design.vue:1294` (próxima fase, decidido pelo usuário).
- Criar specs em `openspec/specs/`.
- Trocar o número de etapas, o formato de relatório ou a matriz de aprovação (só os itens de tenant dentro deles).
- Reescrever a arquitetura descrita em `00` §Arquitetura além do bullet de tenancy (o restante é fiel a `docs/02`).

## Decisions

1. **Tabela conceitual única de migração** (aplicada nos 16 arquivos, garante coerência):
   - Isolamento multi-tenant / vazamento entre filiais (Crítica) → **bypass da fronteira de áreas** (acesso a `/admin/**` ou escrita sem sessão/permissão) e **exposição de conteúdo não publicado na Área Pública** (Crítica).
   - Filtro de tenant em queries → **filtro de visibilidade** (`status`/`ativo`) nas queries públicas; o filtro público não pode contaminar operações administrativas.
   - Valores monetários / conciliação / estorno → conteúdo perdido/duplicado, status divergente entre admin e vitrine, slug duplicado, fronteiras de data/agendamento.
   - `USE financepro;` → `USE publications;`.
   - Alternativa descartada: manter um "equivalente de tenant" (seria inventar arquitetura que `docs/02` explicitamente não prevê — "não há empresas nem filiais").

2. **Negação explícita de multi-tenancy em no máximo 1–3 frases** (em `00` e no briefing do orquestrador `qa.md`): sem uma frase do tipo "escopo único — não invente testes de tenant", um LLM especialista tende a recriar as checagens que estamos removendo. Alternativa descartada: zerar a palavra "tenant" por completo (deixa a porta aberta para regressão conceitual na próxima geração de agente). Consequência aceita no grep de aceitação: ocorrências de `tenant` permitidas **somente** nessas frases de negação.

3. **`00` permanece a única fonte de severidade/processo.** As mudanças de exemplos de severidade (Crítica/Alta) e da matriz de aprovação acontecem só em `00`; os demais documentos referenciam `00` e não duplicam a matriz — evita divergência interna.

4. **Docs no nível de processo (Opção A, decisão do usuário):** os docs não embutem o enum de status nem a regra "`status=publicado AND ativo`" como asserts; citam "status público conforme a fonte da verdade" e apontam para specs/`docs/01`/`docs/02`. Exemplos de domínio ficam limitados aos que já existem hoje no estilo de escrita dos docs.

5. **Inventário vazio tratado como lacuna de documentação, não FAIL** (alinhado à regra de maturidade do próprio `00`): nota curta em `01` e `04` — sem `openspec/specs/*`, não há requisitos formais; a auditoria se apoia em `docs/01`/`docs/02` e reporta a ausência de spec.

6. **Correções de fato stale vão junto** (17→19 componentes, variantes de toast, `USE publications;`): são erros objetivos verificáveis no código, custo zero e evitam que o agente de UX audite um kit inexistente. Alternativa descartada: adiar para outra mudança (manteria os docs errados durante toda a fase de desenvolvimento).

7. **Estrutura e nomes de arquivo intactos:** `00..07` e os 8 `.opencode/agent/qa*.md` mantêm paths, seções e frontmatter (`mode`, `permission.edit: deny`) — só o conteúdo é migrado. Qualquer renomearia quebraria os `L12-L14` de leitura prévia cruzada entre docs e agentes.

## Risks / Trade-offs

- [Resíduos FinancePro escaparem da revisão] → Grep de aceitação final nos 2 diretórios: `FinancePro|Filial|Matriz|financepro|estornar|concilia|CNPJ|SEFAZ|monetári|ERP` = zero; `tenant|multi-tenant|multi-tenancy` apenas em frases de negação; `17 componentes` = zero.
- [Remover checagens de tenant reduzir a "pegada" de segurança] → Mitigado: a fronteira de áreas + RBAC cobre o risco real do sistema (bypass de auth, conteúdo restrito vazando); mantidos SQLi/XSS/CSRF/upload/sessão/rate limit intactos na etapa 9.
- [Opção A deixar os docs vagos sobre domínio] → Aceito e consciente: é a regra do próprio `00` ("nunca assumir comportamentos não documentados"); quando as capabilities forem especificadas, os agentes passam a ler `openspec/specs/<capability>/spec.md` como fonte (já é o fluxo previsto).
- [Fatos em `00` §Arquitetura descreverem backend inexistente] → Já é assim hoje e funciona: a seção declara os estados "a construir" como escopo não aplicável; apenas o bullet de tenancy é corrigido (o antigo estava errado até como meta).

## Migration Plan

Sem implantação. Ordem: `00` primeiro (base conceitual), depois `01..07` (trocas guiadas por `00`), depois os 8 agentes (especificações curtas dos docs), por fim greps de aceitação. Rollback = git (texto puro).

## Open Questions

Nenhuma bloqueante.

# Proposal

## Why

Os artefatos de QA do projeto (`docs/qa/00..07` — 8 documentos — e as 8 definições de agente em `.opencode/agent/qa*.md`) foram escritos para o FinancePro e ainda mandam o agente auditar **isolamento multi-tenant (Matriz/Filial)**, vazamento entre filiais, precisão de valores monetários e a convenção `USE financepro;` — verificações inválidas num sistema de escopo único como o Publications (Dicas Teorema), que seriam fonte de falsos FAILs ou fariam o agente inventar testes de tenant. A adaptação é necessária agora porque os docs de QA são a base de qualquer auditoria das funcionalidades a serem desenvolvidas (Área Pública e Área Administrativa).

## What Changes

- **`docs/qa/00-arquitetura-e-regras-gerais.md`** (base compartilhada de todos os agentes): identidade "Agente Oficial de QA do Publications (Dicas Teorema)"; foco reescrito de "ERP financeiro/bancário multi-tenant" para sistema de publicação com Área Pública anônima × Área Administrativa (auth + RBAC); bullet "Multi-tenancy" substituído por "Escopo único (não há empresas nem filiais) — proteção = fronteira de áreas + RBAC" (única frase negadora de tenant); exemplos de severidade (Crítica/Alta) reescritos para domínio de conteúdo; cobertura, relatório, matriz de aprovação e regras absolutas trocam "isolamento entre tenants" por "fronteira Área Pública × Área Administrativa". Fatos de backend/auth/RBAC/banco permanecem (já fiéis a `docs/02`).
- **`docs/qa/01-qa-funcional.md`**: itens de tenant nas etapas 2–4 e nos critérios/BDD viram checagens de fronteira de áreas (rota admin sem sessão; não-publicado na Área Pública); "precisão monetária" → fronteiras de data/status; seção `## Multi-tenant` → `## Fronteira de Áreas`; nota sobre inventário de specs vazio (`openspec list --specs` sem capabilities).
- **`docs/qa/02-qa-seguranca.md`**: §Multi-tenancy → §Fronteira de áreas (rotas públicas declaradas × `/admin/**`; tudo não-declarado-público é privado por padrão; Área Pública só expõe status públicos conforme fonte da verdade); etapas 6/9 perdem checagens de tenant e ganham "exposição de conteúdo não publicado" e "acesso admin sem sessão/permissão" como **Crítica**.
- **`docs/qa/03-qa-banco.md`**: `USE financepro;` → `USE publications;`; lista de tabelas de infra alinhada a `docs/02` (inclui `perfis`); colunas de tenant → colunas de status/visibilidade; §Isolamento por tenant → §Visibilidade pública (filtro `status`/`ativo` nas queries da Área Pública, busca por ID público nunca retorna não-publicado, filtro público não afeta operações administrativas).
- **`docs/qa/04-qa-documentacao.md`**: identidade + nota de inventário de specs vazio (sem spec → lacuna de documentação, não violação de código).
- **`docs/qa/05-qa-ux.md`**: lista do UI kit corrigida de **17 → 19 componentes** (+ `UiModal`, `UiModalSection`); variantes de toast corrigidas para `success | warning | danger | info` (fonte: `app/composables/useToast.ts`); §Consistência multi-tenant → §Consistência entre áreas; "estornar" → "arquivar"; "valores monetários" → "datas, códigos e slugs".
- **`docs/qa/06-qa-performance.md`**: custo do filtro de tenant → custo do **filtro de visibilidade** (`status`/`ativo`) nas queries da Área Pública (com índice cobrindo-o).
- **`docs/qa/07-qa-execucao-e2e.md`**: cenário de isolamento multi-tenant → cenários da fronteira de áreas (sem sessão em `/admin/**` → 401/403; sem permissão → 403; não-publicado não aparece na Área Pública).
- **`.opencode/agent/qa.md`** (orquestrador): identidade/description; briefing de tenant → "fronteira de áreas + RBAC em todos os especialistas"; Crítica reinterpretada; regra final "nunca omitir … isolamento entre tenants" → fronteira de áreas; nota de inventário vazio.
- **7 agentes especialistas** (`qa-funcional`, `qa-seguranca`, `qa-banco`, `qa-documentacao`, `qa-ux`, `qa-performance`, `qa-execucao`): identidade, descriptions e instruções migradas pela mesma tabela conceitual (tenant → fronteira/visibilidade; 17 → 19 componentes; variantes de toast corrigidas; "monetária" → numérico/códigos).
- **Sem mudança em código**: nenhum arquivo de `app/**` ou `server/**` é alterado; resíduos FinancePro em código (ex.: `app/pages/design.vue:1294`) ficam para a próxima fase.

## Capabilities

### New Capabilities

<!-- nenhum -->

### Modified Capabilities

<!-- nenhuma — mudança pura de documentação de QA, sem alteração de comportamento -->

> **`skip_specs: true`**: esta change é documental (docs de processo de QA e definições de agentes). Nenhum requisito de spec é criado ou alterado — specs descrevem comportamento, e o comportamento do sistema não muda aqui.

## Impact

- **Arquivos alterados:** 8 em `docs/qa/` + 8 em `.opencode/agent/` (16 no total, todos markdown/yaml).
- **Código:** nenhum; `npm run build` não é afetado.
- **Dependências/sistemas:** nenhuma.
- **OpenSpec:** change `adapt-qa-to-publications` com `skip_specs: true`; `openspec/specs/` continua vazio (capabilities ainda não especificadas — as notas de inventário vazio nos docs de QA cobrem esse estado).

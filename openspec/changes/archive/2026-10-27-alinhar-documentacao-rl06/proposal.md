# Proposal

## Why

A auditoria documental do RL06 ainda encontra contradições entre a fonte da verdade (`openspec/specs/**`) e o código atual: a Data de liberação de Lançar as Chamadas é somente leitura no formulário, mas a spec/`docs/15` a descrevem como editável; a importação XLSX valida segunda-feira/dia útil, mas `docs/15` diz o contrário; o KPI do Painel é descrito como “mesma regra da Esteira”, embora use fórmula própria; e restam divergências de contagens, permissões e referências históricas em docs 01/02/03/05/06/07. Isso impede aprovar a parte documental sem ressalvas.

## What Changes

- Alinhar a spec de `lancar-chamadas` ao comportamento real: **Data de liberação somente leitura** (herdada da Release) e importação submetida à mesma validação de segunda-feira/próximo dia útil da criação.
- Alinhar a spec de `painel-executivo`: o KPI de fluxo usa o **mesmo universo** da Esteira, mas **fórmula própria** (inclui `Publicado`).
- Alinhar a spec de `autorizacao-rbac`: paginação isolada de `GET /api/usuarios` exige apenas `visualizar`; `filtrar` só com filtros reais; `GET /api/usuarios/emails` exige `visualizar` + `buscar`.
- Corrigir a documentação viva: `docs/15`, `docs/17`, `docs/02`, `docs/03`, `docs/05`, `docs/06`, `docs/07`, `docs/01` e `docs/bd/02_seed.sql`.
- Adicionar nota de snapshot ao RL06: contagens de 42/30/84/18/36/15 são históricas (commit `85c79c8`); estado atual 46/40/86/18/39/16; `docs/18` removido.
- Não alterar código, migrations, banco ou testes de comportamento. `server/migration/02_seed.sql` permanece imutável; a divergência de totais é registrada em documentação.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `lancar-chamadas`: Data de liberação somente leitura e validação de datas na importação XLSX.
- `painel-executivo`: definição do KPI de fluxo (mesmo universo da Esteira, fórmula própria).
- `autorizacao-rbac`: mapeamento de permissões de `GET /api/usuarios` e `GET /api/usuarios/emails`.

## Impact

- Specs: `openspec/specs/lancar-chamadas/spec.md`, `openspec/specs/painel-executivo/spec.md`, `openspec/specs/autorizacao-rbac/spec.md`.
- Docs: `docs/15`, `docs/17`, `docs/02`, `docs/03`, `docs/05`, `docs/06`, `docs/07`, `docs/01`, `docs/bd/02_seed.sql`, `docs/RL06 - Relatório Completo Final Area Administrativa.md`.
- Código/runtime: nenhuma alteração.
- Banco/migrations: nenhuma alteração; apenas nota sobre o cabeçalho histórico da migration 02.

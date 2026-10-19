# Proposal: zerar-seed-auditoria

## Why

Um banco provisionado do zero já nasce com 25 registros fictícios na tabela `auditoria`, inseridos pelas migrations `07_seed_auditoria.sql` e `13_reconciliar_seed_e_indice.sql`. A trilha de auditoria é um registro corporativo real; ela deve começar **vazia** e ser preenchida exclusivamente pelas operações reais (escritas administrativas e eventos de autenticação). O seed contamina qualquer ambiente novo e cria dados que não correspondem a ações de fato executadas — exatamente o achado RL02 M-20 ("Seed de auditoria grava 25 registros fictícios · Trilha real poluída em qualquer ambiente novo").

## What Changes

- **BREAKING (dados de seed):** a tabela `auditoria` deixa de persistir qualquer registro de demonstração; um banco novo termina o provisionamento **zerado**.
- Adiciona a migration `18_remover_seed_auditoria.sql`, que apaga as linhas `log-seed-%` ao final do provisionamento. Em banco novo ela roda depois das `07`/`13` (que inserem o seed) e o remove; em banco já provisionado ela purga o seed remanescente. O `DELETE` é escopado ao identificador do seed — nenhum registro real da trilha é tocado.
- As migrations `07_seed_auditoria.sql` e `13_reconciliar_seed_e_indice.sql` permanecem **intactas**: a convenção do projeto é *nunca editar migration já executada* (`docs/qa/03`), então a correção entra como migration nova (mesmo padrão da `13`, criada para reconciliar a `07`).
- Atualiza `docs/05 §7` (dados iniciais) e a verificação da página: a tela de auditoria abre em estado vazio até que existam operações reais.
- Atualiza as specs `auditoria` e `migracoes-banco` para refletir "trilha inicia zerada".

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova. -->

### Modified Capabilities
- `auditoria`: o carregamento da página passa a esperar apenas **operações reais** na trilha (sem "seed da migration"); em banco novo a tabela/KPIs ficam vazios. Adiciona o cenário de banco recém-provisionado sem registros.
- `migracoes-banco`: o requirement "Seeds iniciais completos" passa a declarar a `auditoria` (e a trilha de segurança derivada) sem seed; explicita que a correção de seed inadimplente é feita por `DELETE` escopado, sem afetar a proibição de `DROP TABLE`/`VIEW`/`DATABASE`.

## Impact

- **Migrations:** `server/migration/07_seed_auditoria.sql` e `13_reconciliar_seed_e_indice.sql` (remoção do `INSERT`), nova `18_remover_seed_auditoria.sql`.
- **Docs:** `docs/05 - Gestão de Auditoria.md` (§7, §12); referência em `docs/02`.
- **Specs:** `openspec/specs/auditoria/spec.md`, `openspec/specs/migracoes-banco/spec.md`.
- **Sem impacto em frontend/API:** `GET /api/auditoria` já devolve o conjunto vazio, KPIs zerados e estado vazio; nenhuma rota ou componente muda.
- **Bancos já provisionados:** a migration 18 purga o seed; a trilha real permanece íntegra.

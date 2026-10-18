# Proposal

## Why

Hoje o provisionamento insere um **catálogo de softwares de exemplo** (`SFT-001`…) em toda base
nova. Em um banco zerado não deve existir nenhum software cadastrado — o catálogo deve nascer
**vazio**, coerente com o princípio já adotado no frontend de nunca apresentar dados fictícios como
se fossem persistidos.

## What Changes

- **Remover** o seed `server/migration/15_seed_softwares.sql` (nenhum software é criado no boot).
- **Remover** o espelho do seed de softwares em `docs/bd/02_seed.sql`.
- **Atualizar** a documentação do módulo (`docs/10 - Módulo dos Softwares.md`) para não citar o seed.
- Os **códigos sequenciais** continuam sendo gerados pelo servidor na inclusão/importação — apenas
  não há mais catálogo pré-carregado (o primeiro software criado passa a ser `SFT-001`).

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova. -->

### Modified Capabilities
- `migracoes-banco`: o requirement **"Seeds iniciais completos"** deixa de incluir o catálogo inicial
  de softwares (o banco zerado nasce sem softwares).

## Impact

- **Banco:** remoção do arquivo de seed; bases existentes que já aplicaram a migration mantêm os
  registros (o arquivo sai do runner, mas o histórico `_migrations` permanece) — a mudança vale para
  **bases novas**.
- **Docs/spec:** `docs/bd/02_seed.sql`, `docs/10 - Módulo dos Softwares.md` e
  `openspec/specs/migracoes-banco/spec.md`.
- **Sem impacto** na API, nos componentes ou nos testes de código (a geração `SFT-XXX` não muda).

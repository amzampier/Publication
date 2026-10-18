# Proposal

## Why

O administrador inicial provisionado no banco usa o e-mail pessoal `ana.carolina@empresa.com.br`.
Como é uma conta **genérica de administração**, o e-mail deve ser `admin@empresa.com.br`.

## What Changes

- **BREAKING (provisionamento):** o e-mail do administrador inicial passa de
  `ana.carolina@empresa.com.br` para **`admin@empresa.com.br`** (`server/utils/bootstrap-admin.ts`).
- Atualização das referências de credenciais na documentação (`docs/08`, `docs/09`) e nos
  comentários espelhados (`docs/bd/02_seed.sql`, `server/migration/02_seed.sql`).
- A senha provisória (`Public@2026`), o nome exibido, o perfil Administrador e a idempotência do
  bootstrap permanecem inalterados; a mudança vale para bases novas (um admin já existente nunca é
  sobrescrito).

## Capabilities

### New Capabilities
<!-- Nenhuma capability nova. -->

### Modified Capabilities
- `migracoes-banco`: o e-mail do administrador inicial provisionado passa a ser
  `admin@empresa.com.br`.
- `login`: o cenário de credenciais demo usa o novo e-mail `admin@empresa.com.br`.

## Impact

- **Backend:** `server/utils/bootstrap-admin.ts` (`ADMIN_EMAIL`).
- **Docs/spec:** `docs/08 - Login de Autenticação.md`, `docs/09 - Meu Perfil.md`,
  `docs/bd/02_seed.sql`, `server/migration/02_seed.sql`,
  `openspec/specs/migracoes-banco/spec.md`, `openspec/specs/login/spec.md`.
- **Sem impacto** em API, componentes, schema de tabelas ou testes de código.

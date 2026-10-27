# Proposal

## Why

As telas de autenticação exibem, abaixo da logomarca, o subtítulo fixo "Área Administrativa". O texto repete uma informação já implícita na rota `/admin/**` e não acompanha a identidade personalizada configurada em Configurações > Logomarcas, competindo visualmente com a logo. Removê-lo deixa o cabeçalho do card apenas com a identidade do sistema.

## What Changes

- O layout compartilhado das telas de autenticação (`app/layouts/auth.vue`) deixa de passar o subtítulo "Área Administrativa" ao `AuthLoginHeader` — o efeito vale para `/admin/login`, `/admin/esqueci-senha` e `/admin/primeiro-acesso`.
- O componente `AuthLoginHeader` (`app/components/auth/LoginHeader.vue`) deixa de declarar e renderizar a prop `subtitulo`, removendo código morto (nenhum chamador restante a utiliza).
- **BREAKING (visual):** o card de autenticação não exibe mais a linha de subtítulo; o espaçamento entre a logomarca e o divisor verde passa a ser apenas o `mb-4` do cabeçalho.
- O `docs/08 - Login de Autenticação.md` é atualizado para descrever o cabeçalho sem o subtítulo.
- Nenhuma mudança de fluxo de autenticação, API, banco, tokens de design ou permissões.

## Capabilities

### New Capabilities

_Nenhuma._

### Modified Capabilities

- `login`: o cabeçalho do card das telas de autenticação passa a exibir somente a identidade (logomarca personalizada ou marca padrão), sem o subtítulo "Área Administrativa" — afeta o requirement de composição do login e o requirement que descreve a identidade das telas de autenticação e seus cenários.

## Impact

- **Código:** `app/layouts/auth.vue`, `app/components/auth/LoginHeader.vue`.
- **Telas afetadas:** `/admin/login`, `/admin/esqueci-senha`, `/admin/primeiro-acesso`.
- **Docs:** `docs/08 - Login de Autenticação.md` (§1 identidade e §2 tabela de estrutura).
- **Specs:** delta em `openspec/specs/login`.
- **Sem impacto** em API, autenticação, sessão, banco, migrations, permissões, tokens do design system ou demais componentes do kit.
- **Risco de regressão:** baixo e visual — apenas remoção de texto e de uma prop sem chamadores; verificação por conferência visual e pelos gates de lint/test/typecheck/build.

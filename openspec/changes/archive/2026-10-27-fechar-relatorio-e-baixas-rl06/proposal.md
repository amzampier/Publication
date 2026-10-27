# Proposal

## Why

Restam baixas documentais e de UX no fechamento do RL06: o placeholder do `UiInput` ainda usa contraste abaixo do AA; a spec de login não inclui `primeiro-acesso` na identidade das telas de autenticação; `docs/qa/05` ainda informa 25 componentes; e o RL06 mantém veredito/contagens históricas. Além disso, faltam testes de regressão para alguns comportamentos já implementados.

## What Changes

- **B-09:** elevar o placeholder de `UiInput` para `slate-500` (AA) e revisar o mesmo token nos demais campos.
- **B-19:** atualizar a spec de `login` para incluir `/admin/primeiro-acesso` na identidade das telas de autenticação; o layout `auth` e `docs/08` já cobrem a exceção de shell.
- **Docs:** atualizar `docs/qa/05` para 39 componentes e completar a lista; atualizar o RL06 com contagens atuais, achados fechados e veredito **Aprovado com ressalvas (M-07)**.
- **Testes:** cobrir filtro de status da Esteira com SQL/API, mídia por URL exata, M-09 com perfil atual, M-03 com data herdada inválida e formulário remoto por API; browser real permanece limitação declarada.
- Sem schema/migrations e sem Área Pública.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `login`: a identidade das telas de autenticação inclui também `/admin/primeiro-acesso`.

## Impact

- UI: `app/components/ui/Input.vue`.
- Specs: `openspec/specs/login/spec.md`.
- Docs: `docs/qa/05-qa-ux.md`, `docs/08`, `docs/RL06`.
- Testes: unitários/E2E de Esteira, mídia, hierarquia e data de liberação.
- Sem alteração de banco, migrations ou regras de negócio.

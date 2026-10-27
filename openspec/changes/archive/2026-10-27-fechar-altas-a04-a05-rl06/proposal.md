# Proposal

## Why

No RL06, as duas últimas Altas abertas são de **evidência**, não de comportamento novo: A-04 já tem pool maior, mapeamento de saturação para `503 + Retry-After` e uma medição antiga, mas falta uma execução N=20 reproduzível e registrada; A-05 já decidiu o invariante gate-based (“arquivar não altera as filhas; a leitura pública nega pelo pai”), mas faltam testes explícitos para os três tipos de pai e um contrato escrito para futuras leituras públicas. Fechar essas lacunas permite encerrar as 8 Altas do RL06 sem ressalvas.

## What Changes

- **A-04:** endurecer `scripts/load-painel-esteira.mjs` para falhar também quando `ok < N` ou houver `503`/`500`; executar N=20 contra o dev server com credenciais fornecidas apenas por variáveis de ambiente; registrar a medição em `docs/02`.
- **A-05:** estender `tests/visibilidade-publica.test.ts` com casos explícitos de `release`, `manual` e `projeto` arquivados (e múltiplos vínculos com um pai ativo); adicionar em `docs/02` o contrato “toda leitura pública usa `sqlVinculoPublicado`/`itemVisivelNoPortal`”.
- **RL06:** nota opcional de revalidação de A-04/A-05 em 27/10, sem reescrever os achados históricos.
- Nenhuma alteração de comportamento, schema, API ou runtime. O invariante de A-05 permanece o atual; nenhuma filha é reconciliada ao arquivar.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. A mudança é de verificação, testes e documentação; o comportamento já está descrito nas specs de `release-week`, `manuais-mensais`, `escopo-projetos` e `esteira-revisao`. Por isso o change declara `skip_specs: true`.

## Impact

- Scripts: `scripts/load-painel-esteira.mjs`.
- Testes: `tests/visibilidade-publica.test.ts`.
- Documentação: `docs/02 - Guia de Arquitetura e Migrations.md`; nota opcional em `docs/RL06 - Relatório Completo Final Area Administrativa.md`.
- Código de runtime/schema: nenhuma alteração.
- Operação: o teste de carga cria sessões e eventos de auditoria append-only; as credenciais são usadas somente em variáveis de ambiente e não são gravadas no repositório.

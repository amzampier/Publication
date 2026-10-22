# Tasks

## 1. Calendário e regra compartilhada

- [x] 1.1 Criar `shared/feriados.ts` com feriados fixos/móveis, `FERIADOS_EXTRAS`, `ehFeriadoNacional`, `ehDiaUtil`, `proximoDiaUtil`, `segundaDaSemana` e `dataPublicacaoValida`, e verificar com `npm run typecheck`
- [x] 1.2 Adicionar testes de feriados e da regra (segunda normal, terça comum, Finados 02/11/2026 e 03/11/2026, Carnaval 2026) em `tests/feriados.test.ts` e verificar com `npm run test -- tests/feriados.test.ts`

## 2. Integração na Release Week

- [x] 2.1 Atualizar `shared/release-week.ts` para usar/reexportar `dataPublicacaoValida` e ajustar a mensagem de erro, e verificar com `npm run test -- tests/release-week-validadores.test.ts`
- [x] 2.2 Atualizar `server/utils/release-week.ts` para usar a nova regra e a mensagem, e verificar a criação/edição via API local
- [x] 2.3 Atualizar `tests/release-week-validadores.test.ts` e `tests/release-week-import-parser.test.ts` com os cenários de feriado (aceita 03/11/2026, recusa 02/11/2026 e 04/11/2026) e verificar com `npm run test -- tests/release-week-validadores.test.ts tests/release-week-import-parser.test.ts`
- [x] 2.4 Atualizar `docs/12 - Módulo das Releases Week.md` com a regra e a lista de feriados/`FERIADOS_EXTRAS`, e conferir o texto contra o código

## 3. Verificação de integração

- [x] 3.1 Executar `npm run lint`, `npm run test -- --no-file-parallelism`, `npm run typecheck` e `npm run build` e corrigir qualquer falha
- [x] 3.2 Conferir manualmente no formulário de Release Week: 03/11/2026 aceito, 02/11/2026 recusado e uma segunda-feira comum aceita

# Tasks

## 1. Contrato compartilhado de validação

- [x] 1.1 Remover a regra de segunda-feira da `dataLiberacao` em `shared/lancar-chamadas.ts`, mantendo apenas data civil válida; atualizar `tests/lancar-chamadas-validadores.test.ts` para aceitar terça/quinta/sábado e recusar data malformada; verificar com `npm run test -- tests/lancar-chamadas-validadores.test.ts`
- [x] 1.2 Remover `ehSegundaFeira`/`proximaSegunda` de `shared/lancar-chamadas.ts` e os testes correspondentes, após confirmar com busca que não há uso de produção; verificar com `npm run typecheck` e `npm run test -- tests/lancar-chamadas-validadores.test.ts`

## 2. Catálogos e herança no servidor

- [x] 2.1 Expor `data_publicacao` nos catálogos paginados de projetos e manuais em `server/utils/opcoes-chamadas.ts`, mapeando `dataPublicacao`; cobrir o mapeamento em `tests/opcoes-chamadas.test.ts` e verificar com `npm run test -- tests/opcoes-chamadas.test.ts`
- [x] 2.2 Expor `data_publicacao` no catálogo completo de `consultarOpcoesChamadas` em `server/utils/lancar-chamadas.ts` (projetos e manuais), mantendo o formato de `OpcaoChamada`; verificar com `npm run typecheck`
- [x] 2.3 Ajustar `resolverVinculos` para selecionar `data_publicacao` de projeto/manual e derivar `dataLiberacao` vazia na ordem Release → Manual → Projeto; persistir a data derivada também no update; verificar com `npm run test` e `npm run typecheck`
- [x] 2.4 Filtrar no servidor apenas pais em status vinculável nos catálogos remotos (Release: `Aberta`/`Em Revisão`; Manual: `Rascunho`/`Em Revisão`; Projeto: `Em Andamento`/`Homologação`), para a primeira página não abrir vazia; cobrir no teste de `opcoes-chamadas` e verificar com `npm run test -- tests/opcoes-chamadas.test.ts`

## 3. Aprovação e importação

- [x] 3.1 Remover a validação de segunda-feira da herança em `aprovarChamada` (`server/utils/lancar-chamadas.ts`), aceitando qualquer data civil válida; verificar com `npm run test` e conferir que chamadas com projeto publicado fora de segunda avançam para `Aprovado`
- [x] 3.2 Aplicar o fallback Release → Manual → Projeto no commit da importação XLSX no servidor; cobrir com caso de projeto único em `tests/lancar-chamadas-import-parser.test.ts` e verificar com `npm run test -- tests/lancar-chamadas-import-parser.test.ts`
- [x] 3.3 Aplicar o mesmo fallback no preview em `app/components/lancar-chamadas/lerPlanilhaLancarChamadas.ts`; cobrir com teste de parser e verificar com `npm run test -- tests/lancar-chamadas-import-parser.test.ts`
- [x] 3.4 Atualizar `docs/16` (Aprovar) e `docs/17` (herança da Data de liberação) para remover a regra de segunda e registrar a ordem Release → Manual → Projeto; verificar por leitura e coerência com as specs

## 4. Formulário de Chamadas

- [x] 4.1 Criar handlers de seleção de Release/Manual/Projeto em `app/components/lancar-chamadas/Formulario.vue` que recomputem a Data de liberação pela precedência Release → Manual → Projeto, limpem quando não houver vínculo com data e preservem a data carregada na edição; verificar manualmente em `/admin/lancar-chamadas` e com `npm run typecheck`
- [x] 4.2 Atualizar o texto de ajuda do campo somente leitura para citar Release, Manual e Projeto; verificar visualmente em `/design`/formulário e com `npm run lint`
- [x] 4.3 Atualizar `docs/15` (herança, validação, importação e exemplos) para refletir qualquer data civil e a precedência Release → Manual → Projeto; verificar por leitura e coerência com `openspec/specs/lancar-chamadas/spec.md`

## 5. Escopo de Projetos sem regra de dia

- [x] 5.1 Adicionar testes de regressão em `tests/escopo-projetos-validadores.test.ts` e `tests/escopo-projetos-import-parser.test.ts` confirmando que `dataPublicacao` em terça/sexta/sábado é aceita e que data malformada é recusada; verificar com `npm run test -- tests/escopo-projetos-validadores.test.ts tests/escopo-projetos-import-parser.test.ts`
- [x] 5.2 Atualizar `docs/14` para declarar explicitamente que a Data de Publicação aceita qualquer data civil, sem regra de segunda-feira, no cadastro, edição, publicação e importação; verificar por leitura e coerência com `openspec/specs/escopo-projetos/spec.md`

## 6. Verificação integrada

- [x] 6.1 Rodar o conjunto completo de gates (`npm run lint`, `npm run test`, `npm run typecheck`, `npm run build`) e corrigir qualquer regressão
- [x] 6.2 Verificação manual: criar/editar escopo com data fora de segunda, lançar chamada apenas com esse projeto, confirmar preenchimento da Data de liberação e aprovar a chamada; regredir a Release Week com data fora de segunda e confirmar que continua recusada

## 7. Filtro rápido de origem

- [x] 7.1 Adicionar um `UiSelect` de Origem no slot `filtersLeft` da tabela, imediatamente à esquerda do botão Filtros, ligado a `filtros.origem`, com opções Release/Projeto/Manual/Ambos, "Todas as origens" e visibilidade sob `filtrar`; verificar com `npm run lint` e `npm run typecheck`
- [x] 7.2 Cobrir o filtro rápido em teste de modelo e atualizar `docs/15` e o badge de filtros ativos; verificar com `npm run test` e leitura da documentação
- [x] 7.3 Adicionar o botão `X` de limpeza rápida (busca + filtros) imediatamente à direita do botão Filtros, visível só com filtro/busca ativo; documentar em `docs/15` e `docs/01` (`filtersRight`) e verificar com `npm run lint` e `npm run typecheck`

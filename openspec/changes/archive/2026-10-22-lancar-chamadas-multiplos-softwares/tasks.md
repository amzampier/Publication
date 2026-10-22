# Tasks

## 1. Banco e backend

- [x] 1.1 Criar `server/migration/26_entregas_itens_softwares.sql` com a tabela de junção `entregas_itens_softwares` (FKs para `entregas_itens` e `softwares`, PK composta, índice por `software_codigo`) e backfill idempotente a partir de `software_id`/`software`; verificar subindo o dev e conferindo a tabela e as linhas dos registros existentes via `SHOW COLUMNS`/`SELECT COUNT(*)`
- [x] 1.2 Atualizar `shared/lancar-chamadas.ts` (`ChamadaModelo.softwareIds`/`softwares`, `EntradaChamada.softwareIds`, `FiltrosChamada.softwareIds`, validação "ao menos um software", busca por todos os nomes e filtro por interseção); verificar com testes puros em `tests/lancar-chamadas-validadores.test.ts` que a busca encontra pelo software secundário e que salvar sem software é recusado
- [x] 1.3 Atualizar `server/utils/lancar-chamadas.ts` (resolver N códigos, gravar junção + principal em transação, ler a junção com fallback legado no `COLUNAS`/`montarChamada`, `SQL_INSERT`/`UPDATE` e a importação aceitando códigos separados por `;`); verificar com `npm run typecheck` e com a persistência E2E de 6.2

## 2. Componente UiMultiSelect

- [x] 2.1 Criar `app/components/ui/MultiSelect.vue` (`UiMultiSelect`) com `v-model` de array, busca accent-insensitive, chips removíveis, teclado (setas/Enter/Escape/Backspace), DNA visual da família (foco `.ds-bottom-clip`/erro `rose-700`) e papéis acessíveis; verificar com `npm run lint` e `npm run typecheck`
- [x] 2.2 Adicionar a seção do `UiMultiSelect` em `app/pages/design.vue` (índice + seção) com demonstrações de seleção, erro e desabilitado; verificar em `http://localhost:3000/design` que a seção renderiza sem overflow e o campo funciona

## 3. Integração no módulo Lançar as Chamadas

- [x] 3.1 Em `app/components/lancar-chamadas/Formulario.vue`, trocar o `UiSelect` de software por `UiMultiSelect` com `rascunho.softwareIds`, ajustar rascunho/conversões, `camposPorEtapa`, payload e foco; verificar criando e editando uma chamada com dois softwares e recarregando a página
- [x] 3.2 Em `app/components/lancar-chamadas/Filtros.vue`, trocar o filtro de software por `UiMultiSelect` e ajustar o modelo de filtros; verificar aplicando um filtro com dois softwares e conferindo a listagem
- [x] 3.3 Em `app/components/lancar-chamadas/Tabela.vue` e `Detalhes.vue`, exibir a lista de softwares (nomes concatenados na grade; lista/chips nos detalhes); verificar abrindo os detalhes de uma chamada com múltiplos softwares
- [x] 3.4 Atualizar `app/components/lancar-chamadas/lerPlanilhaLancarChamadas.ts` e `Importar.vue` para aceitar vários códigos separados por `;` e validar cada um; verificar com `tests/lancar-chamadas-import-parser.test.ts` que dois códigos resolvem e um código inexistente invalida a linha

## 4. Escopo de Projetos

- [x] 4.1 Atualizar `server/utils/escopo-projetos.ts` (`carregarSoftwares`) para derivar os softwares contemplados da junção (todos os softwares das chamadas, com fallback legado) e `shared/escopo-projetos.ts` se necessário; verificar que um escopo com uma chamada de dois softwares lista os dois, sem repetição

## 5. Documentação

- [x] 5.1 Atualizar `docs/01 - design_system.md` (novo §5.x do `UiMultiSelect`) e `docs/15 - Módulo Lançar Chamadas.md` (softwares múltiplos no formulário, filtro, listagem, detalhes e importação) e `docs/14 - Módulo do Escopo de Projetos.md` (derivação dos contemplados); verificar que os nomes de campo documentados coincidem com `shared/lancar-chamadas.ts`

## 6. Verificação final

- [x] 6.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e confirmar que os quatro passam
- [x] 6.2 Verificar ponta a ponta: criar e editar chamada com dois softwares, recarregar (persistência), filtrar por um dos softwares, abrir Detalhes (lista) e confirmar que a busca encontra pelo software secundário e que o Escopo de Projetos lista os dois

# Proposal

## Why

O Escopo de Projetos pode ser publicado em qualquer data, mas a Data de liberação da chamada continua presa à regra de segunda-feira/próximo dia útil e só é herdada da Release. Com isso, uma chamada vinculada apenas a um projeto fica sem Data de liberação ao ser lançada e, na aprovação, é recusada quando a publicação do projeto cai em outro dia da semana — um contrato incoerente entre os módulos.

## What Changes

- Remover a regra de segunda-feira/próximo dia útil da **Data de liberação** da chamada em todos os caminhos: validação do formulário, preview e commit da importação XLSX, criação/edição e aprovação. A data passa a aceitar qualquer data civil válida, como a Data de lançamento.
- Preencher automaticamente a **Data de liberação** no formulário a partir da `data_publicacao` do vínculo selecionado, com precedência **Release > Manual > Projeto**, recomputada ao trocar/remover vínculos; sem vínculo, permanece vazia.
- Aplicar a mesma herança no servidor: na criação, no update e na importação, a data vazia é derivada de Release, Manual ou Projeto (nessa ordem), usando a data de publicação do pai.
- Expor `dataPublicacao` nos catálogos remotos de projetos e manuais (hoje só a Release expõe).
- Filtrar no servidor os catálogos de vínculo pelos status vinculáveis, para a primeira página abrir com opções (hoje o filtro só ocorre no cliente depois da paginação).
- Oferecer na toolbar da listagem um filtro rápido de **Origem** à esquerda de **Filtros** e um botão `X` de limpeza rápida (busca + filtros) à direita de **Filtros**.
- Tornar explícito e coberto por teste que o **Escopo de Projetos** aceita qualquer data civil em `data_publicacao`, sem regra de segunda-feira, no cadastro, edição, publicação e importação.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `lancar-chamadas`: a Data de liberação aceita qualquer data civil válida; é preenchida por Release, Manual ou Projeto, com precedência e recomputação ao alterar vínculos; a herança na aprovação e na importação deixa de exigir segunda-feira.
- `escopo-projetos`: `data_publicacao` aceita qualquer data civil válida, sem regra de segunda-feira, no cadastro, edição, publicação e importação.

## Impact

- `shared/lancar-chamadas.ts` — validação da Data de liberação e remoção de helpers de segunda-feira sem uso.
- `server/utils/lancar-chamadas.ts` — validação na aprovação, queries de vínculo, fallback de criação/edição/importação.
- `server/utils/opcoes-chamadas.ts` — catálogo paginado de projetos/manuais com `dataPublicacao` e filtro de status vinculável no servidor.
- `app/components/lancar-chamadas/Formulario.vue` — preenchimento ao selecionar Release/Projeto/Manual e texto de ajuda.
- `app/components/lancar-chamadas/Tabela.vue` e `app/components/ui/DataTable.vue` — filtro rápido de Origem e limpeza rápida na toolbar (novo slot `filtersRight`).
- `app/components/lancar-chamadas/lerPlanilhaLancarChamadas.ts` — fallback no preview da importação.
- `shared/escopo-projetos.ts`, `app/components/escopo-projetos/*` — comportamento mantido e coberto por teste (sem mudança de schema).
- Testes: `tests/lancar-chamadas-validadores.test.ts`, `tests/lancar-chamadas-import-parser.test.ts`, `tests/opcoes-chamadas.test.ts`, `tests/escopo-projetos-validadores.test.ts`, `tests/escopo-projetos-import-parser.test.ts`.
- Documentação: `docs/14`, `docs/15`, `docs/16` e `docs/17`.
- Sem migration: `projetos_escopo.data_publicacao` e `entregas_itens.data_liberacao` já são `DATE`.
- A regra de segunda-feira da **Release Week** permanece inalterada.

# Proposal

## Why

A tabela `entregas_itens` é a fonte única dos itens de Release Week, Escopo de Projetos e Manuais, mas
o módulo **Lançar as Chamadas** — dono explícito do CRUD desses itens — ainda é um item de sidebar sem
rota, sem página e sem contrato de tela. Os três módulos consumidores só exibem os itens em modo
somente leitura. Sem uma tela de lançamento, o fluxo de criação das chamadas não existe e a próxima
fase de backend correria o risco de inventar um recorte divergente do banco.

## What Changes

- **Nova página `/admin/lancar-chamadas`** (`app/pages/admin/lancar-chamadas.vue`), fina e dona da
  coordenação, componentizada em `app/components/lancar-chamadas/`.
- **Listagem de chamadas** em `UiDataTable` com Chamada, Título, Software, Módulo, Tipo, Impacto,
  Status, Data de lançamento e Data de liberação; busca textual, filtros em modal (três colunas a
  partir de `sm`) e paginação no cliente.
- **Quatro KPIs por status**: Total, Revisar, Aprovado e Recusado. A listagem é sempre ordenada pelo
  número da chamada.
- **Cadastro e edição em wizard** de quatro etapas — Vínculos e origem, Identificação, Classificação e
  Conteúdo e mídias — com navegação direta pelo indicador de etapas, validação por etapa e Data de
  liberação herdada da `dataPublicacao` da Release selecionada.
- **Vínculo obrigatório e origem derivada (decisão A)**: a chamada precisa de pelo menos um vínculo
  (Release, Projeto ou Manual); um vínculo define `Release`/`Projeto`/`Manual`, dois ou mais definem
  `Ambos`. A origem não é editável; os textos `release`, `software` e `parceiro` são derivados dos
  catálogos, nunca digitados em paralelo.
- **Ações de linha**: Detalhes, Editar, **Aprovar**, **Recusar** e Excluir condicionada. `Aprovar` muda
  o status para `Aprovado`; `Recusar` para `Recusado`; `Excluir` só é permitido quando o status é
  `Revisar` e a chamada não tem histórico.
- **Detalhes** em modal `xl` somente leitura, com descrição, título do manual, links, tags, imagens,
  vínculos, autor e timestamps.
- **Filtros por período** inclusivos de lançamento e liberação, além dos filtros por status,
  classificação, software, parceiro e origem.
- **Colagem de imagens com `Ctrl` + `V`** na etapa Conteúdo e mídias, sem exigir gravação local e seleção
  de arquivo.
- **Relatórios PDF/CSV** do conjunto filtrado, sob a permissão `download`.
- **Novo `UiTagInput`** no kit, usado na etapa Classificação, com chips removíveis, Enter/vírgula para
  adicionar, Backspace para remover, limite e deduplicação; documentado no `/design` e em `docs/01`.
- **Dataset em memória** (`useState`) nesta fase, com catálogos locais de exemplo; nada persiste no F5 e
  a API substitui o dataset na fase backend.
- **Documentação**: novo `docs/15 - Módulo Lançar Chamadas.md` e atualização de `docs/03` (o item deixa
  de ser “sem rota”).
- **Navegação**: o item `lancar-chamadas` de `app/config/navigation.ts` passa a declarar
  `to: '/admin/lancar-chamadas'`.

## Capabilities

### New Capabilities

- `lancar-chamadas`: página administrativa do lançamento de chamadas na fase frontend — rota/shell,
  KPIs por status, listagem ordenada por chamada com busca/filtros/paginação, cadastro/edição com vínculo
  obrigatório e origem derivada, detalhes, aprovação, recusa, exclusão condicionada, relatórios, dataset em
  memória e gates de RBAC na interface.
- `design-system/tag-input`: componente `UiTagInput` — entrada de tags em chips, acessível por mouse e
  teclado, com adição por Enter/vírgula, remoção por botão/Backspace, deduplicação, limite e estados de
  foco/erro alinhados ao design system.

### Modified Capabilities

<!-- Nenhuma capability existente tem requisito alterado. A navegação já suporta itens com rota e a
     UiDataTable já suporta expansão, busca, filtros e ações; o módulo apenas consome esses contratos.
     Atualizações de docs/03 e do exemplo de cenário da spec de navegação são de documentação, não de
     comportamento normativo. -->

## Impact

- **Código novo:** `app/pages/admin/lancar-chamadas.vue`; `app/components/lancar-chamadas/`
  (`Cabecalho`, `Kpis`, `Tabela`, `Filtros`, `Formulario`, `Detalhes`, `Aprovar`, `Recusar`, `Exclusao`, `Midias`,
  `useLancarChamadasModelo.ts`, `validadores.ts`, `gerarPdfLancarChamadas.ts`);
  `shared/lancar-chamadas.ts`; `app/components/ui/TagInput.vue`; `tests/lancar-chamadas-validadores.test.ts`.
- **Código modificado:** `app/config/navigation.ts` (rota do item); `app/pages/design.vue` (seção 24).
- **Documentação:** `docs/15 - Módulo Lançar Chamadas.md` (novo), `docs/01 - design_system.md` (§5.24),
  `docs/03 - Header e Sidebar.md`.
- **Design system:** nova spec `design-system/tag-input`; vitrine `/design`.
- **Fora de escopo:** `server/api/**`, `server/utils/**`, migrations, persistência real, auditoria,
  RBAC de servidor, importação XLSX, `anexos_midias`/upload persistente, transições da Esteira de
  Revisão, coluna `arquivada` e Área Pública.

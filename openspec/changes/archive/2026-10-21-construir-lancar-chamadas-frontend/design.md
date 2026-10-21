# Design

## Context

Ver `proposal.md - Why`.

Estado relevante já verificado no código e no banco:

- `entregas_itens` é a tabela única dos itens de Release Week (`release_id`), Escopo de Projetos
  (`projeto_id`) e Manuais (`manual_id`), com FKs também para `softwares(codigo)`, `parceiros(id)` e
  `usuarios(id)`. As colunas `release`, `software` e `parceiro` são cópias textuais denormalizadas.
- `status` (`Revisar` | `Aprovado` | `Recusado` | `Publicar`) é fluxo editorial; `situacao`
  (`Desenvolvimento` | `Homologação` | `Implantado`) é estágio de entrega. A Esteira de Revisão é a
  dona das transições.
- Não existe coluna `arquivada`. `historico_esteira_revisao` referencia o item com `ON DELETE
  RESTRICT`; `anexos_midias` usa `CASCADE`.
- `id` é `VARCHAR(64)`; `chamada` tem índice, mas não é único.
- O item `lancar-chamadas` já existe em `app/config/navigation.ts` com `Megaphone` `#f59e0b`, sem
  `to`; o catálogo RBAC já existe com `visualizar`, `criar`, `alterar`, `excluir`, `publicar`,
  `arquivar`, `download`, `filtrar` e `buscar`.
- Os módulos consumidores (`release-week`, `manuais`, `escopo-projetos`) leem itens somente em modo
  somente leitura; docs/12, docs/13 e docs/14 delegam o CRUD a este módulo.
- O padrão de módulo do projeto é página fina + componentes de domínio + `use*Modelo` + regras puras
  compartilhadas + testes. A fase frontend de Release Week/Manuais usou dataset em memória antes da
  API.

## Goals / Non-Goals

**Goals:**

- Fixar o contrato de tela e o modelo de domínio do módulo antes da fase backend.
- Entregar uma página navegável e operável com dataset em memória, cobrindo todos os campos de
  `entregas_itens` que fazem sentido no lançamento.
- Manter a página apenas como orquestração, com estado e regras fora dela.
- Adicionar ao kit apenas o controle que não existe: entrada de tags.
- Reutilizar `UiDataTable`, `UiModal`, `UiModalSection`, `UiSelect`, `UiDatePicker`, `UiSegmented`,
  `UiTextarea`, `UiInput`, `UiBadge`, `UiActionMenu`, `UiKpi`, `UiButton`, `UiTooltip`,
  `UiUploadFiles` e `UiLoading`.

**Non-Goals:**

- API, persistência, migration, auditoria, RBAC de servidor, importação XLSX e anexos persistidos.
- Transições de status da Esteira de Revisão.
- Coluna de arquivamento e ação “Arquivar”.
- Exposição pública das chamadas.

## Decisions

### D1 — Dataset em memória com catálogos locais

`useLancarChamadasModelo` mantém `ChamadaModelo[]` em `useState`, semeado com exemplos realistas, e
catálogos locais de releases, projetos, manuais, softwares e parceiros. As ações mutam apenas esse
estado; o F5 restaura o conjunto inicial.

- **Por que:** a fase é explicitamente frontend-only e o precedente de Release Week/Manuais já usou
  esse recorte para exercitar todos os fluxos antes do backend. Evita inventar endpoints e mantém o
  contrato do modelo isolado em `shared/lancar-chamadas.ts`.
- **Alternativa descartada:** consumir as APIs existentes de releases/projetos/manuais/softwares para
  os selects e manter só as chamadas em memória. Isso mistura fonte real e mock, adiciona estados de
  carregamento/erro nos catálogos e dificulta testes determinísticos.
- **Dívida registrada:** na fase backend, `carregarChamadas()` troca o array por `GET /api/...`, os
  catálogos passam a vir dos endpoints existentes e o CRUD passa a chamar a API.

### D2 — Vínculo obrigatório e origem derivada

O rascunho exige pelo menos um entre `releaseId`, `projetoId` e `manualId`. `derivarOrigem` calcula:
um vínculo → `Release`/`Projeto`/`Manual`; dois ou mais → `Ambos`; nenhum → erro. A origem é exibida
como badge somente leitura.

- **Por que:** evita divergência entre o ENUM `origem` e os FKs; é a decisão A confirmada pelo usuário.
- **Alternativa descartada:** select explícito de origem com vínculos opcionais — permitiria combinações
  incoerentes e exigiria validação cruzada complexa.

### D3 — Textos denormalizados derivados dos catálogos

`release`, `software` e `parceiro` são preenchidos a partir das opções selecionadas e exibidos como
parte do registro, sem campos editáveis paralelos. `autorId`/`autorNome` vêm da sessão. Ao selecionar
uma Release, `dataLiberacao` é preenchida com a `dataPublicacao` do catálogo da release, mas continua
editável.

- **Por que:** as três colunas são `NOT NULL` no banco e não podem ficar vazias; derivar mantém a UI
  coerente com os FKs que serão persistidos depois.

### D4 — Status somente leitura no formulário e ação Aprovar separada

Novas chamadas nascem com `status = Revisar`. O formulário não edita `status`; as ações **Aprovar** e
**Recusar** confirmam e gravam `Aprovado`/`Recusado`. "Publicar" e "Arquivar" não existem como ações
nesta fase.

- **Por que:** o status pertence ao fluxo editorial da Esteira; expô-lo no formulário permitiria burlar
  a permissão `publicar`. `entregas_itens` também não tem coluna de arquivamento, então "Arquivar" não
  teria efeito real.
- **RBAC:** Aprovar usa a permissão existente `publicar`; Recusar usa `alterar`; nenhuma
  funcionalidade nova é criada.
- **Alternativa descartada:** editar o status no formulário — mistura criação de conteúdo com workflow
  e enfraquece o RBAC.

### D5 — Exclusão condicionada por status e histórico

`podeExcluir` retorna falso quando `status !== 'Revisar'` ou `temHistorico === true`; a UI desabilita
a ação com motivo. No dataset em memória, `temHistorico` é um campo do modelo; no backend futuro virá
de `historico_esteira_revisao`.

- **Por que:** a FK `ON DELETE RESTRICT` impede apagar item com histórico; antecipar a guarda na UI
  evita um erro previsível.
- **Alternativa descartada:** permitir excluir e tratar o erro da API — pior UX e impossível de simular
  agora sem backend.

### D6 — Mídias limitadas a `imagens` + preview local

O formulário usa `UiUploadFiles` para selecionar imagens, aceita **colagem com `Ctrl` + `V`** enquanto a
etapa Conteúdo e mídias está montada e usa `LancarChamadasMidias` para listar/remover as já existentes.
A colagem lê `ClipboardEvent.clipboardData.items`, valida tipo/tamanho e converte para data URL, sem
gravar arquivo local. `link_manual`, `link_video` e `manualTitulo` são campos de conteúdo.
`anexos_midias` fica fora desta fase.

- **Por que:** `imagens JSON` já é a representação simples no item; `anexos_midias` exige upload
  persistido e API, que não existem nesta fase. A colagem elimina o passo de salvar o print e escolher
  o arquivo.
- **Trade-off:** os previews somem no F5, como todo o dataset; a colagem depende de um evento de
  clipboard com arquivo de imagem (print/área de transferência), não de permissão de leitura contínua.

### D7 — Relatórios sob `download`

O menu “Relatórios” gera PDF (jsPDF/autotable) e CSV (`;`, BOM UTF-8, neutralização de fórmulas) do
conjunto filtrado. A permissão usada é `download`, a única disponível no catálogo do módulo.

- **Por que:** `lancar-chamadas` não possui `exportar`; usar `download` mantém a matriz existente sem
  criar funcionalidade de RBAC.

### D8 — `UiTagInput` como único componente novo de kit

O formulário precisa de uma coleção de tags; nenhum controle atual oferece múltipla entrada com chips.
O componente segue os tokens de foco/erro/desabilitado e é documentado na seção 24 do `/design` e em
`docs/01` §5.24. As tags ficam na etapa **Classificação**, não em Conteúdo e mídias.

- **Por que:** evita um input de texto com parsing improvisado dentro do formulário e mantém a regra
  “nunca criar controle paralelo”.
- **Alternativa descartada:** usar `UiSelect` com múltipla seleção — o componente é single-select e as
  tags são livres.

### D9 — Estrutura de arquivos e responsabilidades

`app/pages/admin/lancar-chamadas.vue` só declara `layout: 'admin'`, dispara a carga inicial e coordena
os modais. O estado, os derivados e as ações ficam em `useLancarChamadasModelo`. Regras puras
(validação, origem, filtros, KPIs, guardas, formatação) ficam em `shared/lancar-chamadas.ts` e são
reexportadas por `app/components/lancar-chamadas/validadores.ts`. Cada parte visual é um componente
`LancarChamadas*` na pasta do módulo.

- **Por que:** segue docs/02 e o padrão dos módulos anteriores; permite testar as regras sem montar a
  página.

### D10 — Modelo de domínio

```ts
type OrigemChamada = 'Release' | 'Projeto' | 'Manual' | 'Ambos'
type TipoChamada = 'Correção' | 'Melhoria' | 'Nova Funcionalidade'
type ImpactoChamada = 'Baixo' | 'Médio' | 'Alto' | 'Crítico'
type SituacaoChamada = 'Desenvolvimento' | 'Homologação' | 'Implantado'
type StatusChamada = 'Revisar' | 'Aprovado' | 'Recusado' | 'Publicar'

interface ChamadaModelo {
  id: string
  origem: OrigemChamada
  releaseId: string
  projetoId: string
  manualId: string
  softwareId: string
  parceiroId: string
  autorId: string
  autorNome: string
  chamada: string
  dataLancamento: string
  dataLiberacao: string
  release: string
  titulo: string
  parceiro: string
  software: string
  modulo: string
  menuFuncionalidade: string
  tipo: TipoChamada
  impacto: ImpactoChamada
  situacao: SituacaoChamada
  descricaoCompleta: string
  manualTitulo: string
  linkManual: string
  linkVideo: string
  imagens: string[]
  status: StatusChamada
  tags: string[]
  temHistorico: boolean
  criadoEm: string
  atualizadoEm: string
}
```

`id` é gerado com `crypto.randomUUID()` no dataset em memória (o banco aceita `VARCHAR(64)`).

### D11 — Regras de validação e apresentação

- Campos obrigatórios: `chamada`, `titulo`, `softwareId`, `parceiroId`, `modulo`,
  `descricaoCompleta`, `dataLancamento` e ao menos um vínculo.
- `chamada` ≤60 e sem duplicidade no conjunto carregado; `titulo` ≤255; `modulo` ≤100;
  `manualTitulo` ≤255.
- `dataLancamento` e `dataLiberacao`, quando preenchidas, precisam ser segunda-feira.
- Links `http(s)`; tags ≤12 e ≤30 caracteres; imagens PNG/JPG/WebP até 5 MB, por seleção ou colagem.
- Filtros e KPIs operam em memória; os filtros incluem períodos inclusivos de lançamento e liberação;
  datas são formatadas `dd/mm/aaaa`; códigos e datas usam `font-mono tabular-nums`.
- Os KPIs são por **status**: Total, Revisar, Aprovado e Recusado.
- A listagem é ordenada por **chamada** (crescente, comparação numérica natural), sem usar
  `ordem_apresentacao`; a mesma ordem vale para as listas de itens dos módulos consumidores.
- A busca cobre chamada, título, descrição, software, módulo, menu, parceiro, tags e release.

### D12 — Gates de RBAC e navegação

`can('lancar-chamadas', acao)` controla Nova Chamada (`criar`), Editar e Recusar (`alterar`), Excluir
(`excluir`), Aprovar (`publicar`), Relatórios (`download`), Filtros (`filtrar`) e busca (`buscar`). O
item da sidebar só aparece com `visualizar`. Nenhuma permissão nova é criada.

### D13 — Wizard de quatro etapas com navegação direta

O formulário é dividido em **Vínculos e origem** → **Identificação** → **Classificação** → **Conteúdo e
mídias**. A primeira etapa é sempre Vínculos e origem. "Próximo" valida a etapa corrente; o indicador de
etapas é clicável e leva diretamente a qualquer etapa, sem exigir "Próximo". "Salvar" valida todas as
etapas e, em erro, leva à etapa do primeiro campo inválido.

- **Por que:** reduz a carga visual de um formulário com muitos campos e deixa o vínculo — a decisão
  mais estrutural — como primeiro passo.
- **Alternativa descartada:** abas simples — não deixam claro o avanço/retrocesso nem o salvamento final.
- **Trade-off:** a navegação direta permite chegar à última etapa com erros anteriores; a validação de
  salvamento e o retorno à etapa do erro cobrem esse caso.

## Risks / Trade-offs

- [Dataset em memória não persiste e some no F5] → Documentado em `docs/15`; a fase backend substitui a
  fonte sem alterar a estrutura visual.
- [Contrato de `entregas_itens` é compartilhado por três módulos] → Tipos e regras centralizados em
  `shared/lancar-chamadas.ts`; o doc registra o mapeamento campo a campo para a API futura.
- [`chamada` não é única no banco] → A UI bloqueia duplicidade no conjunto carregado; a unicidade real
  fica registrada como pendência para a migration/backend.
- [Ausência de `arquivada`] → Não inventar campo; “Arquivar” fica fora e a permissão existente
  permanece sem uso até a decisão de schema.
- [`imagens JSON` × `anexos_midias`] → Nesta fase, `imagens` é a fonte; anexos ficam para o backend.
- [Histórico simulado] → `temHistorico` é um campo do dataset; a guarda real será a FK/consulta no
  backend.
- [Regra de segunda-feira pode ser mais restritiva que o banco] → Validada no cliente e documentada;
  o backend deverá repetir a regra se ela for confirmada como negócio.
- [`UiTagInput` novo pode divergir do padrão visual] → Segue os tokens canônicos, entra no `/design` e
  em `docs/01`, e é coberto por cenários de foco/erro/desabilitado.
- [Colagem com `Ctrl` + `V` depende do navegador/conteúdo da área de transferência] → O handler só age
  quando há arquivo de imagem no clipboard; falhas caem no aviso de formato/tamanho e o upload por
  arquivo permanece como caminho alternativo.
- [Navegação direta no wizard pode levar a etapa futura com erro anterior] → "Salvar" valida todas as
  etapas, leva à etapa do primeiro erro e foca o campo; "Próximo" continua validando a etapa corrente.

## Migration Plan

Sem migration de banco nesta fase. Ordem de implementação:

1. `shared/lancar-chamadas.ts` + testes das regras puras.
2. `UiTagInput` + `/design` seção 24 + `docs/01` §5.24.
3. `useLancarChamadasModelo` com dataset e catálogos.
4. Componentes de domínio (formulário em wizard e mídias com colagem) + página + rota na sidebar.
5. `docs/15` e atualizações de `docs/03`.
6. Gates e conferência manual.

Rollback: remover a rota do item da sidebar e os arquivos do módulo; o kit mantém apenas o
`UiTagInput`, que é aditivo e não altera componentes existentes.

## Open Questions

Nenhuma pendência que altere specs, abordagem ou tarefas. A decisão de vínculo/origem foi resolvida
(A). A eventual criação de `arquivada`, a importação XLSX, os anexos e a API ficam registradas como
próximos passos no `docs/15`, fora desta fase.

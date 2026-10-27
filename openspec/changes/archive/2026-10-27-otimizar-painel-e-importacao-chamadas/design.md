# Design

## Context

Ver `proposal.md`. O Painel já agrega no SQL, mas ainda projeta `e.*` e recalcula o fluxo e os anos de publicação a cada request. O board da Esteira usa `listarChamadasParaEsteira`, que após a correção da galeria passou a carregar todas as mídias por item, contrariando o requisito de projeção enxuta. O formulário ainda busca o catálogo completo; o PDF busca todas as linhas; `importarChamadas` faz 1 INSERT + softwares por linha; o filtro de status da Esteira é client-side; e a Data de liberação não é limpa ao remover a Release.

## Goals / Non-Goals

**Goals:**

- Reduzir colunas, consultas e payload do Painel/board.
- Manter a galeria completa apenas no detalhe.
- Levar o filtro de status da Esteira para antes da paginação.
- Carregar opções do formulário sob demanda.
- Limitar o PDF sem afetar o CSV.
- Tornar a importação de Chamadas em lote.
- Corrigir a limpeza/validação da Data de liberação.

**Non-Goals:**

- Alterar schema/migrations.
- Alterar a regra de negócio de publicação.
- Implementar Área Pública.
- Adicionar novos componentes de UI; reutilizar `UiSelect`/`UiMultiSelect` remotos.

## Decisions

### 1. Painel: projeção mínima + cache

Em `itensFluxo`, o subselect passa a projetar apenas `status`, `data_lancamento`, `criado_em` e os flags `ativo`/`visivel`. O resultado agregado é cacheado em `painel:fluxo` por 30 s. `anosDasPublicacoes` é cacheado por `painel:anos-publicacoes:<escopo>`.

Adicionar `invalidarCachePrefixo(prefixo)` em `server/utils/cache.ts` para limpar `painel:*` nas escritas que hoje invalidam `painel-anos`, sem limpar todo o cache.

Alternativa descartada: cachear a resposta inteira do Painel; o painel varia por permissão/escopo e ano, e o recorte já é barato.

### 2. Board: contagem/capa, não array completo

`listarChamadasParaEsteira` deixa de carregar `carregarMidiasPorItem`. Em vez disso, consulta:
- `COUNT(*)` de mídias por item;
- URL da capa/primeira imagem, quando houver.

Adicionar `imagensCount` (ou campo equivalente) ao item do board; `ChamadaCard` usa a contagem. `Detalhe` continua buscando `GET /api/esteira-revisao/:id`, que carrega as mídias completas.

Alternativa descartada: carregar a primeira página de mídias; o card só precisa de contagem/capa.

### 3. Esteira: filtro de status no servidor

Adicionar `status` ao `GET /api/esteira-revisao` e passar para `listarEsteira`/`listarChamadasParaEsteira`. O `WHERE` de status é aplicado antes de `LIMIT/OFFSET` e o `COUNT(*)` usa o mesmo recorte; o progresso global permanece. O cliente envia `status` quando o filtro estiver ativo e não filtra mais a página localmente para esse campo.

Alternativa descartada: manter client-side; não resolve páginas posteriores.

### 4. Formulário: opções remotas

Estender `useLancarChamadasModelo` com estado remoto para `releases`, `projetos`, `manuais`, `softwares` e `parceiros`, usando `/api/lancar-chamadas/opcoes` e as props remotas já suportadas por `UiSelect`/`UiMultiSelect`.

- Abrir o select carrega a primeira página.
- Busca com debounce.
- Itens já selecionados na edição são mantidos como `selectedOption(s)` usando os códigos/nomes disponíveis em `ChamadaModelo`.
- `carregarCatalogo` deixa de ser chamado na abertura do formulário.

### 5. PDF e CSV

O `GET /api/lancar-chamadas?download=1` sem `formato=csv` recebe `limite` (máximo 5.000, padrão 5.000) e retorna no máximo esse número. A UI detecta o teto e orienta refinar filtros; não gera PDF parcial. O CSV continua no loop keyset atual.

### 6. Importação em lote

Definir uma base `INSERT INTO entregas_itens (...) VALUES` e usar `inserirEmLotes` em blocos de 150. Para softwares, montar todas as linhas `[entrega_item_id, software_codigo, software_nome, ordem]` e inserir em multi-row após os itens. A checagem de duplicidade usa `WHERE chamada IN (...)` em chunks; a transação única e o rollback permanecem.

### 7. Data de liberação

No formulário, `selecionarRelease` limpa `dataLiberacao` quando não há release/data. Na aprovação, a data herdada de Release/Manual/Escopo passa por `dataPublicacaoValida`; inválida → `409` e a chamada permanece `Revisar`. Data existente é preservada.

## Risks / Trade-offs

- **Cache do Painel defasado até 30 s** → invalidação por prefixo nas escritas e TTL curto.
- **PDF limitado a 5.000** → mensagem explícita para refinar filtros; CSV continua completo.
- **Filtro de status server-side muda `total` por aba** → testes de página 1/2 e progresso global.
- **Formulário remoto aumenta requisições** → debounce, cache de selecionados e loading já existente.
- **Importação em lote pode aumentar o tamanho do statement** → chunks de 150 e rollback total.
- **Data herdada inválida bloqueia aprovação** → mensagem clara; corrigir o vínculo pai é a ação esperada.

## Migration Plan

Sem migration. Deploy é apenas código/configuração; rollback por reversão dos arquivos. Dados existentes não são alterados.

## Open Questions

Nenhuma.

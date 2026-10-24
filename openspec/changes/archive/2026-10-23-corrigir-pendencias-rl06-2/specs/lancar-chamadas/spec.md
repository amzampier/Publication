# Spec Delta

## MODIFIED Requirements

### Requirement: A listagem apresenta as chamadas com busca, filtros, ordenação e paginação

A tela SHALL listar as chamadas em `UiDataTable` com as colunas **Chamada**, **Título**, **Software**,
**Módulo**, **Tipo**, **Impacto**, **Status**, **Data de lançamento** e **Data de liberação**. A busca SHALL operar sobre chamada, título, descrição, solução, software, módulo, menu
funcionalidade, parceiro, tags e código da release. A busca SHALL operar somente sobre o texto puro das
descrições, nunca sobre a marcação HTML. A listagem SHALL ser ordenada por **chamada**
(crescente, com comparação numérica natural) e a paginação SHALL ocorrer **no servidor**, com
`pagina` e `porPagina` validados e limitados; a resposta SHALL trazer a página corrente e o total do
conjunto filtrado. A listagem NÃO SHALL materializar as colunas de texto rico, solução, imagens e tags
completas: esses dados SHALL ser carregados sob demanda no detalhe. A tabela SHALL distinguir base
vazia de conjunto filtrado sem resultados.

#### Scenario: Listagem com dados

- **WHEN** a tela é aberta com chamadas no conjunto
- **THEN** as chamadas são exibidas nas colunas definidas, com as datas formatadas em `dd/mm/aaaa`

#### Scenario: Paginação no servidor

- **WHEN** o usuário troca de página ou altera a quantidade de linhas
- **THEN** a API recebe `pagina`/`porPagina`, devolve apenas a página solicitada com o total do conjunto e a tabela exibe os controles derivados desse total

#### Scenario: Ordenação por chamada

- **WHEN** a listagem é exibida sem ordenação manual do usuário
- **THEN** as chamadas aparecem em ordem crescente de `chamada`, sem considerar `ordem_apresentacao`

#### Scenario: Busca textual

- **WHEN** o usuário digita um termo que corresponde a chamada, título, descrição, solução, software, módulo, parceiro, tag ou release
- **THEN** a tabela exibe apenas as chamadas correspondentes e recalcula os KPIs

#### Scenario: Busca ignora a marcação

- **WHEN** a descrição possui formatação (negrito, cor ou tamanho) e o usuário busca por uma palavra do texto
- **THEN** a chamada é encontrada, e um termo de marcação como `strong` ou `span` não produz correspondência

#### Scenario: Base vazia

- **WHEN** não há chamadas no conjunto e nenhum filtro está ativo
- **THEN** a tabela informa que não há chamadas cadastradas

#### Scenario: Filtro sem resultado

- **WHEN** há chamadas no conjunto, mas os filtros ou a busca não retornam nenhuma
- **THEN** a tabela informa que nenhum resultado foi encontrado para o filtro

## ADDED Requirements

### Requirement: A galeria usa miniaturas e carregamento sob demanda

A galeria de imagens da chamada SHALL exibir miniaturas leves em vez do arquivo original em tamanho
de exibição, com `loading="lazy"`, `decoding="async"`, dimensões reservadas e `srcset` quando houver
variante. O servimento de mídia de chamada publicada SHALL permitir cache público reutilizável; a
pré-visualização administrativa SHALL permanecer privada. Uma variante reduzida (aprox. 320 px, WebP)
SHALL ser gerada no upload, com fallback para o original quando a geração não estiver disponível.

#### Scenario: Miniatura leve na galeria
- **WHEN** o usuário abre a galeria de uma chamada com imagens
- **THEN** a galeria usa a variante reduzida (ou a original como fallback) com `loading="lazy"` e sem baixar todas as imagens antes da rolagem

#### Scenario: Imagem publicada com cache
- **WHEN** uma mídia de chamada publicada é servida anonimamente
- **THEN** a resposta permite cache público reutilizável e mantém `nosniff`

### Requirement: A visibilidade pública de mídia respeita a data de liberação

Uma mídia de chamada NÃO SHALL ser considerada pública antes da data efetiva de liberação. Além de a
chamada estar `Publicado` e de ao menos um pai estar `Publicado` e não arquivado, a visibilidade
anônima SHALL exigir que a `data_liberacao` da chamada e a `data_publicacao` do pai não estejam no
futuro (quando informadas). A regra vale para o servimento de mídia e para as futuras leituras
públicas.

#### Scenario: Chamada publicada com liberação futura
- **WHEN** uma chamada está `Publicado`, o pai está publicado e a `data_liberacao` é posterior a hoje
- **THEN** a mídia não é servida anonimamente até a data de liberação

#### Scenario: Pai com publicação futura
- **WHEN** o pai está `Publicado`, mas a `data_publicacao` é posterior a hoje
- **THEN** a mídia não é servida anonimamente até a data de publicação

#### Scenario: Data efetiva liberada
- **WHEN** a chamada e o pai estão publicados e as datas não são futuras
- **THEN** a mídia é servida anonimamente
### Requirement: O detalhe da chamada é carregado sob demanda

A listagem SHALL ser enxuta e o detalhe completo da chamada (descrição/solução em HTML, mídias,
tags, links e autor) SHALL ser obtido por `GET /api/lancar-chamadas/:id` quando o usuário abrir
Detalhes/Editar. A rota SHALL exigir `lancar-chamadas`/`visualizar`, responder `404` para id
inexistente e devolver o mesmo contrato do registro usado pelo formulário. A listagem NÃO SHALL
depender desse payload completo para renderizar as colunas.

#### Scenario: Abrir detalhe busca o registro completo
- **WHEN** o usuário aciona "Detalhes" em uma chamada
- **THEN** o cliente consulta `GET /api/lancar-chamadas/:id` e exibe o HTML sanitizado/mídias retornados

#### Scenario: Detalhe de id inexistente
- **WHEN** `GET /api/lancar-chamadas/:id` recebe um UUID inexistente
- **THEN** a API responde `404` e a tela informa o erro sem abrir dados parciais

#### Scenario: Listagem não carrega o HTML
- **WHEN** a listagem é carregada
- **THEN** a resposta da página não inclui o HTML completo de descrição/solução nem a lista completa de mídias

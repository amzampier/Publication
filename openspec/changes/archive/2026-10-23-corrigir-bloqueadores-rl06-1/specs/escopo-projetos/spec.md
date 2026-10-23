# Spec Delta

## MODIFIED Requirements

### Requirement: API de Escopo de Projetos
A API SHALL expor a listagem, criação, edição, publicação, arquivamento, exclusão, leitura de itens e
importação de escopos. A listagem SHALL retornar apenas escopos não arquivados, com `itensCount` e
`softwaresContemplados` derivados de `entregas_itens`. Todas as rotas SHALL aplicar a permissão
correspondente do módulo `escopo-projetos`; as escritas SHALL registrar auditoria no recurso
**"Escopo de Projetos"**. Conflitos de unicidade ou de guarda SHALL responder `409`; entradas
inválidas, `400`; ausência de sessão, `401`; permissão insuficiente, `403`.

A transição de status para `Publicado` SHALL exigir a permissão `publicar` em **qualquer** caminho:
no endpoint dedicado, na criação com `status=Publicado` e na edição que altere o status para
`Publicado`. Sem essa permissão, a operação SHALL ser recusada com `403` e nenhum dado SHALL ser
alterado — mesmo que o perfil possua `criar` ou `alterar`. Quando a transição para `Publicado` for
autorizada pela edição ou criação, o servidor SHALL preencher `data_publicacao` e SHALL auditar a
operação como **"Homologação"**, não como simples "Alteração".

A criação de um escopo SHALL ser atômica em relação à sua publicação em cascata: o registro do escopo
e a reconciliação das chamadas filhas SHALL ocorrer na mesma transação. Se a reconciliação falhar,
nenhum escopo SHALL permanecer gravado e nenhuma filha SHALL ser alterada.

#### Scenario: Listagem da API
- **WHEN** um usuário com `visualizar` consulta `GET /api/escopo-projetos`
- **THEN** recebe os escopos não arquivados com contagem de itens e softwares derivados

#### Scenario: Escrita sem permissão
- **WHEN** um perfil sem `criar`, `alterar`, `excluir`, `publicar`, `arquivar` ou `importar` tenta a
  ação correspondente
- **THEN** a API responde `403` e não grava nada

#### Scenario: Auditoria das escritas
- **WHEN** um escopo é incluído, alterado, publicado, arquivado, excluído ou importado
- **THEN** um evento é registrado no recurso "Escopo de Projetos"

#### Scenario: Edição não publica sem a permissão publicar
- **WHEN** um perfil com `escopo-projetos`/`alterar` e sem `publicar` envia `PUT /api/escopo-projetos/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece inalterado e nenhuma chamada filha é publicada

#### Scenario: Criação não publica sem a permissão publicar
- **WHEN** um perfil com `escopo-projetos`/`criar` e sem `publicar` envia `POST /api/escopo-projetos` com `status=Publicado`
- **THEN** a API responde `403` e nenhum escopo é criado

#### Scenario: Edição autorizada publica e homologa
- **WHEN** um perfil com `publicar` envia `PUT /api/escopo-projetos/:id` mudando o status para `Publicado`
- **THEN** o status passa a `Publicado`, `data_publicacao` é preenchida, a cascata publica as filhas em `Publicar` e a trilha registra "Homologação"

#### Scenario: Falha na cascata não deixa escopo parcial
- **WHEN** a criação de um escopo com `status=Publicado` falha durante a reconciliação das filhas
- **THEN** nenhum escopo permanece gravado e nenhuma filha é alterada
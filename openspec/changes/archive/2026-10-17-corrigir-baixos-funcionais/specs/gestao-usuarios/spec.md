# Spec Delta

## ADDED Requirements

### Requirement: A exportação informa falha ao usuário
Ao gerar um relatório (CSV ou PDF), se a busca do conjunto ou a geração do arquivo falhar, o sistema SHALL exibir um toast de erro informando a falha — nunca falhar em silêncio (sem apenas registrar no console) — e SHALL indicar carregamento na ação enquanto a exportação estiver em andamento.

#### Scenario: Falha na exportação exibe erro
- **WHEN** o usuário aciona um item de "Relatórios" e a busca do conjunto ou a geração do arquivo falha
- **THEN** um toast de erro é exibido e o usuário sabe que a exportação não foi concluída

#### Scenario: Exportação em andamento indica carregamento
- **WHEN** o usuário aciona uma exportação
- **THEN** a ação exibe estado de carregamento até concluir

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário na Gestão de Usuários SHALL ser genéricas e acionáveis, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha de carga sem detalhe interno
- **WHEN** a carga dos usuários falha
- **THEN** o toast informa apenas que não foi possível carregar os dados, sem citar banco ou detalhes internos

### Requirement: A listagem trata recarga concorrente e reflete o termo de busca
A listagem SHALL aplicar uma recarga solicitada mesmo que haja uma carga em andamento (a recarga pendente SHALL ser executada após a atual concluir, sem ser descartada), e o termo de busca vigente SHALL aparecer no campo de busca da tabela — de modo que o filtro efetivo e o campo exibido nunca divirjam.

#### Scenario: Recarga durante carga em voo é aplicada
- **WHEN** o usuário salva/importa e a listagem é rebuscada enquanto uma carga anterior ainda está em andamento
- **THEN** a recarga pendente é executada após a primeira concluir, refletindo o estado atual (nenhuma atualização é perdida)

#### Scenario: Campo de busca reflete o termo vigente
- **WHEN** o usuário navega de volta à listagem com um termo de busca vigente no estado
- **THEN** o campo de busca da tabela exibe aquele termo, coerente com o conjunto filtrado

### Requirement: A criação concorrente de e-mail duplicado responde 409
Quando a criação de um usuário colidir com um e-mail já existente por uma condição de corrida (violação de unicidade no banco, `errno 1062`), a API SHALL responder `409` com a mensagem de e-mail já cadastrado, e não `500`.

#### Scenario: Corrida de unicidade vira 409
- **WHEN** duas criações com o mesmo e-mail concorrem e a segunda viola a unicidade no banco
- **THEN** a segunda responde `409` ("e-mail já cadastrado"), sem erro genérico `500`

### Requirement: O convite só atribui credenciais a usuário Ativo
O convite SHALL recusar (`400`) a geração/envio de credenciais para um usuário cuja situação não seja **Ativo**, de modo que não sejam entregues credenciais que o login bloquearia.

#### Scenario: Convite a Inativo é recusado
- **WHEN** um convite é solicitado com situação Inativo (ou Bloqueado)
- **THEN** a API responde `400` e nenhuma credencial é gerada/entregue
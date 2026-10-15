# Spec Delta

## Purpose

Definir o comportamento compartilhado da busca de endereço por CEP via API ViaCEP — contrato da consulta (validação, distinção de falhas, limite de tempo) e o efeito do ícone de busca sobre os campos de endereço —, usado pela aba Endereço de Meu Perfil e pela seção Endereço do modal de Gestão de Usuários.

## ADDED Requirements

### Requirement: A consulta de CEP preenche os campos de endereço devolvidos pela ViaCEP
Acionar o ícone de busca ao lado do campo CEP com um CEP de 8 dígitos válido SHALL consultar a API ViaCEP e preencher automaticamente: **Endereço** (`logradouro`), **Bairro** (`bairro`), **Cidade** (`localidade`), **Estado** (`uf`, sigla compatível com a seleção de UFs) e **Região** (`regiao`, valor compatível com a seleção de regiões). Os campos **Número** e **Complemento** SHALL ser preservados (a ViaCEP não os fornece), assim como o próprio CEP. Em sucesso NÃO SHALL haver toast — o preenchimento dos campos é o feedback. A execução SHALL ser idêntica nos dois formulários de endereço do sistema, variando apenas o título do toast de erro (o nome do módulo: "Meu Perfil" ou "Gestão de Usuários").

#### Scenario: CEP válido preenche o endereço
- **WHEN** com CEP `01001-000` o usuário aciona o ícone de busca
- **THEN** Endereço recebe "Praça da Sé", Bairro "Sé", Cidade "São Paulo", Estado "SP" e Região "Sudeste", sem nenhum toast

#### Scenario: Número e complemento não são alterados
- **WHEN** o usuário havia digitado Número `100` e Complemento ` sala 2` e a busca retorna com sucesso
- **THEN** Número e Complemento mantêm os valores digitados, e os demais campos são preenchidos com a resposta da ViaCEP

#### Scenario: Mesmo comportamento nos dois formulários
- **WHEN** o mesmo CEP é consultado na aba Endereço de Meu Perfil e na seção Endereço do modal de Gestão de Usuários
- **THEN** em ambos os campos de endereço recebem os mesmos valores e o toast de erro (houve) identifica o módulo correspondente

### Requirement: Falhas da consulta exibem feedback distinto e não alteram campos
O sistema SHALL distinguir três falhas da busca de CEP, cada uma com toast próprio e **sem alterar nenhum campo de endereço**: (1) CEP com menos de 8 dígitos — toast de aviso "Informe um CEP com 8 dígitos.", **sem emitir requisição**; (2) CEP inexistente na base ViaCEP — toast de erro "CEP não encontrado. Verifique o número digitado."; (3) falha de rede ou resposta inválida — toast de erro "Não foi possível consultar o CEP. Tente novamente.". Nenhum toast de sucesso SHALL ser exibido.

#### Scenario: CEP incompleto não consulta
- **WHEN** com o campo CEP contendo menos de 8 dígitos o usuário aciona o ícone de busca
- **THEN** um toast de aviso pede os 8 dígitos, nenhuma requisição é emitida e os campos de endereço permanecem como estavam

#### Scenario: CEP inexistente
- **WHEN** o usuário consulta um CEP de 8 dígitos que a ViaCEP não encontra
- **THEN** um toast de erro informa que o CEP não foi encontrado e nenhum campo de endereço é alterado

#### Scenario: Falha de rede
- **WHEN** a consulta falha por rede, resposta inválida ou tempo esgotado
- **THEN** um toast de erro informa que não foi possível consultar o CEP e nenhum campo de endereço é alterado

### Requirement: A consulta em voo bloqueia novos acionamentos e tem tempo limite
Enquanto uma busca de CEP estiver em andamento, o ícone SHALL exibir estado de carregamento e os acionamentos (clique ou Enter) SHALL ser ignorados, evitando requisições duplicadas. Uma requisição que não responder dentro do tempo limite SHALL ser abortada e tratada como falha de consulta (toast de erro), devolvendo o ícone ao estado normal.

#### Scenario: Clique duplo não dispara duas consultas
- **WHEN** o usuário aciona o ícone novamente enquanto a primeira consulta ainda está em voo
- **THEN** nenhuma segunda requisição é emitida e o ícone permanece em carregamento

#### Scenario: Tempo limite vira falha
- **WHEN** a resposta da ViaCEP não chega dentro do tempo limite
- **THEN** a requisição é abortada, um toast de erro de consulta é exibido e o ícone volta ao estado normal

### Requirement: Resposta parcial preserva os campos atuais
Quando a resposta da ViaCEP trouxer algum dos campos preenchíveis vazio (ex.: CEP genérico sem logradouro ou bairro), o sistema SHALL preencher apenas os campos com valor e manter o valor atual dos demais, sem apagar conteúdo digitado pelo usuário.

#### Scenario: CEP sem logradouro mantém o endereço digitado
- **WHEN** a resposta vem com `logradouro` vazio e o usuário já havia digitado um endereço
- **THEN** Endereço mantém o texto digitado e os demais campos com valor na resposta são atualizados

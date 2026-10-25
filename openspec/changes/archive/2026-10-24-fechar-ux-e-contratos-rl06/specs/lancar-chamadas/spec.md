# Spec Delta

## ADDED Requirements

### Requirement: As confirmações de Chamadas bloqueiam duplo envio

As confirmações de aprovar, desaprovar, recusar e excluir chamadas SHALL exibir `loading` e desabilitar a ação enquanto a requisição estiver em voo, evitando requisições duplicadas.

#### Scenario: Duplo clique em aprovar
- **WHEN** o usuário clica duas vezes em "Aprovar"
- **THEN** apenas uma requisição é enviada e o botão permanece desabilitado até a resposta

#### Scenario: Falha restaura o botão
- **WHEN** a requisição falha
- **THEN** o botão volta ao estado habilitado e a mensagem de erro é exibida

### Requirement: A listagem indica recarga no modo servidor

Ao trocar de página, buscar ou aplicar filtros no modo servidor, a listagem de Chamadas SHALL exibir um indicador de carregamento sem remover a tabela da tela.

#### Scenario: Troca de página
- **WHEN** o usuário muda de página
- **THEN** um indicador de carregamento é exibido até a nova página chegar

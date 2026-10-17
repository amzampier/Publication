# Spec Delta

## MODIFIED Requirements

### Requirement: O botão de fechar do toast tem nome acessível
O botão de fechar de cada toast SHALL ter nome acessível (por exemplo `aria-label="Fechar"`),
de modo que leitores de tela identifiquem a ação, e SHALL exibir um indicador de foco visível
quando alcançado por teclado.

#### Scenario: Leitor de tela anuncia o fechar
- **WHEN** um toast é exibido e o usuário percorre seus controles por tecnologia assistiva
- **THEN** o botão de fechar possui um nome acessível que descreve a ação

#### Scenario: Botão de fechar mostra foco
- **WHEN** o botão de fechar do toast recebe foco por teclado
- **THEN** um indicador de foco visível é exibido
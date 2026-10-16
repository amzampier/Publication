# Spec Delta

## ADDED Requirements

### Requirement: O botão de fechar do toast tem nome acessível
O botão de fechar de cada toast SHALL ter nome acessível (por exemplo `aria-label="Fechar"`),
de modo que leitores de tela identifiquem a ação.

#### Scenario: Leitor de tela anuncia o fechar
- **WHEN** um toast é exibido e o usuário percorre seus controles por tecnologia assistiva
- **THEN** o botão de fechar possui um nome acessível que descreve a ação

### Requirement: Toasts não estouram a viewport em telas estreitas
O contêiner de toasts SHALL manter os cards integralmente dentro da viewport em larguras de
celular (a partir de 320px), sem corte da borda esquerda.

#### Scenario: Toast legível em tela estreita
- **WHEN** um toast é exibido numa viewport de 320–400px
- **THEN** o card do toast permanece dentro da viewport, sem corte do conteúdo

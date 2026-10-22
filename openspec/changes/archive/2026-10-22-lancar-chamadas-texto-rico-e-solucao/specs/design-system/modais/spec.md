# Spec Delta

## MODIFIED Requirements

### Requirement: A armadilha de Tab fica restrita ao modal do topo

O sistema SHALL restringir a navegação de `Tab` e `Shift+Tab` aos elementos focáveis do modal do topo
quando há empilhamento, sem mover o foco para dentro dos modais subjacentes. Elementos editáveis por
conteúdo (`contenteditable`), como o editor de texto rico, SHALL ser considerados focáveis pela
armadilha, de modo que participem da ordem de tabulação e das bordas de circulação do diálogo.

#### Scenario: Tab percorre apenas o modal filho

- **WHEN** com o modal de usuário sob o modal de câmera, o usuário pressiona `Tab` repetidamente
- **THEN** o foco circula somente entre os controles do modal de câmera e nunca salta para o formulário subjacente

#### Scenario: Editor de texto rico participa da tabulação

- **WHEN** um modal contém um campo de texto rico e o usuário percorre os campos por `Tab`
- **THEN** o foco alcança o editor na ordem visual e a armadilha não deixa o foco escapar do diálogo

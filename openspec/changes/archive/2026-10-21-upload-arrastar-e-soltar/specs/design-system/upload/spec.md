# Spec Delta

## ADDED Requirements

### Requirement: O upload do kit aceita arrastar e soltar em toda a raiz

O `UiUploadFiles` SHALL aceitar arquivos arrastados sobre **qualquer ponto da sua raiz**, nos modos
clássico e `listaSeparada`, aplicando o mesmo fluxo do seletor de arquivos e emitindo `change` com os
arquivos aceitos. Enquanto houver um arquivo sobre a raiz, o componente SHALL exibir um feedback
visual explícito com a instrução “Solte os arquivos aqui” e `dropEffect = copy`. Ao sair da raiz, o
feedback SHALL desaparecer; a passagem do ponteiro sobre elementos filhos não SHALL apagar o estado
de arrasto. O componente SHALL expor uma operação pública para que consumidores encaminhem arquivos
soltos em áreas externas à caixa de upload, sem duplicar o evento quando o drop ocorrer dentro da
própria raiz.

#### Scenario: Arrastar sobre a raiz e soltar

- **WHEN** o usuário arrasta um arquivo sobre a raiz do `UiUploadFiles` e solta
- **THEN** o componente aplica o arquivo como se tivesse sido escolhido no seletor e emite `change`

#### Scenario: Feedback visual durante o arrasto

- **WHEN** um arquivo entra na raiz do componente
- **THEN** o componente exibe “Solte os arquivos aqui” com destaque visual e mantém o estado enquanto
  o ponteiro percorre os elementos filhos

#### Scenario: Drop em área externa encaminhado pelo consumidor

- **WHEN** o consumidor chama a operação pública de aplicar arquivos após um drop fora da raiz do
  `UiUploadFiles`
- **THEN** o componente aplica os arquivos e emite `change`, sem exigir clique na caixa de upload

#### Scenario: Drop dentro da raiz não duplica

- **WHEN** o drop acontece dentro da raiz do `UiUploadFiles` e o consumidor também escuta o evento
- **THEN** o arquivo é aplicado uma única vez

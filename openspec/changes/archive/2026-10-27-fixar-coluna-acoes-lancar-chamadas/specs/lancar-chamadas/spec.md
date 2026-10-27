# Spec Delta

## ADDED Requirements

### Requirement: A coluna de Ações permanece visível na rolagem horizontal

A listagem de Lançar as Chamadas SHALL manter a coluna **Ações** fixa à direita enquanto a tabela for rolada horizontalmente, preservando o acesso a Detalhes, Editar, Excluir e ao menu de demais ações sem exigir rolagem até o fim da grade. O cabeçalho, as linhas e o rodapé da coluna SHALL permanecer alinhados, com fundo opaco e separação visual sutil do conteúdo rolado, e a fixação NÃO SHALL introduzir rolagem horizontal na página.

#### Scenario: Ações visíveis em desktop com rolagem horizontal

- **WHEN** a listagem é exibida em uma largura em que as colunas não cabem e o usuário rola a tabela horizontalmente
- **THEN** a coluna Ações permanece visível à direita, com os controles de cada linha alinhados e acionáveis

#### Scenario: Ações visíveis em tela estreita

- **WHEN** a listagem é exibida em 375px e o usuário rola a tabela horizontalmente
- **THEN** a coluna Ações continua visível à direita e seus controles permanecem alcançáveis por toque e teclado

#### Scenario: Sem overflow na página

- **WHEN** a coluna Ações está fixa e a tabela é rolada até os extremos
- **THEN** a página não ganha rolagem horizontal própria e o conteúdo da última coluna de dados não fica oculto de forma permanente pela coluna fixa

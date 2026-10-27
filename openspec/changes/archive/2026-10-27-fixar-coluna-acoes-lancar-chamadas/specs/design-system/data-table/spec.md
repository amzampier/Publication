# Spec Delta

## ADDED Requirements

### Requirement: A coluna de Ações pode ser fixada à direita

A `UiDataTable` SHALL suportar, de forma opcional e desligada por padrão, a fixação da coluna de Ações à direita durante a rolagem horizontal. Quando habilitada, o cabeçalho, as células de dados e a célula do rodapé da coluna de Ações SHALL permanecer alinhados à borda direita da área visível, com fundo opaco, largura estável e separação visual sutil em relação ao conteúdo que passa por baixo. Sem a opção habilitada, a renderização e o comportamento existentes SHALL permanecer inalterados.

#### Scenario: Coluna fixa durante a rolagem horizontal

- **WHEN** a tabela possui a fixação de Ações habilitada e a área da tabela é rolada horizontalmente
- **THEN** o cabeçalho, as células de dados e o rodapé da coluna de Ações permanecem visíveis e alinhados à direita, sem acompanhar o deslocamento das demais colunas

#### Scenario: Fundo e hover coerentes

- **WHEN** uma linha de dados com a coluna fixa está sob o cursor ou recebe foco visual
- **THEN** a célula fixa de Ações acompanha o fundo da linha e mantém o conteúdo legível, sem transparência que deixe o conteúdo rolado aparecer por baixo

#### Scenario: Comportamento padrão preservado

- **WHEN** a tabela é usada sem habilitar a fixação de Ações
- **THEN** a coluna de Ações continua no fluxo normal da tabela, sem posicionamento fixo, sombra ou alteração de largura

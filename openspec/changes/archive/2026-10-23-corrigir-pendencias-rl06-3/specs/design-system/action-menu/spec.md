# Spec Delta

## ADDED Requirements

### Requirement: Menus de relatórios e exportação usam o menu canônico do kit

Os menus de **Relatórios/Exportar** exibidos nos cabeçalhos de módulo SHALL usar o mesmo padrão
acessível do menu de ações do kit: gatilho com `aria-haspopup="menu"` e `aria-expanded`, itens com
papel de menu, navegação por `ArrowUp`/`ArrowDown` com navegação cíclica, `Home`/`End`, acionamento
por `Enter`/`Space`, fechamento por `Escape` com retorno de foco ao gatilho e fechamento por clique
fora. O menu NÃO SHALL depender apenas de clique nem perder o foco para fora do conjunto aberto.

#### Scenario: Abrir e navegar por teclado

- **WHEN** o gatilho de relatórios está focado e o usuário pressiona `Enter` ou `Space` e depois as setas
- **THEN** o menu abre e o foco percorre os itens na ordem exibida, incluindo o retorno cíclico

#### Scenario: Fechar com Escape devolve o foco

- **WHEN** o menu de relatórios está aberto e o usuário pressiona `Escape`
- **THEN** o menu fecha e o foco retorna ao gatilho

#### Scenario: Clique fora fecha sem exportar

- **WHEN** o menu está aberto e o usuário clica fora dele
- **THEN** o menu fecha sem disparar nenhuma exportação

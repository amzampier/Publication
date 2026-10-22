# Spec Delta

## MODIFIED Requirements

### Requirement: Softwares contemplados derivados das chamadas
Os **softwares contemplados** NÃO SHALL ser selecionados no formulário. Eles SHALL ser derivados
dos itens vinculados ao escopo, um por software distinto das chamadas — considerando **todos** os
softwares de cada chamada —, e SHALL aparecer no
formulário somente quando houver pelo menos um item (o card exibe a quantidade de itens, não os
softwares). Na inclusão/importação, o escopo nasce sem softwares; eles são preenchidos quando as
chamadas são lançadas no módulo "Lançar as Chamadas". Na edição, a lista é somente leitura e vem da
API com os nomes dos softwares. O JSON `softwares_contemplados` NÃO SHALL ser fonte de verdade; o
backend SHALL derivar a lista de `entregas_itens`/`softwares`. O filtro por **Software** SHALL
oferecer apenas os softwares presentes no conjunto.

#### Scenario: Novo escopo sem softwares
- **WHEN** o usuário abre "Novo Escopo"
- **THEN** não há campo de seleção de softwares e a lista de softwares contemplados não é exibida

#### Scenario: Itens preenchem os softwares
- **WHEN** o escopo recebe chamadas com softwares distintos
- **THEN** a lista de softwares contemplados é preenchida automaticamente, sem repetição

#### Scenario: Chamada com múltiplos softwares
- **WHEN** o escopo recebe uma chamada vinculada a dois softwares
- **THEN** ambos os softwares entram na lista de softwares contemplados, sem repetição

#### Scenario: Edição somente leitura dos softwares
- **WHEN** o usuário edita um escopo que já possui itens
- **THEN** os softwares contemplados aparecem como texto/badges com os nomes retornados pela API,
  sem permitir alteração manual

# Spec Delta

## ADDED Requirements

### Requirement: A importação grava chamadas em lote

A importação XLSX de Chamadas SHALL gravar os itens em blocos (multi-row) e os softwares em upsert
multi-row, dentro de uma única transação, mantendo a atomicidade e o limite de 500 linhas.

#### Scenario: Importação de 500 linhas
- **WHEN** o usuário importa 500 chamadas válidas
- **THEN** a gravação usa lotes, conclui em tempo compatível com as demais importações e não deixa registro parcial

#### Scenario: Falha no meio
- **WHEN** uma linha falha durante a gravação em lote
- **THEN** a transação é revertida integralmente

### Requirement: A validação de unicidade usa a chave única

A criação/edição de chamada SHALL verificar duplicidade por `WHERE chamada = ?` (ou pela UK),
tratando `1062` como conflito, sem ler a tabela inteira para montar um conjunto em memória.

#### Scenario: Chamada duplicada
- **WHEN** o usuário tenta gravar uma chamada já existente
- **THEN** a API responde `409` sem varrer a tabela

#### Scenario: Gravação concorrente
- **WHEN** duas requisições criam a mesma chamada ao mesmo tempo
- **THEN** uma vence e a outra recebe `409`
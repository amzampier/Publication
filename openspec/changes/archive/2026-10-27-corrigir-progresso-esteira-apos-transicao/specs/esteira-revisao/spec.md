# Spec Delta

## ADDED Requirements

### Requirement: O progresso é sincronizado após uma transição

Após uma transição bem-sucedida na Esteira, o painel **Progresso da Esteira** SHALL refletir imediatamente os novos totais do ciclo ativo, sem exigir recarregar a página. A sincronização SHALL ocorrer para aprovar, recusar, reabrir, publicar e suspender, mantendo o progresso global coerente com o board e com os dados persistidos. Uma falha ao sincronizar o painel NÃO SHALL desfazer a transição já concluída.

#### Scenario: Publicar item atualiza aguardando

- **WHEN** o usuário publica um item em `Aprovado`, resultando em `Publicar`
- **THEN** o painel atualiza sem recarregar a página, decrementando `aprovados` e incrementando `aguardando` (e `publicar`)

#### Scenario: Suspender volta a contagem para aprovado

- **WHEN** o usuário suspende um item em `Publicar` ou `Publicado`, resultando em `Aprovado`
- **THEN** o painel atualiza sem recarregar a página, devolvendo a contagem para `aprovados` e removendo a de `aguardando`

#### Scenario: Falha na leitura do progresso não reverte a decisão

- **WHEN** a transição é concluída, mas a leitura do progresso falha
- **THEN** o item permanece com o novo status e o painel mantém o último valor conhecido, sem apresentar erro de transição

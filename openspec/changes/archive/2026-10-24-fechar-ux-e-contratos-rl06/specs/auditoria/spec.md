# Spec Delta

## ADDED Requirements

### Requirement: Limpar Filtros limpa apenas o rascunho

Na tela de Auditoria, "Limpar Filtros" SHALL limpar apenas o rascunho do modal; a tabela e os KPIs
só SHALL ser atualizados ao clicar "Aplicar". "Cancelar" SHALL descartar as alterações, e "Aplicar"
SHALL publicar a limpeza.

#### Scenario: Limpar e cancelar
- **WHEN** o usuário clica "Limpar Filtros" e depois "Cancelar"
- **THEN** a tabela e os KPIs permanecem com o conjunto anterior

#### Scenario: Limpar e aplicar
- **WHEN** o usuário clica "Limpar Filtros" e depois "Aplicar"
- **THEN** a tabela, os KPIs e a contagem do botão voltam ao estado sem filtros

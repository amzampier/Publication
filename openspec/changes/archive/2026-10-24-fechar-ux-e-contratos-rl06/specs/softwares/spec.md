# Spec Delta

## MODIFIED Requirements

### Requirement: Exclusão de software

O sistema SHALL oferecer a ação de linha **Excluir**, que abre um modal de confirmação com a descrição do software. Confirmar SHALL remover o registro via `DELETE /api/softwares/:codigo`; o sucesso fecha o modal, retira a linha da listagem e confirma a ação; em falha, um aviso de erro é exibido com a listagem intacta.

#### Scenario: Abrir a confirmação de exclusão
- **WHEN** o usuário aciona "Excluir" em uma linha
- **THEN** o modal de confirmação abre exibindo a descrição e a categoria do software

#### Scenario: Confirmar exclusão
- **WHEN** o usuário confirma a exclusão
- **THEN** o registro é removido via `DELETE /api/softwares/:codigo`, a linha sai da listagem e um aviso de sucesso é exibido

#### Scenario: Falha na exclusão
- **WHEN** a exclusão falha
- **THEN** um aviso de erro é exibido e a listagem permanece intacta

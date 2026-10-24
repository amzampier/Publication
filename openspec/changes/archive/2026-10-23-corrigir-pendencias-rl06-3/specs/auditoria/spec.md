# Spec Delta

## ADDED Requirements

### Requirement: A trilha de auditoria e o histórico da esteira são imutáveis no banco

O banco SHALL impedir `UPDATE` e `DELETE` comuns nas tabelas `auditoria` e
`historico_esteira_revisao` para o usuário da aplicação, por meio de privilégios mínimos e/ou
gatilhos de rejeição. A inserção SHALL continuar permitida e o expurgo controlado da auditoria SHALL
continuar funcionando por um caminho privilegiado e restrito. Nenhuma leitura ou escrita normal da
aplicação SHALL depender de alterar registros históricos.

#### Scenario: Alteração é rejeitada

- **WHEN** uma sessão com DML comum tenta atualizar um registro de auditoria ou histórico
- **THEN** o banco rejeita a operação e o registro permanece inalterado

#### Scenario: Exclusão comum é rejeitada

- **WHEN** uma sessão com DML comum tenta excluir um registro de auditoria ou histórico
- **THEN** o banco rejeita a operação e o registro permanece

#### Scenario: Expurgo controlado continua

- **WHEN** a rotina de expurgo autorizada remove registros de auditoria fora da janela
- **THEN** a remoção é concluída sem violar a imutabilidade dos demais registros

#### Scenario: Inserção normal continua

- **WHEN** uma operação administrativa registra auditoria ou uma transição grava histórico
- **THEN** a inserção é concluída normalmente

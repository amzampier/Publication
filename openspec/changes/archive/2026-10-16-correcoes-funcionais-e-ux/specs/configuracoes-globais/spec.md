# Spec Delta

## ADDED Requirements

### Requirement: A política de retenção de auditoria é aplicada automaticamente
O sistema SHALL aplicar a política de retenção de forma automática: registros de auditoria mais
antigos que `dias_retencao_auditoria` SHALL ser expurgados por uma rotina agendada no banco de
dados (um evento do MariaDB executado diariamente às 03:00), de modo que a trilha não cresça
além da janela configurada — sem exigir ação do operador.

#### Scenario: Registros fora da janela são expurgados
- **WHEN** existem registros de auditoria mais antigos que o número de dias configurado e o evento agendado executa
- **THEN** esses registros são removidos e a trilha mantém apenas os dentro da janela

#### Scenario: A janela acompanha a configuração
- **WHEN** o valor de `dias_retencao_auditoria` é alterado nas Configurações Globais
- **THEN** o expurgo seguinte passa a usar o novo valor

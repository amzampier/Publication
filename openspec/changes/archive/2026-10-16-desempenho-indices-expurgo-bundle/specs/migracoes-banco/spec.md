# Spec Delta

## ADDED Requirements

### Requirement: Sessões expiradas, tokens revogados e logs de segurança são expurgados automaticamente
O sistema SHALL aplicar retenção automática às tabelas auxiliares de sessão e de segurança: sessões
de refresh **expiradas** (sem revogação e com `expira_em` no passado) e **revogadas** há mais de um
dia (`sessoes`), registros de `token_blacklist` vencidos (`expira_em` no passado) e eventos de login
antigos (`seguranca_eventos_login`) além de uma janela fixa (90 dias) SHALL ser removidos por uma
rotina agendada no banco (evento do MariaDB, executado diariamente), sem exigir ação do operador, de
modo que essas tabelas não cresçam indefinidamente.

#### Scenario: Sessões expiradas e revogadas são removidas
- **WHEN** existem sessões cujo `expira_em` já passou (sem revogação) ou cujo `revogado_em` tem mais de um dia e o evento agendado executa
- **THEN** essas sessões são removidas e as sessões ativas/revogadas recentemente permanecem

#### Scenario: Tokens revogados vencidos são removidos
- **WHEN** existem registros de `token_blacklist` com `expira_em` no passado e o evento agendado executa
- **THEN** esses registros são removidos

#### Scenario: Log de segurança antigo é removido
- **WHEN** existem eventos de `seguranca_eventos_login` com mais de 90 dias e o evento agendado executa
- **THEN** esses eventos são removidos e os recentes permanecem

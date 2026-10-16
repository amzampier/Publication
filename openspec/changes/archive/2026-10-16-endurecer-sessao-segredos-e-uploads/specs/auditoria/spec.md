# Spec Delta

## ADDED Requirements

### Requirement: O IP registrado na trilha é o da conexão, salvo proxy confiável
O sistema SHALL registrar na trilha de auditoria o IP real da conexão do cliente; o cabeçalho
`X-Forwarded-For` SHALL ser considerado **somente** quando a implantação declarar uma lista de
proxies confiáveis (por configuração), de modo que o IP da trilha não possa ser forjado por um
cliente arbitrário.

#### Scenario: IP da conexão é o registrado sem proxy confiável
- **WHEN** uma operação de escrita é registrada sem proxies confiáveis configurados e a requisição traz um `X-Forwarded-For` forjado
- **THEN** a trilha registra o IP da conexão, não o valor do cabeçalho

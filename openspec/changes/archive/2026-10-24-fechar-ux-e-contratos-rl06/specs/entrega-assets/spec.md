# Spec Delta

## MODIFIED Requirements

### Requirement: A entrega de produção tem critério verificável

O projeto SHALL manter um checklist de produção com HTTPS/proxy confiável, headers, migrations, backup/restore, e-mail real, limites de banco, compressão/CDN e teste de carga, de modo que o go-live possa ser validado sem depender de conhecimento tácito. Cada item SHALL ter comando/verificação e critério de aceite.

#### Scenario: Checklist executável
- **WHEN** o operador segue o checklist de produção
- **THEN** cada item tem comando/verificação e critério de aceite

#### Scenario: Regressão de headers/cache
- **WHEN** a entrega é validada após o deploy
- **THEN** headers, cache e compressão conferem com este contrato

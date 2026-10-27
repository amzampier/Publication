# Spec Delta

## ADDED Requirements

### Requirement: A importação não cria Release Weeks publicadas

A importação de Release Weeks NÃO SHALL aceitar o status `Publicado`. O preview SHALL classificar a linha como inválida e o servidor SHALL responder `400` com os motivos, sem gravar nenhuma linha, sem executar cascata e sem registrar homologação. A publicação SHALL continuar exclusivamente pelos fluxos explícitos que exigem `publicar`.

#### Scenario: Planilha com Release Publicado

- **WHEN** uma linha da planilha tem `status=Publicado`
- **THEN** a linha é inválida, a importação inteira responde `400` e nenhuma Release Week é gravada

#### Scenario: Demais status

- **WHEN** as linhas usam status diferente de `Publicado` e os demais campos são válidos
- **THEN** a importação segue o fluxo transacional normal

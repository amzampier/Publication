# Spec Delta

## ADDED Requirements

### Requirement: A importação não cria escopos publicados

A importação de Escopo de Projetos NÃO SHALL aceitar o status `Publicado`. O preview SHALL classificar a linha como inválida e o servidor SHALL responder `400` com os motivos, sem gravar nenhum escopo, sem executar cascata e sem registrar homologação. A publicação SHALL continuar exclusivamente pelos fluxos explícitos que exigem `publicar`.

#### Scenario: Planilha com Escopo Publicado

- **WHEN** uma linha da planilha tem `status=Publicado`
- **THEN** a linha é inválida, a importação inteira responde `400` e nenhum escopo é gravado

#### Scenario: Demais status

- **WHEN** as linhas usam status diferente de `Publicado` e os demais campos são válidos
- **THEN** a importação segue o fluxo transacional normal

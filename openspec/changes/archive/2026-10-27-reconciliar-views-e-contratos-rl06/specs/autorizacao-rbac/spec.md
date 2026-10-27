# Spec Delta

## ADDED Requirements

### Requirement: O convite de conta existente exige alterar além de convite

`POST /api/convite` SHALL exigir `gestao-usuarios`/`convite` em todos os casos e, quando o e-mail já possuir conta, SHALL exigir também `gestao-usuarios`/`alterar` antes de redefinir a credencial. A conta existente SHALL permanecer com o perfil real; o perfil informado no payload não SHALL ser aplicado silenciosamente a ela. Sem as permissões, a API SHALL responder `403` sem alterar senha, perfil, sessões ou auditoria.

#### Scenario: Convite de conta existente sem alterar

- **WHEN** um perfil com `gestao-usuarios`/`convite` e sem `alterar` envia convite para um e-mail já cadastrado
- **THEN** a API responde `403`, a senha não muda e nenhuma sessão é revogada

#### Scenario: Convite de conta existente com alterar

- **WHEN** o ator possui `convite` e `alterar` e o alvo é compatível com sua hierarquia
- **THEN** a credencial é redefinida e as sessões antigas do alvo são revogadas

## MODIFIED Requirements

### Requirement: A busca de e-mails usa a permissão de Gestão de Usuários

O catálogo de autorização SHALL mapear `GET /api/usuarios/emails` para o módulo `gestao-usuarios`, exigindo `visualizar` e `buscar` em todas as requisições. A rota SHALL exigir um termo `q` com pelo menos 2 caracteres, rejeitar requisições sem sessão (`401`) e perfis sem as permissões (`403`), sem revelar e-mails.

#### Scenario: Rota protegida no catálogo

- **WHEN** a matriz de permissões é consultada
- **THEN** a rota de e-mails aparece sob `gestao-usuarios`

#### Scenario: Perfil sem permissão

- **WHEN** um perfil sem `gestao-usuarios`/`visualizar` chama a rota
- **THEN** a resposta é `403` e nenhum e-mail é retornado

#### Scenario: Perfil sem buscar

- **WHEN** um perfil com `gestao-usuarios`/`visualizar` e sem `buscar` chama a rota com `q` válido
- **THEN** a resposta é `403` e nenhum e-mail é retornado

#### Scenario: Termo mínimo

- **WHEN** a rota é chamada sem `q` ou com menos de 2 caracteres
- **THEN** a resposta é `400` e nenhum e-mail é retornado

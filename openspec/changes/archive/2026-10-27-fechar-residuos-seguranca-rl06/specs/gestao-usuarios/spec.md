# Spec Delta

## ADDED Requirements

### Requirement: Reset de credencial e convite validam a hierarquia do perfil atual

O sistema SHALL validar a hierarquia de perfil contra o **perfil atual do usuário-alvo** em qualquer operação que altere a credencial de terceiros, inclusive `PUT /api/usuarios/:id` sem campo `perfil` e `POST /api/convite` para conta existente. Quando o payload também alterar o perfil, o novo perfil SHALL ser validado em conjunto. Quem possui `perfis-acesso`/`permissoes` ou `perfis-acesso`/`alterar` mantém o bypass administrativo. A operação sem hierarquia suficiente SHALL responder `403` sem alterar senha, perfil, sessões ou auditoria.

#### Scenario: Reset de senha de perfil superior

- **WHEN** um ator com `gestao-usuarios`/`alterar` e sem controle de perfis envia `PUT /api/usuarios/:id` com nova senha para um alvo de perfil superior, sem enviar `perfil`
- **THEN** a API responde `403`, a senha não muda e as sessões do alvo não são revogadas

#### Scenario: Convite para conta existente de perfil superior

- **WHEN** um ator sem hierarquia suficiente envia convite para o e-mail de uma conta existente cujo perfil real é superior, mesmo informando um perfil inferior no payload
- **THEN** a API responde `403` e a credencial da conta existente não é alterada

#### Scenario: Perfil atual permitido

- **WHEN** o perfil atual do alvo é subconjunto das permissões do ator
- **THEN** o reset/convite é permitido e segue as regras de revogação de sessão

#### Scenario: Administrador de perfis

- **WHEN** o ator possui `perfis-acesso`/`permissoes` ou `perfis-acesso`/`alterar`
- **THEN** a validação de hierarquia não bloqueia a operação

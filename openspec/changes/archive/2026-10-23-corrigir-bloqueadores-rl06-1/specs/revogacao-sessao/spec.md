# Spec Delta

## MODIFIED Requirements

### Requirement: Alterar ou redefinir a senha revoga as sessões vigentes
Ao alterar a própria senha (`POST /api/auth/trocar-senha`), ao redefinir a senha de um usuário pela
edição geral (`PUT /api/usuarios/:id`), pelo convite de conta existente (`POST /api/convite`) ou
pela **recuperação de senha** (`POST /api/auth/esqueci-senha`), o sistema SHALL encerrar a validade
das sessões anteriores (access **e** refresh) e, no caso da troca da própria senha, SHALL emitir uma
nova sessão apenas para o solicitante. Na recuperação de senha, a revogação SHALL ocorrer na mesma
transação da gravação da senha provisória, **após** a entrega bem-sucedida do e-mail e **antes** de
a resposta genérica concluir o trabalho fora do caminho da resposta.

#### Scenario: Sessão capturada deixa de valer após a troca de senha
- **WHEN** um access ou refresh capturado antes da troca de senha é reutilizado depois dela
- **THEN** a resposta é `401` e nenhum novo token é emitido a partir do refresh antigo

#### Scenario: Sessão capturada deixa de valer após a recuperação de senha
- **WHEN** um access ou refresh capturado antes da recuperação de senha é reutilizado depois de a senha provisória ser gravada
- **THEN** a resposta é `401` e nenhum novo token é emitido a partir do refresh antigo

#### Scenario: Recuperação com falha de envio não revoga
- **WHEN** a recuperação de senha falha no envio do e-mail e a senha anterior é mantida
- **THEN** as sessões vigentes permanecem válidas e a senha anterior continua autenticando

#### Scenario: Nova sessão após a recuperação funciona
- **WHEN** o usuário autentica com a senha provisória após a recuperação
- **THEN** uma nova sessão é estabelecida e a condição de senha provisória é sinalizada para a troca obrigatória
# Spec Delta

## MODIFIED Requirements

### Requirement: A aba Segurança permite trocar a senha com validação contra a senha vigente
A aba **Segurança** SHALL conter **Senha atual** na primeira linha (largura de metade, sem
ocupar a tela inteira) e **Nova senha** (mínimo de 8 caracteres) **ao lado da Confirmação da
nova senha** na segunda linha, quando a largura permitir — com alternância de visibilidade, o
botão próprio "Alterar senha" e, ao final, o mini-card informativo "Sua conta está segura". A
troca SHALL ser processada pela API de troca de senha: a senha atual SHALL ser conferida no
servidor contra o hash vigente do banco (bcrypt) — a senha vigente pode ser a original, a
provisória do convite ou a provisória da recuperação, todas já persistidas como hash —, a nova
senha SHALL ter no mínimo 8 caracteres e a confirmação SHALL ser idêntica — validações de
formato no cliente, erro da conferência vindo do servidor, erros exibidos no campo
correspondente no padrão do design system, sem gravar nada. Em sucesso, a nova senha SHALL ser
gravada via API (substituindo o hash vigente; toast de sucesso e campos limpos) e passar a
autenticar no login; os demais campos da página não participam dessa operação.

#### Scenario: Senha atual incorreta
- **WHEN** o usuário informa uma senha atual diferente da vigente e aciona "Alterar senha"
- **THEN** o campo Senha atual exibe erro no padrão do design system (resposta do servidor) e
  a senha do registro não muda

#### Scenario: Confirmação divergente
- **WHEN** a nova senha e a confirmação diferem
- **THEN** o campo de confirmação exibe "As senhas não conferem." e nada é gravado

#### Scenario: Senha nova curta
- **WHEN** a nova senha tem menos de 8 caracteres
- **THEN** o campo exibe "A senha deve ter pelo menos 8 caracteres." e nada é gravado

#### Scenario: Troca bem-sucedida reflete no login
- **WHEN** o usuário troca a senha com todos os campos válidos
- **THEN** o servidor grava o novo hash no lugar do vigente, um toast confirma a troca e as
  próximas autenticações usam a nova senha

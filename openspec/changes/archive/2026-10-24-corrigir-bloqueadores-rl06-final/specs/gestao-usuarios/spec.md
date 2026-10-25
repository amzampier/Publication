# Spec Delta

## MODIFIED Requirements

### Requirement: A atribuição de perfil respeita a hierarquia

Ao criar ou editar um usuário, o sistema SHALL permitir que o ator atribua apenas perfis cujo
conjunto de permissões não exceda o do seu próprio perfil. Um perfil intermediário com
`gestao-usuarios`/`criar` ou `alterar` NÃO SHALL criar ou promover uma conta Administrador, nem
atribuir um perfil com privilégios superiores aos seus. A mesma regra SHALL valer para
`POST /api/convite`, inclusive quando a conta já existe. A tentativa SHALL responder `403` sem
gravar o usuário. Um ator com controle sobre perfis (`perfis-acesso`/`alterar` ou `permissoes`) e
perfil Administrador permanece autorizado.

#### Scenario: Perfil intermediário não cria Administrador
- **WHEN** um perfil com `gestao-usuarios`/`criar`, mas sem controle de perfis, envia `POST /api/usuarios` com perfil Administrador
- **THEN** a API responde `403` e nenhum usuário é criado

#### Scenario: Perfil intermediário não promove a superior
- **WHEN** um perfil intermediário envia `PUT /api/usuarios/:id` trocando o perfil de um usuário para um perfil superior ao seu
- **THEN** a API responde `403` e o perfil do alvo permanece inalterado

#### Scenario: Convite não atribui perfil superior
- **WHEN** um perfil intermediário envia `POST /api/convite` com perfil superior ao seu
- **THEN** a API responde `403`, nenhuma conta é criada e nenhum convite é enviado

#### Scenario: Administrador mantém a atribuição
- **WHEN** um Administrador com controle de perfis cria ou edita um usuário com qualquer perfil ativo
- **THEN** a operação é autorizada

### Requirement: A listagem devolve os carimbos de cadastro

A listagem de usuários SHALL devolver, para cada registro, `dataCadastro` e `atualizadoEm`
derivados de `criado_em`/`atualizado_em`, incluindo essas colunas na projeção enxuta, de modo que o
contrato não devolva campos nulos quando o banco possui os carimbos. O detalhe do usuário continua
sendo a fonte dos campos completos, mas a listagem e a exportação SHALL refletir as datas reais.

#### Scenario: Datas presentes na listagem
- **WHEN** `GET /api/usuarios` devolve um usuário existente
- **THEN** `dataCadastro` e `atualizadoEm` vêm preenchidos com os carimbos do banco

#### Scenario: Exportação usa as datas reais
- **WHEN** o usuário exporta a listagem em CSV/PDF
- **THEN** as datas de cadastro/atualização correspondem ao banco
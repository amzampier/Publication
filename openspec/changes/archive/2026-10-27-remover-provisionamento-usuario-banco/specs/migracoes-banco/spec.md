# Spec Delta

## ADDED Requirements

### Requirement: Provisionamento de usuário e privilégios é responsabilidade do operador

A aplicação SHALL NOT criar, alterar ou remover usuários do MariaDB, nem conceder ou revogar privilégios. A existência da conta de banco, sua senha e seus grants SHALL ser responsabilidade do operador do ambiente, fora do boot e de qualquer script versionado do projeto. Falha de autenticação/autorização SHALL ser reportada como erro de provisionamento, sem tentativa da aplicação de criar ou elevar a conta.

#### Scenario: Boot não executa comandos de conta

- **WHEN** o servidor sobe com `DB_USER`/`DB_PASSWORD` válidos
- **THEN** nenhum comando `CREATE USER`, `ALTER USER`, `DROP USER`, `GRANT` ou `REVOKE` é executado pela aplicação

#### Scenario: Credenciais inválidas não criam conta

- **WHEN** o servidor sobe com credenciais ausentes ou inválidas
- **THEN** o boot falha de forma explícita, sem tentar criar usuário, alterar senha ou conceder privilégios

#### Scenario: Repositório não distribui script de criação de usuário

- **WHEN** o projeto é entregue ou instalado
- **THEN** nenhum script do repositório cria ou ajusta usuário/grants no MariaDB

### Requirement: Conta única para pool e migrations

O pool de conexões e o runner de migrations SHALL usar exclusivamente as variáveis `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME`. O sistema SHALL NOT ler variáveis de uma conta separada de migração (por exemplo, `DB_MIGRATION_USER`/`DB_MIGRATION_PASSWORD`) nem abrir uma segunda conexão com credenciais distintas para aplicar migrations.

#### Scenario: Migrations usam a mesma conta da aplicação

- **WHEN** existem migrations pendentes no boot
- **THEN** elas são aplicadas pela mesma conta configurada em `DB_USER`, sem credenciais adicionais

#### Scenario: Variáveis de migração são ignoradas

- **WHEN** o ambiente define `DB_MIGRATION_USER` ou `DB_MIGRATION_PASSWORD`
- **THEN** a aplicação não as utiliza e continua operando apenas com `DB_*`

### Requirement: A conta do operador cobre as permissões do boot

A conta fornecida pelo operador SHALL possuir os privilégios necessários para as operações que o boot executa, incluindo DDL (`CREATE`/`ALTER`) quando houver migrations pendentes, além do DML usado em runtime e do `EVENT` usado pelo expurgo agendado. Quando a conta não tiver o privilégio exigido, o boot SHALL falhar de forma explícita, sem contornar a restrição criando ou usando outra conta.

#### Scenario: Migration pendente é aplicada com a conta do operador

- **WHEN** a conta de `DB_USER` tem os privilégios exigidos e há migration pendente
- **THEN** a migration é aplicada e registrada em `_migrations`

#### Scenario: Conta sem DDL bloqueia o boot com erro claro

- **WHEN** há migration pendente e a conta de `DB_USER` não pode executar DDL
- **THEN** o boot aborta com erro identificando a migration e o privilégio negado, sem criar conta alternativa ou elevar privilégios

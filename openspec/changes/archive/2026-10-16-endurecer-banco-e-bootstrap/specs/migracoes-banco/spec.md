# Spec Delta

## ADDED Requirements

### Requirement: Migrations não destrutivas
Os arquivos de migration SHALL NOT remover dados ou objetos existentes de forma implícita: nenhuma
migration pode conter `DROP TABLE`, `DROP VIEW` ou `DROP DATABASE` de objetos da aplicação, de modo
que aplicar uma migration pendente nunca cause perda de dados. Objetos já existentes SHALL ser
tratados de forma idempotente (`CREATE ... IF NOT EXISTS`).

#### Scenario: Migration aplicada sobre banco existente não apaga dados
- **WHEN** uma migration pendente é aplicada sobre um banco que já contém tabelas com dados
- **THEN** nenhum dado é removido e as tabelas e objetos permanecem intactos

#### Scenario: Base vazia é provisionada pelos CREATEs
- **WHEN** as migrations rodam sobre um banco sem tabelas
- **THEN** o schema completo é criado pelos `CREATE TABLE` (sem depender de `DROP` prévio)

## MODIFIED Requirements

### Requirement: Registro das migrations executadas
O sistema SHALL manter uma tabela de controle (`_migrations`) com uma linha por arquivo de migration executado, contendo o nome do arquivo e o momento da execução. O registro SHALL ser resiliente: se o nome já estiver registrado (ex.: duas instâncias subindo ao mesmo tempo), a gravação duplicada SHALL ser tratada como já aplicada e o boot SHALL prosseguir, sem abortar.

#### Scenario: Registro após execução bem-sucedida
- **WHEN** um arquivo de migration termina de executar sem erro fatal
- **THEN** seu nome é gravado na tabela de controle e será ignorado nos próximos boots

#### Scenario: Erro fatal não registra a migration
- **WHEN** um arquivo de migration aborta por erro não tolerado
- **THEN** ele não é registrado na tabela de controle e será tentado novamente no próximo boot

#### Scenario: Registro duplicado (corrida entre instâncias) não aborta o boot
- **WHEN** duas instâncias executam a mesma migration e a segunda tenta gravar um nome já presente em `_migrations`
- **THEN** o erro de chave duplicada é tolerado, o boot conclui e a migration não é reaplicada

### Requirement: Administrador inicial com hash bcrypt real
O usuário administrador inicial SHALL existir no banco com hash bcrypt válido (cost 12) da senha provisória documentada (`Public@2026`), permitindo login real. O provisionamento automático SHALL ocorrer **somente quando o ambiente não for de produção** (`NODE_ENV !== 'production'`), SHALL marcar a senha como provisória (`senha_provisoria = 1`) para exigir a troca no primeiro acesso e SHALL ser idempotente: um admin já existente não é sobrescrito.

#### Scenario: Bootstrap cria o admin na primeira execução
- **WHEN** o provisionamento roda em ambiente não-produção sem o usuário `ana.carolina@empresa.com.br`
- **THEN** o usuário é criado com perfil Administrador, situação Ativo, hash bcrypt verificável e marcado com senha provisória

#### Scenario: Admin existente não é modificado
- **WHEN** o provisionamento roda com o admin já existente (mesmo com hash trocado)
- **THEN** nenhum dado do usuário é alterado

#### Scenario: Produção não cria administrador padrão
- **WHEN** o provisionamento roda com `NODE_ENV=production` e sem o administrador
- **THEN** nenhum usuário administrador é criado automaticamente e o log informa que o provisionamento foi ignorado

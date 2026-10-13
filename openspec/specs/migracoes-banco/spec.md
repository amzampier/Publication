# Migrations de Banco de Dados Specification

## Purpose

Provisiona e mantém o banco de dados MariaDB do Publications alinhado ao schema versionado: executa migrations SQL automaticamente na inicialização do servidor, aplica os seeds iniciais (perfis, admin, configurações) e expõe o pool de conexões utf8mb4 usado pela aplicação.

## Requirements

### Requirement: Banco provisionado na inicialização
O servidor SHALL executar as migrations pendentes automaticamente na inicialização, antes de atender requisições, de modo que uma base vazia fique utilizável após o boot.

#### Scenario: Primeira inicialização com banco vazio
- **WHEN** o servidor sobe apontando para um banco `publications` sem tabelas
- **THEN** todas as migrations de `server/migration/` são aplicadas em ordem alfabética e o banco fica com o schema completo (tabelas, views e seeds)

#### Scenario: Inicialização com banco já provisionado
- **WHEN** o servidor sobe com todas as migrations já registradas
- **THEN** nenhuma migration é reexecutada e o boot conclui normalmente

### Requirement: Execução idempotente das migrations
Reexecutar migrations já aplicadas ou reexecutar o boot SHALL ser seguro: erros de "já existe" (coluna, índice, chave duplicada, tabela existente, registro duplicado) não interrompem a execução.

#### Scenario: Reexecução de migration com objetos já existentes
- **WHEN** um arquivo de migration contém um `CREATE TABLE`/`CREATE INDEX`/`INSERT` cujo objeto ou registro já existe
- **THEN** o runner ignora o erro idempotente correspondente e continua executando os demais statements do arquivo

#### Scenario: Boot repetido não duplica registros de seed
- **WHEN** o servidor reinicia com os seeds já aplicados
- **THEN** as chaves únicas impedem duplicidade e os registros originais permanecem intactos

### Requirement: Registro das migrations executadas
O sistema SHALL manter uma tabela de controle (`_migrations`) com uma linha por arquivo de migration executado, contendo o nome do arquivo e o momento da execução.

#### Scenario: Registro após execução bem-sucedida
- **WHEN** um arquivo de migration termina de executar sem erro fatal
- **THEN** seu nome é gravado na tabela de controle e será ignorado nos próximos boots

#### Scenario: Erro fatal não registra a migration
- **WHEN** um arquivo de migration aborta por erro não tolerado
- **THEN** ele não é registrado na tabela de controle e será tentado novamente no próximo boot

### Requirement: Convenção dos arquivos de migration
Os arquivos SQL de `server/migration/` SHALL seguir as convenções do `docs/02` §4.5: nomes sequenciais (`01_`, `02_`...), `;` como delimitador de statements e bloco de rollback comentado ao final. Os executáveis NÃO contêm `USE`: o pool conecta já no banco selecionado por `DB_NAME` (a referência `docs/bd/` mantém o `USE` para execução manual via cliente SQL).

#### Scenario: Migration nova respeita a convenção
- **WHEN** um novo arquivo `.sql` é adicionado em `server/migration/` com nome sequencial, sem `USE` e com rollback comentado
- **THEN** o runner o executa na ordem correta junto das demais, no banco apontado por `DB_NAME`

### Requirement: Erro fatal é visível
Um erro não tolerado SHALL interromper a execução das migrations e ser claramente identificado no log — o servidor não deve subir fingindo que o banco está pronto.

#### Scenario: Statement inválido aborta a execução
- **WHEN** um statement falha com código de erro fora da lista de tolerância
- **THEN** a execução daquele arquivo para, o erro é logado com o nome do arquivo e do statement, e a inicialização sinaliza a falha

### Requirement: Seeds iniciais completos
Após as migrations, o banco SHALL conter os seeds de `docs/bd/02_seed.sql`: os 4 perfis padrão (Administrador, Editor, Revisor, Leitor), a matriz de permissões (11 módulos × 4 perfis), a linha `config_default` de `configuracoes_globais` e a linha padrão de `configuracoes_limite_requisicao`.

#### Scenario: Perfis e matriz de permissões presentes
- **WHEN** o provisionamento termina
- **THEN** existem 4 perfis Ativo e 44 linhas em `permissoes_perfil` com os totais 99/45/21/6 por perfil

#### Scenario: Configurações globais inicializadas
- **WHEN** o provisionamento termina
- **THEN** existe exatamente uma linha `config_default` com sidebar expandida e retenção de 180 dias

### Requirement: Administrador inicial com hash bcrypt real
O usuário administrador inicial SHALL existir no banco com hash bcrypt válido (cost 12) da senha provisória documentada (`Public@2026`), permitindo login real quando a autenticação for implementada. O bootstrap SHALL ser idempotente: um admin já existente não é sobrescrito.

#### Scenario: Bootstrap cria o admin na primeira execução
- **WHEN** o provisionamento roda sem o usuário `ana.carolina@empresa.com.br`
- **THEN** o usuário é criado com perfil Administrador, situação Ativo e hash bcrypt verificável

#### Scenario: Admin existente não é modificado
- **WHEN** o provisionamento roda com o admin já existente (mesmo com hash trocado)
- **THEN** nenhum dado do usuário é alterado

### Requirement: Pool de conexões utf8mb4
A aplicação SHALL acessar o banco por um pool de conexões com charset `utf8mb4`, limites de conexão/fila configurados, suporte a queries parametrizadas e transações explícitas com commit/rollback.

#### Scenario: Acentuação preservada ponta a ponta
- **WHEN** um registro com acentos (ex.: "Configurações") é gravado e relido
- **THEN** o conteúdo retorna íntegro, sem corrupção de charset

#### Scenario: Transação com falha desfaz tudo
- **WHEN** uma escrita composta falha no meio e o chamador executa o rollback
- **THEN** nenhuma das alterações daquela transação persiste

### Requirement: Migrations incluídas no build de produção
O build de produção SHALL incluir os arquivos `.sql` de `server/migration/` no artefato final, de modo que `node .output/server/index.mjs` também execute as migrations.

#### Scenario: Build e boot em produção
- **WHEN** `npm run build` é executado e o servidor de produção sobe contra um banco vazio
- **THEN** o diretório `.output/server/migration/` contém os `.sql` e as migrations são aplicadas normalmente

### Requirement: Conexão configurada por variáveis de ambiente
A conexão com o banco SHALL ser configurada por `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` e `DB_NAME` (default `publications`), documentadas em `.env.example`.

#### Scenario: Apontar para outra instância
- **WHEN** as variáveis `DB_*` do `.env` apontam para outro host/banco acessível
- **THEN** o servidor e as migrations operam sobre essa instância alvo

#### Scenario: Ausência de .env usa defaults locais
- **WHEN** o `.env` não define `DB_*`
- **THEN** a conexão usa os defaults documentados (localhost:3306, root, banco `publications`)

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

### Requirement: Migrations não destrutivas
Os arquivos de migration SHALL NOT remover dados ou objetos existentes de forma implícita: nenhuma migration pode conter `DROP TABLE`, `DROP VIEW` ou `DROP DATABASE` de objetos da aplicação, de modo que aplicar uma migration pendente nunca cause perda de dados. Objetos já existentes SHALL ser tratados de forma idempotente (`CREATE ... IF NOT EXISTS`).

#### Scenario: Migration aplicada sobre banco existente não apaga dados
- **WHEN** uma migration pendente é aplicada sobre um banco que já contém tabelas com dados
- **THEN** nenhum dado é removido e as tabelas e objetos permanecem intactos

#### Scenario: Base vazia é provisionada pelos CREATEs
- **WHEN** as migrations rodam sobre um banco sem tabelas
- **THEN** o schema completo é criado pelos `CREATE TABLE` (sem depender de `DROP` prévio)

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
Após as migrations, o banco SHALL conter os seeds de `docs/bd/02_seed.sql`: os 4 perfis padrão (Administrador, Editor, Revisor, Leitor), a matriz de permissões (11 módulos × 4 perfis), a linha `config_default` de `configuracoes_globais` e a linha padrão de `configuracoes_limite_requisicao`. O banco zerado **não** SHALL conter softwares pré-cadastrados — o catálogo de softwares inicia **vazio** e seus códigos sequenciais são gerados pelo servidor na inclusão/importação.

#### Scenario: Perfis e matriz de permissões presentes
- **WHEN** o provisionamento termina
- **THEN** existem 4 perfis Ativo e 44 linhas em `permissoes_perfil` com os totais 99/45/21/6 por perfil

#### Scenario: Configurações globais inicializadas
- **WHEN** o provisionamento termina
- **THEN** existe exatamente uma linha `config_default` com sidebar expandida e retenção de 180 dias

#### Scenario: Catálogo de softwares inicializado
- **WHEN** o provisionamento termina em um banco zerado
- **THEN** a tabela `softwares` está vazia (nenhum software de exemplo é inserido) e o catálogo nasce sem registros

### Requirement: Administrador inicial com hash bcrypt real
O usuário administrador inicial SHALL existir no banco com hash bcrypt válido (cost 12) da senha provisória documentada (`Public@2026`), permitindo login real. O provisionamento automático SHALL ocorrer **somente quando o ambiente não for de produção** (`NODE_ENV !== 'production'`), SHALL marcar a senha como provisória (`senha_provisoria = 1`) para exigir a troca no primeiro acesso e SHALL ser idempotente: um admin já existente não é sobrescrito.

#### Scenario: Bootstrap cria o admin na primeira execução
- **WHEN** o provisionamento roda em ambiente não-produção sem o usuário `admin@empresa.com.br`
- **THEN** o usuário é criado com perfil Administrador, situação Ativo, hash bcrypt verificável e marcado com senha provisória

#### Scenario: Admin existente não é modificado
- **WHEN** o provisionamento roda com o admin já existente (mesmo com hash trocado)
- **THEN** nenhum dado do usuário é alterado

#### Scenario: Produção não cria administrador padrão
- **WHEN** o provisionamento roda com `NODE_ENV=production` e sem o administrador
- **THEN** nenhum usuário administrador é criado automaticamente e o log informa que o provisionamento foi ignorado

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

### Requirement: Sessões expiradas, tokens revogados e logs de segurança são expurgados automaticamente
O sistema SHALL aplicar retenção automática às tabelas auxiliares de sessão e de segurança: sessões
de refresh **expiradas** (sem revogação e com `expira_em` no passado) e **revogadas** há mais de um
dia (`sessoes`), registros de `token_blacklist` vencidos (`expira_em` no passado) e eventos de login
antigos (`seguranca_eventos_login`) além de uma janela fixa (90 dias) SHALL ser removidos por uma
rotina agendada no banco (evento do MariaDB, executado diariamente), sem exigir ação do operador, de
modo que essas tabelas não cresçam indefinidamente.

#### Scenario: Sessões expiradas e revogadas são removidas
- **WHEN** existem sessões cujo `expira_em` já passou (sem revogação) ou cujo `revogado_em` tem mais de um dia e o evento agendado executa
- **THEN** essas sessões são removidas e as sessões ativas/revogadas recentemente permanecem

#### Scenario: Tokens revogados vencidos são removidos
- **WHEN** existem registros de `token_blacklist` com `expira_em` no passado e o evento agendado executa
- **THEN** esses registros são removidos

#### Scenario: Log de segurança antigo é removido
- **WHEN** existem eventos de `seguranca_eventos_login` com mais de 90 dias e o evento agendado executa
- **THEN** esses eventos são removidos e os recentes permanecem

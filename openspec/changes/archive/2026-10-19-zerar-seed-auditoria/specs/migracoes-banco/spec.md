# Spec Delta: migracoes-banco

## MODIFIED Requirements

### Requirement: Migrations não destrutivas
Os arquivos de migration SHALL NOT remover dados ou objetos existentes de forma implícita: nenhuma migration pode conter `DROP TABLE`, `DROP VIEW` ou `DROP DATABASE` de objetos da aplicação, de modo que aplicar uma migration pendente nunca cause perda de dados. Objetos já existentes SHALL ser tratados de forma idempotente (`CREATE ... IF NOT EXISTS`). Uma migration de correção PODE remover registros de seed conhecidos por meio de `DELETE` escopado a identificadores fixos (ex.: `id LIKE 'log-seed-%'`), desde que não atinja dados operacionais.

#### Scenario: Migration aplicada sobre banco existente não apaga dados
- **WHEN** uma migration pendente é aplicada sobre um banco que já contém tabelas com dados
- **THEN** nenhum dado é removido e as tabelas e objetos permanecem intactos

#### Scenario: Base vazia é provisionada pelos CREATEs
- **WHEN** as migrations rodam sobre um banco sem tabelas
- **THEN** o schema completo é criado pelos `CREATE TABLE` (sem depender de `DROP` prévio)

#### Scenario: Correção de seed é escopada e reexecutável
- **WHEN** uma migration de correção remove registros de seed por identificador fixo em um banco com dados operacionais
- **THEN** apenas as linhas de seed são removidas e a migration é idempotente em reexecução

### Requirement: Seeds iniciais completos
Após as migrations, o banco SHALL conter os seeds de `docs/bd/02_seed.sql`: os 4 perfis padrão (Administrador, Editor, Revisor, Leitor), a matriz de permissões (11 módulos × 4 perfis), a linha `config_default` de `configuracoes_globais` e a linha padrão de `configuracoes_limite_requisicao`. O banco zerado **não** SHALL conter softwares pré-cadastrados — o catálogo de softwares inicia **vazio** e seus códigos sequenciais são gerados pelo servidor na inclusão/importação. O banco zerado também **não** SHALL conter registros de demonstração na trilha de auditoria: a tabela `auditoria` inicia **vazia**, preenchida apenas por operações reais.

#### Scenario: Perfis e matriz de permissões presentes
- **WHEN** o provisionamento termina
- **THEN** existem 4 perfis Ativo e 44 linhas em `permissoes_perfil` com os totais 99/45/21/6 por perfil

#### Scenario: Configurações globais inicializadas
- **WHEN** o provisionamento termina
- **THEN** existe exatamente uma linha `config_default` com sidebar expandida e retenção de 180 dias

#### Scenario: Catálogo de softwares inicializado
- **WHEN** o provisionamento termina em um banco zerado
- **THEN** a tabela `softwares` está vazia (nenhum software de exemplo é inserido) e o catálogo nasce sem registros

#### Scenario: Trilha de auditoria inicializada vazia
- **WHEN** o provisionamento termina em um banco zerado
- **THEN** a tabela `auditoria` está vazia (nenhum registro `log-seed-%`) e é populada apenas por operações reais

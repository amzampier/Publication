# Spec Delta

## MODIFIED Requirements

### Requirement: Seeds iniciais completos
Após as migrations, o banco SHALL conter os seeds de `docs/bd/02_seed.sql`: os 4 perfis padrão (Administrador, Editor, Revisor, Leitor), a matriz de permissões (11 módulos × 4 perfis), a linha `config_default` de `configuracoes_globais` e a linha padrão de `configuracoes_limite_requisicao`. O banco zerado **não** SHALL conter softwares pré-cadastrados — o catálogo de softwares inicia **vazio** e seus códigos sequenciais são gerados pelo servidor na inclusão/importação. O banco zerado também **não** SHALL conter registros de demonstração na trilha de auditoria: a tabela `auditoria` inicia **vazia**, preenchida apenas por operações reais.

#### Scenario: Perfis e matriz de permissões presentes
- **WHEN** o provisionamento termina
- **THEN** existem 4 perfis Ativo e 44 linhas em `permissoes_perfil` com os totais **92/67/41/14** por perfil (Administrador/Editor/Revisor/Leitor)

#### Scenario: Configurações globais inicializadas
- **WHEN** o provisionamento termina
- **THEN** existe exatamente uma linha `config_default` com sidebar expandida e retenção de 180 dias

#### Scenario: Catálogo de softwares inicializado
- **WHEN** o provisionamento termina em um banco zerado
- **THEN** a tabela `softwares` está vazia (nenhum software de exemplo é inserido) e o catálogo nasce sem registros

#### Scenario: Trilha de auditoria inicializada vazia
- **WHEN** o provisionamento termina em um banco zerado
- **THEN** a tabela `auditoria` está vazia (nenhum registro `log-seed-%`) e é populada apenas por operações reais

## ADDED Requirements

### Requirement: As views de itens refletem o schema vigente

As views de leitura dos itens (`v_release_itens`, `v_projeto_itens`, `v_manual_itens` e a view
`manuais`) SHALL ser recriadas de forma idempotente contra o schema atual, sem referenciar colunas
removidas e incluindo `arquivada` onde a tabela de origem já a possui. Uma migration de reconciliação
SHALL poder ser aplicada sobre banco existente sem perder dados.

#### Scenario: Views consultáveis
- **WHEN** as migrations terminam
- **THEN** as três views de itens podem ser consultadas sem `ER_VIEW_INVALID`

#### Scenario: View de manuais inclui arquivamento
- **WHEN** a view `manuais` é consultada
- **THEN** ela expõe a coluna `arquivada` da tabela `manuais_mensal`

### Requirement: A migration reconcilia carimbos e índices

A migration RL06-2 SHALL limpar `release_week.data_aprovacao` de registros cujo status não seja
`Publicado` e SHALL criar índices para as janelas de data usadas pelo Painel
(`entregas_itens.data_lancamento` e `data_liberacao`), de forma idempotente e com rollback
documentado.

#### Scenario: Carimbo residual removido
- **WHEN** a migration é aplicada em uma base com release reaberta e `data_aprovacao` preenchida
- **THEN** o carimbo fica nulo e o status permanece o atual

#### Scenario: Índices de data presentes
- **WHEN** a migration termina
- **THEN** os índices de `data_lancamento` e `data_liberacao` existem em `entregas_itens`

### Requirement: A unicidade de ciclos arquivados é reconciliada

A migration SHALL substituir as chaves únicas de Release Week, Manuais e Escopo por uma regra que
permita **um registro ativo** por chave de negócio e **vários registros arquivados** com a mesma
chave, sem perder os registros existentes. A regra SHALL ser aplicada no banco, não apenas na
interface.

#### Scenario: Um ativo por chave
- **WHEN** já existe um ciclo ativo com a mesma chave de negócio
- **THEN** uma nova inclusão ativa continua respondendo `409`

#### Scenario: Recriar após arquivar
- **WHEN** o único ciclo com a chave está arquivado
- **THEN** é possível criar um novo ciclo ativo com a mesma chave e o arquivado permanece preservado
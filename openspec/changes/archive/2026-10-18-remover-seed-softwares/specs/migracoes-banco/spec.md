# Spec Delta

## MODIFIED Requirements

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

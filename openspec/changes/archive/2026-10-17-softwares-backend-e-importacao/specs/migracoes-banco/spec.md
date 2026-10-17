# Spec Delta

## MODIFIED Requirements

### Requirement: Seeds iniciais completos
Após as migrations, o banco SHALL conter os seeds de `docs/bd/02_seed.sql`: os 4 perfis padrão (Administrador, Editor, Revisor, Leitor), a matriz de permissões (11 módulos × 4 perfis), a linha `config_default` de `configuracoes_globais`, a linha padrão de `configuracoes_limite_requisicao` e o **catálogo inicial de softwares** (códigos sequenciais `SFT-001`… com descrição, categoria e situação).

#### Scenario: Perfis e matriz de permissões presentes
- **WHEN** o provisionamento termina
- **THEN** existem 4 perfis Ativo e 44 linhas em `permissoes_perfil` com os totais 99/45/21/6 por perfil

#### Scenario: Configurações globais inicializadas
- **WHEN** o provisionamento termina
- **THEN** existe exatamente uma linha `config_default` com sidebar expandida e retenção de 180 dias

#### Scenario: Catálogo de softwares inicializado
- **WHEN** o provisionamento termina
- **THEN** existem softwares com códigos sequenciais (a partir de `SFT-001`), cada um com descrição,
  categoria e situação

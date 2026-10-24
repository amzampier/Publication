# busca-fulltext Specification

## Purpose

Definir uma busca textual indexada para os módulos de maior volume, preservando filtros, paginação e
permissões existentes sem varrer tabelas inteiras com `LIKE`.

## Requirements

### Requirement: A busca textual usa índice FULLTEXT

As listagens de Chamadas, Auditoria e Usuários SHALL usar índices `FULLTEXT` do MariaDB para termos
textuais com 3 ou mais caracteres, por meio de `MATCH ... AGAINST` nas colunas textuais do módulo.
Códigos, e-mails e termos menores que 3 caracteres SHALL continuar usando igualdade/prefixo
indexável, sem degradar para `LIKE '%termo%'` em colunas sem índice. A busca SHALL manter os mesmos
campos pesquisáveis documentados em cada módulo.

#### Scenario: Termo textual indexado
- **WHEN** o usuário busca “fiscal” em Chamadas
- **THEN** a consulta usa `MATCH ... AGAINST` e retorna chamadas cujo texto contém o termo

#### Scenario: Código ou e-mail
- **WHEN** o usuário busca “SFT-001” ou “ana@empresa.com”
- **THEN** a consulta usa prefixo/igualdade indexável e encontra o registro

#### Scenario: Termo curto
- **WHEN** o termo tem menos de 3 caracteres
- **THEN** a busca usa o caminho de prefixo e não faz varredura textual completa

### Requirement: A busca textual mantém paginação e contagem no servidor

A busca SHALL aplicar `LIMIT/OFFSET` e devolver o total do conjunto filtrado sem carregar todas as
linhas na aplicação. Os filtros e a ordenação existentes SHALL continuar funcionando junto do termo.

#### Scenario: Resultado paginado
- **WHEN** a busca retorna mais registros que o tamanho da página
- **THEN** a resposta traz apenas a página solicitada e o total filtrado

#### Scenario: Filtro combinado
- **WHEN** o usuário combina termo, status e período
- **THEN** a consulta aplica todos os critérios e a contagem reflete a interseção

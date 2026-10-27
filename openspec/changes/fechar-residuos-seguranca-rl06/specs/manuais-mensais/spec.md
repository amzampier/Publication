# Spec Delta

## MODIFIED Requirements

### Requirement: Importação de Manuais por planilha

O sistema SHALL importar catálogos mensais de uma planilha `.xlsx` com as colunas **Título, Mês, Ano, Descrição, Status, Data de Criação, Data de Publicação, Destaque do mês e Destaque da semana** por `POST /api/manuais/importar`, sob a permissão `manuais`/`importar`. O parser SHALL classificar cada linha como `pronto`, `já cadastrado`, `repetido no arquivo` ou `inválida`. O servidor SHALL revalidar título, mês, ano, status e datas (formato civil válido), recusar o status `Publicado`, tratar `(ano, mes_numero)` já cadastrado como conflito (sem gravar) e recusar a importação inteira (`400`, com os motivos) quando houver linha inválida ou duplicada. Quando tudo estiver válido, SHALL gravar em **transação** (códigos gerados, autor = usuário da sessão, `data_criacao` e `data_publicacao` da planilha) e registrar auditoria com a contagem. O limite SHALL ser de 500 linhas. O autor histórico NÃO SHALL ser preservado por esta importação: todos os registros ficam com o usuário que executa a importação.

#### Scenario: Importar linhas válidas

- **WHEN** um usuário com `manuais`/`importar` envia linhas válidas com status diferente de `Publicado`
- **THEN** cada catálogo é gravado com o código gerado, as datas históricas e a resposta informa quantos foram importados

#### Scenario: Publicação histórica sem data é inválida

- **WHEN** uma linha tem status `Publicado`, com ou sem Data de Publicação preenchida
- **THEN** a linha é marcada como inválida, a API responde `400` e a importação não grava nada

#### Scenario: Linha inválida recusa a importação inteira

- **WHEN** alguma linha tem campo obrigatório vazio, mês/ano/status inválido ou data inválida
- **THEN** a API responde `400` com os motivos e nada é gravado

#### Scenario: Mês já cadastrado é conflito

- **WHEN** a planilha traz um `(ano, mês)` já existente na base (inclusive arquivado)
- **THEN** nenhum catálogo é gravado e a resposta identifica os conflitos

#### Scenario: Importação exige a permissão de importar

- **WHEN** um perfil sem `manuais`/`importar` chama a rota de importação
- **THEN** a API responde `403` e nada é gravado

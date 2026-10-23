# Spec Delta

## MODIFIED Requirements

### Requirement: O Painel Executivo é a tela inicial da Área Administrativa

O sistema SHALL renderizar o **Painel Executivo** em `/admin`, dentro do shell administrativo, com
título, subtítulo, seletor de ano e ação de atualizar. O item raiz **Painel Executivo** da sidebar
SHALL navegar para `/admin` e aparecer como ativo (`aria-current="page"`) na rota. O seletor SHALL
listar apenas anos com ao menos uma chamada lançada (`entregas_itens.data_lancamento`), em ordem
decrescente; o ano inicial SHALL ser o corrente quando houver chamadas nele, senão o mais recente
com chamadas. Sem anos disponíveis, o seletor SHALL ser omitido e a tela SHALL exibir o estado vazio.
O painel SHALL ser somente leitura e NÃO SHALL criar um novo módulo RBAC. O acesso SHALL ser
permitido a usuários autenticados que possuam `visualizar` em ao menos um dos módulos agregados
(`release-week`, `manuais`, `escopo-projetos`, `lancar-chamadas`, `softwares` ou `parceiros`); sem
nenhum deles, a API SHALL responder `403` e a tela SHALL exibir estado de acesso negado, sem dados.

#### Scenario: Abrir o painel pela sidebar

- **WHEN** o usuário autenticado com acesso ao painel clica em "Painel Executivo" na sidebar
- **THEN** o navegador vai para `/admin`, o painel é renderizado dentro do shell e o item raiz aparece como ativo

#### Scenario: Acesso por URL direta

- **WHEN** o usuário autenticado com acesso ao painel abre `/admin` diretamente
- **THEN** o painel é exibido com o ano corrente quando ele tem chamadas; caso contrário, com o mais recente com chamadas

#### Scenario: Sem sessão

- **WHEN** um visitante sem sessão abre `/admin` ou chama a API do painel
- **THEN** ele é redirecionado ao login (página) ou recebe `401` (API), sem dados do painel

#### Scenario: Ano sem chamadas não aparece no seletor

- **WHEN** o seletor de ano é exibido
- **THEN** ele lista apenas os anos que possuem ao menos uma chamada lançada, sem anos vazios anteriores ou posteriores

#### Scenario: Perfil sem nenhum módulo agregado recebe 403

- **WHEN** um usuário autenticado sem `visualizar` em nenhum dos módulos agregados abre `/admin` ou chama `GET /api/painel-executivo`
- **THEN** a API responde `403` e nenhum dado do painel é devolvido

#### Scenario: Perfil com apenas um módulo vê apenas os blocos permitidos

- **WHEN** um usuário possui `visualizar` apenas em `softwares` e abre o painel
- **THEN** o painel exibe somente o ranking de softwares permitido e não exibe KPIs, séries ou publicações de chamadas/publicações não autorizadas

### Requirement: A API do painel agrega os dados no servidor

O sistema SHALL servir `GET /api/painel-executivo` sob sessão autenticada e autorização por módulo,
aceitando o parâmetro opcional `ano` (`AAAA`) e devolvendo, no mínimo: `periodo`,
`anosDisponiveis`, `kpis`, `serieMensal`, `serieAnual`, `porPublicacao`, `porSoftware`, `porTipo` e
`porImpacto`. As agregações SHALL ser feitas no servidor, com queries parametrizadas e sem depender
da paginação das telas de módulo. Ano ausente SHALL usar o ano corrente quando ele tiver chamadas;
caso contrário, o ano mais recente com chamadas (sem chamadas, o ano corrente). Ano inválido SHALL
responder `400`.

Cada bloco SHALL ser filtrado pela permissão `visualizar` do módulo de origem: KPIs, séries e
dimensões de chamadas exigem `lancar-chamadas`/`visualizar`; cada aba de `porPublicacao` exige
`visualizar` do módulo correspondente (`release-week`, `manuais` ou `escopo-projetos`); o ranking de
softwares exige `softwares`/`visualizar`. Blocos sem permissão SHALL ser devolvidos vazios/zerados,
sem títulos, códigos ou status de conteúdo não autorizado. Sem permissão em nenhum módulo agregado, a
API SHALL responder `403`. Sob saturação da fila do banco, a API SHALL responder `503` com
`Retry-After`, nunca `500` de fila.

#### Scenario: Consulta sem ano

- **WHEN** a tela chama `GET /api/painel-executivo` sem `ano`
- **THEN** a API responde `200` com o ano corrente (se tiver chamadas) ou o mais recente com chamadas, todos os blocos permitidos e `anosDisponiveis` em ordem decrescente

#### Scenario: Ano específico

- **WHEN** a tela chama `GET /api/painel-executivo?ano=2025`
- **THEN** a API responde `200` com os dados de 2025 permitidos ao perfil

#### Scenario: Ano inválido

- **WHEN** a API recebe `ano=abc` ou um ano fora de quatro dígitos
- **THEN** responde `400` e não consulta o banco

#### Scenario: Sem sessão

- **WHEN** a API é chamada sem sessão
- **THEN** responde `401` e não devolve dados

#### Scenario: Leitor não recebe dados de chamadas ou softwares

- **WHEN** um perfil com `visualizar` em release/manuais/escopo, mas sem `lancar-chamadas` e sem `softwares`, chama o painel
- **THEN** recebe as publicações permitidas e os blocos de chamadas, séries de chamadas e ranking de softwares vazios/zerados, sem títulos ou status de conteúdo não autorizado

#### Scenario: Administrador recebe todos os blocos

- **WHEN** um perfil com `visualizar` em todos os módulos agregados chama o painel
- **THEN** recebe todos os blocos do contrato com os dados do período

#### Scenario: Saturação do pool responde 503

- **WHEN** a fila de conexões do banco está saturada durante uma consulta ao painel
- **THEN** a API responde `503` com `Retry-After` e não expõe erro interno de fila
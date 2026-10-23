# Spec Delta

## ADDED Requirements

### Requirement: A publicação exige a permissão própria em qualquer caminho

Além da permissão da rota genérica, o sistema SHALL exigir a funcionalidade `publicar` do módulo
sempre que uma operação de `create` ou `update` de Release Week, Manuais Mensais ou Escopo de
Projetos resultar no status `Publicado`. A permissão `criar` ou `alterar` isolada NÃO SHALL ser
suficiente para publicar. Sem `publicar`, a API SHALL responder `403` e não SHALL alterar o registro,
as chamadas filhas, o histórico ou a auditoria de homologação.

#### Scenario: Edição de Release Week sem publicar é negada
- **WHEN** um perfil com `release-week`/`alterar` e sem `publicar` envia `PUT /api/release-week/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece e nenhuma chamada filha é publicada

#### Scenario: Edição de Manual sem publicar é negada
- **WHEN** um perfil com `manuais`/`alterar` e sem `publicar` envia `PUT /api/manuais/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece e nenhuma chamada filha é publicada

#### Scenario: Edição de Escopo sem publicar é negada
- **WHEN** um perfil com `escopo-projetos`/`alterar` e sem `publicar` envia `PUT /api/escopo-projetos/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece e nenhuma chamada filha é publicada

#### Scenario: Criação já publicada sem publicar é negada
- **WHEN** um perfil com `criar` e sem `publicar` envia `POST` de Release, Manual ou Escopo com `status=Publicado`
- **THEN** a API responde `403` e nenhum registro é criado

#### Scenario: Perfil com publicar prossegue
- **WHEN** um perfil com `publicar` envia a transição para `Publicado` pela criação ou edição
- **THEN** a operação é executada e homologada conforme a regra do módulo

### Requirement: O catálogo cobre mídias de chamadas e o Painel Executivo

O catálogo de autorização SHALL incluir as rotas de servimento de mídias de chamadas e de dados do
Painel Executivo, com as seguintes regras:
- `GET /uploads/chamadas/**` → sessão com `lancar-chamadas`/`visualizar` **ou**, para visitante
  anônimo, somente mídia de chamada `Publicado` com ao menos um pai ativo `Publicado` e não
  arquivado; sem autorização, `404`/`401`/`403` sem conteúdo.
- `GET /api/painel-executivo` → sessão com `visualizar` em ao menos um dos módulos agregados
  (`release-week`, `manuais`, `escopo-projetos`, `lancar-chamadas`, `softwares`, `parceiros`);
  cada bloco SHALL exigir a permissão do módulo de origem. Sem nenhum módulo, `403`.

#### Scenario: Mídia de chamada exige permissão ou publicação
- **WHEN** um perfil sem `lancar-chamadas`/`visualizar` requisita uma mídia de chamada não publicada
- **THEN** a resposta é `404` (ou `403`) e o conteúdo não é servido

#### Scenario: Mídia publicada é acessível anonimamente
- **WHEN** um visitante anônimo requisita uma mídia de chamada `Publicado` cujo pai está `Publicado` e não arquivado
- **THEN** a mídia é servida

#### Scenario: Painel exige ao menos um módulo
- **WHEN** um usuário autenticado sem `visualizar` em nenhum módulo agregado chama `GET /api/painel-executivo`
- **THEN** a API responde `403` e não devolve dados

#### Scenario: Bloco do painel respeita o módulo de origem
- **WHEN** um usuário sem `lancar-chamadas`/`visualizar` chama o painel
- **THEN** os blocos derivados de chamadas são devolvidos vazios/zerados, sem títulos ou status de conteúdo não autorizado
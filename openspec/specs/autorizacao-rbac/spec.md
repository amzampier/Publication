# autorizacao-rbac Specification

## Purpose

Garantir que toda rota administrativa por módulo seja autorizada no servidor pela matriz de
permissões do perfil do usuário autenticado, negando com `403` o que não estiver concedido e
preservando as portas públicas e o autoatendimento.

## Requirements

### Requirement: Toda rota de módulo exige a permissão correspondente

O sistema SHALL autorizar cada rota administrativa de módulo pela matriz do perfil do usuário da
sessão, segundo o **catálogo de funcionalidades de cada módulo** (as funcionalidades fixas
`visualizar`, `criar`, `alterar`, `excluir` e as específicas do módulo — ex.: `importar`, `exportar`,
`filtrar`, `buscar`, `permissoes`, `publicar`, `arquivar`, `download`), respondendo `403` e **sem
efeito sobre os dados** quando a permissão exigida não estiver concedida. Requisições sem sessão
válida SHALL continuar respondendo `401` (a autorização SHALL ocorrer somente após a autenticação).

#### Scenario: Permissão concedida prossegue
- **WHEN** um usuário autenticado cujo perfil concede a ação exigida chama a rota de módulo
- **THEN** a operação é executada e responde com o código de sucesso habitual (200/201/204)

#### Scenario: Permissão ausente responde 403 sem efeito
- **WHEN** um usuário autenticado cujo perfil **não** concede a ação exigida chama a rota de módulo
- **THEN** a API responde `403` (mensagem amigável de permissão) e nenhum dado é criado, alterado ou excluído

#### Scenario: Sem sessão permanece 401
- **WHEN** a rota de módulo é chamada sem sessão válida
- **THEN** a resposta é `401` e a verificação de permissão não é executada

#### Scenario: Ação extra é exigida como as ações fixas
- **WHEN** a rota corresponde a uma funcionalidade específica do módulo (ex.: importar, exportar,
  filtrar, buscar, permissoes) não concedida ao perfil
- **THEN** a API responde `403`, tratando a funcionalidade específica como qualquer ação fixa

### Requirement: O catálogo de rotas administrativas mapeia cada rota para módulo e ação

O sistema SHALL aplicar a cada rota administrativa a permissão do módulo e da funcionalidade
indicados (o `modulo` SHALL usar os identificadores da matriz: `gestao-usuarios`, `perfis-acesso`,
`auditoria`, `configuracoes-globais`, `softwares`, `parceiros`, `release-week`, `manuais`,
`escopo-projetos`, `lancar-chamadas`, `esteira-revisao`):

- `GET /api/usuarios` → `gestao-usuarios` / `visualizar`; com o parâmetro de **filtro/paginação**
  server-side → `gestao-usuarios` / `filtrar`; com o parâmetro de **busca** → `gestao-usuarios` / `buscar`
- `GET /api/usuarios/emails` → `gestao-usuarios` / `visualizar`
- `GET /api/usuarios/:id` → `gestao-usuarios` / `visualizar`
- `POST /api/usuarios` → `gestao-usuarios` / `criar`; `POST /api/convite` → `gestao-usuarios` / `convite`
- `PUT /api/usuarios/:id`, `PUT /api/usuarios/:id/situacao` → `gestao-usuarios` / `alterar`
- `DELETE /api/usuarios/:id` → `gestao-usuarios` / `excluir`
- `POST /api/usuarios/importar` → `gestao-usuarios` / `importar`
- `GET /api/usuarios` com o parâmetro de **exportação** → `gestao-usuarios` / `exportar`
- `GET /api/perfis` → `perfis-acesso` / `visualizar`; com o parâmetro de **exportação** → `perfis-acesso` / `exportar`
- `POST /api/perfis` → `perfis-acesso` / `criar`
- `PUT /api/perfis/:id` → `perfis-acesso` / `alterar`
- `PUT /api/perfis/:id/permissoes`, `POST /api/perfis/:id/permissoes/copiar` → `perfis-acesso` / `permissoes`
- `DELETE /api/perfis/:id` → `perfis-acesso` / `excluir`
- `GET /api/softwares` → `softwares` / `visualizar`; com o parâmetro de **exportação** → `softwares` / `exportar`
- `POST /api/softwares` → `softwares` / `criar`
- `PUT /api/softwares/:codigo` → `softwares` / `alterar`
- `DELETE /api/softwares/:codigo` → `softwares` / `excluir`
- `POST /api/softwares/importar` → `softwares` / `importar`
- `GET /api/parceiros` → `parceiros` / `visualizar`; com o parâmetro de **exportação** → `parceiros` / `exportar`
- `POST /api/parceiros` → `parceiros` / `criar`
- `PUT /api/parceiros/:id` → `parceiros` / `alterar`
- `DELETE /api/parceiros/:id` → `parceiros` / `excluir`
- `POST /api/parceiros/importar` → `parceiros` / `importar`
- `GET /api/release-week` → `release-week` / `visualizar`; com o parâmetro de **exportação** → `release-week` / `exportar`
- `GET /api/release-week/:id/itens` → `release-week` / `visualizar_itens`
- `POST /api/release-week` → `release-week` / `criar`
- `PUT /api/release-week/:id` → `release-week` / `alterar`; se o status mudar para `Publicado`, também `publicar`
- `PUT /api/release-week/:id/publicar` → `release-week` / `publicar`
- `PUT /api/release-week/:id/arquivar` → `release-week` / `arquivar`
- `DELETE /api/release-week/:id` → `release-week` / `excluir`
- `POST /api/release-week/importar` → `release-week` / `importar`
- `GET /api/manuais` → `manuais` / `visualizar`; com o parâmetro de **exportação** → `manuais` / `exportar`
- `GET /api/manuais/:id/itens` → `manuais` / `visualizar_itens`
- `POST /api/manuais` → `manuais` / `criar`
- `PUT /api/manuais/:id` → `manuais` / `alterar`; se o status mudar para `Publicado`, também `publicar`
- `PUT /api/manuais/:id/publicar` → `manuais` / `publicar`
- `PUT /api/manuais/:id/arquivar` → `manuais` / `arquivar`
- `DELETE /api/manuais/:id` → `manuais` / `excluir`
- `POST /api/manuais/importar` → `manuais` / `importar`
- `GET /api/escopo-projetos` → `escopo-projetos` / `visualizar`; com o parâmetro de **exportação** → `escopo-projetos` / `exportar`
- `GET /api/escopo-projetos/:id/itens` → `escopo-projetos` / `visualizar`
- `POST /api/escopo-projetos` → `escopo-projetos` / `criar`; se o status for `Publicado`, também `publicar`
- `PUT /api/escopo-projetos/:id` → `escopo-projetos` / `alterar`; se o status mudar para `Publicado`, também `publicar`
- `PUT /api/escopo-projetos/:id/publicar` → `escopo-projetos` / `publicar`
- `PUT /api/escopo-projetos/:id/arquivar` → `escopo-projetos` / `arquivar`
- `DELETE /api/escopo-projetos/:id` → `escopo-projetos` / `excluir`
- `POST /api/escopo-projetos/importar` → `escopo-projetos` / `importar`
- `GET /api/lancar-chamadas` → `lancar-chamadas` / `visualizar`; com o parâmetro de **download** → `lancar-chamadas` / `download`
- `GET /api/lancar-chamadas/opcoes` → `lancar-chamadas` / `visualizar`
- `POST /api/lancar-chamadas` → `lancar-chamadas` / `criar`
- `PUT /api/lancar-chamadas/:id` → `lancar-chamadas` / `alterar`
- `PUT /api/lancar-chamadas/:id/aprovar` → `lancar-chamadas` / `publicar`
- `PUT /api/lancar-chamadas/:id/desaprovar` → `lancar-chamadas` / `alterar`
- `PUT /api/lancar-chamadas/:id/recusar` → `lancar-chamadas` / `alterar`
- `DELETE /api/lancar-chamadas/:id` → `lancar-chamadas` / `excluir`
- `POST /api/lancar-chamadas/importar` → `lancar-chamadas` / `importar`
- `GET /api/esteira-revisao` → `esteira-revisao` / `visualizar`; com **busca** → `buscar`; com **filtros** → `filtrar`
- `GET /api/esteira-revisao/:id` e `GET /api/esteira-revisao/:id/historico` → `esteira-revisao` / `visualizar`
- `PUT /api/esteira-revisao/:id/aprovar|publicar|suspender` → `esteira-revisao` / `publicar`
- `PUT /api/esteira-revisao/:id/recusar|reabrir` → `esteira-revisao` / `alterar`
- `GET /api/auditoria` → `auditoria` / `visualizar`; com o parâmetro de **filtro** → `auditoria` / `filtrar`;
  com o parâmetro de **busca** → `auditoria` / `buscar`; com o parâmetro de **exportação** → `auditoria` / `exportar`
- `GET /api/configuracoes`, `GET /api/seguranca/estado` → `configuracoes-globais` / `visualizar`
- `PUT /api/configuracoes`, `POST /api/seguranca/liberar` → `configuracoes-globais` / `alterar`
- `POST /api/uploads` com destino `logomarcas` → `configuracoes-globais` / `alterar`; com destino `logos` → `parceiros` / `alterar`; com destino `chamadas` → `lancar-chamadas` / `criar` ou `alterar`
- `GET /uploads/chamadas/**` → sessão com `lancar-chamadas`/`visualizar` **ou**, para anônimo, o gate de conteúdo publicado
- `GET /api/painel-executivo` → sessão com `visualizar` em ao menos um dos módulos agregados, com cada bloco filtrado pelo módulo de origem

#### Scenario: Leitor não executa escrita nem exclusão
- **WHEN** um usuário com perfil Leitor (que não concede `criar`, `alterar` nem `excluir` em `gestao-usuarios`) chama `POST`, `PUT` ou `DELETE` de usuários
- **THEN** a API responde `403` em todas e nenhum usuário é criado, alterado ou excluído

#### Scenario: Leitor não grava configurações nem perfis
- **WHEN** um usuário com perfil Leitor chama `PUT /api/configuracoes` ou `PUT /api/perfis/:id/permissoes`
- **THEN** a API responde `403` e a configuração e a matriz permanecem intactas

#### Scenario: Ação extra de importar é exigida
- **WHEN** um perfil que concede `criar` mas não concede a ação extra `importar` chama `POST /api/usuarios/importar`
- **THEN** a API responde `403`

#### Scenario: Rota de e-mails exige visualizar de usuários
- **WHEN** um perfil sem `gestao-usuarios`/`visualizar` chama `GET /api/usuarios/emails`
- **THEN** a API responde `403`

#### Scenario: Rotas de softwares usam o módulo softwares
- **WHEN** um perfil concede `softwares`/`visualizar` mas não `softwares`/`excluir` chama `DELETE /api/softwares/:codigo`
- **THEN** a API responde `403` e nenhum software é excluído

#### Scenario: Importação de softwares exige a ação extra
- **WHEN** um perfil sem `softwares`/`importar` chama `POST /api/softwares/importar`
- **THEN** a API responde `403`

#### Scenario: Rotas de Release Week usam o módulo release-week
- **WHEN** um perfil concede `release-week`/`visualizar` mas não `release-week`/`arquivar` chama `PUT /api/release-week/:id/arquivar`
- **THEN** a API responde `403` e nenhuma release é arquivada

#### Scenario: Itens de Release Week exigem a ação extra
- **WHEN** um perfil sem `release-week`/`visualizar_itens` chama `GET /api/release-week/:id/itens`
- **THEN** a API responde `403` e nenhum item é retornado

#### Scenario: Leitor não escreve Manuais
- **WHEN** um usuário sem `manuais`/`criar`, `alterar` ou `excluir` chama as rotas de escrita de Manuais
- **THEN** a API responde `403` em todas e nenhum catálogo é criado, alterado ou excluído

#### Scenario: Rotas de Manuais usam o módulo manuais
- **WHEN** um perfil concede `manuais`/`visualizar` mas não `manuais`/`arquivar` chama `PUT /api/manuais/:id/arquivar`
- **THEN** a API responde `403` e nenhum catálogo é arquivado

#### Scenario: Itens de Manuais exigem a ação extra
- **WHEN** um perfil sem `manuais`/`visualizar_itens` chama `GET /api/manuais/:id/itens`
- **THEN** a API responde `403` e nenhum item é retornado

#### Scenario: Importação de Manuais exige a ação extra
- **WHEN** um perfil sem `manuais`/`importar` chama `POST /api/manuais/importar`
- **THEN** a API responde `403` e nada é gravado

#### Scenario: Rotas de Escopo usam o módulo escopo-projetos
- **WHEN** um perfil concede `escopo-projetos`/`visualizar` mas não `escopo-projetos`/`publicar` chama `PUT /api/escopo-projetos/:id/publicar`
- **THEN** a API responde `403` e nenhum escopo é publicado

#### Scenario: Rotas da Esteira usam o módulo esteira-revisao
- **WHEN** um perfil sem `esteira-revisao`/`publicar` chama `PUT /api/esteira-revisao/:id/aprovar`
- **THEN** a API responde `403` e a chamada permanece no status anterior

#### Scenario: Importação de chamadas exige a ação extra
- **WHEN** um perfil sem `lancar-chamadas`/`importar` chama `POST /api/lancar-chamadas/importar`
- **THEN** a API responde `403` e nenhuma chamada é criada

#### Scenario: Aprovação de chamada exige publicar
- **WHEN** um perfil concede `lancar-chamadas`/`alterar` mas não `publicar` chama `PUT /api/lancar-chamadas/:id/aprovar`
- **THEN** a API responde `403` e o status da chamada permanece inalterado

#### Scenario: Download de chamadas exige a ação extra
- **WHEN** um perfil sem `lancar-chamadas`/`download` chama `GET /api/lancar-chamadas?download=1`
- **THEN** a API responde `403` e nenhum arquivo é gerado

#### Scenario: Upload de imagem de chamada exige escrita no módulo
- **WHEN** um perfil sem `lancar-chamadas`/`criar` e sem `alterar` chama `POST /api/uploads` com destino `chamadas`
- **THEN** a API responde `403` e nenhum arquivo é gravado

### Requirement: Portas públicas e autoatendimento exigem apenas sessão

O sistema SHALL manter sem exigência de permissão de módulo as portas públicas e as rotas de
autoatendimento, que continuam exigindo apenas sessão válida (quando administrativas) ou sendo
abertas: `/api/auth/*`, `GET /api/configuracoes/identidade`, `GET /api/usuarios/eu`,
`PATCH /api/usuarios/eu`, `GET /api/usuarios/eu/permissoes`, `GET /api/configuracoes/shell` (a matriz do próprio usuário, que
alimenta o `.can()`) e `POST /api/uploads` com destino `avatares` (retrato do próprio perfil).

#### Scenario: Meu Perfil acessível a qualquer perfil
- **WHEN** um usuário autenticado de qualquer perfil chama `GET /api/usuarios/eu` ou `PATCH /api/usuarios/eu`
- **THEN** a requisição é autorizada pela sessão, sem exigir permissão de módulo

#### Scenario: Upload de avatar próprio independe da matriz
- **WHEN** um usuário autenticado envia `POST /api/uploads` com destino `avatares`
- **THEN** o upload é aceito com base na sessão, sem exigir permissão de módulo

#### Scenario: Portas públicas seguem abertas
- **WHEN** `/api/auth/*` ou `GET /api/configuracoes/identidade` é chamada sem sessão
- **THEN** a rota responde normalmente, sem `401` nem `403`

### Requirement: O cliente dispõe do helper `.can(modulo, acao)`

O sistema SHALL disponibilizar no cliente um helper reativo `.can(modulo, acao)` que consulta as
permissões do perfil do usuário da sessão e SHALL usá-lo para **controlar a interface**: as
funcionalidades que o perfil não possui SHALL ser escondidas ou desabilitadas — em particular os
itens de navegação do módulo (sidebar e menu da conta), os botões de ação de linha (criar, editar,
excluir, clonar, bloquear, enviar convite), a flag/expansão de itens (`visualizar_itens`), o botão
"Filtros" (`filtrar`), o campo de busca (`buscar`), as exportações (`exportar`/`download`), a
importação (`importar`) e a ação "Permissões" (`permissoes`). Nos módulos cujo filtro/busca são
server-side (Gestão de Usuários e Auditoria) a imposição é **também** no servidor; nos demais
(Softwares, Parceiros, Perfis, Release Week, Manuais, Lançar as Chamadas) o controle é de interface.

#### Scenario: Helper responde pelas permissões do perfil
- **WHEN** o cliente consulta `.can(modulo, acao)` para o usuário da sessão
- **THEN** o retorno reflete se a ação está concedida ao perfil do usuário

#### Scenario: Funcionalidade não concedida é ocultada
- **WHEN** o perfil do usuário da sessão não concede `filtrar` em um módulo
- **THEN** o botão "Filtros" daquele módulo não é exibido (e o campo de busca é ocultado sem `buscar`)

#### Scenario: Clonagem e itens respeitam a matriz na interface
- **WHEN** o perfil não concede `release-week`/`clonar` ou `release-week`/`visualizar_itens`
- **THEN** a ação "Clonar" e a flag de itens não são exibidas na tela de Release Week

#### Scenario: Manuais respeitam a matriz na interface
- **WHEN** o perfil não concede `manuais`/`clonar`, `manuais`/`visualizar_itens` ou `manuais`/`importar`
- **THEN** a ação "Clonar", a flag de itens e o ícone de importação não são exibidos na tela de
  Manuais Mensais

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

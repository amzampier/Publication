# Spec Delta: autorizacao-rbac

## MODIFIED Requirements

### Requirement: O catálogo de rotas administrativas mapeia cada rota para módulo e ação
O sistema SHALL aplicar a cada rota administrativa a permissão do módulo e da funcionalidade
indicados (o `modulo` SHALL usar os identificadores da matriz: `gestao-usuarios`, `perfis-acesso`,
`auditoria`, `configuracoes-globais`, `softwares`, `parceiros`, `release-week`, `manuais`):

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
- `PUT /api/release-week/:id` → `release-week` / `alterar`
- `PUT /api/release-week/:id/publicar` → `release-week` / `publicar`
- `PUT /api/release-week/:id/arquivar` → `release-week` / `arquivar`
- `DELETE /api/release-week/:id` → `release-week` / `excluir`
- `POST /api/release-week/importar` → `release-week` / `importar`
- `GET /api/manuais` → `manuais` / `visualizar`; com o parâmetro de **exportação** → `manuais` / `exportar`
- `GET /api/manuais/:id/itens` → `manuais` / `visualizar_itens`
- `POST /api/manuais` → `manuais` / `criar`
- `PUT /api/manuais/:id` → `manuais` / `alterar`
- `PUT /api/manuais/:id/publicar` → `manuais` / `publicar`
- `PUT /api/manuais/:id/arquivar` → `manuais` / `arquivar`
- `DELETE /api/manuais/:id` → `manuais` / `excluir`
- `POST /api/manuais/importar` → `manuais` / `importar`
- `GET /api/auditoria` → `auditoria` / `visualizar`; com o parâmetro de **filtro** → `auditoria` / `filtrar`;
  com o parâmetro de **busca** → `auditoria` / `buscar`; com o parâmetro de **exportação** → `auditoria` / `exportar`
- `GET /api/configuracoes`, `GET /api/seguranca/estado` → `configuracoes-globais` / `visualizar`
- `PUT /api/configuracoes`, `POST /api/seguranca/liberar` → `configuracoes-globais` / `alterar`
- `POST /api/uploads` com destino `logomarcas` → `configuracoes-globais` / `alterar`; com destino `logos` → `parceiros` / `alterar`

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

### Requirement: O cliente dispõe do helper `.can(modulo, acao)`
O sistema SHALL disponibilizar no cliente um helper reativo `.can(modulo, acao)` que consulta as
permissões do perfil do usuário da sessão e SHALL usá-lo para **controlar a interface**: as
funcionalidades que o perfil não possui SHALL ser escondidas ou desabilitadas — em particular os
itens de navegação do módulo (sidebar e menu da conta), os botões de ação de linha (criar, editar,
excluir, clonar, bloquear, enviar convite), a flag/expansão de itens (`visualizar_itens`), o botão
"Filtros" (`filtrar`), o campo de busca (`buscar`), as exportações (`exportar`/`download`), a
importação (`importar`) e a ação "Permissões" (`permissoes`). Nos módulos cujo filtro/busca são
server-side (Gestão de Usuários e Auditoria) a imposição é **também** no servidor; nos demais
(Softwares, Parceiros, Perfis, Release Week, Manuais) o controle é de interface.

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

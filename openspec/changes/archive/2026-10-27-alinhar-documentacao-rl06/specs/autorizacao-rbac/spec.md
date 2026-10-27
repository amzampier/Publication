# Spec Delta

## MODIFIED Requirements

### Requirement: O catálogo de rotas administrativas mapeia cada rota para módulo e ação

O sistema SHALL aplicar a cada rota administrativa a permissão do módulo e da funcionalidade
indicados (o `modulo` SHALL usar os identificadores da matriz: `gestao-usuarios`, `perfis-acesso`,
`auditoria`, `configuracoes-globais`, `softwares`, `parceiros`, `release-week`, `manuais`,
`escopo-projetos`, `lancar-chamadas`, `esteira-revisao`):

- `GET /api/usuarios` → `gestao-usuarios` / `visualizar`; com os **filtros** server-side
  (`usuario`, `perfil`, `status`) → `gestao-usuarios` / `filtrar`; a **paginação** isolada
  (`pagina`/`porPagina`) permanece em `visualizar`; com o parâmetro de **busca** → `gestao-usuarios` / `buscar`
- `GET /api/usuarios/emails` → `gestao-usuarios` / `visualizar` e `buscar`
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
- `GET /api/lancar-chamadas/:id` → `lancar-chamadas` / `visualizar`
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

#### Scenario: Rota de e-mails exige buscar além de visualizar

- **WHEN** um perfil concede `gestao-usuarios`/`visualizar` mas não `gestao-usuarios`/`buscar` chama `GET /api/usuarios/emails`
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

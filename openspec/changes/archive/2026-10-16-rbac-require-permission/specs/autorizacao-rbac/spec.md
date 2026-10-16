# Spec Delta

## Purpose

Garantir que toda rota administrativa por módulo seja autorizada no servidor pela matriz de
permissões do perfil do usuário autenticado, negando com `403` o que não estiver concedido e
preservando as portas públicas e o autoatendimento.

## ADDED Requirements

### Requirement: Toda rota de módulo exige a permissão correspondente
O sistema SHALL autorizar cada rota administrativa de módulo pela matriz do perfil do usuário da
sessão (as 4 ações fixas `visualizar`, `criar`, `alterar`, `excluir` e as ações extras
`publicar`, `arquivar`, `download`, `exportar`, `importar`), respondendo `403` e **sem efeito
sobre os dados** quando a permissão exigida não estiver concedida. Requisições sem sessão válida
SHALL continuar respondendo `401` (a autorização SHALL ocorrer somente após a autenticação).

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
- **WHEN** a rota corresponde a uma ação extra (ex.: importar, exportar) não concedida ao perfil
- **THEN** a API responde `403`, tratando a ação extra como qualquer ação fixa

### Requirement: O catálogo de rotas administrativas mapeia cada rota para módulo e ação
O sistema SHALL aplicar a cada rota administrativa a permissão do módulo e da ação indicados
(o `modulo` SHALL usar os identificadores da matriz: `gestao-usuarios`, `perfis-acesso`,
`auditoria`, `configuracoes-globais`):

- `GET /api/usuarios` → `gestao-usuarios` / `visualizar`
- `POST /api/usuarios`, `POST /api/convite` → `gestao-usuarios` / `criar`
- `PUT /api/usuarios/:id`, `PUT /api/usuarios/:id/situacao` → `gestao-usuarios` / `alterar`
- `DELETE /api/usuarios/:id` → `gestao-usuarios` / `excluir`
- `POST /api/usuarios/importar` → `gestao-usuarios` / `importar`
- `GET /api/perfis` → `perfis-acesso` / `visualizar`
- `POST /api/perfis` → `perfis-acesso` / `criar`
- `PUT /api/perfis/:id`, `PUT /api/perfis/:id/permissoes`, `POST /api/perfis/:id/permissoes/copiar` → `perfis-acesso` / `alterar`
- `DELETE /api/perfis/:id` → `perfis-acesso` / `excluir`
- `GET /api/auditoria` → `auditoria` / `visualizar`
- `GET /api/configuracoes`, `GET /api/seguranca/estado` → `configuracoes-globais` / `visualizar`
- `PUT /api/configuracoes`, `POST /api/seguranca/liberar` → `configuracoes-globais` / `alterar`
- `POST /api/uploads` com destino `logomarcas` → `configuracoes-globais` / `alterar`

#### Scenario: Leitor não executa escrita nem exclusão
- **WHEN** um usuário com perfil Leitor (que não concede `criar`, `alterar` nem `excluir` em `gestao-usuarios`) chama `POST`, `PUT` ou `DELETE` de usuários
- **THEN** a API responde `403` em todas e nenhum usuário é criado, alterado ou excluído

#### Scenario: Leitor não grava configurações nem perfis
- **WHEN** um usuário com perfil Leitor chama `PUT /api/configuracoes` ou `PUT /api/perfis/:id/permissoes`
- **THEN** a API responde `403` e a configuração e a matriz permanecem intactas

#### Scenario: Ação extra de importar é exigida
- **WHEN** um perfil que concede `criar` mas não concede a ação extra `importar` chama `POST /api/usuarios/importar`
- **THEN** a API responde `403`

### Requirement: Portas públicas e autoatendimento exigem apenas sessão
O sistema SHALL manter sem exigência de permissão de módulo as portas públicas e as rotas de
autoatendimento, que continuam exigindo apenas sessão válida (quando administrativas) ou sendo
abertas: `/api/auth/*`, `GET /api/configuracoes/identidade`, `GET /api/usuarios/eu`,
`PATCH /api/usuarios/eu`, `GET /api/usuarios/eu/permissoes` (a matriz do próprio usuário, que
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
permissões do perfil do usuário da sessão, para uso incremental na interface. Nesta etapa o
helper SHALL poder ser consumido quando necessário, **sem** exigir o ocultamento de itens de
navegação ou botões (o controle de interface é tema de etapa posterior).

#### Scenario: Helper responde pelas permissões do perfil
- **WHEN** o cliente consulta `.can(modulo, acao)` para o usuário da sessão
- **THEN** o retorno reflete se a ação está concedida ao perfil do usuário

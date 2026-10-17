# Spec Delta

## MODIFIED Requirements

### Requirement: O catálogo de rotas administrativas mapeia cada rota para módulo e ação
O sistema SHALL aplicar a cada rota administrativa a permissão do módulo e da ação indicados
(o `modulo` SHALL usar os identificadores da matriz: `gestao-usuarios`, `perfis-acesso`,
`auditoria`, `configuracoes-globais`, `softwares`):

- `GET /api/usuarios` → `gestao-usuarios` / `visualizar`
- `GET /api/usuarios/emails` → `gestao-usuarios` / `visualizar`
- `GET /api/usuarios/:id` → `gestao-usuarios` / `visualizar`
- `POST /api/usuarios`, `POST /api/convite` → `gestao-usuarios` / `criar`
- `PUT /api/usuarios/:id`, `PUT /api/usuarios/:id/situacao` → `gestao-usuarios` / `alterar`
- `DELETE /api/usuarios/:id` → `gestao-usuarios` / `excluir`
- `POST /api/usuarios/importar` → `gestao-usuarios` / `importar`
- `GET /api/perfis` → `perfis-acesso` / `visualizar`
- `POST /api/perfis` → `perfis-acesso` / `criar`
- `PUT /api/perfis/:id`, `PUT /api/perfis/:id/permissoes`, `POST /api/perfis/:id/permissoes/copiar` → `perfis-acesso` / `alterar`
- `DELETE /api/perfis/:id` → `perfis-acesso` / `excluir`
- `GET /api/softwares` → `softwares` / `visualizar`
- `POST /api/softwares` → `softwares` / `criar`
- `PUT /api/softwares/:codigo` → `softwares` / `alterar`
- `DELETE /api/softwares/:codigo` → `softwares` / `excluir`
- `POST /api/softwares/importar` → `softwares` / `importar`
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

#### Scenario: Rota de e-mails exige visualizar de usuários
- **WHEN** um perfil sem `gestao-usuarios`/`visualizar` chama `GET /api/usuarios/emails`
- **THEN** a API responde `403`

#### Scenario: Rotas de softwares usam o módulo softwares
- **WHEN** um perfil concede `softwares`/`visualizar` mas não `softwares`/`excluir` chama `DELETE /api/softwares/:codigo`
- **THEN** a API responde `403` e nenhum software é excluído

#### Scenario: Importação de softwares exige a ação extra
- **WHEN** um perfil sem `softwares`/`importar` chama `POST /api/softwares/importar`
- **THEN** a API responde `403`

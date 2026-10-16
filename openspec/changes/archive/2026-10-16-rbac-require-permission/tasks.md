# Tasks

## 1. Núcleo de autorização (server)

- [x] 1.1 Criar `server/utils/permission.ts` com `carregarPermissoesDaSessao(event)` (query única em `usuarios JOIN permissoes_perfil`, montagem de `Map<modulo, Set<acao>>` reusando a normalização de `server/utils/perfis.ts`, memoizada em `event.context`) e `requirePermission(event, modulo, acao)` que lança `createError({ statusCode: 403 })` quando a ação não estiver concedida. Verificado por `npm run build` (sucesso).
- [x] 1.2 Garantir que `requirePermission` aceita as 9 ações (4 fixas + 5 extras) e trata módulo/acao inexistente como negação (`403`). Verificado no E2E: Leitor sem o extra/modulo recebe `403`; matriz da sessão traz as ações extras via `parseExtras`.

## 2. Aplicação nas rotas de módulo

- [x] 2.1 Aplicar `requirePermission` nas rotas de usuários (`GET`/`visualizar`, `POST`/`criar`, `PUT` e `situacao`/`alterar`, `DELETE`/`excluir`, `importar`/`importar`, `convite`/`criar`). Verificado no E2E: Leitor `403` em POST/DELETE; Administrador `200/201`.
- [x] 2.2 Aplicar nas rotas de perfis (`GET`/`visualizar`, `POST`/`criar`, `PUT`, `permissoes` e `copiar`/`alterar`, `DELETE`/`excluir`). Verificado no E2E (Administrador `200` no GET/matriz).
- [x] 2.3 Aplicar em auditoria, configurações e segurança (`auditoria`/`visualizar`; `configuracoes-globais` `visualizar`/`alterar`). Verificado no E2E: Leitor `403` no `PUT /api/configuracoes`; Administrador `200`.
- [x] 2.4 Aplicar no upload por destino: `pasta=logomarcas` exige `configuracoes-globais`/`alterar`; `pasta=avatares` permanece só sessão; destino inválido continua `400`. Verificado por código + build.
- [x] 2.5 Confirmar que autoatendimento e portas públicas permanecem sem permissão de módulo. Verificado no E2E: Leitor `200` em `GET /api/usuarios/eu` e `GET /api/usuarios/eu/permissoes`.

## 3. Permissões no cliente (disponibilização)

- [x] 3.1 Criar `GET /api/usuarios/eu/permissoes` (session-only) devolvendo `{ permissoes }`. Verificado no E2E: Leitor retorna a matriz de 6 ações (6/99) e a rota é isenta de `requirePermission`.
- [x] 3.2 Criar `app/composables/usePermissions.ts` expondo `.can(modulo, acao)`. Verificado por código + build (a matriz do Administrador tem todas as ações; a do Leitor não tem `gestao-usuarios/criar`).

## 4. Guarda anti-lockout da matriz

- [x] 4.1 Verificação de lockout em `salvarMatriz`/`copiarMatriz` (contagem de usuários ativos com `pode_editar` nos três módulos essenciais; `0` → `rollback` + `409`). Verificado no E2E: remover `alterar` de `configuracoes-globais` do Administrador → `409`; matriz permaneceu `99/99`.
- [x] 4.2 Cenário permitido. Verificado no E2E: gravações normais (criação/exclusão de usuário Leitor e leitura da matriz) seguiram `200/201` com KPIs recalculados e base restaurada (4 perfis).

## 5. Verificação integrada

- [x] 5.1 `npm run build` — sucesso ("Build complete!"), sem erros nos novos arquivos e rotas.
- [x] 5.2 E2E autenticado em `localhost:3000`: Administrador `200` nas rotas; Leitor `403` nas de escrita/exclusão/configuração e `200` no autoatendimento; guarda anti-lockout `409`.
- [x] 5.3 `GET /design` e `GET /` retornam `200`; resultado registrado em `docs/RL02` (Etapa 1) — C-01 passa a "corrigido".

# Proposal

## Why

A página `/admin/perfis-acesso` ainda opera em fase 1: perfis, matriz de permissões e contagens vivem em memória (`useState`) e são descartados a cada recarga, apesar de as tabelas `perfis_acesso`/`permissoes_perfil` já existirem, já serem provisionadas no boot (migrations `01`/`02`) e já conterem os 4 perfis canônicos com a matriz 99/45/21/99 idêntica à demo. É preciso criar o backend do módulo e integrar a frontend a ele — com todo o tráfego de dados passando pela API (rotas Nitro `/api/**` + `useApiFetch`), para que o CRUD de perfis, a matriz de permissões e as cópias entre perfis persistam e sobrevivam à recarga.

## What Changes

- **Novo backend** em `server/`: utilitário `server/utils/perfis.ts` (leitura/escrita/normalização `permissoes_perfil` → shape da tela) e rotas `/api/perfis` — `GET` (lista com matriz e contagem de usuários), `POST` (criar), `PUT /:id` (editar), `DELETE /:id` (exclusão com guarda de vínculo → 409), `PUT /:id/permissoes` (substitui a matriz em transação) e `POST /:id/permissoes/copiar` (grava a matriz **salva** da origem no destino em uma transação).
- **Integração da frontend**: `usePerfisDemo` vira camada sobre a API (mesmo shape público, mesmos componentes), com estados de carregando/erro; `salvarPerfil`/`salvarPermissoes`/`excluirPerfil` passam a ser assíncronos via `useApiFetch`. Filtros, KPIs e exportações CSV/PDF continuam client-side sobre o conjunto vigente carregado.
- **BREAKING (comportamento da spec)**: os requisitos da capability `perfis-acesso` que mandam "nenhuma requisição HTTP", "base em memória" e "recarga restaura a demo" passam a exigir persistência via API e recarga que rebusca o banco.
- **Escopo deliberado (fora desta change)**: autenticação/autorização nas rotas (`requirePermission`), trilha de auditoria (`registrarAuditoria`), colunas futuras `padrao_sistema`/`cor_identificacao`, e a integração de `/admin/gestao-usuarios` com o banco (a coluna Usuários da tabela de perfis passa a contar do banco `usuarios`, com os números mudando de 2/5/4/5 para 2/0/0/0 até a gestão de usuários ir ao backend).

## Capabilities

### New Capabilities

<!-- nenhuma: a superfície de API serve o comportamento já especificado da página -->

### Modified Capabilities

- `perfis-acesso`: persistência via API substitui a base em memória — os requisitos "A base de perfis vive em memória e se restaura na recarga", "O modal de cadastro/edição cria e altera perfis", "O modal de exclusão confirma a remoção de um perfil", "O modal de permissões configura a matriz do perfil", "O modal de permissões copia a matriz entre perfis" e "As contagens de permissões e de usuários são derivadas, nunca digitadas" mudam de "em memória, sem requisição HTTP, recarga restaura demo" para "gravado via API, sobrevive à recarga, guarda de vínculo no servidor (409)"; filtros/KPIs/exportações permanecem client-side.

## Impact

- **Backend (novo):** `server/utils/perfis.ts`, `server/api/perfis/index.get.ts`, `server/api/perfis/index.post.ts`, `server/api/perfis/[id]/index.put.ts`, `server/api/perfis/[id]/index.delete.ts`, `server/api/perfis/[id]/permissoes/index.put.ts`, `server/api/perfis/[id]/permissoes/copiar/index.post.ts` — todos sob o padrão já consolidado de `server/api/configuracoes` (pool `query`/`getTransaction` de `server/utils/db.ts`, validação com `createError` 400/404/409).
- **Frontend:** `app/components/perfis/usePerfisDemo.ts` (reescrita para API), `Formulario.vue`, `Permissoes.vue`, `Exclusao.vue` (salvar/excluir/copiar assíncronos), `Tabela.vue`/`Kpis.vue`/`Cabecalho.vue`/`Filtros.vue` (estado de carga), `app/pages/admin/perfis-acesso.vue` (orquestração + carregamento).
- **Banco:** nenhuma migration nova — tabelas e seeds (`01_create_tables.sql`, `02_seed.sql`) já existem e são aplicados no boot.
- **Docs:** `docs/07 - Perfis de Acesso (RBAC).md` §13 (pendência "Backend" resolve-se em parte) e a spec `perfis-acesso` sincronizada via `/opsx-sync`.
- **Fora de escopo:** `useAuth`, `/api/auth/*`, `server/utils/audit.ts`, `useUsuariosDemo`/gestão de usuários, componentes do design system.

# Proposal

## Why

A tela de Configurações Globais está completa no frontend mas 100% em memória: o "Salvar" só mostra toast, os logos voltam ao padrão a cada reload e nada chega ao banco `configuracoes_globais` (que já existe, seedado e ocioso). Com a infra de migrations MariaDB pronta (change `criar-migration-nitro` arquivada), é o momento de abrir a primeira API do projeto e persistir de verdade — e criar de uma vez a camada de uploads reutilizável (logos hoje, avatares no futuro).

## What Changes

- **Primeira API REST do projeto**: `GET /api/configuracoes` e `PUT /api/configuracoes` lendo/escrevendo a linha `config_default` de `configuracoes_globais` (todos os campos do banco, inclusive os sem painel hoje: `nome_empresa`, `banner_*`, `exigir_revisao_para_publicar`, `notificar_por_email`).
- **Endpoint de uploads**: `POST /api/uploads` (multipart: `file` + `pasta`) salvando em `uploads/<pasta>/` e devolvendo a URL pública; tipos de imagem e tamanho limitados no server.
- **Pasta `uploads/` na raiz** (gitignored), servida em runtime via `nitro.publicAssets` — funciona igual em dev e produção (diferente de `public/`, que é copiada no build).
- **Composable `useApiFetch`**: wrapper do `$fetch` com `credentials: 'include'` e headers de contexto `x-usuario-id`/`x-usuario-nome` (docs/02 §5.2 — sem auto-refresh ainda, que depende da change de auth).
- **Frontend passa a usar API**: a página hidrata logos/sidebar/retenção via `GET` no load; "Salvar Alterações Globais" faz `PUT` com toast de sucesso **ou erro** (botão permanece habilitado em erro, valor não perdido); upload de logo faz `POST /api/uploads` em vez de montar o caminho localmente.
- **Aba Segurança permanece demo** nesta fase (sem tabela de bloqueios por IP; wire real fica para a change de auth/rate-limit).
- **Sem guard no server** nesta fase — a página continua protegida pelo middleware `auth.global.ts` do frontend; a guard real (sessão/JWT) vem com a change de auth.

## Capabilities

### New Capabilities
- `uploads`: contrato do serviço de uploads de arquivos — endpoint multipart, subpastas (`logomarcas`, `avatares`), validação de tipo/tamanho, persistência em disco e servimento público em `/uploads/**`.

### Modified Capabilities
- `configuracoes-globais`: (a) requirement "Salvar oferece feedback sem persistir nesta fase" passa a exigir persistência real via `PUT /api/configuracoes` com cenário de erro; (b) novo requirement de hidratação via `GET /api/configuracoes` no carregamento da página (logos, sidebar e retenção restaurados de valores salvos, inclusive após recarregar).

## Impact

- **Novos arquivos**: `app/composables/useApiFetch.ts`, `server/api/configuracoes/index.get.ts`, `server/api/configuracoes/index.put.ts`, `server/api/uploads/index.post.ts`, `server/utils/configuracoes.ts`, `server/utils/uploads.ts`, diretório `uploads/` (gitignored).
- **Modificados**: `nuxt.config.ts` (`nitro.publicAssets` para `uploads/`), `app/pages/admin/configuracoes-globais.vue` (load/save), `app/components/configuracoes/AbaLogomarcas.vue` (upload via API), composables `useLogomarcaHeader`/`useLogomarcaLogin`/`useSidebarExpandida`/`useSessoesAbertas` (hidratação).
- **Banco**: nenhuma mudança de schema — usa `configuracoes_globais` e seeds já existentes.
- **Dependências**: nenhuma nova (`mysql2` já instalado; Nitro suporta multipart nativamente).
- **Observável**: estado passa a persistir entre recargas (comportamento oposto ao cenário "Estado não persiste" da spec atual — modificado nesta change); demais abas inalteradas visualmente.

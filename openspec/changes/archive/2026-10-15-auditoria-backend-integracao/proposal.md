# Proposal — auditoria-backend-integracao

## Why

A página `/admin/auditoria` (fase 1) é 100% demonstração em memória: a base de 25 registros
morre na recarga, o `docs/02` §3.6 promete um helper `registrarAuditoria` que não existe,
nenhuma rota de escrita grava na tabela `auditoria` (que já está criada e vazia na migration
01) e a página não tem estado de carregamento no F5 — ao contrário de Meu Perfil e
Configurações Globais. Sem trilha real, a Área Administrativa não oferece rastreabilidade
das operações, que é a razão de existir do módulo.

## What Changes

- **Backend — escrita:** criação de `server/utils/audit.ts` com `registrarAuditoria(event,
  { acao, recurso, entidadeId?, detalhes, sessao? })` — resiliente (nunca derruba a requisição
  principal), que preenche `usuario_id`/`usuario_nome`/`usuario_perfil` da sessão (ou da
  sessão informada pelo chamador — login/recuperação) e `endereco_ip` via `ipDoCliente`;
  ligada (19 chamadas) em todas as rotas de escrita existentes: usuários (criar/editar/
  situacao/excluir/importar/eu), perfis (criar/editar/excluir/matriz/copiar), configurações,
  uploads, convite e liberação de bloqueio.
- **Backend — autenticação na trilha (escopo novo, pedido do usuário):** login, logout,
  troca de senha e recuperação de senha registram como o 5º tipo **`Acesso`** com recurso
  "Autenticação" (sessão informada explicitamente nos casos sem cookie no request); tentativas
  inválidas continuam exclusivas do log `seguranca_eventos_login` (aba Segurança).
- **Backend — leitura:** novo `GET /api/auditoria` (protegido pelo middleware global
  `auth-api.ts`) com filtros estruturais por query param (data inicial/final, usuário,
  ação, recurso), ordenação do mais recente para o mais antigo e retorno
  `{ registros, opcoes }` — as opções dos selects derivam do conjunto não filtrado.
- **Backend — seed:** migration `07_seed_auditoria.sql` com ~25 registros (ids fixos,
  datas relativas a `NOW()`) para a tela abrir com conteúdo desde a primeira execução.
- **Frontend:** `useAuditoriaDemo.ts` deixa de ser demo e passa a servir a API
  (mesmo precedente de `usePerfisDemo`: contrato público estável, base inicia vazia,
  nunca exibe demo fingindo ser real); o tipo `Acesso` entra no enum de ações com badge
  variante neutra; a página ganha `UiLoading` no F5 ("Carregando
  auditoria…") e toast de erro na falha, no padrão Meu Perfil/Configurações Globais;
  filtros estruturais passam a refazer o GET ao aplicar/limpar; KPIs, busca, paginação
  e exportações CSV/PDF continuam client-side sobre o conjunto retornado.
- **Bugfix:** o SQL de expurgo exibido na aba Retenção de Configurações Globais (e no
  `docs/04`) usa a coluna inexistente `registrado_em` — corrigido para `data_hora`.
- **Fail-fast de boot determinístico (escopo acrescentado na verificação):** o plugin
  `server/plugins/migration.ts` passa a capturar a falha de migrations/bootstrap e
  terminar o processo com exit != 0 e mensagem clara — antes, a rejeição virava
  `[unhandledRejection]` logado e o processo continuava ouvindo, contradizendo o
  "fails fast by design" do `AGENTS.md`.
- **Documentação = código:** `docs/05` reescrito para a fase 2 (API + loading),
  `docs/02` §3.6 atualizado com a assinatura real do helper e §3.2 corrigido para
  descrever o código real (validação ad hoc, middleware `auth-api.ts`, `requirePermission`
  como roadmap, não promessa), `docs/04` e `docs/qa/00` alinhados.
- **Fora de escopo (por decisão):** RBAC/`requirePermission` nas rotas (pendência da change
  de perfis-acesso), expurgo automático real, paginação server-side e registro de tentativas
  de credencial inválidas na trilha (permanecem exclusivas do log `seguranca_eventos_login`
  da aba Segurança — a autenticação BEM-SUCEDIDA está no escopo, como tipo `Acesso`).

## Capabilities

### New Capabilities

_(nenhuma)_

### Modified Capabilities

- `auditoria`: o requirement "A fase 1 opera sem persistência e sem chamadas de rede" é
  substituído — a página passa a carregar os registros via `GET /api/auditoria` com
  estado de carregamento no F5 e toast de erro; o cenário "Acesso direto por URL" e o
  cenário "Sem filtros ativos" dos KPIs deixam de citar a base de demonstração. Novos
  requirements: carga via API com loading/toast, contrato do `GET /api/auditoria`
  (filtros server-side + opções do conjunto não filtrado) e registro de trilha pelas
  operações de escrita via `registrarAuditoria`.

## Impact

- **Código novo:** `server/utils/audit.ts`, `server/api/auditoria/index.get.ts`,
  `server/migration/07_seed_auditoria.sql`.
- **Rotas alteradas (15):** `server/api/usuarios/*` (6), `server/api/perfis/*` (5),
  `server/api/configuracoes/index.put.ts`, `server/api/uploads/index.post.ts`,
  `server/api/convite/index.post.ts`, `server/api/seguranca/liberar/index.post.ts` —
  só acréscimo de chamada após o sucesso da gravação.
- **Frontend:** `app/components/auditoria/useAuditoriaDemo.ts` (API-backed),
  `app/pages/admin/auditoria.vue` (loading/toast), `app/components/auditoria/Tabela.vue`
  (subtitle); componentes Kpis/Filtros/Cabecalho/Detalhe inalterados em contrato.
- **Fix:** `app/components/configuracoes/AbaRetencaoAuditoria.vue` (coluna da query).
- **Docs:** `docs/05`, `docs/02` (§3.2/§3.6), `docs/04`, `docs/qa/00`.
- **Specs:** delta da capability `auditoria`.
- **Banco:** tabela `auditoria` já existe (migration 01); seed é o único artefato novo.
  `UiDataTable` e demais componentes de kit intocados.

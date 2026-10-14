# Design

## Context

A capability `perfis-acesso` está 100% implementada em fase 1 (estado em `useState`,
descartado na recarga) e o banco já está pronto: `perfis_acesso`/`permissoes_perfil` com
seeds idempotentes (`01_create_tables.sql`/`02_seed.sql`), provisionadas no boot pelo plugin
`server/plugins/migration.ts`. O único precedente de integração frontend×API é o módulo de
Configurações Globais: `server/utils/configuracoes.ts` (normalização + pool `query`) +
`server/api/configuracoes/index.{get,put}.ts` + `useApiFetch` (headers `x-usuario-id`/
`x-usuario-nome`, `credentials: 'include'`). `useAuth` ainda é fake (cookie com id demo
`u-001`, que não é UUID de banco), não existe `/api/auth/*`, e não há `server/utils/audit.ts`.
Ver proposal.md para a motivação e a spec delta para o contrato de comportamento.

## Goals / Non-Goals

**Goals:**
- CRUD de perfis + matriz de permissões + cópias persistindo em MariaDB, 100% por rotas
  Nitro `/api/perfis/**` chamadas via `useApiFetch`.
- Reaproveitar o shape de dados atual (`PerfilDemo`, `Record<ModuloId, Permissao[]>`) para
  que os 8 componentes de `app/components/perfis/` mudem o mínimo possível.
- Guarda de vínculo (usuários) imposta no servidor (409), com a FK `RESTRICT` como backstop.

**Non-Goals:**
- Autenticação/autorização nas rotas (`requirePermission`, JWT/sessões) — depende da change
  de auth; os endpoints seguem abertos como `/api/configuracoes`.
- Trilha de auditoria (`registrarAuditoria`) — utilitário ainda não existe e os ids demo
  (`u-001`) não batem com a FK `usuario_id` UUID.
- Colunas `padrao_sistema`/`cor_identificacao` (sem UI no kit; `padrao_sistema` mudaria a
  regra de exclusão irrestrita da spec) e a regra "perfil Inativo/Bloqueado não atribuível".
- Backend de `/admin/gestao-usuarios` (a coluna Usuários passa a contar do banco `usuarios`,
  com números 2/0/0/0 em vez de 2/5/4/5 até essa change existir).
- Filtros, KPIs e exportações CSV/PDF continuam client-side sobre o conjunto vigente
  carregado (a spec delta mantém esse requisito intacto).

## Decisions

**D1 — Contrato da API (REST sob `/api/perfis`):**
```
GET    /api/perfis                       lista: perfil + matriz normalizada + contagem de vínculos
POST   /api/perfis                       { nome, descricao, situacao } → 201 (UUID do banco)
PUT    /api/perfis/:id                   patch de nome/descricao/situacao → 200 (criado_em preservado)
DELETE /api/perfis/:id                   200 | 409 (usuários > 0) | 404
PUT    /api/perfis/:id/permissoes        { permissoes: Record<ModuloId, Permissao[]> } → 200 (replace-all)
POST   /api/perfis/:id/permissoes/copiar { destino_id } → 200 (grava a matriz SALVA da origem no destino)
```
Alternativa considerada: endpoints aninhados em `/api/perfis/:id/...` para tudo — rejeitado
porque Nitro já trata `[id]` como segmento dinâmico; a forma acima espelha o precedente
`configuracoes` (arquivos `index.<verb>.ts`, validação manual com `createError`).

**D2 — `server/utils/perfis.ts` como única camada de acesso ao banco:** funções
`listarPerfis()`, `criarPerfil()`, `atualizarPerfil()`, `excluirPerfil()`,
`salvarMatriz()`, `copiarMatriz()` usando `query`/`getTransaction` de `server/utils/db.ts`.
A normalização acontece só aqui: linhas `permissoes_perfil` (4 TINYINT + `extras` JSON) →
`Record<ModuloId, Permissao[]>` na leitura e o inverso na escrita (módulo sem linha = `[]`;
`extras NULL` = sem extras). O frontend nunca vê o shape tabular.

**D3 — Matriz em transação, replace-all (DELETE + INSERT das 11 linhas) ou upsert em
`uk_perfil_modulo`:** escolhido **DELETE + INSERT em transação** (`getTransaction`) — mais
simples que upsert e garante que ações removidas não persistam. Alternativa (upsert só das
11 linhas) exigiria DELETE das linhas fora dos 11 módulos conhecidos de qualquer forma.
"Copiar para" também é uma transação server-side (ler origem → gravar destino), garantindo
que o destino receba a matriz **salva**, nunca o rascunho (que só existe no cliente).

**D4 — Contagem de vínculos no `GET`:** um `GROUP BY perfil_id` sobre `usuarios` resolve a
coluna Usuários no servidor (evita N+1 e mantém o shape `LinhaPerfil` do frontend). Hoje
retorna 2/0/0/0 (administradores cadastrados); a spec delta documenta o valor como derivado
do banco e o cenário "Acompanha a base de usuários do sistema" cobre o futuro.

**D5 — Reescrita de `usePerfisDemo.ts` mantendo o contrato público:** o composable vira
`usePerfis.ts` (ou é renomeado no lugar, atualizando os 8 imports) mantendo nomes e tipos
(`perfis`, `linhas`, `filtros`, `perfisFiltrados`, `opcoesPerfis`, `KPIs`, `salvarPerfil`,
`salvarPermissoes`, `excluirPerfil`) — só que `salvar*`/`excluir*` passam a ser `async` e a
base é hidratada por `GET /api/perfis` na montagem da página. Alternativa: trocar as
chamadas em cada componente — rejeitada; centralizar no composable mantém os componentes
quase intactos e concentra o estado de carga/erro.

**D6 — Estados de carga/erro na página:** a página (`perfis-acesso.vue`) orquestra o
carregamento no `onMounted`, exibe `UiLoading` enquanto `GET` está em voo e, em falha, toast
de erro + tabela vazia (nunca a semente demo fingindo ser real). Mutações mostram o toast de
sucesso/erro já existentes (`useToast`); erro de `409` no delete vira `toast.warning` de
bloqueio (mesmo texto atual), reaproveitando o fluxo do modal.

**D7 — Identidade enviada pelos headers já existentes:** `useApiFetch` já envia
`x-usuario-id`/`x-usuario-nome`; os handlers de escrita os leem (`getHeader`) para preencher
`detalhes`-like de contexto nos erros/logs de console, mas **não** gravam auditoria nesta
change. Sem sessão real no servidor, nada é autenticado — consistente com
`/api/configuracoes`.

**D8 — Validação server-side espelha a do cliente:** nome (obrigatório, ≤100),
`situacao` no enum, módulos ∈ 11 ids conhecidos (reutilizar a lista exportada pelo
composable via constante compartilhada? não — o `server/` não importa de `app/`; duplicar a
lista de 11 módulos/9 ações em `server/utils/perfis.ts` com comentário apontando
`usePerfisDemo`/`docs/07` como fonte). `404` para id inexistente; `409` para vínculo
(conferir contagem antes do DELETE; a FK `RESTRICT` abortaria com erro 1451 — tratado como
rede de segurança).

## Risks / Trade-offs

- [Números da coluna Usuários mudam de 2/5/4/5 para 1/0/0/0] → Documentado na spec delta;
  é a verdade do banco. Mitigação futura: change de `gestao-usuarios` ao backend.
- [Endpoints sem autenticação expõem CRUD livre em dev] → Mesmo risco aceito em
  `/api/configuracoes`; mitigação real vem com a change de auth (`requirePermission`).
- [Duplicação da lista de módulos/ações cliente×servidor] → Aceita (barreira
  `app/`×`server/`); comentário de manutenção em ambos os lados + cenário de `400` na spec
  cobre divergência acidental.
- [Race entre exclusão e criação de vínculo] → FK `RESTRICT` garante integridade mesmo se a
  contagem prévia estiver defasada; o `409` é apenas a mensagem amigável.
- [Quebra de SSR/hidratação ao trocar `useState` síncrono por carga assíncrona] → Carga em
  `onMounted` (client-only), estado inicial `[]` + flag de carregando; a página já roda com
  shell admin e não depende de hidratação server-side do conteúdo.
- [Requisições duplicadas múltiplas instâncias do composable] → `useState` do Nuxt compartilha
  o estado entre instâncias; a flag `carregado` evita refetch redundante por componente.

## Migration Plan

Nenhuma migration de banco (tabelas/seeds já aplicados no boot). Deploy = build normal
(`npm run build`); rollback = reverter o código — o banco aceita leituras/escritas da nova
API sem alteração de esquema, e dados gravados permanecem (sem down-migration necessário).

## Open Questions

- Nenhuma que afete specs, abordagem ou tasks — as decisões de escopo (auth/auditoria
  adiadas, contagem pelo banco, sem `padrao_sistema`/`cor_identificacao`) estão registradas
  na proposal e refletidas na spec delta.

# Design — auditoria-backend-integracao

## Context

A tela `/admin/auditoria` é completa em frontend (KPIs, filtros em modal, tabela, detalhe,
CSV/PDF) mas 100% demo (`useAuditoriaDemo.ts` com 25 registros relativos a "hoje"). No
backend: a tabela `auditoria` existe desde a migration 01 (§18 — id, usuario_id FK NULL,
data_hora, usuario_nome, usuario_perfil, acao, entidade, entidade_id, endereco_ip,
detalhes; índices em data_hora DESC, entidade e usuario_nome) e está vazia — nenhum código
insere nela, e `server/utils/audit.ts` (prometido no `docs/02` §3.6) não existe. Os
precedentes de integração consolidados no projeto são `usePerfisDemo` (composable mantém o
nome/contrato, base inicia vazia, API preenche, demo nunca finja ser real) e o loading de
F5 de Meu Perfil/Configurações Globais (`carregando` + `<UiLoading v-if>` + `<div v-else>` +
toast na falha). Ver proposal.md para motivação; specs/auditoria/spec.md para o contrato.

## Goals / Non-Goals

**Goals:**
- Trilha real: `registrarAuditoria` gravando nas operações de escrita existentes.
- Consulta real: `GET /api/auditoria` com filtros server-side; página API-backed com
  loading no F5 e toast de erro, sem demo fingindo ser real.
- Conteúdo imediato: seed determinístico via migration (tela nunca vazia na primeira execução).
- Documentação refletindo o código (`docs/05`, `docs/02`, `docs/04`, `docs/qa/00`) e o
  bugfix do SQL de expurgo (`registrado_em` → `data_hora`).

**Non-Goals:**
- RBAC/`requirePermission` nas rotas (pendência da change de perfis-acesso).
- Auditoria de **tentativas inválidas** de credencial — seguem exclusivamente no log
  `seguranca_eventos_login` (aba Segurança); a autenticação bem-sucedida entrou no escopo
  como tipo `Acesso` (D10, pedido do usuário na verificação).
- Expurgo automático real pela retenção (a aba Retenção segue exibindo a rotina como planejada).
- Paginação server-side, novos filtros no modal (IP etc.), `UiMenu` no kit, componentes de kit alterados.

## Decisions

**D1 — Reusar a tabela existente; `acao` guarda o TIPO, `entidade` é o recurso.**
Sem migration de schema. `acao` (VARCHAR 200) recebe apenas um dos 5 tipos
{Inclusão, Alteração, Exclusão, Homologação, Acesso} — o que mantém `VARIANTE_POR_ACAO` e o badge
íntegros; o texto humano fica em `detalhes`. `recurso` da UI → coluna `entidade`;
`entidade_id` recebe o id afetado ou `''` (NOT NULL); `usuario_id`/`usuario_nome`/
`usuario_perfil` vêm da sessão; `data_hora` usa o DEFAULT da coluna.
*Alternativa descartada*: migration acrescentando coluna `recurso` — duplicaria `entidade`
e contradiz o DDL já em produção.

**D2 — `server/utils/audit.ts` resiliente, espelhando `registrarEventoLogin`.**
`registrarAuditoria(event, { acao, recurso, entidadeId?, detalhes })`: lê
`getSessionUser(event)` (utils/auth) e `ipDoCliente(event)` (utils/rateLimit — já usado
pelo log de login), INSERT com `UUID()` e `data_hora` default, tudo em try/catch com
`console.error` — **nunca lança** (spec: falha no log não derruba a resposta principal).
Guard de `acao` contra os 4 tipos; `detalhes` truncado em MEDIUMTEXT-safe (slice defensivo).
*Alternativa descartada*: lançar erro e deixar a rota tratar — violaria a resiliência
operacional e atrasaria respostas (`docs/qa/06`).

**D3 — `GET /api/auditoria` devolve `{ registros, opcoes }`, filtros por query param.**
Handler em `server/api/auditoria/index.get.ts` + `listarAuditoria(filtros)` em
`server/utils/audit.ts` (mesma separação util/handler de `seguranca.ts`/`perfis.ts`).
Protegido de graça pelo `auth-api.ts` (401 sem sessão). Params opcionais: `dataInicial`,
`dataFinal` (`yyyy-mm-dd`), `usuario` (nome), `acao`, `recurso` — vazios ausentes = todos.
Datas viram janela inclusiva (`data_hora >= '… 00:00:00'` e `<= '… 23:59:59'`). Ordenação
`ORDER BY data_hora DESC, id DESC`. `opcoes` (usuários e recursos distintos) computadas
sobre o conjunto **não** filtrado — regra já consolidada: opção de select não some por
razão de filtro. `acao` fora dos 4 tipos → WHERE sem match → lista vazia (sem 400).
*Alternativa descartada*: fetch-all + filtro client-side (padrão perfis/usuários) — a trilha
cresce a cada escrita do sistema inteiro e a retenção padrão é 180 dias; filtrar no
servidor mantém o payload estável sem tocar no `UiDataTable`.

**D4 — Filtros estruturais no servidor; KPIs, busca, paginação e exportações no cliente.**
`registrosFiltrados` do composable passa a ser o que a API devolve para o filtro vigente;
`UiDataTable` recebe `data` como hoje (busca/sort/paginção client-side). Os filtros
seguem em `useState` (preservados na navegação interna, zerados no F5) e um `watch`
refaz o `GET` ao aplicar/limpar. KPIs (`Kpis.vue`), CSV/PDF (`Cabecalho.vue`) e detalhe
não mudam de contrato — só a origem dos dados.
*Alternativa descartada*: paginação server-side — exige refatorar `UiDataTable` (que é
100% client) sem benefício enquanto o volume é pequeno; fica registrado como upgrade.

**D5 — Composable vira API-backed preservando o contrato público.**
`useAuditoriaDemo.ts` mantém nome e exports (`filtros`, `registrosFiltrados`,
`filtrosAtivosCount`, `periodoRotulo`, `opcoesUsuarios`, `opcoesRecursos`, `limparFiltros`,
types, helpers de data) — mesmíssimo precedente de `usePerfisDemo` na change
`perfis-acesso-backend`. Adiciona `registros` (`useState`, inicia `[]`), `carregando`,
`carregado` e `carregarAuditoria()` idempotente; `opcoesUsuarios`/`opcoesRecursos` passam
a vir de `opcoes` da resposta. `REGISTROS` (demo) é removido. A página monta
`carregando = ref(true)` → `onMounted` → `carregarAuditoria()` → `finally false`, com
`toast.danger` na falha e `<UiLoading v-if="carregando" message="Carregando auditoria…" />`
+ `<div v-else>` — cópia do padrão de `configuracoes-globais.vue`. Subtítulo da tabela
perde "— fase 1 em memória".

**D6 — Seed `07_seed_auditoria.sql` com datas relativas.**
~25 linhas copiando a curadoria da base demo (4 usuários fictícios com
`usuario_id NULL`, 6 recursos, as 4 ações, 5 IPs), ids fixos `log-seed-001`… e
`DATE_SUB(NOW(), INTERVAL n DAY)` + horários fixos — o filtro "Período" e o KPI
"Última atividade" seguem coerentes com "hoje". Runner tolera 1062 e rastreia por
`_migrations` (re-execução não duplica). *Alternativa descartada*: seed com datas fixas
absolutas — o KPI de "Última atividade" envelheceria e o demo perderia utilidade.

**D7 — 19 pontos de chamada de `registrarAuditoria`, após o sucesso de cada operação.**

| Rota | acao | recurso |
|---|---|---|
| POST /api/usuarios | Inclusão | Usuários |
| PUT /api/usuarios/:id | Alteração | Usuários |
| PUT /api/usuarios/:id/situacao | Alteração | Usuários |
| DELETE /api/usuarios/:id | Exclusão | Usuários |
| POST /api/usuarios/importar | Inclusão (1 evento, detalhes com contagem) | Usuários |
| PATCH /api/usuarios/eu | Alteração | Meu Perfil |
| POST /api/perfis | Inclusão | Perfis de Acesso |
| PUT /api/perfis/:id | Alteração | Perfis de Acesso |
| DELETE /api/perfis/:id | Exclusão | Perfis de Acesso |
| PUT /api/perfis/:id/permissoes | Alteração | Perfis de Acesso |
| POST /api/perfis/:id/permissoes/copiar | Alteração | Perfis de Acesso |
| PUT /api/configuracoes | Alteração | Configurações Globais |
| POST /api/uploads | Inclusão | Logomarcas |
| POST /api/convite | Inclusão | Usuários |
| POST /api/seguranca/liberar | Alteração | Rate Limits |
| POST /api/auth/login (sucesso) | **Acesso** | Autenticação |
| POST /api/auth/logout (com sessão) | **Acesso** | Autenticação |
| POST /api/auth/trocar-senha | **Acesso** | Autenticação |
| POST /api/auth/esqueci-senha (ambos os caminhos) | **Acesso** | Autenticação |

`Homologação` fica no enum/seed (não há rota de esteira ainda). As chamadas usam
`await` fire-and-forget seguro (o helper nunca lança) após o sucesso, com o
`entidadeId` correspondente quando houver.

**D10 — Autenticação na trilha como `'Acesso'` (escopo novo a pedido do usuário).**
As 4 rotas de auth entram na trilha com o 5º tipo `Acesso` (badge `neutral` na tabela,
opção nova no filtro de ação) e recurso "Autenticação". Como o request do login ainda não
carrega os cookies (eles pertencem à resposta) e o `esqueci-senha` é público,
`registrarAuditoria` ganhou a sobrescrita opcional `sessao: { id, nome, perfil }` — sem
ela o registro sairia como "Desconhecido". Logout sem cookie não gera evento (evita
usuário anônimo na trilha); tentativas de credencial inválida continuam exclusivas do
log `seguranca_eventos_login` (fonte da aba Segurança — os dois logs coexistem com
papéis distintos: segurança operacional × governança). A resposta anti-enumeração do
`esqueci-senha` permanece idêntica nos dois caminhos (o log é interno).

**D8 — Documentação sincronizada com o código no mesmo change.**
`docs/05` (fase 2: API, loading, composable, backend, pendências), `docs/02` §3.6
(assinatura real de `registrarAuditoria` + mapeamento entidade/recurso) e §3.2
(validação ad hoc real, middleware `auth-api.ts`, `requirePermission` como roadmap —
o `docs/qa/00` recebe a mesma correção), `docs/04` + `AbaRetencaoAuditoria.vue` (coluna
`data_hora`). Purpose da spec `auditoria` em `openspec/specs/` é atualizado diretamente
(instrução do CLI para Purpose de capability existente).

## Risks / Trade-offs

- [Volume crescente da trilha com fetch do conjunto filtrado] → retenção (30–730 dias,
  default 180) limita o crescimento; filtros server-side mantêm o payload estável; se
  mesmo assim crescer, o upgrade é paginação server-side (D4, fora de escopo agora).
- [Seed pode "esconder" que nenhuma escrita real ainda aconteceu] → aceito: o seed é
  rotulado como seed no `docs/05` e os primeiros registros reais aparecem com ids/usuarios
  reais; alternativa (tela vazia) violaria o objetivo de conteúdo imediato.
- [19 rotas tocadas podem conflitar em merge] → acréscimo de 1–3 linhas por rota, sempre
  após o sucesso da gravação; nenhuma assinatura muda.
- [`usuario` do filtro é o NOME (com acento/caixa), não o id] → contrato da UI já é esse;
  servidor compara exatamente `usuario_nome`; homônimos teóricos filtrariam juntos —
  aceito (mesmo comportamento da fase 1).
- [Timezone: datas locais x `NOW()` do MariaDB] → janela de datas comparada como texto
  `yyyy-mm-dd` local (mesmo `diaLocal` do frontend); seed usa `NOW()` do servidor —
  consistente com `data_hora` default das escritas reais.

## Migration Plan

1. Migration 07 roda sozinha no boot (plugin `migration.ts`); rollback = não aplicável
   (seed only; nenhuma mudança de schema — se necessário, `DELETE FROM auditoria WHERE id LIKE 'log-seed-%'`).
2. Deploy único: backend (helper + rotas + GET) e frontend no mesmo build — o frontend
   antigo não é chamado pelo novo backend e vice-versa (o GET só é consumido pela página nova).
3. **Fail-fast de boot (D9 — escopo acrescentado na verificação):** o plugin
   `server/plugins/migration.ts` ganha `try/catch` + `process.exit(1)` com mensagem
   clara, tornando determinístico o comportamento que o `AGENTS.md` já documenta
   ("MariaDB fora do ar → boot falha rápido"). Antes da mudança, a rejeição de
   `runMigrations()` era reportada como `[unhandledRejection]` e o processo seguia
   ouvindo (verificado em dev e produção com `NUXT_DB_PORT` inválido). Com o banco
   fora, dev e produção encerram com exit != 0; em runtime (servidor de pé, GET
   falhando), a página degrada com toast + tabela vazia (CDP verificado).

## Open Questions

_(nenhuma — escopo, modelo de dados, contrato da API e limites foram fechados com o usuário
na exploração: escrita entra tudo, auth fora da trilha, nome da change e tratativa dos docs
confirmados.)_

# Design

## Context

Ver `proposal.md` para a motivação (achados `RL03-C-01`, `RL03-A-01`, `RL03-B-17`).

Estado atual relevante (leitura somente, sem alterações):

- O middleware `server/middleware/auth-api.ts` protege `/api/**` e é o **único** ponto que hoje chama
  `sessaoAtivaNoServidor(sessao)` (comparação de `token_version`). Ele **isenta** todo `/api/auth/*`
  (linha 12) e `/api/configuracoes/identidade` (linha 16).
- `server/utils/auth.ts`:
  - `getSessionUser(event)` (262-276) devolve a sessão a partir do **access JWT válido** (assinatura +
    expiração) **sem tocar o banco**; só cai em `renovarSessao` quando o access não valida.
  - `sessaoAtivaNoServidor({ id, tokenVersion })` (326-337) valida no banco: conta existe, `situacao === 'Ativo'`
    e `token_version` confere.
  - `rotacionarSessao(event, refresh)` (166-200) executa em transação, mas faz `SELECT ... LIMIT 1`
    **sem** `FOR UPDATE` (linhas 176-181), permitindo que duas renovações concorrentes leiam a mesma
    linha não revogada antes de qualquer `UPDATE`.
- `server/api/auth/seguro/index.get.ts` e `server/api/auth/trocar-senha/index.post.ts` usam apenas
  `getSessionUser` (+, no caso da troca, `buscarUsuarioPorId` conferindo `situacao`), sem
  `sessaoAtivaNoServidor`.

## Goals / Non-Goals

**Goals:**
- Fazer `GET /api/auth/seguro` e `POST /api/auth/trocar-senha` recusarem token de sessão revogada
  (`401`), fechando o bypass de revogação.
- Tornar a rotação do refresh atômica e rejeitar o reuso/renovações concorrentes do mesmo refresh.
- Preservar integralmente o comportamento de sessão válida e do fluxo de senha provisória
  (`primeiro-acesso`): `trocar-senha` continua acessível a uma sessão provisória.

**Non-Goals:**
- Não tratar os demais achados do RL03 (importação de usuários, RBAC dinâmico na UI, índices/expurgo,
  documentação, UX) — outras etapas.
- Não introduzir detecção de reuso por "família de tokens"/blacklist por `jti`; a rejeição de reuso
  usa o próprio estado da linha de `sessoes`.
- Não alterar a estratégia de cookies (nomes, TTL, `SameSite`), nem o `token_version` no login/logout.

## Decisions

### D1 — Validar a revogação explicitamente nas rotas `seguro` e `trocar-senha` (e não afrouxar o middleware)
Após `getSessionUser(event)` retornar sessão, cada rota chama `sessaoAtivaNoServidor(sessao)`; se
falso, limpa os cookies (`limparCookiesAuth`) e responde `401` ("Sessão expirada ou revogada."),
espelhando o middleware.

- **Por que não** reusar o middleware global (remover a isenção de `/api/auth/*`): o middleware também
  aplica o bloqueio `403` de senha provisória, que **não** deve valer para `trocar-senha`/`seguro`
  (sem ele, uma sessão provisória não conseguiria trocar a senha nem hidratar a sinalização). Isso
  exigiria condicionais extras para recompor exatamente as três portas de entrada. Validar na rota é
  mais simples e local.
- **Por que não** mudar `getSessionUser` para sempre consultar o banco: ele é usado por rotas que
  já fazem a checagem (middleware) e por `logout`; uma consulta global adicionaria acoplamento e
  custo sem necessidade. Uma checagem explícita nos dois pontos vulneráveis é suficiente e rastreável.
- **Alternativa considerada:** um helper único `obterSessaoValida(event)` que encapsula
  `getSessionUser` + `sessaoAtivaNoServidor`. Aceitável e preferível para evitar duplicação; a escolha
  fica para a implementação **sem** mudar o contrato observável.

### D2 — Rotação atômica com `SELECT ... FOR UPDATE`
Adicionar `FOR UPDATE` ao `SELECT` de `rotacionarSessao` (auth.ts:176-181). Duas renovações
concorrentes com o mesmo refresh passam a serializar no lock da linha; a segunda, ao reler a linha já
marcada com `revogado_em` pela primeira, não satisfaz `revogado_em IS NULL` e recebe `null` → `401`.
- **Por que:** a condição `revogado_em IS NULL AND expira_em > ?` já rejeita reuso sequencial; o
  `FOR UPDATE` fecha a janela de corrida. Em MariaDB (REPEATABLE READ), leituras de lock enxergam a
  última versão confirmada — comportamento desejado.
- **Alternativa considerada:** `INSERT ... ON DUPLICATE KEY`/reuso baseado em `jti` — mais invasivo e
  desnecessário para o risco atual.

### D3 — Sem migration
A correção usa colunas/tabelas existentes (`usuarios.token_version` — migration 09; `sessoes` —
migration 01). Nenhuma DDL nova.

## Risks / Trade-offs

- **[Consulta extra por `seguro`/`trocar-senha`]** → custo de 1 `SELECT` por chamada; `seguro` roda na
  hidratação (baixo volume) e a troca é rara. Desprezível frente ao ganho de segurança.
- **[`FOR UPDATE` retém lock de linha por instantes]** → transações curtas (sem I/O externo dentro da
  transação); risco de contenção ínfimo no volume esperado.
- **[Regressão no fluxo de provisória]** → mitigado por validar revogação (conta Ativa + versão), que
  independe de `senha_provisoria`; cenário coberto em `tasks.md` (troca de senha por sessão provisória
  continua funcionando).
- **[Clientes com 401 inesperado]** → o `useApiFetch` já renova em `401` e o middleware global leva ao
  login; o comportamento novo é idêntico ao já observado nas demais rotas protegidas.

## Migration Plan

- Deploy apenas de código (sem migration). Ordem: `auth.ts` (helper/`FOR UPDATE`) → rotas `seguro` e
  `trocar-senha`.
- Rollback: reverter os commits; nenhum dado é migrado, então o rollback é imediato e seguro.
- Verificação: E2E conforme `tasks.md` (token revogado → `401`; refresh reutilizado → `401`; sessão
  válida e fluxo de provisória inalterados) + `npm run build`.

## Open Questions

(nenhuma)

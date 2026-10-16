# Design

## Context

Ver `proposal.md` — Why. Estado atual que molda a abordagem:

- `server/middleware/auth-api.ts` já autentica toda `/api/**` (exceto `/api/auth/*` e
  `/api/configuracoes/identidade`) e responde `401` sem sessão.
- `getSessionUser()` (`server/utils/auth.ts`) devolve `{ id, nome, email, perfil }` — o **nome** do
  perfil, **sem** a matriz. Com access JWT válido não consulta o banco.
- A matriz vive em `permissoes_perfil` (PK composta `perfil_id`+`modulo`): colunas booleanas
  `pode_visualizar`/`pode_incluir`/`pode_editar`/`pode_excluir` e `extras` JSON. `server/utils/perfis.ts`
  já expõe `MODULOS_IDS` (11) e `ACOES_IDS`/`EXTRAS_IDS` (9) e sabe montar a matriz por perfil.
- A associação usuário→perfil é `usuarios.perfil_id` → `perfis_acesso.id` (nome em `nome_perfil`).
- Não há, hoje, endpoint que devolva a matriz do próprio usuário ao cliente.

## Goals / Non-Goals

**Goals:**
- Autorizar, no servidor, cada rota de módulo pela matriz do perfil do usuário da sessão, com `403` e
  sem efeito colateral quando a permissão falta.
- Manter portas públicas e autoatendimento apenas com sessão.
- Guarda anti-lockout na gravação/cópia da matriz.
- Disponibilizar `.can(modulo, acao)` no cliente (uso incremental; sem gating visual nesta etapa).

**Non-Goals:**
- Ocultar/desabilitar itens de sidebar, menu e botões conforme permissão (etapa posterior).
- Revogação de sessão no logout/desativação (achado A-04/A-05, Etapa 3 do RL02).
- Cifra da senha SMTP (A-01), validação de upload (A-02), rate limit/XFF (A-03), etc. — etapas do RL02.
- Definir efeito da `situacao` do perfil (M-05) ou da matriz para módulos ainda não construídos.

## Decisions

### D1 — Helper `requirePermission` por rota (não middleware mapeado)
Chamado explícito no início de cada handler: `await requirePermission(event, 'gestao-usuarios', 'criar')`.
- **Por quê:** precisão por método, exceções de autoatendimento explícitas e alinhamento com o roadmap
  `docs/02 §3.5` (`requirePermission(event, modulo, acao)`).
- **Alternativa descartada:** mapa declarativo rota→(módulo,ação) no middleware — concentra a regra, mas
  dificulta exceções por método e o `uploads` por destino.
- `requirePermission` lança `createError({ statusCode: 403, statusMessage: '...' })`; o `401` continua no
  middleware, antes do handler.

### D2 — Resolução da matriz da sessão com cache por request
`carregarPermissoesDaSessao(event)`: extrai o id do usuário de `getSessionUser`, e numa única query
carrega a matriz do perfil do usuário:

```sql
SELECT pp.modulo, pp.pode_visualizar, pp.pode_incluir, pp.pode_editar, pp.pode_excluir, pp.extras
  FROM usuarios u JOIN permissoes_perfil pp ON pp.perfil_id = u.perfil_id
 WHERE u.id = ?
```

Monta um `Map<modulo, Set<acao>>` (reusando a normalização de ações de `server/utils/perfis.ts`).
Memoiza em `event.context.__permissoes` para não repetir a query no mesmo request.
- **Por quê:** uma leitura por request é aceitável (o middleware já protege; `getSessionUser` é barato) e
  evita introduzir invalidação de cache entre requests.
- **Alternativa descartada:** embutir a matriz no JWT — exigiria re-login a cada mudança de matriz e
  incharia o token; cache em memória global — invalidação complexa após salvar a matriz.

### D3 — Catálogo de rotas → (módulo, ação)
Conforme a spec `autorizacao-rbac`. O `uploads` decide pelo campo `pasta`: `logomarcas` exige
`configuracoes-globais`/`alterar`; `avatares` é session-only.
- **Por quê (avatares session-only):** o mesmo endpoint serve o retrato do próprio perfil (Meu Perfil,
  que não tem módulo) e a edição de outro usuário; a gravação no registro alvo já é protegida por
  `gestao-usuarios`/`alterar`, então um upload órfão de avatar é inócuo.
- **Alternativa descartada:** exigir `gestao-usuarios`/`alterar` em `avatares` — quebraria o avatar do
  Meu Perfil para perfis sem esse módulo.

### D4 — Endpoint session-only para o `.can()`
Nova rota `GET /api/usuarios/eu/permissoes` (exige apenas sessão) devolvendo
`{ permissoes: Record<modulo, acao[]> }` do próprio usuário. O composable `usePermissions()` busca uma vez
e expõe `.can(modulo, acao)`.
- **Por quê:** o cliente precisa da própria matriz; as rotas `/api/perfis` exigem `perfis-acesso`/`visualizar`
  (nem todo perfil tem) e expõem todos os perfis.
- **Alternativa descartada:** incluir a matriz na resposta de login/`/api/auth/seguro` — muda contratos
  existentes e serve dados extras a toda navegação.

### D5 — Guarda anti-lockout dentro da transação da matriz
Em `salvarMatriz`/`copiarMatriz`, após o `DELETE`+`INSERT` da matriz alvo **dentro da transação**, contar
usuários ativos cujo perfil detém `pode_editar = 1` nos três módulos essenciais; se o total for `0`,
`rollback()` + `409`.

```sql
SELECT COUNT(*) AS total
  FROM usuarios u
  JOIN permissoes_perfil g ON g.perfil_id = u.perfil_id AND g.modulo='gestao-usuarios'      AND g.pode_editar=1
  JOIN permissoes_perfil p ON p.perfil_id = u.perfil_id AND p.modulo='perfis-acesso'        AND p.pode_editar=1
  JOIN permissoes_perfil c ON c.perfil_id = u.perfil_id AND c.modulo='configuracoes-globais' AND c.pode_editar=1
 WHERE u.situacao='Ativo'
```

- **Por quê:** dentro da mesma transação a matriz nova já é visível, então a contagem reflete o estado
  hipotético pós-gravação sem lógica de simulação em memória.
- **Alternativa descartada:** bloquear na leitura da matriz do Administrador (trava por papel) — contraria a
  spec `perfis-acesso` ("matriz editável como a de qualquer outro perfil").

## Risks / Trade-offs

- **Regressão por negar acesso:** perfis não-Administrador perdem ações hoje permitidas → mitigação:
  cenários de spec + verificação E2E (Leitor bloqueado; Administrador intacto) antes do arquivamento.
- **Custo de uma leitura extra por request autorizado:** mitigação — memoização por request (D2); o
  volume atual é baixo (PERF-xx do RL02 cobre o backend, não este helper).
- **Contrato de erro novo (403/409):** consumidores que tratavam só `401` → mitigação: `useApiFetch`
  propaga o err de qualquer status; telas já exibem toast de erro genérico.
- **Falso positivo no anti-lockout:** um Administrador legítimo pode ser impedido de retirar a última
  permissão essencial → comportamento pretendido (proteção), com `409` informativo.
- **Assunção registrada:** `avatares` session-only e `/api/usuarios/eu[/permissoes]` session-only; se o
  produto exigir RBAC no autoatendimento, ajustar a spec (não há módulo "Meu Perfil" na matriz hoje).

## Migration Plan

- **Sem mudança de schema/migrations/seeds** — colunas e matriz já existem.
- **Deploy:** subir o código (helper + chamadas por rota + guarda + endpoint/composable).
- **Rollback:** reverter o commit (as rotas voltam a depender só de sessão); nenhum dado é migrado.
- **Verificação:** `npm run build` + E2E autenticado (Leitor → 403; Administrador → 200) + conferência da
  guarda anti-lockout (409 ao remover a última administração essencial).

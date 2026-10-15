# Design

## Context

Ver `proposal.md` — Why. Contexto mínimo verificado no código:

- `server/utils/auth.ts`: lockout real — `TENTATIVAS_MAX = 5`, `JANELA_BLOQUEIO_MIN = 15`, estado em `usuarios.tentativas_falhas`/`bloqueado_ate`; `registrarFalhaLogin(usuarioId)` bloqueia ao chegar em 5; `limparFalhasLogin(usuarioId)` zera; `bloqueioVigente()` devolve os minutos restantes. O login falha em 4 pontos: e-mail inexistente (401 sem registrar), bloqueio vigente (403 antes do bcrypt), senha errada (401 + registrarFalhaLogin), sucesso (limparFalhasLogin).
- `server/utils/rateLimit.ts`: throttle por IP (janela 60s, em memória), limite lido de `configuracoes_limite_requisicao` (`rate_limit_default`: ativo=1, 120/min, pico=180) com **cache interno de 60s** (`cacheLimite`).
- `server/utils/configuracoes.ts` + rotas `GET/PUT /api/configuracoes`: só a linha `configuracoes_globais`; nada de rate limit.
- `AbaSeguranca.vue`: mock completo (linha fictícia, toast "demo"); `configuracoes-globais.vue`: sem estado de carregamento — renderiza defaults até o `onMounted` resolver o GET (flash no F5).
- Spec `login` já exige "5 falhas → 15 minutos" — o `30 Min` só vivia em `configuracoes-globais` (spec + docs/04 + rótulo da aba).
- Padrão de referência de log do projeto: tabela `auditoria` (id, data_hora, usuario_id FK `ON DELETE SET NULL`, `endereco_ip`, append-only).

## Goals / Non-Goals

**Goals:**

- A aba Segurança espelha o estado real (lockout + rate limit) com fonte única no servidor, incluindo as constantes.
- Log de eventos de login auditório (append-only), alimentado pelos 4 pontos de falha, incluindo tentativas contra e-mails inexistentes.
- Liberação real de contas bloqueadas a partir da aba.
- Rate limit ajustável pela tela, com efeito imediato no limitador (cache invalidado).
- F5 sem flash de defaults na página de Configurações Globais (padrão Meu Perfil).

**Non-Goals:**

- Retenção/purge dos eventos (pode amarrar na retenção de auditoria numa change futura).
- RBAC por perfil nas novas rotas (pendência conhecida do sistema).
- Eventos dos demais endpoints de auth (`esqueci-senha`, `refresh`, `trocar-senha`) e histórico do rate limit por IP (janela segue em memória).
- Tornar editáveis as constantes de lockout (5/15 seguem fixas no código, expostas pelo GET).

## Decisions

**D1 — Tabela nova `seguranca_eventos_login` (migration 05), append-only.** Colunas: `id` (PK), `ocorrido_em DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6)`, `email_alvo VARCHAR(255)` (o digitado, em minúsculas), `usuario_id UUID NULL` com FK `usuarios` **ON DELETE SET NULL** (o log sobrevive à exclusão da conta), `ip VARCHAR(45)`, `tipo ENUM('senha-invalida','email-inexistente','bloqueio-aplicado','tentativa-bloqueado')`, `tentativas_acumuladas TINYINT UNSIGNED NULL`; índices em `ocorrido_em DESC`, `email_alvo`, `ip`. A aplicação só insere e lê — nunca UPDATE/DELETE (mesma regra da `auditoria`). **Migration 06** (pós-QA) acrescenta ao ENUM o valor `'bloqueio-liberado'`: a liberação de um bloqueio por e-mail inexistente também é um evento novo, mantendo o log 100% append-only (nenhuma linha antiga é alterada). Convenções de migration do docs/02 §4.5 (sem `USE`, `;`, rollback comentado). *Alternativa considerada:* reusar a tabela `auditoria` com `entidade='login'` — rejeitada: a `auditoria` registra ações de operadores autenticados (com perfil/nome), não tentativas anônimas; misturar polui os dois consumidores.

**D2 — Um evento por tentativa, nos 4 pontos do login.** `server/utils/seguranca.ts` (novo) exporta `registrarEventoLogin({ emailAlvo, usuarioId, ip, tipo, tentativas? })` e `consultarBloqueioEmailInexistente(email)` (conta eventos `email-inexistente` dos últimos 15 min). No handler de login:
```
e-mail inexistente  -> se 5 tentativas na janela: evento 'tentativa-bloqueado'
                       (usuario_id NULL) + 403 com o MESMO aviso das contas;
                       senão: evento 'email-inexistente' com o contador da
                       janela (1..5) + 401 genérico
bloqueio vigente    -> evento 'tentativa-bloqueado' (tentativas = 5, o motivo)
senha errada        -> registrarFalhaLogin() retorna { bloqueou, tentativas };
                       evento 'bloqueio-aplicado' (5ª falha) ou 'senha-invalida'
sucesso             -> nenhum evento (limparFalhasLogin já zera o estado)
```
Anti-enumeração: o comportamento passa a ser **uniforme** — e-mail existente e inexistente respondem os mesmos códigos/mensagens em cada posição da sequência (5×401 + 403), fechando o oráculo que o bloqueio só-de-contas abria. Contar e-mail inexistente pelo **log** (sem estado extra) usa a própria tabela nova como fonte: janela deslizante de 15 min, eventos do bloqueio não renovam a janela (tipos diferentes), expira sozinho. *Nota:* o bloqueio de e-mail inexistente não tem linha na tabela de contas — não é liberável pela aba, só expira (aceito; documentado).

**D3 — Rotas de estado/ação sob `/api/seguranca`** (sessão exigida pelo middleware global, **nenhuma exemption**):
- `GET /api/seguranca/estado` → `{ constantes: { tentativas_max, janela_bloqueio_min, limite_requisicoes_minuto, rate_limit_ativo }, contas: [{ id, email, tentativas, bloqueadoAte | null, status }], eventos: [...últimos 50] }` — contas = `WHERE tentativas_falhas > 0 OR (bloqueado_ate IS NOT NULL AND bloqueado_ate > NOW())` **mais os bloqueios vigentes de e-mails inexistentes** (5 `email-inexistente` na janela pós-liberação, vindos do log; `id: ''` marca que não há conta — deduplicados contra e-mails de contas reais); no estado **bloqueado**, `tentativas` devolve `TENTATIVAS_MAX` (o banco zera o contador no ato do bloqueio — exibir 5 é a causa real); constantes lidas de `auth.ts` (exportadas) e da linha de rate limit; eventos `ORDER BY ocorrido_em DESC LIMIT 50`.
- `POST /api/seguranca/liberar` (`{ usuarioId }` **ou** `{ email }`) → conta: chama `limparFalhasLogin` (zera falhas e bloqueio); e-mail: `liberarBloqueioEmail` **insere** um evento `bloqueio-liberado` (as janelas passam a contar apenas eventos posteriores à liberação — sem alterar o log). Toast e recarga são do cliente.

**D4 — Rate limit entra no `GET/PUT /api/configuracoes` como bloco `rate_limit`.** `getConfiguracoes()` passa a devolver também `{ ativo, limite_requisicoes_minuto }` (ler a linha `rate_limit_default`); `atualizarConfiguracoes()` aceita o patch e grava na segunda tabela; o `PUT` chama a nova exportação **`invalidarCacheLimite()`** de `rateLimit.ts` após gravar, para o novo limite valer sem esperar os 60s do cache. Mantém um único gesto de salvamento para a página inteira (mesmo padrão da retenção) e evita um botão de salvar por aba. *Alternativa descartada:* `PUT /api/seguranca/rate-limit` imediato — criaria dois gestos de salvamento na mesma aba e dividesaria o "rascunho global" da página.

**D5 — Liberar é ação imediata, não rascunho.** A liberação é uma operação sobre o estado (como desbloqueio em Gestão de Usuários), não uma preferência: `POST` direto + toast + recarga dos blocos; não emite `change` e não habilita o "Salvar Alterações Globais". Cobre contas (`{ usuarioId }`) **e bloqueios por e-mail inexistente** (`{ email }` → evento `bloqueio-liberado` no log).

**D6 — Constantes vêm do servidor.** O cliente não tem mais `5`/`30` hardcoded: o card de indicadores renderiza `constantes` do `GET /api/seguranca/estado` (fonte única: `TENTATIVAS_MAX`, `JANELA_BLOQUEIO_MIN` e o limite do banco). O card de chave passa a descrever a realidade: "Bloqueio: conta (e-mail)" e "Rate limit: IP".

**D7 — Loading no F5 = `UiLoading` no lugar do card de abas.** `configuracoes-globais.vue` ganha `carregando` iniciando `true`; o `onMounted` aguarda o GET (como hoje), zera `carregando` no `finally` e o template renderiza `<UiLoading v-if="carregando" message="Carregando configurações…" />` sem o card até lá — idêntico ao padrão de `meu-perfil.vue`. A aba Segurança tem o próprio fetch (`GET /api/seguranca/estado` na montagem) e exibe `UiLoading` ("Carregando segurança…") enquanto voa. *Alternativa considerada:* eliminar o 2º GET promovendo a retenção/rate limit ao estado hidratado pelo layout (useState no payload) — rejeitada por escopo: mexe no composable compartilhado e no contrato do SSR; o UiResolve resolve o sintoma pedido com uma tela de espera honesta.

**D8 — Frontend da aba em 4 blocos** (`AbaSeguranca.vue` reescrita, sem props — dona do seu fetch):
1. Indicadores (4 cards: tentativas máximas, janela do bloqueio, limite de requisições/minuto com status ativo e chave de rastreio) com valores de `constantes`.
2. "Contas em estado de segurança" — `UiDataTable` (E-mail, Tentativas, Status, Ações) com `LockOpen` + tooltip em "Liberar"; estado vazio "Nenhuma conta em estado de segurança."
3. "Eventos de login" — `UiDataTable` somente leitura (Quando, E-mail, IP, Tipo com `UiBadge`, Tentativas); sem coluna Ações; estado vazio "Nenhum evento registrado."
4. "Rate limit" — `UiInput` (limite/minuto) + `UiSwitch` (ativo) que emitem `change` (rascunho da página). O botão "Atualizar" recarrega o fetch dos blocos 2-3.

## Risks / Trade-offs

- [INSERT extra a cada login falho] → volume baixo (só falhas), tabela pequena e indexada; se um dia crescer demais, o purge futuro resolve.
- [Evento de e-mail inexistente pode crescer sob varredura] → aceito: é justamente o sinal de segurança mais valioso; LIMIT 50 na UI protege a tela.
- [Exclusão de usuário] → FK `ON DELETE SET NULL` mantém o evento com `usuario_id` nulo e o e-mail preservado em `email_alvo`.
- [IP via `xForwardedFor`] → mesmo comportamento do `rateLimit.ts` (proxy confiável); atrás de proxy sem header, registra o IP do proxy — aceito e documentado.
- [Race entre "Atualizar" e evento recém-escrito] → recarga simples é suficiente; sem polling.
- [Renomear a aba "(30 Min)" → "(15 Min)"] → ripple na spec (feito no delta), docs/04 e rótulos internos do componente; nenhum consumidor externo do texto.
- [PUT de configurações passa a tocar duas tabelas] → escritas sequenciais; falha na segunda deixa a primeira gravada (aceito — os dois campos são independentes e a próxima gravação corrige; transação não paga o custo aqui).

## Migration Plan

`05_seguranca_eventos_login.sql` entra no boot (runner idempotente já registrado); sem mudança das tabelas existentes. Rollback = comentar statements + remover linha de `_migrations` (bloco no próprio arquivo). Deploy único com a change; rollback de código não depende da tabela (sem eventos, a aba mostra o bloco vazio).

## Open Questions

Nenhuma — janela de 15 min, modelo estado+log, rate limit via Salvar global e loading no F5 estão fechados com o usuário.

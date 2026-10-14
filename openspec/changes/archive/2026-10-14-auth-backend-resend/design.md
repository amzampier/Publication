# Design

## Context

A autenticação é a última peça fase-1 do sistema: `useAuth` valida contra `useUsuariosDemo`,
o cookie `auth-sessao` guarda um id demo (`u-001`) invisível para o servidor, `ForgotForm`
gera e exibe a senha no cliente e `Convite.vue` só emite toast de simulação. O banco já está
pronto para o destino real (`usuarios.hash_senha` com bcrypt custo 12 no bootstrap,
`sessoes`, `token_blacklist`, `tokens_acesso`, `tentativas_falhas`/`bloqueado_ate`,
`configuracoes_limite_requisicao`) e o `.env` já tem `RESEND_API_KEY`/`MAIL_FROM`. O único
precedente de integração é o padrão das changes `criar-migration-nitro` e
`perfis-acesso-backend` (rotas Nitro + `useApiFetch` + `server/utils/*`). Ver proposal.md
para o porquê e a spec delta para o contrato de comportamento.

## Goals / Non-Goals

**Goals:**
- Login/sessão real (HttpOnly + refresh rotativo), logout, recuperação e troca de senha 100%
  via `/api/auth/**`, com lockout e rate limit.
- E-mails reais via Resend (REST) para "Esqueci a senha" e convite, com templates em
  `shared/` usados por cliente (pré-visualização) e servidor (envio).
- Frontend troca a camada fake por API **sem mudar rotas, páginas nem composição** dos
  componentes (mesmo padrão da change de perfis).

**Non-Goals:**
- Seed dos 16 usuários demo (decisão registrada: só o admin autentica; contas novas nascem
  pelo convite) e CRUD de `/admin/gestao-usuarios` ao banco (segue demo).
- Auditoria de eventos de login (`server/utils/audit.ts`), `usePermissions`/`.can()` (RBAC
  client) e fluxo de redefinição por link com token (`tokens_acesso` fica para a futura
  página de redefinição — a recuperação atual usa senha provisória por e-mail).
- Rate limit fora das rotas de auth; refresh token em outro dispositivo/sessão paralela.

## Decisions

**D1 — Sessão: JWT de acesso (`jose`, HS256) + refresh opaco rotativo em `sessoes`.**
`POST /api/auth/login` gera access JWT (~15 min, payload `{ sub: usuario_id, nome, perfil }`)
e um refresh aleatório (32 bytes) cujo **hash** é gravado em `sessoes` (`refresh_token_hash`,
`ip`, `user_agent`, `expira_em` = 7 dias). Cookies: `HttpOnly`, `SameSite=Lax`, `Path=/` —
`__Host-auth-token`/`__Host-auth-refresh` (com `Secure`) **só em produção**; em dev http o
prefixo `__Host-` é omitido (navegador não persiste cookie `__Host-` sem `Secure`).
`POST /api/auth/refresh` valida o refresh (hash → sessão ativa e não expirada), **rotaciona**
(INSERT do novo hash + revogação do anterior na mesma transação) e emite novo access.
`POST /api/auth/logout` marca `revogado_em` e limpa os dois cookies.
Alternativa considerada: token opaco puro em `sessoes` (sem lib) — descartada: o usuário
escolheu seguir docs/02 (JWT + rotação), e `jose` é a lib padrão da indústria (1 dependência).
`token_blacklist` não é usado (com revogação por `sessoes` + expiração curta do access, o
blacklist ficaria redundante — mantido no banco para a migração prevista em docs/02).

**D2 — `AUTH_JWT_SECRET` em `runtimeConfig`.** O segredo HS256 vem de `AUTH_JWT_SECRET`
(adicionado ao `.env` e ao `.env.example` na implementação; gerar uma vez por ambiente).
Sem fallback fraco: em dev, o plugin de boot falha rápido com mensagem clara se ausente
(mesma filosofia do fail-fast de migrations).

**D3 — Resend via REST pura, sem SDK.** `server/utils/mailer.ts` chama
`https://api.resend.com/emails` com `$fetch` e `Authorization: Bearer <key>` — payload
`{ from: MAIL_FROM, to, subject, html, text }`. `runtimeConfig` recebe `resendApiKey`/`mailFrom`
(mapeados de `RESEND_API_KEY`/`MAIL_FROM`, como os `DB_*` no `nuxt.config.ts`); a chave nunca
chega ao cliente. Alternativa: pacote `resend` do npm — descartada (zero deps novas para um
endpoint REST de um campo só).

**D4 — Templates em `shared/utils/emails.ts`.** O `app/utils/conviteTemplate.ts` migra para
`shared/` (auto-importado por app e server no Nuxt 4) com dois ajustes: `renderHtmlConvite`/
`renderTextoConvite` passam a receber `link` como parâmetro (o servidor usa
`useRequestURL().origin`; o cliente usa `window.location.origin` — o `montarLinkAcesso` com
`window` sai), e ganham irmãos `ASSUNTO_RECUPERACAO` + `renderHtmlRecuperacao`/
`renderTextoRecuperacao` (e-mail com a senha provisória). `gerarSenhaProvisoria` migra junto
(réguas: ≥8, maiúscula+minúscula+número+símbolo). `Convite.vue` continua importando por
auto-import/`#shared` — pré-visualização e "Copiar mensagem" inalterados.

**D5 — Lockout: 5 falhas → 15 minutos.** `POST /api/auth/login` consulta a conta ANTES do
bcrypt: se `bloqueado_ate > now` → aviso "Conta bloqueada temporariamente. Tente novamente em
X minutos." (sem executar bcrypt); credenciais incorretas incrementam `tentativas_falhas` (5 →
`bloqueado_ate = now + 15min`, contador zera no bloqueio); sucesso zera o contador e limpa
`bloqueado_ate`. Situação Inativo responde o aviso próprio **antes** do lockout (não conta
como falha de senha — a senha nem é conferida). Constantes `TENTATIVAS_MAX=5`,
`JANELA_BLOQUEIO_MIN=15` em `server/utils/auth.ts`.

**D6 — Rate limit por IP, em memória, só nas rotas de auth.** `server/utils/rateLimit.ts`:
janela fixa de 1 minuto por IP (Map em memória com varredura de expirados), limite lido de
`configuracoes_limite_requisicao.limite_requisicoes_minuto` (cache de 60s, default 120).
Aplicado em `login`, `refresh`, `esqueci-senha`, `trocar-senha` e `convite` → `429` com
mensagem genérica. Sem persistência (perde-se o contador no restart) e por processo (single-node
— o deploy atual é um único Nitro). Alternativa: contador em banco a cada request — mais I/O
por benefício que só aparece em cluster (docs/02 prevê banco; adiado junto do rate limit
global de todas as rotas).

**D7 — Hidratação da sessão: `GET /api/auth/seguro`.** Como o cookie de acesso é HttpOnly, o
cliente não tem como checar sessão sozinho (diferente da fase 1). `ensureSessao()` (agora
async) chama `GET /api/auth/seguro`, que: valida o access JWT; se expirado mas houver refresh
válido, **rotaciona no servidor** e reemite os cookies (o F5 não precisa dançar refresh no
cliente); devolve `{ usuario: { id, nome, email, perfil } }` ou `401`. Resultado é cacheado em
`useState('auth-usuario')` + flag `sessaoVerificada` — navegações SPA seguintes não refazem a
chamada; `auth.global.ts` só chama quando o estado está vazio. `POST /api/auth/login` devolve
o mesmo shape de usuário.

**D8 — Auto-refresh com single-flight em `useApiFetch`.** `catch (401)` → uma única promise de
refresh compartilhada (todas as chamadas em voo aguardam a mesma) → retry uma vez; falha no
refresh → derruba o estado (`sair()`) e o middleware leva ao login. Segue o desenho de
docs/02 §5.2, acrescentando o guard de concorrência (n documentado lá, mas necessário para
N chamadas simultâneas não gerarem N rotações — cada rotação invalida a anterior e derrubaria
a sessão).

**D9 — `POST /api/convite` com find-or-create.** Body `{ email, senha, nome, perfil,
situacao, telefone?, departamento?, funcao? }` (tudo que a linha demo tem). Lookup por
`email_corporativo`; se ausente → INSERT (hash bcrypt da senha, `perfil_id` resolvido por
`nome_perfil` em `perfis_acesso` — os 4 seeds existem —, `senha_provisoria = 1`); se presente
→ substitui `hash_senha` (bcrypt) e zera lockout. Canal E-mail → grava e chama o mailer
(falha do Resend → `502` sem gravação? **não**: grava primeiro (a conta é desejável mesmo se
o e-mail falhar) e retorna `502` com a conta já criada — o toast de erro manda o admin
repetir; repetição regrava hash e reenvia). Canal WhatsApp → mesma gravação, sem mailer (o
client abre o app). O spec exige que a conta persista na recarga; a listagem da tela NÃO
muda (gestão segue demo).

**D10 — `POST /api/auth/trocar-senha` autenticado pelo cookie.** Identifica o usuário pela
sessão (não por header), confere `senha_atual` com bcrypt, valida `nova` (≥8), grava hash,
`senha_provisoria = 0`. Erros: `401` sem sessão; `400` "Senha atual incorreta." (o cliente
mapeia para o campo Senha atual); `400` para nova inválida. `AbaSeguranca.vue` mantém a UI e
trocá a chamada local por esta API.

**D11 — `ForgotForm` vira cliente da API.** `POST /api/auth/esqueci-senha { email }` →
sempre `200 { ok: true }` (genérico — o servidor só envia se a conta existir; falha do
Resend é logada no servidor sem alterar a resposta, para não vazar existência). O estado de
sucesso do card deixa de exibir `<code>` com a senha e passa a confirmar o envio ("Se o e-mail
estiver cadastrado, enviamos as instruções…"), preservando os botões de retorno/reenvio.

**D12 — Escopo do rate limit/lockout no fluxo de convite.** O convite exige sessão válida
(mesmo middleware aberto dos demais `/api` hoje: a rota lê o cookie para identificar o
operador — se não houver sessão, `401`); ele também passa pelo rate limit (D6). As rotas
`/api/perfis` e `/api/configuracoes` continuam abertas nesta change (proteção delas é
`requirePermission`, escopo futuro).

## Risks / Trade-offs

- [15 dos 16 e-mails demo param de autenticar] → Decisão registrada na proposal; `docs/08` §6
  é atualizado (só `ana.carolina`); contas novas nascem pelo convite (D9).
- [`AUTH_JWT_SECRET` ausente quebra o boot] → Adicionar ao `.env`/`.env.example` como tarefa
  explícita; falha fast-fail com mensagem clara (D2).
- [Resend pode rejeitar o remetente (domínio não verificado em sandbox)] → Teste manual com
  o `MAIL_FROM` real é gate de aceitação; convite mostra toast de erro (feedback ao admin);
  esqueci-senha mantém 200 genérico por exigência do spec (D11) — o usuário não vê erro, só
  não recebe o e-mail; risco aceito e documentado.
- [Side-channel de timing no esqueci-senha (só envia se existir)] → Resposta sempre 200 com o
  mesmo formato; latência do envio é a única diferença — mitigação parcial (aceita, mesma
  postura da fase 1); mitigação forte exigiria fila assíncrona (fora de escopo).
- [Rate limit/lockout em memória: perdem estado no restart e não valem em cluster] → Aceito
  para o deploy single-node atual; migração para a tabela `configuracoes_limite_requisicao`
  chega com o rate limit global (deferred).
- [Custo bcrypt 12 (~250ms) em login/convite] → Intencional (força bruta); UI já tem
  `:loading`.
- [`sessions` crescem sem limpeza (expiradas)] → `revogado_em`/`expira_em` permitem limpeza
  futura; não bloqueia esta change.
- [D11 pode derrubar sessão SPA se refresh falhar] → single-flight (D8) evita corrida; ao
  falhar, estado cai para deslogado e o middleware redireciona — comportamento esperado.

## Migration Plan

Nenhuma migration de banco (tabelas/seeds intactos). Passos de entrega: `npm i jose` →
gerar/adicionar `AUTH_JWT_SECRET` no `.env` (+ `.env.example`) → código → `npm run build` →
fluxo manual com e-mails reais. Rollback = reverter o código: os cookies novos são ignorados
pela versão anterior (que volta a ler `auth-sessao`), hashes de senha gravados continuam
compatíveis (bcrypt), e nenhuma coluna muda de significado.

## Open Questions

- Nenhum que afete specs, abordagem ou tasks — a origem do e-mail (`MAIL_FROM`) já está
  configurada e as constantes de lockout/rate limit são ajustes de implementação.

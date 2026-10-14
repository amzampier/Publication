# Proposal

## Why

A autenticação ainda é fase 1 (fake): `useAuth` valida contra a base demo em memória, o cookie fino guarda um id `u-001` que não existe no banco, a recuperação de senha gera e **exibe** a senha no cliente sem enviar e-mail algum, e o modal de convite da Gestão de Usuários só emite toast de simulação — enquanto o banco já provisiona tudo (`usuarios.hash_senha` com bcrypt, `sessoes`, `tokens_acesso`, lockout) e o `.env` já tem `RESEND_API_KEY`/`MAIL_FROM`. É preciso criar o backend de autenticação (login/sessão/recuperação/troca de senha) e integrar a frontend, com o **Resend** disparando os e-mails de "Esqueci a senha" e de convite.

## What Changes

- **Backend de auth:** `POST /api/auth/login` (bcrypt + status Ativo + lockout de tentativas + rate limit), `POST /api/auth/refresh` (rotação de sessão), `POST /api/auth/logout` (revoga sessão), `POST /api/auth/esqueci-senha` (resposta sempre genérica; gera provisória, grava hash e **envia por e-mail via Resend**), `POST /api/auth/trocar-senha` (bcrypt, serve o Meu Perfil). Sessão = **JWT em cookie `__Host-auth-token` HttpOnly** (access ~15min) + refresh opaco rotativo gravado em `sessoes` (hash) — fiel a `docs/02` §3.2/§3.4; auto-refresh de `401` em `useApiFetch` (§5.2). Dependência nova: `jose`.
- **Resend via REST pura** (`$fetch` no Nitro com `runtimeConfig` `RESEND_*`/`MAIL_FROM` — sem SDK); template de convite migra para `shared/` (hoje em `app/utils/conviteTemplate.ts`, não importável pelo `server/`).
- **Convite real:** o modal passa a chamar `POST /api/convite` com **find-or-create por e-mail** — linha demo sem conta é materializada no banco (hash da provisória) e o e-mail sai de verdade; WhatsApp permanece client-side (protocolo do app).
- **BREAKING (comportamento):** só `ana.carolina@empresa.com.br`/`Public@2026` autentica no fim (não há seed dos 16 usuários demo — decisão registrada); a recuperação deixa de exibir a senha na tela (estado genérico "enviamos as instruções"); lockout (N falhas → bloqueio temporário) e `429` por rate limit passam a existir nas rotas de auth.
- **Frontend:** `useAuth` (`entrar`/`sair`/`ensureSessao`) vira camada da API; `auth.global.ts` valida sessão real; `ForgotForm` sem exibir senha; `Convite.vue` envio real com toast de sucesso/erro; `AbaSeguranca` do Meu Perfil troca a senha via API (obrigatório para coerência — sem isso a troca continuaria mexendo na base demo enquanto o login valida no banco).
- **Escopo deliberado (fora):** seed dos 16 usuários demo, CRUD de `/admin/gestao-usuarios` ao banco (continua demo), auditoria de eventos de login, `usePermissions`/`.can()` (RBAC client), tokens de redefinição com link (futura página de redefinição).

## Capabilities

### New Capabilities

<!-- nenhuma: os endpoints servem o comportamento já especificado das telas -->

### Modified Capabilities

- `login`: autenticação deixa a base demo e passa a validar no banco via API (bcrypt, `ultimo_login`, erro genérico, Inativo); sessão fake por cookie fino vira cookie `HttpOnly` JWT + refresh rotativo com F5 via API e logout servidor; `/admin/esqueci-senha` envia a provisória **por e-mail** (Resend) com estado de sucesso genérico que não exibe senha; **ADDED** lockout de tentativas, rate limit `429` nas rotas de auth e renovação automática de sessão; docs/08 deixa de descrever pendências de backend.
- `meu-perfil`: aba Segurança passa a validar a senha atual e gravar a nova via API (comparação bcrypt no servidor), mantendo cenários de confirmação divergente, tamanho mínimo e efeito no login.
- `gestao-usuarios`: modal de convite passa a enviar e-mail **real via API (Resend)** com find-or-create da conta no banco (persistindo após recarga quando enviado), mantendo canal WhatsApp, pré-visualização, geração/redefinição da provisória e descarte do rascunho.

## Impact

- **Backend (novo):** `server/api/auth/{login,refresh,logout,esqueci-senha,trocar-senha}/index.post.ts`, `server/api/convite/index.post.ts`, `server/utils/auth.ts` (JWT/`jose` + `sessoes` + lockout), `server/utils/mailer.ts` (Resend REST), `server/utils/rateLimit.ts`; `runtimeConfig` ganha `RESEND_API_KEY`/`MAIL_FROM`.
- **Frontend:** `app/composables/useAuth.ts`, `app/composables/useApiFetch.ts` (auto-refresh 401), `app/middleware/auth.global.ts`, `app/components/auth/ForgotForm.vue`, `app/components/usuarios/Convite.vue`, `app/components/perfil/AbaSeguranca.vue`, `app/utils/cookies.ts` (cookies HttpOnly no servidor; cliente só o flag de "lembrar-me").
- **Shared (novo):** `shared/utils/conviteTemplate.ts` (template HTML/texto + gerador de senha provisória, movido de `app/utils/`).
- **Dependências:** `+ jose` (JWT); Resend sem SDK (REST). `bcrypt` já existe.
- **Banco:** nenhuma migration nova — `sessoes`, `token_blacklist`, `tokens_acesso`, `usuarios.*` já existem.
- **Docs:** `docs/08` (§3 sessão, §5 recuperação, §6 credenciais, §11 pendências), `docs/09` (aba Segurança) e specs sincronizadas via `/opsx-sync`.
- **QA afetado:** credenciais demo de `docs/08` §6 (só Ana loga); fluxos E2E das telas administrativas passam a exigir login real.

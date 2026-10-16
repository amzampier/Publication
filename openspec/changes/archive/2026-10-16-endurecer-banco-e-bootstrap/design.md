# Design

## Context

Ver `proposal.md` — Why. Estado atual que molda a abordagem:

- `server/migration/01_create_tables.sql` começa com `DROP VIEW/TABLE IF EXISTS` de todas as tabelas (linhas 24-46) e usa `CREATE TABLE` simples; já está registrado em `_migrations`, então não reexecuta onde aplicado.
- `server/utils/migration-runner.ts`: o `INSERT INTO _migrations` (linha 78) fica **fora** do tratamento tolerante — um `1062` (corrida) aborta o boot.
- `server/utils/bootstrap-admin.ts`: cria `ana.carolina@empresa.com.br`/`Public@2026` com `senha_provisoria = 0` em qualquer ambiente; chamado por `server/plugins/migration.ts`.
- `server/utils/auth.ts`: `UsuarioSessao` não carrega `provisoria`; o access JWT embute `nome/email/perfil`; `getSessionUser` valida o token sem banco; `renovarSessao` recarrega a conta.
- `server/api/auth/trocar-senha` já grava `senha_provisoria = 0` e a Auditoria registra o evento.
- `server/api/auth/login` monta a sessão sem `provisoria`; `convite` e `esqueci-senha` já marcam `senha_provisoria = 1`.
- `server/utils/configuracoes.ts` faz 2 `query()` independentes (configuracoes_globais + configuracoes_limite_requisicao).
- `registrarFalhaLogin` faz `SELECT` + `UPDATE` sem lock (read-modify-write).
- `perfis_acesso` não tem `UNIQUE` em `nome_perfil`; `criarPerfil`/`atualizarPerfil` não tratam `1062`.
- Faltam índices em `auditoria(acao)` e `seguranca_eventos_login(email_alvo, tipo, ocorrido_em)`.

## Goals / Non-Goals

**Goals:**
- Migrations não destrutivas; bootstrap do admin restrito a demo e com senha provisória.
- Fluxo de troca obrigatória da senha provisória no primeiro acesso (servidor + cliente).
- Unicidade de nome de perfil e atomicidade/robustez (configurações, lockout, `_migrations`); índices de auditoria/segurança.

**Non-Goals:**
- Mascarar a senha SMTP (A-01), invalidar a sessão no logout/desativação (A-04/A-05), validar conteúdo de upload (A-02) — Etapa 3 do RL02.
- Expurgo automático de auditoria (M-03).
- Redefinição de senha por token único.

## Decisions

### D1 — Remover os `DROP` da migration 01 (por edição)
Remover o bloco de `DROP VIEW/TABLE` do `01_create_tables.sql`.
- **Por quê:** é a causa do C-02. A base vazia é criada pelos `CREATE TABLE`; onde a migration já foi aplicada ela não reexecuta (registro em `_migrations`), logo a edição é segura.
- **Exceção consciente:** `docs/02 §7` diz "nunca edite migration aplicada" — vale para produção; aqui o projeto é pré-produção, não há dado a migrar e a alternativa (deixar os DROP) mantém o risco crítico.
- **Alternativa descartada:** guarda no runner que detecta `DROP` — menos direta e deixa o arquivo perigoso.

### D2 — Bootstrap restrito ao ambiente e com senha provisória
`ensureAdminUser` só executa quando `process.env.NODE_ENV !== 'production'` (caso contrário loga e retorna) e insere o admin com `senha_provisoria = 1`.
- **Por quê:** remove a credencial conhecida de instalações de produção (C-03) e força a troca no primeiro acesso.
- **Alternativa descartada:** exigir `BOOTSTRAP_ADMIN_*` em produção — aumenta fricção; o objetivo é não criar.

### D3 — `provisoria` na sessão e bloqueio no middleware
Adicionar `provisoria` a `UsuarioSessao` e ao JWT (`emitirAccessToken`/`validarAccessToken`); `buscarUsuarioPorEmail`/`buscarUsuarioPorId` passam a ler `senha_provisoria`; `login` e `renovarSessao` propagam a flag. Em `auth-api.ts`, após resolver a sessão: se `sessao.provisoria`, responder `403` ("Troca de senha obrigatória") — as rotas `/api/auth/*` já são isentas do middleware, então trocar-senha/logout/refresh/seguro seguem acessíveis.
- **Por quê:** o `403` server-side é a barreira real (o cliente só melhora a UX).
- **Alternativa descartada:** checar `senha_provisoria` no banco a cada request (custo/duplicidade) — a flag no token, reemitida na troca, é suficiente.

### D4 — Tela e guarda do cliente
`UsuarioLogado` ganha `provisoria`; `auth.global.ts` redireciona para `/admin/primeiro-acesso` quando a sessão é provisória e a rota não é a própria (e manda de volta a `/admin` quando a provisória já foi resolvida). Nova página `app/pages/admin/primeiro-acesso.vue` no layout de autenticação, reutilizando `AuthBackground`/card, com o `trocar-senha` já existente; após o sucesso, reemite/recarrega a sessão e navega a `/admin`.
- **Por quê:** a tela precisa ser alcançável com sessão provisória; o layout `auth` (sem shell) mantém a consistência das telas de autenticação.

### D5 — Reemissão do token na troca
`trocar-senha`, após limpar a flag, reemite **apenas o cookie de access** (novo token com `provisoria=false`), preservando o refresh.
- **Por quê:** sem reemitir, o token em uso continuaria marcado como provisório e as rotas seguiriam bloqueadas.

### D6 — Migration 08 (unicidade + índices)
Novo `server/migration/08_integridade_e_indices.sql` com `ALTER TABLE perfis_acesso ADD UNIQUE KEY uk_perfis_nome (nome_perfil)`, `ALTER TABLE auditoria ADD KEY idx_audit_acao (acao)` e `ALTER TABLE seguranca_eventos_login ADD KEY idx_seg_email_tipo_data (email_alvo, tipo, ocorrido_em)`, com bloco de rollback comentado. Erros 1061 (índice já existe) são tolerados pelo runner.
- **Por quê:** separar a correção de schema da migration 01 (que é a cópia executável do `docs/bd/01`).

### D7 — 409 de nome de perfil
Em `criarPerfil`/`atualizarPerfil`, tratar `errno 1062` como `409` (mensagem amigável), com a `UNIQUE` do banco como garantia final (espelha o padrão de `excluirPerfil`).
- **Alternativa descartada:** só pré-checar por `SELECT` — sujeito a corrida; o tratamento do `1062` é o backstop.

### D8 — Atomicidade e robustez
`atualizarConfiguracoes` passa a usar `getTransaction` (commit/rollback); `registrarFalhaLogin` usa `SELECT ... FOR UPDATE` dentro de transação; o `INSERT` em `_migrations` é envolvido em `try/catch` que trata `1062` como "já aplicada" e prossegue.
- **Por quê:** elimina a janela de estado parcial (M-11), a subconta de tentativas (M-12) e a abortagem de boot em corrida (M-13).

## Risks / Trade-offs

- **Fluxo demo/QA muda:** a credencial `Public@2026` deixa de dar acesso pleno (primeiro login exige troca) → esperado; atualizar `docs/08` e o roteiro de QA/E2E para trocar a senha no primeiro acesso.
- **Edição da migration 01:** contraria a convenção de "não editar migration aplicada" → aceito por ser pré-produção; registrar no cabeçalho do arquivo o motivo.
- **Bloqueio 403 amplo durante a provisória:** pode surpreender consumidores → mitigado pelo redirecionamento do cliente e pela rota de troca sempre acessível.
- **UNIQUE de nome de perfil sobre base com duplicatas:** falharia no boot → verificado que a base/seed tem nomes únicos (4 perfis); a migration é a fonte final e o erro seria visível (fail-fast).

## Migration Plan

- **Schema:** nova `08_*.sql` aplicada no boot seguinte (aditiva). Rollback documentado no próprio arquivo (drop das chaves).
- **Código:** subir helper/rotas/tela; o middleware passa a bloquear sessões provisórias.
- **Dados:** o admin demo existente permanece com `senha_provisoria = 0`; só novos provisionamentos nascem provisórios. Para exercitar o fluxo, criar um usuário por convite (já nasce provisório).
- **Verificação:** `npm run build` + E2E (login demo → troca obrigatória; após troca, acesso normal; produção não cria admin; `409` de nome duplicado; boot reaplica sem apagar dados).

## Open Questions

Nenhuma pendente — as três decisões de escopo foram resolvidas com o usuário (bootstrap gated, DROP removido, change única).

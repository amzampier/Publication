# Tasks

## 1. Migration do log de eventos

- [x] 1.1 Criar `server/migration/05_seguranca_eventos_login.sql` pelas convenções do docs/02 §4.5 (sem `USE`, `;` como delimitador, bloco `REVERTER (ROLLBACK)` comentado): tabela `seguranca_eventos_login` com `id`, `ocorrido_em` (DEFAULT CURRENT_TIMESTAMP(6)), `email_alvo VARCHAR(255)`, `usuario_id UUID NULL` com FK `usuarios` ON DELETE SET NULL, `ip VARCHAR(45)`, `tipo ENUM('senha-invalida','email-inexistente','bloqueio-aplicado','tentativa-bloqueado')`, `tentativas_acumuladas TINYINT UNSIGNED NULL`, índices em `ocorrido_em DESC`, `email_alvo` e `ip` — verificar: subir o dev server registra a migration em `_migrations` e o `SHOW CREATE TABLE` confirma a FK com SET NULL

## 2. Backend de segurança (utils, hooks do login, rotas)

- [x] 2.1 Criar `server/utils/seguranca.ts` com `registrarEventoLogin(...)` (INSERT na tabela nova), `listarEstadoSeguranca()` (constantes de `auth.ts` + linha de rate limit + contas com `tentativas_falhas > 0` ou bloqueio vigente + últimos 50 eventos com status derivado) e `liberarBloqueio(usuarioId)` (reusa `limparFalhasLogin`) — verificar com `npm run build` e consulta direta ao util via rota no task 2.2
- [x] 2.2 Criar `server/api/seguranca/estado/index.get.ts` e `server/api/seguranca/liberar/index.post.ts` (sessão exigida pelo middleware, sem exemption; 401 sem sessão) — verificar: `curl` sem sessão responde 401; com sessão, o GET devolve `constantes` (5/15/120), `contas` e `eventos`
- [x] 2.3 Hook nos 4 pontos de falha de `server/api/auth/login/index.post.ts` (e-mail inexistente → evento; bloqueio vigente → evento; senha errada → evento com tipo derivado de um novo retorno booleano de `registrarFalhaLogin`; sucesso sem evento) preservando respostas e anti-enumeração — verificar: 5 logins errados geram 4 eventos (4 senha-invalida + 1 bloqueio-aplicado), um login com e-mail inexistente gera evento sem bloquear ninguém, e as respostas 401/403 continuam idênticas

## 3. Rate limit no GET/PUT de configurações

- [x] 3.1 Exportar `invalidarCacheLimite()` em `server/utils/rateLimit.ts`; `getConfiguracoes()`/`atualizarConfiguracoes()` e as rotas `GET/PUT /api/configuracoes` ganham o bloco `rate_limit` (`ativo`, `limite_requisicoes_minuto`, com validação de inteiro > 0), gravando em `configuracoes_limite_requisicao` e invalidando o cache após o PUT — verificar: PUT alterando o limite devolve o valor novo no GET imediatamente e o limitador passa a usá-lo (sem esperar 60s)

## 4. Frontend — aba Segurança real + loading da página

- [x] 4.1 Reescrever `app/components/configuracoes/AbaSeguranca.vue` nos 4 blocos do design (indicadores de `constantes`; tabela de contas com Status derivado, "Liberar" imediato via POST + toast + recarga; tabela de eventos somente leitura com `UiBadge` de tipo; rate limit editável emitindo `change`), com `UiLoading` próprio enquanto o GET voa, "Atualizar" recarregando e estados vazios — verificar com `npm run build` e, na aba, os números batem com o banco (5/15/120), a liberação destrava o login de verdade e o log mostra as tentativas feitas
- [x] 4.2 Em `app/pages/admin/configuracoes-globais.vue`: estado `carregando` com `<UiLoading v-if="carregando" message="Carregando configurações…" />` no lugar do card de abas até o GET resolver; hidratar e enviar o rascunho `rate_limit` no corpo do `PUT` — verificar: F5 na página exibe o loading sem flash dos defaults e o valor salvo de rate limit persiste na recarga

## 5. Documentação

- [x] 5.1 Atualizar `docs/04 - Configurações Gerais.md`: §1 (nome da aba "(15 Min)"), §3.6 (descrever os 4 blocos reais, as rotas `/api/seguranca/*` e o bloco `rate_limit` no GET/PUT) e remover a nota de "Fase 1 em memória" — verificar por releitura: nenhuma menção a "30 Min", `seguranca_rate_limits` fictícia ou "sem persistência" na aba

## 6. Verificação final

- [x] 6.1 `npm run build` limpo + bateria E2E — executada pelo qa-execucao em Chrome headless ((b)–(i) PASS; (a) apontou B1/B2/B3, corrigidos no grupo 8) + revalidação pós-correção por script API (14/14: conta bloqueada com tentativas 5, linha de e-mail bloqueado no bloco, liberar { email } com evento `bloqueio-liberado`, contagem zerada pós-liberação, ENUM 06, 400 sem args) + `npm run build` limpo após as correções — resultado registrado nesta task

## 7. Ajustes de feedback (data/hora, tentativas, bloqueio de e-mail inexistente)

- [x] 7.1 Corrigir a renderização da tabela de eventos em `AbaSeguranca.vue`: `accessorKey` da coluna "Quando" apontando para o campo formatado (`quando` — hoje mostra o ISO cru) e slot `#cell(tentativas)` (hoje `#cell(tentativasAcumuladas)`, que nunca casa com o id da coluna e deixa a célula vazia) — verificar: "Quando" exibe `dd/mm/aaaa HH:mm` e a coluna Tentativas exibe número ou "—"
- [x] 7.2 Popular `tentativas_acumuladas` em todos os tipos de evento no servidor (`email-inexistente` = contador da janela 1..5; `tentativa-bloqueado` = 5, o motivo do bloqueio) — verificar: cada linha do log mostra a quantidade de tentativas correspondente
- [x] 7.3 Bloquear e-mail inexistente após 5 tentativas em 15 minutos (janela derivada do log, mesmo 403/aviso das contas — uniformiza resposta e fecha o oráculo de enumeração): helper em `seguranca.ts`, checagem no login, delta da spec `login`, ajuste do cenário no delta `configuracoes-globais` e do design D2 — verificar: 5×401 (com tentativas 1..5 no log) e 6ª → 403; envelhecendo os eventos >15 min no banco, volta a 401; spec `login` e delta validados com `openspec validate --strict`

## 8. Ajustes pós-QA (contador de bloqueado + bloqueio por e-mail na aba)

- [x] 8.1 Migration `06_seguranca_eventos_bloqueio_liberado.sql`: `ALTER TABLE seguranca_eventos_login MODIFY COLUMN tipo ENUM(..., 'bloqueio-liberado')` (sem edição da 05 aplicada; rollback comentado) — verificar: registrada em `_migrations` e o ENUM aceita o novo valor
- [x] 8.2 Servidor: `liberarBloqueioEmail(email)` (INSERT do evento `bloqueio-liberado`; liberações anteriores descontam os eventos da janela — append-only puro), `consultarBloqueioEmailInexistente` e `listarEstadoSeguranca` passando a contar bloqueios por e-mail pós-liberação; `POST /api/seguranca/liberar` aceita `{ email }`; contas bloqueadas reais exibem `TENTATIVAS_MAX` como tentativas (correção do B1) — verificar: conta bloqueada → tentativas 5; e-mail inexistente bloqueado → aparece em `contas` (sem id), Liberar registra `bloqueio-liberado` no log e o bloqueio some (novas 5 tentativas necessárias para re bloquear)
- [x] 8.3 Frontend: linhas de bloqueio por e-mail no bloco de contas (id vazio → Liberar envia `{ email }`), badge do novo tipo no log, indicador de limite/minuto no bloco de indicadores (B3) e rótulo da aba "Segurança & Rate Limits (15 Min)" (B2) — verificar com `npm run build` e a bateria (a)–(g) do 6.1 reexecutada, incluindo liberar por e-mail pela UI

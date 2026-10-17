# Tasks

> Não há runner de testes no repositório; as verificações usam `npm run build`, a execução E2E
> no dev server (`localhost:3000`) e consultas read-only ao MariaDB, conforme o gate do projeto.

## 1. Uploads — fechar o XSS armazenado (RL04-C-01)

- [x] 1.1 Em `server/utils/uploads.ts`, fazer `ehImagemReal` (ou um novo `detectarTipoImagem`) devolver o tipo canônico detectado (`'png' | 'jpeg' | 'webp' | 'gif' | null`). Verificar com um script Node rápido que um buffer PNG/JPEG/GIF/WebP retorna o tipo e um HTML retorna `null`.
- [x] 1.2 Ajustar `gravarUpload` para gravar sempre com a extensão canônica do tipo detectado (nunca a extensão enviada), mantendo a resolução de colisão `basename-1, -2, …` sobre o nome **sem** a extensão original. Verificar que um upload chamado `evil.html` resulta em `evil.png` (ou equivalente) no disco.
- [x] 1.3 Atualizar `server/api/uploads/index.post.ts` para usar o tipo detectado, rejeitar (`400`) quando o conteúdo não for imagem e nunca propagar a extensão do cliente ao nome final. Verificar que o arquivo PNG-com-payload-HTML com nome `.html` responde `400` **ou** é gravado apenas com extensão de imagem.
- [x] 1.4 (Defesa em profundidade) Em `nuxt.config.ts`, acrescentar `Content-Security-Policy: default-src 'none'` (ou `sandbox`) ao `routeRules` de `/uploads/**`, preservando o `nosniff`. Verificar que uma imagem continua sendo exibida em `/uploads/**`.
- [x] 1.5 Verificar E2E que: (a) `GET` de qualquer arquivo de `/uploads/**` nunca devolve `Content-Type: text/html`; (b) uploads legítimos de logomarca (`pasta=logomarcas`, com permissão) e de avatar (`pasta=avatares`) continuam funcionando e exibindo a imagem; (c) conteúdo não-imagem (HTML/SVG/texto) responde `400`.

## 2. Sessão — corrigir o TTL do refresh (RL04-A-01)

- [x] 2.1 Em `server/utils/auth.ts`, introduzir `REFRESH_TTL_SEG = REFRESH_TTL_DIAS * 24 * 60 * 60` e usá-lo no `maxAge` dos cookies e no cálculo de `expira` como `new Date(Date.now() + REFRESH_TTL_SEG * 1000)`, tanto em `criarSessao` quanto em `rotacionarSessao`. Verificar por inspeção que não resta nenhum `* 24 * 3600` sem conversão para ms.
- [x] 2.2 Verificar E2E no banco: após um login, `SELECT TIMESTAMPDIFF(SECOND, criado_em, expira_em) FROM sessoes ORDER BY criado_em DESC LIMIT 1` resulta em ~`604800` (7 dias); e o `Set-Cookie` do refresh mantém `Max-Age=604800`, agora coerente com a linha.
- [x] 2.3 Verificar E2E que, com o access expirado (ex.: reduzir `AUTH_ACCESS_TTL` em ambiente de teste) e o refresh vigente, `POST /api/auth/refresh` renova os cookies (`200`) em vez de `401` — a sessão sobrevive além de ~15 min.

## 3. Logout — limpar o estado de sessão no cliente (RL04-A-02)

- [x] 3.1 Criar `app/composables/sessaoEstado.ts` com `limparEstadoSessao()` que redefine ao valor inicial todas as chaves `useState` derivadas da sessão: `perfis-base`/`perfis-carregando`/`perfis-carregado`/`perfis-filtros`; `usuarios-base`/`usuarios-carregando`/`usuarios-carregado`/`usuarios-filtros`/`usuarios-pagina`/`usuarios-por-pagina`/`usuarios-total`/`usuarios-kpis`/`usuarios-opcoes`/`usuarios-busca`; `auditoria-registros`/`auditoria-carregando`/`auditoria-carregado`/`auditoria-opcoes`/`auditoria-filtros`/`auditoria-pagina`/`auditoria-por-pagina`/`auditoria-total`/`auditoria-kpis`/`auditoria-busca`; `permissoes-usuario`; `config-globais-cache`. Verificar por inspeção que a lista cobre todas as chaves de `usePerfisModelo`, `useUsuarios`, `useAuditoriaModelo`, `usePermissions` e `useConfiguracoesGlobais`.
- [x] 3.2 Chamar `limparEstadoSessao()` em `sair()` e em `sessaoInvalidada()` de `app/composables/useAuth.ts` (mantendo a limpeza de `auth-usuario`/`auth-verificada`). Verificar por inspeção que ambos os caminhos limpam o estado.
- [x] 3.3 Verificar E2E (navegador): logar como Administrador, abrir Gestão de Perfis e Gestão de Usuários, encerrar a sessão, logar como Leitor na **mesma aba** (sem reload) e confirmar que as telas não exibem a matriz/contadores/nomes do Administrador e que refazem o GET no servidor (Leitor recebe `403`/estado vazio, sem dados do usuário anterior).

## 4. Integração, regressão e documentação

- [x] 4.1 Rodar `npm run build` e confirmar sucesso (gate do projeto).
- [x] 4.2 Regressão de sessão: confirmar que F5 em página administrativa mantém o acesso, que o reuso de refresh já rotacionado responde `401` e que renovações concorrentes seguem `200/401` (comportamento preservado pelas mudanças de TTL).
- [x] 4.3 Atualizar `docs/RL04 - Relatório de Qualidade Completo.md` marcando RL04-C-01, RL04-A-01 e RL04-A-02 como **CORRIGIDO**, com a data e o resumo da verificação — e registrar no documento que a Etapa 1 foi concluída.
- [x] 4.4 Confirmar que os deltas de `uploads` e `login` refletem o comportamento implementado e que `openspec validate corrigir-seguranca-e-sessao` passa.
# Tasks — auditoria-backend-integracao

## 1. Backend — seed, helper de auditoria e API de consulta

- [x] 1.1 Criar `server/migration/07_seed_auditoria.sql` com ~25 registros (ids fixos
      `log-seed-001`…, `usuario_id NULL`, `usuario_nome`/`usuario_perfil` fictícios,
      datas via `DATE_SUB(NOW(), INTERVAL n DAY)`, as 4 ações, 6 recursos, 5 IPs —
      curadoria espelhando a base demo atual). Verificar: subir o dev com MariaDB e
      confirmar no log o apply da migration 07 e `SELECT COUNT(*) FROM auditoria`
      com as linhas `log-seed-%`.
- [x] 1.2 Criar `server/utils/audit.ts`: type `AcaoAuditoria`, `registrarAuditoria(event,
      { acao, recurso, entidadeId?, detalhes })` resiliente (try/catch + console.error,
      nunca lança; usa `getSessionUser` + `ipDoCliente`; `UUID()`; guard dos 4 tipos;
      `entidade_id` default `''`) e `listarAuditoria(filtros)` com janela de datas
      inclusiva, `ORDER BY data_hora DESC, id DESC` e `opcoes` do conjunto não filtrado.
      Verificar: `npm run build` compila sem erros de tipo.
- [x] 1.3 Criar `server/api/auditoria/index.get.ts` lendo query params (`dataInicial`,
      `dataFinal`, `usuario`, `acao`, `recurso`) e devolvendo `{ registros, opcoes }`
      no shape da UI (`registradoEm`, `usuario: { id, nome }`, `recurso` ← `entidade`).
      Verificar: com sessão o `GET` responde 200; sem sessão (ou cookie removido) 401.
- [x] 1.4 Ligar `registrarAuditoria` nas 6 rotas de usuários (POST, PUT :id, PUT :id/situacao,
      DELETE :id, POST importar com contagem nos detalhes, PATCH eu) após o sucesso da
      gravação, com `entidadeId` quando houver. Verificar: cada operação bem-sucedida
      insere 1 linha em `auditoria` com o tipo e o recurso "Usuários"/"Meu Perfil" corretos.
- [x] 1.5 Ligar `registrarAuditoria` nas 5 rotas de perfis (POST, PUT :id, DELETE :id,
      PUT :id/permissoes, POST :id/permissoes/copiar) com recurso "Perfis de Acesso".
      Verificar: criar/editar/excluir perfil e gravar/copiar matriz geram registros com
      os tipos corretos.
- [x] 1.6 Ligar `registrarAuditoria` em PUT /api/configuracoes ("Configurações Globais"),
      POST /api/uploads ("Logomarcas"), POST /api/convite ("Usuários") e POST
      /api/seguranca/liberar ("Rate Limits"). Verificar: cada operação gera 1 registro
      com o recurso mapeado; operações que falham (400/404/409) não geram registro.
- [x] 1.7 Verificar a resiliência do log: inspecionar que `registrarAuditoria` nunca
      propaga exceção e que nenhuma rota precisa de try/catch em volta da chamada;
      simular falha (ex.: tabela temporariamente renomeada em dev) e confirmar que a
      resposta da operação administrativa continua 200/201 com erro só no console.

## 2. Frontend — composable API-backed, loading no F5 e fix da aba Retenção

- [x] 2.1 Converter `app/components/auditoria/useAuditoriaDemo.ts` para API-backed
      preservando o contrato público (mesmo precedente de `usePerfisDemo`): remover
      `REGISTROS`, adicionar `registros` (`useState`, inicia `[]`), `carregando`,
      `carregado`, `carregarAuditoria()` idempotente via `useApiFetch('/api/auditoria')`
      com os filtros como query params, `opcoes` da resposta alimentando
      `opcoesUsuarios`/`opcoesRecursos` e `watch` refazendo o GET ao aplicar/limpar.
      Verificar: `npm run build` e grep confirmando que `REGISTROS`/`dataAtras` não
      existem mais; nenhum consumidor quebrado (Kpis/Cabecalho/Filtros/Detalhe/página).
- [x] 2.2 Adicionar loading no F5 e toast de erro em `app/pages/admin/auditoria.vue`
      (padrão `configuracoes-globais.vue`): `carregando = ref(true)` → `onMounted` →
      `carregarAuditoria()` → `finally carregando = false`; `<UiLoading v-if="carregando"
      message="Carregando auditoria…" />` + `<div v-else>` no conteúdo; `toast.danger`
      na falha com tabela vazia (nunca demo). Verificar: F5 exibe só o overlay enquanto
      o GET voa; com o GET falhando (rede cortada), toast de erro e tabela vazia.
- [x] 2.3 Remover "— fase 1 em memória" do subtitle em
      `app/components/auditoria/Tabela.vue:32`. Verificar: grep "fase 1 em memória" = 0
      ocorrências em `app/`.
- [x] 2.4 Corrigir a coluna da query exibida em
      `app/components/configuracoes/AbaRetencaoAuditoria.vue:39`
      (`registrado_em` → `data_hora`). Verificar: a aba Retenção exibe
      `DELETE FROM auditoria WHERE data_hora < NOW() - INTERVAL N DAY`.

## 3. Documentação — código é a fonte da verdade

- [x] 3.1 Reescrever `docs/05 - Gestão de Auditoria.md` para a fase 2: §1 (API +
      persistência), §3.6 (composable API-backed com `carregando`), nova seção de
      backend (`audit.ts`, `GET /api/auditoria`, mapeamento entidade/recurso, seed),
      §6 (seed em vez de "em memória"), loading no F5 e pendências atualizadas
      (sair "backend", entrar/manter RBAC e `UiMenu`). Verificar: cada afirmação do
      doc confere com o código (rotas, mensagens, arquivos).
- [x] 3.2 Atualizar `docs/02 - Guia de Arquitetura e Migrations.md`: §3.6 com a
      assinatura real de `registrarAuditoria` (arquivo, params, resiliência,
      mapeamento `recurso` → `entidade`) e §3.2 corrigida para o código real
      (validação ad hoc com `createError`, middleware `auth-api.ts`,
      `requirePermission`/`validation.ts`/`safeError.ts` como roadmap, não promessa).
      Verificar: greps por `utils/audit` no doc batem com o arquivo criado; nenhum
      helper prometido sem existir sem a marcação de roadmap.
- [x] 3.3 Corrigir `docs/04 - Configurações Gerais.md:134` (coluna `data_hora` na query
      de expurgo) e `docs/qa/00-arquitetura-e-regras-gerais.md:26` (descrever o backend
      real: sem `validation.ts`, middleware `auth-api.ts`, auditoria via `audit.ts`).
      Verificar: grep `registrado_em` = 0 em `docs/` e `app/`; texto do qa confere com
      os arquivos de `server/`.
- [x] 3.4 Atualizar o Purpose da spec `auditoria` em `openspec/specs/auditoria/spec.md`
      (remover "fase 1 em memória"; a consulta agora é sobre registros persistidos
      servidos pela API). Verificar: `openspec show auditoria --type spec` sem menção
      a fase 1 no Purpose.

## 4. Verificação final (integração)

- [x] 4.1 `npm run build` limpo (gate estrutural do projeto — não há lint/test).
- [x] 4.2 Greps de regressão: `REGISTROS`/`dataAtras` = 0 em `app/`; `registrado_em` = 0
      em `app/` e `docs/`; "fase 1 em memória" = 0 em `app/`; 15 chamadas de
      `registrarAuditoria` em `server/api/`.
- [x] 4.3 Conferência manual (dev + MariaDB): F5 mostra `UiLoading` "Carregando
      auditoria…" e depois a tabela com seed; aplicar filtro de ação refaz o GET
      (aba Network) e recalcula KPIs/badge; criar um usuário em Gestão de Usuários
      e conferir o registro de Inclusão no topo da trilha; exportar CSV/PDF sobre o
      conjunto filtrado; aba Retenção exibe a query com `data_hora`.
- [x] 4.4 Conferir que a falha do banco (parar MariaDB) derruba o boot por design, e
      que com o GET falhando em runtime a página mostra toast + tabela vazia sem
      nenhuma ocorrência da base demo antiga.

## 5. Fail-fast de boot (escopo acrescentado a pedido do usuário na verificação 4.4)

- [x] 5.1 Tornar o fail-fast do boot determinístico em `server/plugins/migration.ts`
      (catch + mensagem clara + terminação com exit != 0 quando migrations/bootstrap
      falham — hoje a rejeição vira `[unhandledRejection]` e o processo continua
      ouvindo). Verificar: com `NUXT_DB_PORT` apontando para porta inválida, o
      `node .output/server/index.mjs` termina sozinho em poucos segundos com
      exit code != 0 e a mensagem de fail-fast no log.
- [x] 5.2 Verificar o comportamento oposto (boot saudável) nos dois modos:
      produção (`node .output/server/index.mjs` com banco no ar sobe, loga
      `[migrations] Banco atualizado` e responde HTTP) e dev (`npm run dev`
      reiniciado sobe no :3000 com a migration 07 já aplicada).

## 6. Autenticação na trilha como 'Acesso' (escopo novo a pedido do usuário)

- [x] 6.1 Estender `server/utils/audit.ts`: 5º tipo `'Acesso'` no union/ACOES e sobrescrita
      opcional de `sessao` no `registrarAuditoria` (login ainda não tem cookie no request e
      `esqueci-senha` é público — o chamador informa `{ id, nome, perfil }`). Verificar:
      `npm run build` compila e o guard dos 5 tipos passa.
- [x] 6.2 Ligar `registrarAuditoria` nas 4 rotas de auth com recurso 'Autenticação'
      (login = 'Acesso' com a conta autenticada; logout = 'Acesso' só com sessão válida;
      trocar-senha = 'Acesso' do logado; esqueci-senha = 'Acesso' com o e-mail alvo, nos
      dois caminhos — resposta anti-enumeração intacta). Verificar E2E: login gera registro
      no topo com `usuario.id` preenchido (não 'Desconhecido') e tentativa de credencial
      inválida NÃO gera registro.
- [x] 6.3 Frontend: `AcaoAuditoria`/`ACOES`/`VARIANTE_POR_ACAO` de `useAuditoriaDemo.ts`
      com `'Acesso'` → badge `neutral` (filtro de ação ganha a opção). Verificar: grep dos
      5 tipos no composable + build.
- [x] 6.4 Atualizar artifacts e docs: spec delta (MODIFIED do badge de 5 tipos + ADDED dos
      eventos de autenticação), proposal (escopo), design (D10), `docs/02` §3.6 e `docs/05`
      §6.2. Verificar: `openspec validate --strict` e docs coerentes com o código.
- [x] 6.5 Verificação final do grupo: `npm run build` + E2E (login/logout/troca/QA
      esqueci-senha com e-mail inexistente) conferindo os registros `'Acesso'` na trilha e
      greps dos 5 tipos em `app/` + `server/`.

## 7. Loading no F5 em Gestão de Usuários e Perfis de Acesso (pedido do usuário)

- [x] 7.1 Padronizar o F5 de `app/pages/admin/gestao-usuarios.vue` e
      `app/pages/admin/perfis-acesso.vue` no padrão Meu Perfil/Configurações/Auditoria:
      `carregando = ref(true)` de nível de página (nasce `true` → o SSR já renderiza só o
      overlay), busca em `onMounted` com `finally` e conteúdo gated por `v-else` (hoje o
      `UiLoading` é irmão do conteúdo e o `useState` do composable nasce `false` — no F5 a
      página vazia pinta antes do overlay). Verificar: SSR HTML das duas rotas (com sessão)
      contém a mensagem de loading e NÃO os KPIs/tabela; após a hidratação o conteúdo
      aparece e o overlay some; falha do GET mantém o toast existente.
- [x] 7.2 `npm run build` + conferência nas duas rotas (F5 mostra `UiLoading` "Carregando
      perfis…"/"Carregando usuários…" e depois a página completa, sem flash de estado vazio).
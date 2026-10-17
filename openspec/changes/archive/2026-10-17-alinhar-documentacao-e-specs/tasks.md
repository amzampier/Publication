# Tasks

> Verificação por `npm run build` e, com a ferramentaria nova, `npm run lint`/`test` verdes (o `typecheck` roda e reporta a dívida de tipos — change `corrigir-erros-de-tipo`);
> além de grep dos itens DOC e `openspec validate --specs`.

## 1. Specs

- [x] 1.1 Aplicar o delta de `gestao-usuarios` (filtros no servidor; título da requirement da tela renomeado; estado vazio vigente). Verificar que não resta a cláusula "em memória" nem o título "permanecem locais" e que `openspec validate --specs` passa.
- [x] 1.2 Aplicar o delta de `autorizacao-rbac` (cataloga `GET /api/usuarios/emails`). Verificar por `openspec show autorizacao-rbac --type spec`.

## 2. Documentação (DOC-01…17 / M-22)

- [x] 2.1 `docs/05 - Gestão de Auditoria.md`: RBAC `requirePermission` implementado; contrato real de `GET /api/auditoria` (`{ registros, total, kpis, opcoes, pagina, porPagina }` + params); paginação server-side; expurgo por EVENT. (DOC-01/02/06, M-22)
- [x] 2.2 `docs/07 - Perfis de Acesso (RBAC).md`: dropdown de perfis dinâmico; situação do perfil controla acesso/atribuição; matriz 99/45/21/**6**; tipos `*Modelo`. (DOC-03/04/14/15)
- [x] 2.3 `docs/03 - Header e Sidebar.md`: middleware de auth e RBAC presentes; "10 tintas D9". (DOC-05/16)
- [x] 2.4 `docs/02 - Guia de Arquitetura e Migrations.md`: `_migrations (nome, aplicado_em)`; `ipDoCliente` só com `TRUSTED_PROXIES`; resíduo "(demo)". (DOC-11/12/17)
- [x] 2.5 `docs/01 - design_system.md` (sumário 5.1–5.20, `@lucide/vue`, default do `Kpi`), `docs/04` ("mockups"→backend), `docs/09` (tipos `*Modelo`), `docs/bd/01` (migration 11) e `docs/qa/00` (`@lucide/vue`). (DOC-02/13/15/17 + M-22)
- [x] 2.6 Criar `docs/06 - Gestão de Usuários e Convite.md` (rota, componentes, CRUD/importação/convite/bloqueio, backend) e confirmar que as referências de `docs/01`/`docs/07` resolvem. (DOC-08)
- [x] 2.7 Grep final: sem `lucide-vue-next`, `#2161ef`, `usePerfisDemo`/`useAuditoriaDemo`, "8 tintas", "filtros … em memória" nas docs de tela.

## 3. Ferramentaria de processo

- [x] 3.1 Adicionar devDependencies e scripts `lint`, `typecheck`, `test` ao `package.json`; criar `eslint.config.mjs` (flat, Vue+TS) e `vitest.config.ts`. Confirmar `npm install`; `lint` e `test` verdes; `typecheck` roda e reporta a dívida de tipos (a zerar na change `corrigir-erros-de-tipo`).
- [x] 3.2 Escrever a suíte mínima (Vitest) para funções puras exportadas: `detectarTipoImagem`/`sanitizarNomeArquivo`, `sanitizarRedirectAdmin` (e a validação de data da auditoria, se exportada). Confirmar `npm run test` verde.
- [x] 3.3 Documentar os comandos no `AGENTS.md` e registrar a dívida de tipos (baseline do `typecheck`) a ser zerada na change própria `corrigir-erros-de-tipo` (fora do escopo de documentação).

## 4. Integração e validação

- [x] 4.1 Rodar `npm run build` (gate) e confirmar sucesso; confirmar `lint` e `test` verdes (o `typecheck` roda e a dívida fica registrada).
- [x] 4.2 Atualizar `docs/RL04 - Relatório de Qualidade Completo.md` marcando M-22/DOC-01…17 como **CORRIGIDO** e registrando o encerramento da Etapa 5 do RL04.
- [x] 4.3 Confirmar que `openspec validate alinhar-documentacao-e-specs` passa e que `openspec validate --specs` segue **30/30**.
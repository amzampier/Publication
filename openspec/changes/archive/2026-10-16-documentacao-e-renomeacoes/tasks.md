# Tasks

## 1. Documentação de arquitetura e banco

- [x] 1.1 Atualizar `docs/02` (DOC-01…DOC-09): stack real (`@lucide/vue`, `jose`, `exceljs`/`jspdf`/`jspdf-autotable`; Zod/@vueuse/`jsonwebtoken` inexistentes marcados como roadmap/removidos), árvore de diretórios real, `_migrations` real (`nome`/`aplicado_em`), plugin com `ensureAdminUser`/fail-fast, hook `rootDir`/`output.serverDir`, snack `useApiFetch` (single-flight/SSR), cookies dev/prod, `requirePermission` como implementado, convenção sem `USE`, contagens (26 componentes) e §3.7 (endpoints auxiliares — MEL-02).
- [x] 1.2 Atualizar `docs/bd/01` (seção "COMPLEMENTO" com `sidebar_expandida`, `seguranca_eventos_login`, índices, `token_version`, EVENT do expurgo) e `docs/bd/02` (removido o `INSERT` do admin com hash placeholder — bootstrap é em TS).

## 2. Documentação das telas

- [x] 2.1 Atualizar `docs/01` (26 componentes / 20 seções; Área Pública como roadmap) (DOC-09).
- [x] 2.2 Atualizar `docs/04` (§12 — persistência/auth resolvidas + MEL-01), `docs/07` (§13 — rotas exigem sessão/permissão) e `docs/08` (§11 — auditoria/RBAC/rate limit resolvidos).

## 3. Especificação e riscos

- [x] 3.1 MEL-01: documentadas as colunas de `configuracoes_globais` sem UI como reservadas/roadmap em `docs/04`.
- [x] 3.2 MEL-02: nomeados os endpoints auxiliares em `docs/02` §3.7.
- [x] 3.3 MEL-03: registrado o lockout por conta como risco aceito em `docs/08` §11.

## 4. Renomeações (NOM-02)

- [x] 4.1 Renomeados `useUsuariosDemo.ts`→`useUsuariosModelo.ts`, `usePerfisDemo.ts`→`usePerfisModelo.ts`, `useAuditoriaDemo.ts`→`useAuditoriaModelo.ts` e os tipos `UsuarioDemo`→`UsuarioModelo`/`PerfilDemo`→`PerfilModelo` (38 arquivos ajustados; nenhum `*Demo` restou). Verificado com `npm run build`.

## 5. Verificação

- [x] 5.1 `npm run build` — sucesso ("Build complete!").
- [x] 5.2 Etapa 6 registrada no `docs/RL02`; cenário `gestao-usuarios` "Filtro e exportação não fazem requisição" renomeado para "Filtro e exportação consultam o servidor".

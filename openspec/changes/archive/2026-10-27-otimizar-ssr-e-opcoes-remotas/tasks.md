# Tasks

## 1. Bootstrap SSR

- [x] 1.1 Criar `GET /api/auth/contexto` (session-only) com `obterSessaoValida` retornando `{ usuario, shell, permissoes, avatar }`; verificar `401` sem sessão e shape completo com sessão em teste unitário/rota
- [x] 1.2 Criar `useBootstrap()` com single-flight por request e preencher os estados existentes (`auth-usuario`, `config-shell-cache`, `permissoes-usuario`, `usuario-avatar`); migrar `auth.global`, `admin.vue`, `usePermissions`, `carregarShell` e `useAvatarUsuario`; verificar uma única chamada de sessão por página administrativa
- [x] 1.3 Ajustar `limparEstadoSessao`/logout para resetar o bootstrap e cobrir refresh, senha provisória, 401 e logout; verificar com testes de sessão e E2E de login/provisional/RBAC
- [x] 1.4 Atualizar `docs/02` com o endpoint de contexto e o fluxo SSR de uma validação; verificar a documentação contra o código

## 2. Opções remotas

- [x] 2.1 Evoluir `GET /api/lancar-chamadas/opcoes` para `tipo`, `q` e `limite`, com busca por código/nome, `escaparLike`, limite padrão 20/máximo 50 e cache apenas da primeira página; manter a resposta completa sem `tipo`; verificar por testes de endpoint (busca, limite, permissão, shape antigo)
- [x] 2.2 Adicionar modo remoto opcional ao `UiSelect` e ao `UiMultiSelect` (`remote`, `loading`, `hasMore`, `selectedOption`/`selectedOptions`, `search`, `loadMore`) sem alterar o modo local; verificar com testes de componente e atualizar `docs/01` e `/design`
- [x] 2.3 Migrar `Filtros.vue`, `Formulario.vue` e `useLancarChamadasModelo` para carregar opções sob demanda e preservar labels/chips de itens já selecionados; verificar filtros, criação/edição e estados vazio/erro/loading em E2E

## 3. M-07 documental

- [x] 3.1 Adicionar no RL06 e em `docs/02` a nota de risco aceito do M-07 (conta do ambiente de desenvolvimento, provisionamento do operador, produção com conta própria e mínimo privilégio); verificar o texto e a ausência de mudanças de código/banco

## 4. Verificação final

- [x] 4.1 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; verificar que todos passam
- [x] 4.2 Rodar `openspec validate "otimizar-ssr-e-opcoes-remotas" --type change --strict` e `openspec validate --specs`; verificar a sincronização dos deltas de design system
- [x] 4.3 Revisar o diff final e confirmar que não houve mudança de schema/migrations nem vazamento de segredos; verificar os arquivos alterados

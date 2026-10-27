# Design

## Context

Ver `proposal.md - Why`. Hoje o SSR de `/admin` faz chamadas separadas para `/api/auth/seguro`, `/api/configuracoes/shell`, `/api/usuarios/eu/permissoes` e, quando o avatar é necessário, `/api/usuarios/eu`; cada uma valida a sessão no servidor. As opções de Lançar as Chamadas são carregadas inteiras e cacheadas por 30 s no servidor, mas o payload completo ainda vai ao cliente. O `UiSelect`/`UiMultiSelect` só filtram localmente.

## Goals / Non-Goals

**Goals:**

- Uma única validação de sessão por página administrativa, sem alterar o contrato de auth/provisional/RBAC.
- Opções de Chamadas carregadas sob demanda, com busca server-side, limite e seleção preservada.
- Manter o modo local dos componentes do kit como padrão.
- Registrar o M-07 como risco aceito no ambiente de desenvolvimento.

**Non-Goals:**

- Alterar schema, migrations ou dados.
- Criar novo módulo RBAC ou nova permissão.
- Substituir os componentes do kit por biblioteca externa.
- Mudar a semântica dos filtros (status, tipo, impacto, origem, software, parceiro, datas).

## Decisions

1. **Bootstrap único `GET /api/auth/contexto`.** Endpoint session-only sob `/api/auth/*`, portanto isento do middleware `auth-api` e com uma única validação via `obterSessaoValida`. Retorna `{ usuario, shell, permissoes, avatar }`. Alternativa descartada: manter `/api/auth/seguro` + três endpoints; continuaria com múltiplas validações.
2. **`useBootstrap` com single-flight por request.** No servidor, a promessa fica em `event.context.bootstrapPromise`; no cliente, em uma promessa de módulo. `useState` marca `bootstrap-carregado` e preenche os estados já existentes (`auth-usuario`, `auth-verificada`, `config-shell-cache`, `permissoes-usuario`, `permissoes-carregado`, `usuario-avatar`, `usuario-avatar-carregado`). Assim `auth.global`, `admin.vue` e o header não repetem chamadas. Alternativa descartada: `useAsyncData` no middleware, que tem contexto limitado.
3. **Sem tocar no fluxo de refresh/401.** O endpoint chama `obterSessaoValida`, que já renova o access pelo refresh e limpa cookies inválidos; o comportamento de senha provisória continua sendo decidido no `auth.global` pelo `usuario.provisoria`.
4. **Busca remota opcional no kit.** `UiSelect`/`UiMultiSelect` ganham props `remote`, `loading`, `hasMore` e uma opção selecionada fora da página (`selectedOption`/`selectedOptions`), além do evento `search` (debounce no consumidor) e `loadMore`. O modo local (sem `remote`) permanece idêntico. Alternativa descartada: componentes paralelos `UiRemoteSelect`/`UiRemoteMultiSelect`, que duplicariam o design system.
5. **Endpoint de opções por catálogo.** `GET /api/lancar-chamadas/opcoes?tipo=releases|projetos|manuais|softwares|parceiros&q=&limite=` retorna `{ itens, total }` com campos mínimos; sem `tipo`, mantém a resposta completa por compatibilidade. Busca por código/nome com `escaparLike` e limite padrão 20 (máximo 50); IDs já selecionados podem ser resolvidos no retorno. Alternativa descartada: só cachear a lista completa, que não reduz o payload.
6. **Cache só da primeira página.** A consulta sem `q` pode usar `cacheado` por catálogo (TTL curto); buscas com `q` não entram em cache ilimitado. Alternativa descartada: cachear cada termo digitado, que cresceria sem teto.
7. **M-07 documental.** Nenhum código de provisionamento. A nota registra que a conta é do ambiente de desenvolvimento, que o projeto não cria usuários/grants e que produção exige conta e privilégios definidos pelo operador.

## Risks / Trade-offs

- [Regressão no guard de sessão/provisional] → manter `auth.global` como fonte do redirect, cobrir login/provisional/401/logout em E2E e testes do endpoint.
- [Refresh rotativo no bootstrap] → reutilizar `obterSessaoValida`, não duplicar a lógica de refresh.
- [Estado de bootstrap residual após logout] → `limparEstadoSessao` também reseta `bootstrap-carregado` e a promessa do cliente.
- [Payload do bootstrap] → retornar apenas shell, matriz de permissões, avatar e `sessaoPublica`; nada de segredos/tokens.
- [Busca remota degradar acessibilidade] → manter os mesmos papéis/teclado; adicionar cenários de loading/vazio/erro e testes de componente.
- [Busca `LIKE` em catálogos grandes] → usar prefixo em códigos indexados, `escaparLike` e limite; medir e, se necessário, propor índice em change futura.
- [Compatibilidade do endpoint de opções] → manter a resposta antiga quando `tipo` não é informado até todos os consumidores migrarem.

## Migration Plan

1. Criar o endpoint/contexto e o `useBootstrap`; migrar auth/layout/permissões/avatar.
2. Evoluir o endpoint de opções e o modo remoto do kit; migrar filtros e formulário.
3. Atualizar docs/design system, `/design` e a nota M-07 no RL06.
4. Rodar testes, gates e E2E; deploy sem migration.
5. Rollback: reverter os arquivos da change; sem schema/dados alterados.

## Open Questions

Nenhuma. A escolha B1 (estender o kit) e o M-07 documental foram confirmados.

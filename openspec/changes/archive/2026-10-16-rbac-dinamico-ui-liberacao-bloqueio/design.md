# Design

## Context

Ver `proposal.md` para a motivação (`RL03-M-01`, `RL03-M-02`).

Estado atual relevante (leitura somente):

- `server/utils/usuarios.ts` (`listarUsuarios`) já devolve `opcoes.perfis` a partir de
  `SELECT DISTINCT nome_perfil FROM perfis_acesso` (linhas ~329-331) — ou seja, a **fonte de perfis
  já é dinâmica no servidor**; o problema está no cliente, que a ignora.
- `app/components/usuarios/useUsuariosModelo.ts:5,78` fixam `PerfilUsuario` como união dos 4 perfis
  e `PERFIS` como a lista fixa; `VARIANTE_POR_PERFIL` (linhas 82-87) só mapeia esses 4.
- `app/components/usuarios/Formulario.vue:318` (`opcoesPerfil = PERFIS.map(...)`) e
  `app/components/usuarios/Filtros.vue:25` (`opcoesPerfil = PERFIS.map(...)`) usam a lista fixa.
- `app/components/usuarios/lerPlanilhaUsuarios.ts:92` valida `PERFIS.includes(perfil)`.
- `server/utils/auth.ts:423-429` — `limparFalhasLogin` retorna `affectedRows !== 0`, e
  `server/utils/seguranca.ts:76-77` (`liberarBloqueio`) propaga esse `false` → a rota responde
  `404` (`server/api/seguranca/liberar/index.post.ts:18-20`).

## Goals / Non-Goals

**Goals:**
- Perfis customizados (Ativos) atribuíveis, filtráveis e importáveis na Gestão de Usuários, usando a
  lista de perfis do servidor.
- Liberação de bloqueio idempotente (sucesso para conta existente já limpa).

**Non-Goals:**
- Não alterar o cadastro de perfis em si (`perfis-acesso`) nem o RBAC.
- Não alterar a revalidação server-side da importação (o servidor já aceita perfis customizados).
- Não tratar os demais achados do RL03.

## Decisions

### D1 — Fonte única de perfis: `opcoes.perfis` do servidor
`useUsuarios` já expõe `opcoes.perfis` (populado por `GET /api/usuarios`). Formulário e filtros
passam a montar as opções de Perfil a partir de `opcoes.perfis` (com fallback vazio), em vez da
constante `PERFIS`. A lista já inclui perfis customizados, pois vem de `perfis_acesso`.

- **Por que não** manter `PERFIS` fixo + anexar customizados: duplicaria a fonte da verdade e poderia
  divergir. Usar a lista do servidor é a fonte canônica.
- **Trade-off:** a lista só está disponível após a carga de `GET /api/usuarios`; como a página de
  Gestão de Usuários carrega essa rota na montagem, as opções estarão prontas antes do uso (o
  modal/filtro só abrem após a tabela carregar).

### D2 — Tipo `PerfilUsuario` vira `string`; badge de perfil com fallback
`PerfilUsuario` deixa de ser união fechada e vira `string` (o valor real vem do servidor).
`VARIANTE_POR_PERFIL` deixa de ser um `Record` exaustivo e passa a um helper
`variantePerfil(perfil: string)` que devolve a variante mapeada para os 4 perfis conhecidos e
`'neutral'` para qualquer outro — preservando o visual atual e suportando perfis novos.

- **Alternativa considerada:** manter o union e usar `as PerfilUsuario` com cast — frágil e
  silenciosamente errado para perfis desconhecidos; preferimos o helper explícito.

### D3 — `lerPlanilhaUsuarios` recebe os perfis válidos por parâmetro
A função ganha um parâmetro `perfisValidos: Iterable<string>` (montado a partir de `opcoes.perfis`)
e valida `perfisValidos.has(perfil)` em vez de `PERFIS.includes(...)`. O chamador (`Importar.vue`)
já busca a base completa de e-mails; passa também a buscar os perfis (mesma fonte `useUsuarios`).

### D4 — Liberação idempotente via checagem de existência
`limparFalhasLogin(usuarioId)` passa a devolver `true` quando a conta **existe** (mesmo que o
`UPDATE` não altere linhas), e `false` somente quando não há conta. Implementação: após o `UPDATE`,
se `affectedRows === 0`, faz `SELECT id FROM usuarios WHERE id = ? LIMIT 1` para confirmar
existência. O contrato (booleano) e a rota (`liberar`) ficam inalterados; `404` passa a ocorrer só
para conta inexistente.

- **Alternativa considerada:** checar existência **antes** do UPDATE — um round-trip extra sempre;
  a abordagem escolhida só consulta no caso raro (conta já limpa).

### D5 — Sem migration
Usa `perfis_acesso` e `usuarios` existentes. Nenhuma DDL.

## Risks / Trade-offs

- **[Lista de perfis vazia antes da carga]** → fallback para lista vazia; o modal/filtro de
  usuários só é acionado após a tabela carregar, então na prática sempre há dados.
- **[Badge de perfil desconhecido]** → helper com fallback `neutral` evita quebra visual.
- **[Ampliar `PerfilUsuario` para `string`]** → toques de tipo em `useUsuariosModelo.ts`,
  `Formulario.vue`, `Filtros.vue`, `Tabela.vue` e `Importar.vue`; a verificação é o `npm run build`.
- **[Liberação: consulta extra]** → apenas no caso de conta já limpa (raro), custo desprezível.

## Migration Plan

- Deploy apenas de código (sem migration). Ordem: `useUsuariosModelo.ts` (tipo/helper) →
  `Filtros.vue`/`Formulario.vue` (opções dinâmicas) → `lerPlanilhaUsuarios.ts` + `Importar.vue`
  (perfis por parâmetro) → `auth.ts`/`seguranca.ts` (liberação idempotente).
- Rollback: reverter os commits; nenhum dado é migrado.
- Verificação: E2E conforme `tasks.md` + `npm run build`.

## Open Questions

(nenhuma)

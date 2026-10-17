# Design

## Context

Ver `proposal.md - Why` e os achados RL04-M-01, RL04-M-09, RL04-M-05, RL04-M-06, RL04-B-10 e
RL04-B-14 em `docs/RL04 - Relatório de Qualidade Completo.md`. Estado atual relevante:

- **Revogação:** `alterarSituacaoUsuario` (`server/utils/usuarios.ts:522-540`) incrementa
  `token_version` só no caminho `/situacao`; a edição geral (`atualizarUsuario`, `:469-490`) grava
  `situacao` sem revogar. `revogarAccessVigente` (`server/utils/auth.ts:356`) só incrementa a versão;
  nenhum caminho revoga as linhas de `sessoes` além do logout (`revogarSessao`).
- **Validação de sessão/refresh:** `sessaoAtivaNoServidor` (`auth.ts:326-337`) checa apenas
  `usuarios.situacao`/`token_version` — não considera `perfis_acesso.situacao`. `renovarSessao`
  (`auth.ts:229-255`) recarrega a conta e checa `usuario.situacao`, mas não o perfil.
- **Opções de perfil:** `listarUsuarios` devolve `opcoes.perfis` de
  `SELECT DISTINCT nome_perfil FROM perfis_acesso` sem filtro de situação (`usuarios.ts:329-331`).
- **Anti-lockout:** `garantirAdministracao` (`server/utils/perfis.ts:366-372`) roda apenas em
  `salvarMatriz`/`copiarMatriz`; `atualizarUsuario`, `alterarSituacaoUsuario` e `excluirUsuario` não
  checam. `Permissoes.vue:119-124,172-177` engole a mensagem do `409` com um texto genérico.

## Goals / Non-Goals

**Goals:**
- Qualquer caminho que desative um usuário revoga access **e** refresh; reativar não reaviva.
- Sessões de usuários com perfil não-Ativo deixam de autenticar (validação e renovação).
- Apenas perfis Ativos na UI/importação.
- Guarda anti-lockout cobre desativar/excluir o último administrador essencial, com mensagem real na UI.
- `POST /api/auth/refresh` não renova sessão revogada.

**Non-Goals:**
- Itens de Etapa 3+ do RL04 (ordenação server-side, cache de config, a11y, performance, exportação).
- Migration de schema ou armazenar `token_version` na tabela `sessoes`.
- Estender a guarda anti-lockout à inativação de **perfil** (avaliar em etapa futura).
- Revogar acesso em massa por outros gatilhos (ex.: troca de perfil) além dos previstos nas specs.

## Decisions

### D1 — Revogação de sessão centralizada no usuário
Introduzir em `server/utils/auth.ts` um helper `revogarSessoesDoUsuario(usuarioId, exec)` que (a)
incrementa `usuarios.token_version` e (b) marca `sessoes.revogado_em = NOW()` de todas as sessões
abertas do usuário. Ele aceita o executor (`query` ou `tx.query`) para poder rodar dentro de uma
transação. Passam a usá-lo: `alterarSituacaoUsuario` (Inativo), `atualizarUsuario` (transição para
Inativo) e a inativação de perfil (para cada usuário vinculado).

- **Alternativas consideradas:** (a) só `token_version` — deixa o refresh válido (o buraco do
  RL04-B-14); (b) guardar `token_version` em `sessoes` e comparar no refresh — exige migration e
  muda o schema. Revogar as linhas de `sessoes` fecha o refresh sem schema novo.
- **Exclusão:** já cai por FK `CASCADE` em `sessoes`; mantém-se.

### D2 — Validação considera a situação do perfil
`sessaoAtivaNoServidor` passa a fazer `JOIN perfis_acesso` e exigir `usuarios.situacao = 'Ativo'`
**e** `perfis_acesso.situacao = 'Ativo'`. `renovarSessao` passa a checar também
`usuario.perfil_situacao === 'Ativo'` (o `buscarUsuarioPorId` já devolve `perfil_situacao`). Isso
derruba as sessões ao inativar o perfil, tanto na requisição quanto na renovação.

- **Alternativas consideradas:** revogar em massa as sessões dos usuários ao inativar o perfil (D1
  em lote) — correto, porém deixa uma janela até o `UPDATE`; a checagem por requisição cobre
  imediatamente e é mais barata. Pode-se combinar: checar por requisição (obrigatório) **e** revogar
  em lote ao inativar (defesa em profundidade). Adota-se a checagem; a revogação em lote é opcional.

### D3 — Opções de Perfil apenas Ativas
`listarUsuarios` restringe `opcoes.perfis` a `situacao = 'Ativo'`. O frontend já consome
`opcoes.perfis` no formulário, nos filtros e na lista de perfis válidos da importação
(`lerPlanilhaUsuarios`), então a UI passa a oferecer apenas perfis Ativos e a planilha a marcar
como inválida a linha com perfil inativo — coerente com o `400` que o servidor já responde.

- **Alternativas consideradas:** filtrar no cliente — não cobre o filtro nem a importação e
  duplicaria a regra; o servidor é a fonte única.

### D4 — Guarda anti-lockout reutilizável e transacional
Extrair `garantirAdministracaoApos(tx)` (contagem na transação, como hoje) e aplicá-la em
`atualizarUsuario`, `alterarSituacaoUsuario` e `excluirUsuario`, executando a mutação e a contagem
na **mesma transação** (rollback + `409` quando zerar). A mensagem do `409` passa a ser exibida pelo
cliente lendo o `statusMessage` do erro (em `Permissoes.vue`, no `salvar` e no `confirmarCopia`).

- **Alternativas consideradas:** checar antes da mutação (estado prévio) — não reflete a mudança;
  contar pós-mutação dentro da transação é a única forma correta.
- **Impacto:** `atualizarUsuario` passa a operar em transação (hoje é um `UPDATE` avulso); mantém a
  atomicidade do campo + guarda.

### D5 — Desativação e revogação na mesma transação
Em `atualizarUsuario`, quando a situação transita para `Inativo`, chamar `revogarSessoesDoUsuario`
com o `tx.query` antes do commit, junto da guarda de lockout — uma única transação garante que a
situação, a revogação e a proteção sejam atômicas.

## Risks / Trade-offs

- **Bloquear a própria desativação/exclusão do último admin** → comportamento pretendido (evita
  lockout); a mensagem explica a causa. Testar que com 2 administradores a operação é permitida.
- **Revogação em lote ao inativar perfil** → adotada apenas a checagem por requisição (D2); se
  preferível revogar de imediato, chamar D1 para todos os usuários do perfil (custo O(n) com n
  pequeno).
- **Atualizar o `SELECT` de validação de sessão com `JOIN`** → +1 join por requisição autenticada;
  `perfis_acesso` é pequena (PK por id) e o índice já é usado — custo desprezível. Alternativa: ler
  a situação do perfil uma vez no middleware; não necessário agora.
- **Mensagem do `409` no cliente** → o `useApiFetch`/`$fetch` precisa expor `data.statusMessage`; já
  existe esse padrão no projeto (usado no login). Ajustar o `catch` para ler a mensagem.

## Migration Plan

1. `server/utils/auth.ts`: D1 (`revogarSessoesDoUsuario`) e D2 (validação com perfil).
2. `server/utils/perfis.ts`: extrair `garantirAdministracaoApos(tx)` reutilizável; revogar sessões
   dos usuários ao inativar perfil (se adotado em D2) e validar situações.
3. `server/utils/usuarios.ts`: D3 (`opcoes.perfis` só Ativos), D4 (transação + guarda em
   atualizar/situacao/excluir), D5 (revogação na transição para Inativo).
4. Frontend: `Permissoes.vue` (mensagem do `409`); conferir que formulário/filtros/importação
   derivam de `opcoes.perfis`.
5. Verificar por `npm run build` e E2E: desativar pelo modal → `401` e refresh `401`; reativar →
   token antigo segue `401`; inativar perfil → sessões caem; perfil Inativo não listado; desativar/excluir
   último admin → `409` com mensagem; refresh de sessão revogada → `401`.
6. **Rollback:** reverter os commits; sem migration e sem alteração de dados persistidos além das
   revogações em si (que expiram naturalmente).

## Open Questions

Nenhuma pendente que altere specs, abordagem ou tarefas.
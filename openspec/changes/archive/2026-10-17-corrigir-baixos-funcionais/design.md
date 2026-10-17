# Design

## Context

Ver `proposal.md - Why` e os achados RL04-M-21/B-09/B-15/B-17/B-18/B-19/B-20/B-21/B-22 em
`docs/RL04 - Relatório de Qualidade Completo.md`. Estado atual relevante:

- `usuarios/Cabecalho.vue`, `auditoria/Cabecalho.vue` e `perfis/Cabecalho.vue`: os `exportarCsv`
  não têm `try/catch` e os PDFs só fazem `console.error` (falha silenciosa).
- Toasts com "Verifique a conexão com o banco": `gestao-usuarios.vue:29`, `auditoria.vue:33`,
  `perfis-acesso.vue:31,115`, `configuracoes-globais.vue:88`, `perfis/Formulario.vue:140`,
  `perfis/Permissoes.vue:128,181`.
- `listarAuditoria` (`audit.ts`) não seleciona `entidade_id` nem o expõe; `DATA_ISO` valida só o
  formato (`^\d{4}-\d{2}-\d{2}$`), aceitando `2026-13-99` que chega ao banco.
- `esqueci-senha` grava "senha provisória enviada" fixo, mesmo em falha de envio.
- `convite` grava credenciais para usuário Inativo (login bloqueia).
- `useUsuarios`/`useAuditoriaModelo`: `if (carregando) return false` descarta recargas; o `busca`
  persiste no `useState` mas `DataTable.vue` reinicia o campo vazio.
- `criarUsuario` pré-checa e-mail, mas o `1062` concorrente não é mapeado (vira `500`).

## Goals / Non-Goals

**Goals:**
- Exportações com feedback de erro (e loading).
- Mensagens de erro sem detalhe de infraestrutura.
- `entidade_id` no detalhe da auditoria; data inválida → `400`.
- Trilha da recuperação correta (enviada × falha).
- Convite só para usuário Ativo.
- Busca refletida no campo; recarga concorrente aplicada.
- E-mail duplicado concorrente → `409`.

**Non-Goals:**
- Etapa 4 (performance/banco) e Etapa 5 (documentação) do RL04.
- Outras mensagens não listadas; redesenho de telas.

## Decisions

### D1 — Feedback de exportação
Envolver cada handler de exportação (`usuarios`, `auditoria`, `perfis`) em `try/catch` que emite
`toast.danger` em falha, com um ref de loading por ação que desabilita/exibe spinner enquanto gera.
Alternativa: só padronizar — insuficiente (o finding é o silêncio).

### D2 — Mensagens de erro genéricas
Trocar os textos com "conexão com o banco" por mensagens genéricas e acionáveis
(ex.: "Não foi possível carregar os usuários. Tente novamente."), preservando a mensagem do
servidor quando houver `statusMessage` útil.

### D3 — `entidade_id` na auditoria
Adicionar `entidade_id` ao `SELECT`, ao `AuditoriaRow`, ao `RegistroAuditoriaApi` (`entidadeId`),
ao tipo do front e ao `Detalhe.vue` (linha "Entidade" quando presente).

### D4 — Validação de data no filtro
Substituir a checagem só de formato por uma que valide a data real (mês 1–12 e dia válido para o
mês); data presente porém inválida → `createError(400)`. Alternativa: ignorar silenciosamente —
menos claro para o operador.

### D5 — Trilha da recuperação
Na tarefa pós-resposta do `esqueci-senha`, capturar o desfecho do `enviarEmail` (sucesso/falha) e
montar o `detalhes` da trilha conforme o resultado.

### D6 — Convite só para Ativo
Validar `situacao === 'Ativo'` no `POST /api/convite`; recusar (`400`) caso contrário (mesma regra
já aplicada em criação/edição de usuários).

### D7 — Busca e recarga
- Busca: adicionar prop `initialSearch` ao `DataTable` e inicializar `searchQuery` com ela; os
  composables passam o `busca` vigente — campo e filtro ficam coerentes.
- Recarga: substituir o `return false` por um flag `recargaPendente` que, ao concluir a carga em
  voo, dispara nova carga (last-write-wins, sem descartar a solicitação).

### D8 — `1062` → `409`
Envolver o `INSERT` de `criarUsuario` (e o de `importarUsuarios` por linha) em `try/catch` que
mapeia `errno 1062` para `409` com a mensagem de e-mail já cadastrado.

## Risks / Trade-offs

- **Loading de exportação** → evitar bloquear a UI; apenas desabilitar a ação durante a geração.
- **`initialSearch`** → não deve disparar busca no mount (evitar requisição dupla); apenas hidratar
  o campo (o composable já carrega com o `busca` vigente).
- **Recarga pendente** → limitar a uma recarga pendente (evitar tempestade de recargas).
- **`entidade_id`** → expor apenas o UUID (sem dados sensíveis); vazio quando não aplicável.

## Migration Plan

1. Backend: `audit.ts` (validação de data + `entidade_id`), `usuarios.ts` (`1062`→`409`);
   `convite` (não-Ativo → `400`); `esqueci-senha` (detalhe por desfecho).
2. Frontend: `Cabecalho.vue`×3 (toast/loading); páginas e `Formulario/Permissoes` (mensagens);
   `Detalhe.vue` + `useAuditoriaModelo` (entidadeId); `DataTable.vue` (`initialSearch`); composables
   (busca/recarga).
3. Verificar por `npm run build` e E2E: exportação com falha → toast; data inválida → `400`;
   `entidade_id` no detalhe; convite a Inativo → `400`; e-mail duplicado concorrente → `409`.
4. **Rollback:** reverter os commits; sem migration e sem alteração de dados.

## Open Questions

Nenhuma pendente que altere specs, abordagem ou tarefas.
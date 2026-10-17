# Design

## Context

Ver `proposal.md - Why` e os achados RL04-M-02/M-03/M-04/M-07/M-08 em
`docs/RL04 - Relatório de Qualidade Completo.md`. Estado atual relevante:

- **Ordenação:** a `UiDataTable` em modo servidor **já emite** `sort-change` (`SortRule[]` em
  `DataTable.vue:375`) mas as páginas (`usuarios/Tabela.vue`, `auditoria/Tabela.vue`) **não ouvem**
  o evento e as APIs (`listarUsuarios`, `listarAuditoria`) têm `ORDER BY` fixo
  (`usuarios.ts:308/313`, `audit.ts`).
- **Shell:** as preferências são carregadas por `carregarConfiguracoesGlobais()` →
  `GET /api/configuracoes`, que exige `configuracoes-globais/visualizar` (`configuracoes/index.get.ts:6`);
  perfis sem essa permissão caem nos defaults.
- **Cache:** `config-globais-cache` (`useConfiguracoesGlobais.ts:43`) não é atualizado após o `PUT`.
- **Recuperação:** `esqueci-senha` aguarda `enviarEmail` no caminho da resposta (só o caminho
  inexistente leva um bcrypt equivalente — `:40-42`), deixando diferença de latência.
- **Falha de carga:** os `catch` de `useUsuarios.ts:211-213` e `useAuditoriaModelo.ts:154-156`
  limpam só a lista, preservando KPIs/total/opções.

## Goals / Non-Goals

**Goals:**
- Ordenação das tabelas de Usuários e Auditoria aplicada pelo servidor (modo servidor).
- Preferências do shell disponíveis a qualquer perfil administrativo (apenas sessão).
- Cache/estado de configurações atualizado após salvar.
- Latência da recuperação de senha constante (envio fora do caminho da resposta), mantendo a troca
  de senha condicionada à entrega.
- Falha de carga zera KPIs/total/opções em Usuários e Auditoria.

**Non-Goals:**
- A cauda de UX/acessibilidade da Etapa 3 (nomes acessíveis, foco, contraste, exportações silenciosas
  etc.) — change próprio.
- Performance/banco (Etapa 4) e documentação (Etapa 5).
- Ordenação multi-coluna com `Shift` no servidor além do que o evento já emite (aplicam-se as regras
  válidas em ordem; não é objetivo destacá-la na UI).

## Decisions

### D1 — Ordenação no servidor por whitelist
As APIs de listagem passam a aceitar `ordenar` (id da coluna) e `direcao` (`asc`|`desc`). O servidor
mapeia o id para a coluna real por uma **whitelist** por módulo (Usuários: `nome→u.nome_completo`,
`email→u.email_corporativo`, `perfil→p.nome_perfil`, `status→u.situacao`, `ultimoAcesso→u.ultimo_login`;
Auditoria: `dataHora→a.data_hora`, `usuario→…`, `acao→…`, `recurso→…`, `detalhes→…`, `ip→…`); id fora
da whitelist é ignorado e vale o `ORDER BY` padrão. O cliente (composables) guarda o estado de
ordenação e a `Tabela.vue` escuta `@sort-change` → reseta para a 1ª página e recarrega com os params.

- **Alternativas consideradas:** ordenar no cliente — inviável com paginação server-side (só a página
  atual); desabilitar a ordenação — contraria a spec da tabela. Whitelist + `ORDER BY` montado a
  partir de constantes evita injeção (nenhum input do usuário entra cru no SQL).
- **Multi-regra:** aplica-se cada regra válida em sequência no `ORDER BY` (o componente já suporta
  `Shift`); regras inválidas são ignoradas.

### D2 — Porta somente-sessão para as preferências do shell
Novo `GET /api/configuracoes/shell` (apenas sessão, sem `requirePermission`) devolve **apenas** o que
o shell precisa: `logo_header_url`, `logo_login_url`, `sidebar_grupos`, `sidebar_expandida`. O layout
`admin.vue` passa a hidratar por ele (`carregarShell()`); a página de Configurações mantém o
`GET /api/configuracoes` completo (gated) para montar o formulário.

- **Alternativas consideradas:** afrouxar a permissão do `GET /api/configuracoes` — exporia rate limit
  e retenção a perfis sem o módulo; endpoint enxuto é mais seguro e explícito.

### D3 — Atualizar o cache/estado após salvar
Após o `PUT /api/configuracoes` confirmar, a página alimenta o cache compartilhado com a **resposta**
do servidor e reaplica o estado do shell (logomarcas/sidebar/sessões), de modo que reentrar na tela
e navegar (sem F5) mostrem os valores salvos. O cache é separado: `config-globais-cache` (completo,
da página) e `config-shell-cache` (preferências do shell).

- **Alternativas consideradas:** apenas invalidar o cache (forçar refetch) — uma chamada extra e
  possível corrida; escrever a resposta no cache é imediato e consistente.

### D4 — Recuperação de senha fora do caminho da resposta
`POST /api/auth/esqueci-senha` passa a: resolver a conta, registrar a trilha e **emitir a resposta
genérica imediatamente**; a geração da senha provisória, o `enviarEmail` e o `UPDATE` do hash rodam
**após** a resposta via `event.waitUntil` (Nitro) — mantendo a ordem "entrega antes da troca" e a
resposta idêntica para existente/inexistente.

- **Alternativas consideradas:** jitter/delay constante — frágil e dependente de estimativa do
  provedor; manter no caminho — preserva o oráculo de tempo. O `waitUntil` mantém a tarefa viva sem
  atrasar a resposta.
- **Fallback:** onde `event.waitUntil` não existir, disparar a tarefa sem await (o processo é um
  node-server de longa duração). Em ambos, falha do envio mantém a senha anterior.

### D5 — Zerar o resumo na falha de carga
Nos `catch` de `carregarUsuarios` e `carregarAuditoria`, além da lista, zerar `total`, `kpis` e
`opcoes` (estado vazio), evitando exibir contadores/opções da carga anterior.

## Risks / Trade-offs

- **Ordenação por whitelist** → coluna não mapeada cai no padrão; nenhum SQL montado a partir de
  input do usuário (só constantes). Validar com `EXPLAIN` que os índices atendem `nome`/`data_hora`.
- **Envio fora do caminho da resposta** → se o processo cair logo após responder, o e-mail/troca pode
  não concluir; o usuário pode solicitar de novo (a senha anterior continua válida até a entrega).
- **Porta `/shell`** → deve devolver só preferências de shell (nada de rate limit/retenção); cobre
  perfis administrativos autenticados.
- **Cache pós-salvar** → garantir que a escrita no cache aconteça só após o `PUT` confirmar (falha
  preserva o cache atual e as alterações na tela).

## Migration Plan

1. Backend: `listarUsuarios`/`listarAuditoria` (whitelist + `ORDER BY` dinâmico) e rotas (params);
   `server/api/configuracoes/shell/index.get.ts`; `esqueci-senha` (resposta imediata + `waitUntil`).
2. Frontend: `useUsuarios`/`useAuditoriaModelo` (estado de ordenação + reset no `catch`),
   `usuarios/Tabela.vue` e `auditoria/Tabela.vue` (`@sort-change`), `useConfiguracoesGlobais`
   (`carregarShell` + atualização de cache), `admin.vue` (loader do shell), `configuracoes-globais.vue`
   (atualizar cache pós-salvar).
3. Verificar por `npm run build` e E2E: ordenar por Nome/Usuário reordena via API (com paginação);
   Editor vê as preferências do shell; reentrar na tela sem F5 mostra os valores salvos; recuperação
   com latência equivalente (existente × inexistente) e senha só troca após envio; falha de carga zera
   KPIs/total/opções.
4. **Rollback:** reverter os commits; sem migration e sem alteração de schema.

## Open Questions

Nenhuma pendente que altere specs, abordagem ou tarefas.
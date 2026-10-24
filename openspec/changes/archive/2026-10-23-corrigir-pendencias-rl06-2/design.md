# Design

## Context

Ver `proposal.md — Why` e as specs delta. Estado atual relevante após o RL06-1:

- `GET /api/lancar-chamadas` devolve todas as chamadas com HTML, mídias e tags; o board da Esteira reutiliza a mesma função interna. Não há `GET /api/lancar-chamadas/:id`.
- O formulário de chamada não preenche a Data de liberação ao selecionar a Release e o servidor a zera no create; a validação não aplica segunda-feira.
- O board da Esteira filtra no cliente e exclui `Publicado` mesmo quando o filtro de status é explícito; o histórico de id inexistente devolve `[]`.
- O Painel ainda materializa `entregas_itens` em `itensFluxo` e o KPI de fluxo exclui `Publicado` do numerador (a spec manda incluir).
- `uploads/chamadas` é servido por rota autorizada, mas o upload ainda faz parse antes da permissão e não tem limite em `chunked`.
- `TRUSTED_PROXIES` é tratado como booleano (string não vazia), sem comparar IP/CIDR.
- A unicidade de Release/Manual/Escopo inclui arquivadas; as views `v_*_itens` estão inválidas desde a migration 28.
- `gestao-usuarios` não tem regra de hierarquia; a listagem projeta datas nulas.
- A auditoria grava códigos de negócio em `entidade_id` em vários pontos.
- As telas novas repetem estados de erro como “lista vazia”; botões sem loading; status com variantes divergentes; paginação/teclado/labels com lacunas.

## Goals / Non-Goals

**Goals:**

- Fechar M-01…M-30, A-06/A-07/A-08 e B-01…B-05 com comportamento verificável.
- Fazer a migração 31 reconciliar views, índices, carimbos e unicidade sem perda de dados.
- Manter o contrato do Painel/Estaira estável para quem tem todas as permissões, exceto a paginação explícita de Chamadas.
- Reduzir risco de regressão com testes por comportamento e E2E.

**Non-Goals:**

- Construir a Área Pública (apenas preparar o gate de visibilidade/data).
- Introduzir um novo módulo RBAC ou multi-tenant.
- Redesenhar telas; as mudanças de UX são correções pontuais.
- Corrigir itens de RL06-3 (bundle TipTap, transações longas, contraste geral etc.).

## Decisions

### D1 — Migração 31 única e idempotente

Uma migration `31_rl06_2_reconciliacao.sql` agrupa:

1. **Views:** `CREATE OR REPLACE VIEW` para `v_release_itens`, `v_projeto_itens`, `v_manual_itens` e `manuais`, sem `situacao` e com `arquivada` onde aplicável.
2. **Carimbo:** `UPDATE release_week SET data_aprovacao = NULL WHERE status <> 'Publicado'` (B-01).
3. **Índices:** `entregas_itens(data_lancamento)` e `entregas_itens(data_liberacao)` (M-10), com `IF NOT EXISTS`/checagem em `information_schema` para idempotência.
4. **Unicidade com arquivadas (B-04):** adicionar a cada tabela uma coluna gerada `chave_ativa VARCHAR(36) AS (IF(arquivada = 0, 'ativo', id)) STORED` e substituir o índice único antigo por `UNIQUE (ano, semana, chave_ativa)` (release), `UNIQUE (ano, mes_numero, chave_ativa)` (manual) e `UNIQUE (ano, versao, chave_ativa)` (escopo). Assim há no máximo um ativo por chave e vários arquivados (cada um usa o próprio `id`).
5. **Rollback documentado:** recriar os índices antigos e remover as colunas geradas; se houver múltiplos arquivados com a mesma chave, o rollback exige consolidar/remover duplicatas antes (documentado).

**Alternativa considerada:** manter a unicidade atual e apenas documentar. Rejeitada porque o objetivo do B-04 é permitir recriar um ciclo arquivado; a coluna gerada resolve no banco sem apagar o histórico.

### D2 — Paginação server-side em Chamadas, projeção enxuta na Esteira

- `GET /api/lancar-chamadas?pagina=&porPagina=` passa a devolver `{ itens, total, pagina, porPagina }` com `LIMIT/OFFSET`, `porPagina` clampado e projeção sem `descricao_html`/`solucao_html`/`imagens`/`tags` completas.
- `GET /api/lancar-chamadas/:id` devolve o registro completo (HTML, mídias, tags) para Detalhes/Editar.
- O board da Esteira continua usando uma função interna (`listarChamadasParaEsteira`) com projeção lean e todos os itens do ciclo ativo — paginar o board quebraria a semântica de colunas/progresso. O cache de opções (10 s) é mantido e invalidado nas escritas.
- **BREAKING:** consumidores externos do array completo precisam passar a ler `itens/total`; o frontend é atualizado no mesmo change.

**Alternativa considerada:** adicionar `?paginado=1` mantendo o array sem parâmetro. Rejeitada porque cria dois contratos e deixa a listagem pesada como padrão.

### D3 — Miniaturas com `sharp` e fallback

No upload de `chamadas`, após gravar o original, gerar `-320.webp` com `sharp` (qualidade ~75), mantendo o original. A galeria usa `srcset` com a variante e `loading="lazy"`/`decoding="async"`; se a geração falhar (binário indisponível), o upload não falha e a galeria usa o original. A rota de mídia serve as duas variantes sob o mesmo gate e adiciona cache público longo para publicadas e `private` para admin. Nenhuma coluna nova: a URL da variante é derivada por convenção.

**Alternativa considerada:** redimensionar no cliente/canvas. Rejeitada porque não reduz o download inicial e depende do navegador.

### D4 — Estado de erro compartilhado no kit

`UiDataTable` ganha props `error`/`errorMessage` e evento `retry`; o estado de erro tem precedência sobre o vazio e mostra “Tentar novamente”. Para telas sem tabela (Painel, Escopo, cards), criar `UiErrorState` (ícone, mensagem, retry) e usá-lo nos catches. O 403 recebe mensagem de permissão; rede/5xx, mensagem de conexão. O toast continua, mas não é a única evidência.

### D5 — Mapa canônico de status

Criar `shared/status-badge.ts` com mapas por domínio (Release, Manual, Escopo, Chamada) e uma função que devolve `label`/`variant`. Painel e módulos passam a usar o mesmo mapa; a `UiBadge` continua recebendo a variante. Testes comparam o mesmo status em contextos diferentes.

### D6 — Hierarquia de perfil por subconjunto de permissões

Ao criar/editar usuário, carregar a matriz do perfil-alvo e comparar com a do ator:

- ator com `perfis-acesso`/`permissoes` (ou `alterar`) pode atribuir qualquer perfil ativo;
- demais atores só podem atribuir perfil cuja matriz seja subconjunto da sua (módulo/ação);
- a validação ocorre no servidor antes do INSERT/UPDATE e responde `403`.

**Alternativa considerada:** proibir apenas o nome “Administrador”. Rejeitada porque perfis customizados podem ser equivalentes/superiores.

### D7 — `TRUSTED_PROXIES` com IP/CIDR

Criar um helper de IP (`ipConfiavel`) usando `ipaddr.js` (nova dependência pequena) para comparar o peer com a lista de IPs/CIDRs. `ipDoCliente` e o rate limit só usam `X-Forwarded-For` quando a conexão vem de um proxy da lista; caso contrário, usam o IP do socket. IPv4 e IPv6 são suportados.

**Alternativa considerada:** validar apenas o primeiro octeto/IPv4. Rejeitada por ser frágil e não cobrir IPv6.

### D8 — Auditoria com UUID canônico

As rotas de escrita passam a enviar `entidadeId` com o `id` do registro (criado/atualizado/excluído/arquivado), não o código. O código continua em `detalhes`. Importações em lote usam `entidadeId=''` e detalham o lote. Testes verificam usuários, release, manual, escopo, software e parceiro.

### D9 — Data de visibilidade sem `publicado_em`

Não será criada a coluna `publicado_em`: a data efetiva já existe em `release_week.data_publicacao`, `manuais_mensal.data_publicacao`, `projetos_escopo.data_publicacao` e `entregas_itens.data_liberacao`. O gate público passa a exigir `status='Publicado'`, pai ativo publicado e datas ≤ hoje (quando informadas). A decisão evita migration extra e usa o dado de negócio existente; `publicado_em` pode ser adicionado no futuro se houver necessidade de auditoria temporal exata.

### D10 — Menor privilégio de banco como operação, não migration

O código não pode conceder/revogar privilégios do próprio usuário. Entregar `scripts/db-least-privilege.sql` (criação do usuário `publications_app` com DML no schema e `EVENT`, sem `GRANT OPTION`) e atualizar `.env.example`/`docs/02`; a aplicação do script é uma etapa de infraestrutura, não um passo automático do boot.

### D11 — Agregações do Painel

Manter a consolidação do RL06-1 e adicionar: índices de data, `itensFluxo` com `GROUP BY`/`SUM(CASE)` no SQL (sem materializar todas as linhas), séries e dimensões agregadas no banco, e cache curto de `anosDisponiveis`. O contrato de resposta não muda.

### D12 — UX pontual

- `salvando` + `:loading`/`:disabled` nos formulários de Softwares, Parceiros, Escopo, Perfis, Permissões, Configurações e Meu Perfil.
- `UiDataTable`/`UiPagination` com `flex-wrap` e rolagem interna em 320–375 px.
- `AppHeader`: guardar o gatilho e devolvê-lo ao fechar; drawer com `role=dialog`/trap/`Escape`.
- Busca da tabela com `aria-label`/label oculto; `UiRichText` com `id`/`aria-labelledby`.
- Texto de apoio mínimo em `slate-500/600`; códigos em mono; “Limpar Filtros” só no rascunho.

## Risks / Trade-offs

- **`sharp` é dependência nativa** → fixar versão compatível com Node 22/24; testar `npm install`/build no Windows; fallback para o original se a geração falhar.
- **Paginação de Chamadas é breaking** → atualizar todos os consumidores no mesmo commit; o board usa função interna, não o endpoint paginado.
- **Coluna gerada + troca de índice** → testar em banco com registros ativos/arquivados; rollback documenta a consolidação de duplicatas.
- **Hierarquia de perfil pode bloquear fluxos legítimos** → permitir explicitamente quem tem `perfis-acesso`/`permissoes`; mensagens claras.
- **`ipaddr.js` adiciona dependência** → pequena e amplamente usada; testar IPv4/IPv6 e lista vazia.
- **Mudança de variantes de status pode alterar a aparência** → mapa único e revisão visual na vitrine/QA.
- **Miniaturas mudam URLs** → manter o original e derivar a variante; a URL original continua válida.

## Migration Plan

1. Implementar a migration 31 e o código que a consome (views, índices, unicidade, carimbo) no mesmo deploy.
2. Rodar em banco de desenvolvimento com backup/snapshot; validar `_migrations` (31), views consultáveis, índices e criação/recriação de ciclos.
3. Deploy do código (inclui `sharp` no build) e reinício do servidor; validar upload/thumbnail e portas públicas.
4. Rollback: reverter o código e aplicar o bloco de rollback da 31 (recriar índices antigos, remover colunas geradas); se houver múltiplos arquivados com a mesma chave, consolidar antes. O rollback não restaura miniaturas já geradas, mas o original permanece.
5. Operação: aplicar `scripts/db-least-privilege.sql` no ambiente e ajustar `DB_USER`; validar boot e migrations com o usuário restrito.

## Open Questions

Nenhuma pendência que altere specs, abordagem ou tarefas. A criação de `publicado_em` foi deliberadamente descartada em favor das datas de negócio existentes; se o produto exigir auditoria temporal exata, isso entra em change futura.
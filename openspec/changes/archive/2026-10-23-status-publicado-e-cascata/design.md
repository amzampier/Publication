# Design

## Context

Ver `proposal.md` para a motivação. O estado atual relevante:

- `entregas_itens.status` é `ENUM('Revisar','Aprovado','Recusado','Publicar')`
  (`server/migration/01_create_tables.sql`, ampliado pela `24`).
- A visibilidade pública é derivada em `shared/esteira-revisao.ts`: `Publicar` **e** ao menos um pai
  ativo `Publicado`.
- `publicarReleaseWeek`, `publicarManual` e `publicarEscopo` usam `query` do pool, sem transação e
  sem ator; os formulários dos três pais também permitem gravar `Publicado` diretamente.
- `sincronizarStatusPais` reabre o pai para `Em Revisão`/`Homologação` ao criar, importar ou alterar
  vínculos, dentro da transação da chamada.
- `historico_esteira_revisao` é gravado por `registrarTransicao` (uma linha por item, com cálculo de
  tempo no estágio).
- O board e o Painel Executivo calculam o fluxo por `status`; o Painel usa
  `SUM(e.status = 'Publicar')`.
- A Área Pública ainda é um placeholder (`app/pages/index.vue`).

## Goals / Non-Goals

**Goals:**

- Um estado explícito `Publicado` para a chamada visível no portal.
- Cascata determinística e transacional pai → filhas, com histórico por transição.
- Reversão simétrica quando o pai deixa de estar publicado.
- Board, progresso, KPIs e Painel coerentes com o novo estado.
- Backfill seguro das chamadas existentes.

**Non-Goals:**

- Implementar a Área Pública (UI, rotas e consultas públicas).
- Bloquear a publicação do pai enquanto houver filhas em `Revisar`/`Recusado`.
- Notificações, e-mails ou publicação em lote.
- Alterar a regra de “qualquer pai ativo publicado” para “todos os pais publicados”.
- Migrar imagens para `anexos_midias` (change separada).

## Decisions

### 1. `Publicar` deixa de significar “publicado”

`Publicar` passa a ser **aguardando a publicação do conteúdo pai**; `Publicado` é o estado final
visível. A mudança é deliberada e marcada como **BREAKING** no proposal. Alternativa descartada:
reutilizar `Publicar` e inferir “publicado” pelo pai — mantém a ambiguidade e impede consultas
públicas simples por status.

### 2. A cascata publica somente filhas em `Publicar`

Publicar um pai executa:

```sql
UPDATE entregas_itens
   SET status = 'Publicado'
 WHERE <fk_pai> = ?
   AND status = 'Publicar';
```

Filhas em `Revisar`, `Aprovado` ou `Recusado` não são tocadas: a cascata não substitui o trabalho da
Esteira. Alternativa descartada: publicar todas as filhas — burlaria homologação e recusas.

### 3. Reversão simétrica com regra de múltiplos pais

Quando o pai deixa de estar `Publicado` (edição, reabertura por vínculo ou importação), as filhas em
`Publicado` voltam para `Publicar` **somente se nenhum outro vínculo ativo estiver `Publicado`**:

```sql
UPDATE entregas_itens e
   SET e.status = 'Publicar'
 WHERE e.<fk_pai> = ?
   AND e.status = 'Publicado'
   AND NOT EXISTS (
     SELECT 1 FROM release_week r
      WHERE r.id = e.release_id AND r.status = 'Publicado' AND r.arquivada = 0
   )
   AND NOT EXISTS (
     SELECT 1 FROM manuais_mensal m
      WHERE m.id = e.manual_id AND m.status = 'Publicado' AND m.arquivada = 0
   )
   AND NOT EXISTS (
     SELECT 1 FROM projetos_escopo p
      WHERE p.id = e.projeto_id AND p.status = 'Publicado' AND p.arquivada = 0
   );
```

Voltar para `Publicar` (e não `Aprovado`) mantém a chamada “pronta” e permite que a nova publicação
do pai a promova novamente sem um clique extra. Alternativa descartada: voltar para `Aprovado` —
exigiria uma nova ação de Publicar Item após cada reabertura do pai.

### 4. Um único reconciliador, chamado de todos os pontos de escrita

Novo `server/utils/publicacao-pais.ts` expõe `reconciliarFilhasPublicacao(executor, tipo, id, ator)`.
Ele decide entre publicar (`Publicar` → `Publicado`) e reverter (`Publicado` → `Publicar`) conforme
o status atual do pai e grava o histórico. Pontos de chamada:

- `publicarReleaseWeek`, `publicarManual`, `publicarEscopo` — na mesma transação da publicação.
- `criar*`/`atualizar*`/`importar*` dos três pais — quando o status resultante for/ deixar de ser
  `Publicado`.
- `sincronizarStatusPais` em Lançar as Chamadas — quando a reabertura do pai tira o conteúdo de
  `Publicado`.

Centralizar evita divergência entre o botão Publicar e a edição direta do status. Alternativa
descartada: reconciliar só nas rotas de publicação — deixaria a edição/importação inconsistentes.

### 5. Transação, ator e auditoria

As funções de publicação dos pais passam a receber `AtorTransicao` (id, nome, perfil) e a usar
`getTransaction`. A rota obtém o ator da sessão (`getSessionUser`). O histórico das filhas usa esse
ator e parecer
`Publicado automaticamente com o conteúdo pai <código>` / `Devolvido a aguardando publicação porque o conteúdo pai <código> deixou de estar publicado`.

A auditoria é registrada **uma vez** na ação do pai, com a contagem de filhas afetadas no detalhe,
para não gerar centenas de eventos. Alternativa descartada: auditar cada filha — ruído operacional e
custo de escrita.

### 6. Histórico em massa, sem N+1

`registrarTransicao` roda uma subquery por item. Para uma cascata com muitas filhas, o reconciliador
faz `INSERT ... SELECT` antes do `UPDATE`, calculando o tempo no estágio com a mesma regra:

```sql
INSERT INTO historico_esteira_revisao
  (entrega_item_id, chamada, status_anterior, novo_status, responsavel_id,
   responsavel_nome, responsavel_perfil, parecer_tecnico,
   criterios_aceite_atendidos, tempo_no_estagio_minutos)
SELECT e.id, e.chamada, 'Publicar', 'Publicado', ?,
       ?, ?, ?,
       1,
       GREATEST(TIMESTAMPDIFF(MINUTE,
         COALESCE(
           (SELECT MAX(h.data_transicao)
              FROM historico_esteira_revisao h
             WHERE h.entrega_item_id = e.id AND h.novo_status = 'Publicar'),
           e.criado_em),
         NOW()), 0)
  FROM entregas_itens e
 WHERE e.<fk_pai> = ? AND e.status = 'Publicar';
```

O `INSERT` ocorre **antes** do `UPDATE` (o `status_anterior` ainda está disponível). A reversão segue
o mesmo padrão com `'Publicado'` → `'Publicar'`. Alternativa descartada: chamar
`registrarTransicao` em laço — N+1 e tempo de transação proporcional ao quadrado em cenários
grandes.

### 7. `Publicar Item` com atalho para o pai já publicado

`publicarChamada` grava `Publicado` quando algum vínculo ativo já está `Publicado`; caso contrário,
grava `Publicar`. Sem o atalho, uma chamada aprovada depois da publicação do pai ficaria presa em
`Publicar` até o próximo ciclo do pai (que não virá). Alternativa descartada: sempre gravar
`Publicar` e reconciliar em leitura — não persistiria o estado real.

### 8. `Suspender` a partir de `Publicar` e `Publicado`

Ambos voltam para `Aprovado`, preservando `data_liberacao`. Suspender a chamada não altera o pai.
Alternativa descartada: suspender só `Publicado` — impediria cancelar o agendamento antes da
publicação do pai.

### 9. Board e progresso preservam o recorte atual

- **Board:** a coluna Publicados mostra `Publicar` (Aguardando pai) por padrão; `Publicado` sai do
  board por padrão e reaparece quando um vínculo específico é filtrado. O status `Publicado` entra
  nas opções do filtro.
- **Progresso:** o percentual continua sobre o ciclo ativo
  (`(Aprovado + Publicar) / ciclo`), excluindo `Publicado`. O painel ganha uma contagem informativa
  **no portal** (`Publicado`) fora do percentual. Isso evita misturar “já concluído e no portal” com
  “ainda no fluxo” e preserva a leitura atual do board.
- **Painel Executivo:** o numerador do percentual passa a incluir `Publicar` e o ciclo exclui
  `Publicado`; a definição fica alinhada à Esteira.

Alternativa descartada: manter `Publicado` no board por padrão — polui a fila de trabalho e contraria
o comportamento já validado de “publicado sai do board”.

### 10. Backfill e índices

Migration 29:

1. Amplia o enum.
2. Insere histórico de migração para as filhas em `Publicar` com pai ativo `Publicado`.
3. Atualiza essas filhas para `Publicado`.
4. Cria índices compostos para a cascata: `(release_id, status)`, `(manual_id, status)` e
   `(projeto_id, status)`.

O backfill é idempotente (`status = 'Publicar'` no `UPDATE`; `NOT EXISTS` no histórico). O rollback
manual devolve `Publicado` para `Publicar` e remove os índices; o enum só volta depois de não haver
`Publicado`.

### 11. Estado compartilhado e UI

- `StatusChamada` e `STATUS_CHAMADA` ganham `Publicado`; `VARIANTE_STATUS_CHAMADA` mapeia
  `Publicado` para a variante existente `publicado` (badge esmeralda “Publicado”).
- `ProgressoVinculo` ganha `publicado` (contagem informativa) e `aguardando` (`Publicar`).
- `itemPublicadoNoPortal` passa a exigir `status === 'Publicado'` e vínculo ativo publicado.
- `motivoBloqueio*` e `podeTransicionar` reconhecem `Publicado`; `suspender` aceita `Publicar` e
  `Publicado`.
- O card de `Publicado` habilita “No Portal”; o de `Publicar` mantém “Aguardando pai”.

## Risks / Trade-offs

- **Cascata com muitas filhas** → histórico set-based, transação curta e índices compostos; medir com
  volume representativo antes de liberar.
- **Reabrir o pai despublica várias filhas** → comportamento intencional e já refletido na
  visibilidade atual; o histórico deixa rastro e o filtro de vínculo mostra o estado.
- **Pai arquivado com filhas `Publicado`** → as filhas mantêm o status, mas a visibilidade exige pai
  não arquivado; ao desarquivar, voltam a ser visíveis sem nova cascata.
- **Edição direta do status do pai** → coberta pelo reconciliador nos `atualizar*`; testes de API
  devem cobrir `PUT` com `status: 'Publicado'` e com saída de `Publicado`.
- **Concorrência** → `UPDATE` condicionado ao status lido; se a filha mudou, ela não é sobrescrita.
  A transição do pai usa a mesma transação e o mesmo ator.
- **Auditoria concentrada no pai** → decisão consciente; o histórico por filha continua completo.
- **Rollback do enum** → exige reverter `Publicado` antes de encolher o enum; documentado na
  migration.

## Migration Plan

1. Deploy da migration 29 e do código juntos (boot falha rápido se a migration não aplicar).
2. Backfill roda no boot, antes de a aplicação aceitar requisições.
3. Verificar: chamadas `Publicar` com pai publicado agora estão `Publicado`; histórico contém a
   transição de migração.
4. Rollback: reverter `Publicado` para `Publicar`, remover índices compostos e, por último, o valor do
   enum; o histórico de migração permanece.

## Open Questions

Nenhuma pendente. As decisões de cascata, reversão, múltiplos pais, board e progresso foram
confirmadas antes da proposta.

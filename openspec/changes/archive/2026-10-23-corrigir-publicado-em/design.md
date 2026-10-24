# Design

## Context

As specs de Release Week, Manuais, Escopo e Lançar as Chamadas já exigem que conteúdo `Publicado`
não seja público antes da data agendada. Na prática, cada leitura repete a comparação de
`data_publicacao`/`data_liberacao` e a rota de mídia precisa consultar as duas datas. Não existe um
campo único que diga **quando** o conteúdo se tornou público. Ver `proposal.md` para a motivação;
os contratos estão nos delta specs.

## Goals / Non-Goals

**Goals:**

- Criar um carimbo único e consultável de publicação efetiva (`publicado_em`).
- Manter o agendamento: data futura continua oculta até o dia configurado.
- Limpar o carimbo ao sair de `Publicado`, inclusive na cascata pai → filhas.
- Usar o mesmo gate em utilitários, SQL de visibilidade e servimento de mídia.
- Reconciliar a base existente sem perder dados.

**Non-Goals:**

- Implementar a Área Pública ou novas APIs públicas.
- Alterar a semântica de `data_publicacao`/`data_liberacao` como datas editoriais/agendadas.
- Resolver fuso horário ou agendamento por hora; a granularidade continua por dia.

## Decisions

### 1. `publicado_em` é o instante efetivo, não o instante do clique

`publicado_em` é calculado no momento da transição para `Publicado`:

```sql
CASE
  WHEN data_publicacao IS NOT NULL AND data_publicacao > CURDATE()
    THEN TIMESTAMP(data_publicacao)
  ELSE CURRENT_TIMESTAMP(6)
END
```

Assim, publicar hoje um conteúdo agendado para o futuro grava um carimbo futuro e o gate
`publicado_em <= NOW()` continua oculto até a data. Publicar conteúdo com data passada/ausente grava
o instante real da operação. Para chamadas, a data de referência é `data_liberacao`. Alternativa
descartada: usar sempre `CURRENT_TIMESTAMP(6)`, que exporia conteúdo agendado no mesmo dia do clique.

### 2. Migration 33 aditiva e backfill determinístico

Nova `33_rl06_3_publicado_em.sql` adiciona `publicado_em DATETIME(6) NULL` em:

- `release_week`
- `manuais_mensal`
- `projetos_escopo`
- `entregas_itens`

Backfill apenas para `status = 'Publicado'`:

- parents: `TIMESTAMP(COALESCE(data_publicacao, DATE(criado_em)))`;
- chamadas: `TIMESTAMP(COALESCE(data_liberacao, DATE(criado_em)))`.

Cria índices `(status, arquivada, publicado_em)` nas tabelas com `arquivada` e
`(status, publicado_em)` em `entregas_itens`. A migration é idempotente e o rollback remove colunas e
índices. Alternativa descartada: backfill com `NOW()` para tudo, que perderia o agendamento futuro.

### 3. Transições centralizadas

Criar um helper puro `publicadoEmPara(data: string | null): string | null` (ou SQL equivalente) e
usar em:

- criação/edição/publicação de Release, Manual e Escopo;
- `transicionarChamada` para `Publicado`/saída;
- `reconciliarFilhasPublicacao` na cascata de publicação e reversão.

Regras:
- entrar em `Publicado` → calcular/setar `publicado_em` quando nulo ou recalculável;
- sair de `Publicado` → `publicado_em = NULL`;
- reentrar → recalcular a partir da data vigente;
- edição de data com status `Publicado` → recalcular o carimbo.

### 4. Gate único na visibilidade

`ContextoVinculo` ganha `publicadoEm: string | null`. `contextoPublicado` exige status `Publicado`,
não arquivado e `publicadoEm <= agora`. `sqlVinculoPublicado` passa a incluir
`publicado_em IS NOT NULL AND publicado_em <= NOW()` em cada EXISTS. A chamada também ganha
`publicadoEm` no modelo e no gate; a rota de mídia substitui as comparações de `data_liberacao`/
`data_publicacao` por `e.publicado_em <= NOW()` e pelos `publicado_em` dos pais.

### 5. Compatibilidade e cache

`publicadoEm` é um campo aditivo nos modelos administrativos. Escritas que mudam `publicado_em`
invalidam `chamadas-opcoes` e quaisquer caches de opções/visibilidade. A leitura administrativa
continua mostrando conteúdo em revisão independentemente do carimbo.

### 6. Documentação

Atualizar `docs/12`–`15`, `docs/bd/01` e `AGENTS.md` para explicar o carimbo, o backfill e o gate.
Não alterar a promessa de data editorial; apenas registrar que a publicação efetiva é derivada dela.

## Risks / Trade-offs

- **Diferença de fuso entre banco e aplicação** → usar o fuso já configurado no pool (`DB_TIMEZONE`)
  e comparar tudo no banco; testes com data futura/passada.
- **Backfill de registros históricos sem hora** → usar a data agendada à meia-noite; o campo é
  histórico, não uma reconstrução exata do clique.
- **Conteúdo já publicado com data futura** → permanece oculto até a data, comportamento desejado;
  validar com os registros RW-52 e chamada 0000545878.
- **Cascata e edição concorrentes** → recalcular dentro da mesma transação e condicionar ao status.
- **Cache de opções** → invalidar nas escritas que alteram `publicado_em`.

## Migration Plan

1. Aplicar a migration 33 em banco de teste e conferir colunas, índices e backfill.
2. Validar que registros futuros continuam ocultos e registros passados ficam visíveis.
3. Validar transições de publicar/reabrir e a cascata pai → filhas.
4. Rollback: remover índices e colunas; nenhum dado editorial é alterado.

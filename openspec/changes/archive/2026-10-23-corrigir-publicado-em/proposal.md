# Proposal

## Why

Hoje `status = 'Publicado'` é um estado editorial e pode coexistir com `data_publicacao` futura. Sem um carimbo único de **publicação efetiva**, cada leitura pública precisa repetir a regra de data e corre o risco de expor conteúdo agendado antes do dia certo. O RL06 registrou esse resíduo como **B-05**: a coluna `publicado_em` não existe.

## What Changes

- Adicionar `publicado_em DATETIME(6)` em `release_week`, `manuais_mensal`, `projetos_escopo` e `entregas_itens`, com índice para leitura pública.
- Definir `publicado_em` como o instante em que o conteúdo se torna efetivamente público:
  - `data_publicacao`/`data_liberacao` futura → o próprio dia agendado;
  - data ausente ou já passada → o instante da transição para `Publicado`.
- Gravar `publicado_em` em toda entrada em `Publicado` e limpá-lo ao sair, incluindo criação, edição, endpoint de publicar e cascata pai → filhas.
- Reconciliar a base existente: registros já `Publicado` recebem `publicado_em` a partir da data agendada ou da data de criação.
- Passar a visibilidade pública (utilitário, consultas SQL e servimento de mídia) a exigir `publicado_em <= NOW()`, além de status `Publicado` e pai não arquivado.
- **BREAKING internamente:** `contextoPublicado`/`ContextoVinculo` passam a carregar `publicadoEm`; consultas e testes que só checavam status precisam incluir o carimbo.

## Capabilities

### New Capabilities

Nenhuma nova capability.

### Modified Capabilities

- `release-week`: a visibilidade pública passa a usar `publicado_em`, não apenas `data_publicacao`.
- `manuais-mensais`: a visibilidade pública passa a usar `publicado_em`, não apenas `data_publicacao`.
- `escopo-projetos`: a visibilidade pública passa a usar `publicado_em`, não apenas `data_publicacao`.
- `lancar-chamadas`: mídia e leitura pública usam `publicado_em` da chamada e dos pais; transições atualizam o carimbo.
- `uploads`: o servimento autorizado de mídia de chamada usa `publicado_em` como gate temporal.
- `migracoes-banco`: nova migration adiciona, indexa e reconcilia `publicado_em` nas quatro tabelas.

## Impact

- **Banco:** migration `33_rl06_3_publicado_em.sql`; backfill e índice; nenhuma tabela/coluna existente é removida.
- **Código:** `shared/esteira-revisao.ts`, `server/utils/visibilidade-publica.ts`, `server/utils/lancar-chamadas.ts`, `server/utils/release-week.ts`, `server/utils/manuais.ts`, `server/utils/escopo-projetos.ts`, `server/utils/publicacao-pais.ts`, `server/routes/uploads/chamadas/[...arquivo].get.ts`.
- **Contratos:** respostas administrativas podem ganhar `publicadoEm` de forma aditiva; nenhuma rota nova.
- **Testes:** transições, cascata, backfill, agendamento futuro, mídia e regressão de conteúdo já publicado.
- **Documentação:** specs acima, `docs/12`–`15`, `docs/bd/01` e `AGENTS.md`.
- **Fora de escopo:** os demais itens do roadmap (FULLTEXT, export streaming, `/api/usuarios/emails`, headers/CSRF, rate limit persistente, CDN e validação de produção).

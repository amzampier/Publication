# Proposal

## Why

O RL06 encerrou as etapas bloqueante (RL06-1) e de consistência (RL06-2), mas deixou a Etapa RL06-3: um conjunto de achados Baixos e duas melhorias estruturais que ainda afetam performance, acessibilidade, consistência visual, documentação e integridade da trilha de auditoria. Fechar esses itens agora evita que a dívida de polimento seja herdada pela Área Pública.

## What Changes

- **Performance**
  - Carregar o editor TipTap sob demanda, fora do bundle inicial da rota de Lançar as Chamadas (B-06).
  - Reduzir transações longas nas importações e trocar inserts individuais de mídias por operações em lote (B-07).
  - Cachear shell/configurações/opções com single-flight e paralelizar a carga de SSR (I-02).
- **Acessibilidade e UI**
  - Transformar ações de ícone em botões acionáveis por teclado (B-08).
  - Elevar o contraste de textos de apoio e remover `text-slate-400` de conteúdo (B-09).
  - Explicar por que “Recusar” está indisponível e validar o parecer no clique, em Chamadas e Esteira (B-11).
  - Corrigir a seção 27 da vitrine, seu índice e os caracteres corrompidos (B-13/B-21).
  - Usar o `UiActionMenu` canônico nos menus de relatórios/exportação (B-14).
  - Corrigir textos imprecisos de recuperação de senha, paginação e convite (B-15).
- **Tokens e documentação**
  - Usar tokens de marca em vez de hex arbitrário nas telas novas (B-18).
  - Trocar o SQL bruto da retenção por resumo em linguagem natural com detalhe acessível (B-16) e corrigir a semântica de “marcados” para “removidos”.
  - Atualizar `docs/01`, `docs/03`, `docs/05`, `docs/15`, `AGENTS.md`, `.env.example` e a vitrine (B-17/B-19/B-20/B-21/B-22/B-23).
- **Banco**
  - Tornar `auditoria` e `historico_esteira_revisao` imutáveis no banco para DML comum, preservando o expurgo controlado (I-01).
- **Regressão**
  - Verificar que B-10 (Limpar Filtros) e B-12 (mono/tabular) continuam corrigidos.

## Capabilities

### New Capabilities

Nenhuma nova capability.

### Modified Capabilities

- `design-system/form-control-states`: ação de ícone à direita do input vira botão com foco e acionamento por teclado.
- `design-system/action-menu`: menus de relatórios/exportação passam a usar o menu canônico e sua navegação por teclado.
- `design-system/upload`: a dica padrão de formatos reflete os formatos realmente aceitos.
- `design-system/data-table`: o rótulo da paginação é neutro e configurável pelo chamador.
- `design-system/layout-navigation`: a exceção de shell inclui `/admin/primeiro-acesso`.
- `vitrine`: a seção 27 entra no índice e o conteúdo deixa de ter caracteres corrompidos.
- `configuracoes-globais`: o painel de retenção descreve remoção (não marcação) e apresenta resumo natural com detalhe técnico acessível.
- `login`: a recuperação rotula o envio de senha provisória e a exceção de shell inclui o primeiro acesso.
- `lancar-chamadas`: o parecer da recusa é obrigatório, validado no clique e o botão explica por que está desabilitado.
- `esteira-revisao`: o parecer da recusa é obrigatório, validado no clique e o botão explica por que está desabilitado.
- `auditoria`: a trilha e o histórico da esteira são imutáveis no banco, exceto pelo expurgo controlado.

## Impact

- **Código:** `app/components/ui/RichText.client.vue`, `Input.vue`, `DataTable.vue`, `Pagination.vue`, `UploadFiles.vue`, `ActionMenu.vue`, `app/components/softwares|parceiros|lancar-chamadas|auditoria|esteira/Cabecalho.vue`, `app/components/lancar-chamadas/Recusar.vue`, `app/components/esteira/Decisao.vue`, `app/pages/design.vue`, `configuracoes/AbaRetencaoAuditoria.vue`, `server/utils/{lancar-chamadas,midias,manuais,release-week,escopo-projetos,db}.ts`, `server/migration/*.sql`, `app/composables/use*`.
- **APIs/contratos:** nenhuma rota nova; a imutabilidade no banco e o cache de SSR alteram o comportamento interno, não o contrato HTTP.
- **Dependências:** nenhuma nova; TipTap passa a ser importado dinamicamente.
- **Documentação:** `docs/01`, `docs/03`, `docs/05`, `docs/15`, `AGENTS.md`, `.env.example` e `app/pages/design.vue`.
- **Fora de escopo:** roadmap declarado no RL06 (FULLTEXT, export streaming, `/api/usuarios/emails`, headers/CSRF, rate limit persistente, CDN) e o resíduo `publicado_em` de B-05; permanecem como backlog separado.

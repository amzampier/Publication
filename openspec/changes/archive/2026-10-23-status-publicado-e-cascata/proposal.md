# Proposal

## Why

Hoje `entregas_itens.status` termina em `Publicar`, um estado que mistura “pronto para publicar” com
“publicado”: a visibilidade na Área Pública é derivada de `status = 'Publicar'` **e** de ao menos um
vínculo ativo apontar para conteúdo pai `Publicado`. Não existe um estado próprio de publicado, o
histórico da esteira não registra a publicação do pai e as chamadas filhas não acompanham o ciclo do
conteúdo pai. Com a Área Pública a caminho, é preciso um estado estável e consultável (`Publicado`) e
uma cascata explícita pai → filhas, sem publicar à força itens que ainda estão em revisão.

## What Changes

- Adicionar `Publicado` ao enum `entregas_itens.status`, depois de `Publicar`. **BREAKING**:
  `Publicar` passa a significar “aguardando a publicação do conteúdo pai”; “publicado no portal”
  passa a ser `Publicado`.
- Publicar um conteúdo pai (Release Week, Manual ou Escopo de Projetos) SHALL publicar em cascata as
  chamadas filhas que estiverem em `Publicar`, gravando histórico por transição.
- Reabrir ou despublicar o pai SHALL devolver para `Publicar` as filhas em `Publicado` que não
  tenham outro vínculo ativo publicado.
- `Publicar Item` SHALL ir direto para `Publicado` quando o pai já estiver publicado.
- `Suspender` SHALL aceitar `Publicar` e `Publicado`, voltando para `Aprovado`.
- A visibilidade pública SHALL exigir `status = 'Publicado'` **e** ao menos um vínculo ativo
  publicado (defesa em profundidade), mantendo a regra de “qualquer pai ativo publicado”.
- Backfill: chamadas em `Publicar` cujo pai já está `Publicado` passam a `Publicado`, com histórico
  de migração.
- Atualizar board, KPIs, progresso, filtros e Painel Executivo para o novo estágio.
- Atualizar docs, design system (cor do novo status) e testes.

## Capabilities

### New Capabilities

_Nenhuma. O comportamento novo pertence às capabilities existentes._

### Modified Capabilities

- `lancar-chamadas`: novo status `Publicado`; bloqueios de aprovação/recusa/exclusão; reconciliação
  das filhas quando o vínculo reabre o pai.
- `esteira-revisao`: máquina de estados, board, progresso, visibilidade pública, transições e API.
- `painel-executivo`: definição do percentual do fluxo e contagem de chamadas publicadas.
- `release-week`: publicação do pai publica as chamadas filhas em cascata.
- `manuais-mensais`: publicação do catálogo publica as chamadas filhas em cascata.
- `escopo-projetos`: publicação do escopo publica as chamadas filhas em cascata.

## Impact

- **Banco:** migration 29 altera o enum de `entregas_itens.status` e faz o backfill com histórico.
- **Shared:** `shared/lancar-chamadas.ts`, `shared/esteira-revisao.ts`, `shared/painel-executivo.ts`.
- **Server:** `server/utils/lancar-chamadas.ts`, novo `server/utils/publicacao-pais.ts`,
  `server/utils/{release-week,manuais,escopo-projetos,painel-executivo}.ts` e rotas de publicação dos
  três conteúdos pai.
- **App:** componentes de Esteira, Lançar as Chamadas, tabelas de pais e o design system.
- **Docs/specs:** `docs/15`, `docs/16`, `docs/17`, `docs/bd` e as seis capabilities acima.
- **Compatibilidade:** a semântica de `Publicar` muda; consumidores devem ler `Publicado` para
  visibilidade pública. A Área Pública ainda não existe, então não há contrato público a migrar.

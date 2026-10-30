# Proposal

## Why

O Painel de Destaques (`/`) apresenta a última release, os manuais em destaque e o histórico de
Releases Week, mas não dá visibilidade ao **Escopo de Projetos** — o visitante precisa abrir a
sidebar para descobrir o último projeto liberado e não tem como perceber, na entrada da Área
Pública, quais chamadas críticas acabaram de ser publicadas. Isso esconde um conteúdo de governança
relevante e reduz o valor da página de entrada.

## What Changes

- Adicionar ao Painel de Destaques a seção **“Escopo de Projeto”**, posicionada **antes do Histórico
  de Releases Week**.
- Exibir o **último escopo publicado** por `publicado_em` (desempate por ano e versão), com código,
  nome, versão, ano, data de publicação, total de chamadas, sistemas contemplados e CTA
  **“Ver escopo completo”** para `/escopos/{id}`.
- Adicionar, na mesma seção, o card **“Chamadas críticas”** com até três chamadas publicadas com
  `impacto = 'Crítico'` do escopo em destaque, exibindo código, título, sistema(s), parceiro e o
  badge `critico`.
- Estender `GET /api/publico/painel` com `escopoDestaque` e `chamadasCriticas`, mantendo o gate
  público (`status = 'Publicado'`, `arquivada = 0`, `publicado_em <= NOW(6)`) e o cache de curta
  duração. Não há novo endpoint nem migration.
- Estados vazios: sem escopo publicado, a seção inteira não é renderizada; com escopo e sem
  chamadas críticas, apenas o card do escopo aparece.
- Atualizar a vitrine `/design` (seção 29), `docs/19`, `docs/20`, `docs/21` e os testes do painel.
- Sem alteração no banco, nas permissões, no shell público ou na Área Administrativa.

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `painel-publico`: inclui a seção do último escopo liberado e o card de chamadas críticas, com
  ajustes na ordem das seções, no contrato de `GET /api/publico/painel`, no gate de visibilidade,
  nos estados vazios, na responsividade e na acessibilidade.

## Impact

- **Shared:** `shared/publico.ts` (tipos `PublicoEscopoPainel`/`PublicoChamadaCritica`, campos em
  `PublicoPainel` e helpers de seleção).
- **Server:** `server/utils/publico.ts` (consulta do último escopo por `publicado_em`, chamadas
  críticas e composição do painel); `server/api/publico/painel.get.ts` permanece com a mesma rota e
  cache.
- **App:** `app/pages/index.vue` (composição da nova seção) e novo
  `app/components/publico/PainelEscopoDestaque.vue`; `app/pages/design.vue` (demo da seção 29).
- **Docs:** `docs/19` (contrato da API), `docs/20` (layout/regras/contrato) e `docs/21` (ligação com
  o Escopo público).
- **Testes:** `tests/publico-painel.test.ts` para a seleção do último escopo e o filtro de críticas.
- **Dependências:** nenhuma nova; sem migration e sem alteração de schema.

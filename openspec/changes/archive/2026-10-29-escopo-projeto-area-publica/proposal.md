# Proposal

## Why

A Área Pública já lista o Escopo de Projetos na sidebar (projeto -> sistemas) e já tem a leitura
anônima de navegação, mas o clique em um sistema não leva a lugar nenhum: apenas altera o estado
local. O visitante não consegue verificar quais chamadas foram desenvolvidas para aquele sistema, e
o "Ver Tudo" do projeto também não tem destino. Esta é a primeira página pública de conteúdo e
fecha a lacuna entre a navegação publicada e a leitura das chamadas.

## What Changes

- Nova rota pública `/escopos/[id]` com a lista de chamadas do escopo;
  `/escopos/[id]?sistema=<nome>` filtra pelo sistema escolhido na sidebar e "Ver Tudo" abre sem
  filtro.
- Cabeçalho do escopo com versão, ano, sistema selecionado, título, texto contextual, totais
  (chamadas no projeto, sistemas contemplados, chamadas no sistema) e "Voltar aos Destaques".
- Cards das chamadas com código, tipo, softwares, parceiro, título, resumo em texto puro, tags,
  evidências (galeria) e links externos de manual/vídeo.
- Leitura anônima nova em `GET /api/publico/escopos/:id` e
  `GET /api/publico/escopos/:id/chamadas?sistema=&pagina=&porPagina=`, com gate público, paginação
  de seis itens e sem campos internos.
- Sidebar pública passa a navegar ao selecionar um sistema e a derivar o item ativo da URL; o item
  "Ver Tudo" navega para o escopo sem filtro.
- O hero da página reutiliza o degradê aprovado do Painel de Destaques; o púrpura permanece a
  identidade do Escopo nos chips, ícones e badges.
- Documentação: novo `docs/21 - Módulo Escopo Projeto Área Pública.md`; atualização de `docs/01`,
  `docs/18`, `docs/19`, `AGENTS.md` e da vitrine `/design` (seção 30).
- Nenhuma migration e nenhuma alteração no schema.

## Capabilities

### New Capabilities

- `escopo-publico`: página pública do escopo em `/escopos/[id]` (cabeçalho, lista de chamadas por
  sistema, evidências, links externos, estados, responsividade, acessibilidade) e o contrato da
  leitura anônima.

### Modified Capabilities

- `design-system/public-layout`: a seleção de um sistema de Escopo de Projetos passa a navegar e o
  item ativo passa a derivar da URL; "Ver Tudo" e "Voltar aos Destaques" navegam.
- `design-system/brand-tokens`: o degradê escuro aprovado passa a ser permitido também no hero da
  página pública de Escopo de Projetos, mantendo a identidade púrpura nos chips e ícones.

## Impact

- **App:** `app/pages/escopos/[id].vue`, `app/composables/usePublicoEscopo.ts`,
  `app/components/publico/EscopoCabecalho.vue`, `app/components/publico/EscopoChamadaCard.vue`,
  `app/components/publico/EscopoEvidencias.vue`; ajustes em `app/layouts/default.vue` e
  `app/components/layout/PublicSidebar.vue`.
- **Shared:** `shared/publico.ts` (DTOs, normalização e helpers puros).
- **Server:** `server/utils/publico.ts` e novas rotas
  `server/api/publico/escopos/[id].get.ts` e `server/api/publico/escopos/[id]/chamadas.get.ts`.
- **Banco:** nenhuma migration; usa `projetos_escopo`, `entregas_itens`,
  `entregas_itens_softwares`, `softwares` e `anexos_midias`.
- **Docs/vitrine:** novo doc 21; `docs/01` (§2.1 e §3.6), `docs/18` (§4.6 e §12), `docs/19`
  (endpoints/DTOs), `AGENTS.md` e `app/pages/design.vue` (seção 30).
- **Testes:** `tests/publico-escopo.test.ts` para helpers puros; verificação manual do gate,
  contagens, filtro, paginação, URL direta, estados, mobile e tema escuro.
- **Dependências:** nenhuma nova.

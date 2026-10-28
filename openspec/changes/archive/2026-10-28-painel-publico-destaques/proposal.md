# Proposal

## Why

A Área Pública já possui shell, navegação e leitura anônima dos resumos publicados, mas a rota `/` ainda é um placeholder: o visitante precisa abrir a sidebar para descobrir o conteúdo da semana. Falta um painel de entrada que destaque a release atual, os manuais da semana, as releases mais acessadas e o histórico filtrável, transformando a navegação em uma vitrine editorial utilizável.

## What Changes

- Implementar o **Painel de Destaques da Área Pública** em `/`, dentro do shell público existente, com quatro seções:
  - **Última Release Liberada da Semana** — release em destaque (`destaque_semana = 1`), com fallback para a última publicada, até três chamadas, contagem de fotos, parceiro, chamada, tipo e crédito do revisor.
  - **Manuais em Destaque dessa Semana** — até dois cards por item de manual com `destaque_semana = 1`, com “Ver vídeo”, “Manual online” e “Ler conteúdo”; fallback para o catálogo mensal quando o item não tiver links.
  - **Releases Mais Vistas** — top três por `total_visualizacoes`, excluindo o destaque; quando nenhuma release tiver views, a seção passa a **“Releases Recentes”** por data.
  - **Histórico de Releases Week** — releases publicadas com filtros de software e tipo, contagens por tipo e paginação de seis itens.
- Criar a leitura pública do painel:
  - `GET /api/publico/painel` — destaque, manuais, ranking/recentes e opções de filtro.
  - `GET /api/publico/releases?software=&tipo=&pagina=&porPagina=` — histórico filtrado e paginado.
- Estender o contrato público para expor somente dados de negócio necessários: descrição, parceiro, chamada, software, módulo, tipo, contagem de fotos, links de vídeo/manual e `revisor_nome`. Autor, feedback, IDs internos, auditoria e metadados internos continuam fora do DTO.
- Definir o destino dos CTAs para rotas dedicadas (`/releases/[id]`, `/manuais/[id]` e `/manuais/[id]/itens/[itemId]`). As páginas de detalhe **não** fazem parte deste change; o painel apenas estabelece os links e o contrato.
- Adicionar funções puras compartilhadas para seleção do destaque, fallback de views, agrupamento de manuais, contagens por tipo, filtros, pluralização e formatação de visualizações, com testes unitários.
- Atualizar a documentação visual (`docs/20 - Painel de Destaque Area Publica.md`), o design system (`docs/01`), a referência da API pública (`docs/19`) e a vitrine `/design` com o novo painel.
- Registrar duas exceções visuais no design system: o degradê sutil do hero público e as variantes semânticas de badge para **Correção**, **Melhoria** e **Nova Funcionalidade**.

**Não há breaking change** para a Área Administrativa nem para os endpoints públicos existentes.

## Capabilities

### New Capabilities

- `painel-publico`: painel de entrada da Área Pública, com as quatro seções, contrato de dados anônimo, gate de visibilidade, regras de seleção e contagem, estados, responsividade, acessibilidade e testes.

### Modified Capabilities

- `design-system/brand-tokens`: permitir o degradê sutil no hero do conteúdo público, delimitado à Área Pública, e registrar as cores semânticas dos badges de tipo como uso editorial público, sem alterar a paleta administrativa.

## Impact

- **Frontend:** `app/pages/index.vue`, novos componentes em `app/components/publico/`, composable de carregamento e a seção pública em `app/pages/design.vue`.
- **Compartilhado:** `shared/publico.ts` com novos DTOs e funções puras; `tests/publico-painel.test.ts`.
- **Servidor:** `server/utils/publico.ts`, `server/api/publico/painel.get.ts` e `server/api/publico/releases.get.ts`, sob o middleware anônimo já existente.
- **Banco:** leitura das tabelas atuais; nenhuma migration obrigatória. Índices adicionais podem ser avaliados na implementação se os planos de execução exigirem.
- **Fora de escopo:** contador de visualizações, páginas de detalhe, busca server-side, painel de resultados de busca, RBAC público e SEO avançado. O campo `total_visualizacoes` é exibido quando existir; o ranking tem fallback por data.
- **Documentação:** `docs/20 - Painel de Destaque Area Publica.md` (novo), `docs/01`, `docs/18`, `docs/19` e `AGENTS.md` quando a implementação ocorrer.

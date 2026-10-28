# Tasks

## 1. Contrato compartilhado, regras puras e referência visual

- [x] 1.1 Adicionar os DTOs do painel em `shared/publico.ts` (`PublicoPainel`, `PublicoReleaseDestaque`, `PublicoChamadaDestaque`, `PublicoManualItemDestaque`, `PublicoReleaseResumoPainel`, `PublicoContagensTipo`, `PublicoFiltrosPainel`, `PublicoHistorico`) sem alterar `PublicoNavegacao`; verificar com `npm run typecheck` e com a suíte existente de `publico-navegacao`.
- [x] 1.2 Implementar em `shared/publico.ts` as funções puras `selecionarReleaseDestaque`, `selecionarItensDestaque`, `selecionarManuaisDestaque`, `ranquearMaisVistas`, `contarTipos`, `filtrarHistorico`, `rotuloFotos`, `rotuloVisualizacoes` e `rotuloTipo`; verificar que não importam Nuxt/Vue e que a suíte de testes compila.
- [x] 1.3 Criar `tests/publico-painel.test.ts` cobrindo destaque com flag e fallback, limite/ordem das chamadas, manuais por item e fallback de catálogo, ranking com views/parcial/todas zero, exclusão do hero, contagens por tipo, filtros combinados, normalização de `pagina`/`porPagina` e formatação; verificar com `npm run test`.
- [x] 1.4 Criar `docs/20 - Painel de Destaque Area Publica.md` como referência visual e de contrato, com as quatro seções, regras de seleção, DTOs, estados, responsividade, acessibilidade e checklist; verificar que o documento aponta para `docs/18`, `docs/19` e para o change.

## 2. Leitura pública no servidor

- [x] 2.1 Estender `server/utils/publico.ts` com helpers de gate para pai e filho e com `listarPainelPublico()`, retornando hero, manuais, ranking/recentes e opções de filtro; verificar com consulta manual no MariaDB e com `GET /api/publico/painel` sem cookie.
- [x] 2.2 Implementar `listarHistoricoPublico({ software, tipo, pagina, porPagina })` com contagens agregadas por tipo, filtros por `EXISTS`, ordenação por `publicado_em` e paginação; verificar com `EXPLAIN` nas consultas e com uma chamada que retorne `itens`, `total`, `pagina` e `porPagina`.
- [x] 2.3 Criar `server/api/publico/painel.get.ts` e `server/api/publico/releases.get.ts` com normalização de parâmetros, `Cache-Control` público e erros genéricos; verificar que `GET` anônimo responde `200` e que `GET /api/release-week` sem cookie continua respondendo `401`.
- [x] 2.4 Ampliar `tests/visibilidade-publica.test.ts` para cobrir pai/filho em rascunho, arquivado, publicação futura e `origem = 'Ambos'`; verificar com `npm run test`.
- [x] 2.5 Atualizar `docs/19 - API Pública de Navegação.md` com os dois endpoints, DTOs, gate, cache, normalização de parâmetros e a lista explícita de campos públicos; verificar que os exemplos `curl` documentados funcionam sem cookie.

## 3. Página e componentes do painel

- [x] 3.1 Criar `app/composables/usePublicoPainel.ts` com duas leituras (`publico-painel` e `publico-historico`), estado de filtros e retry; verificar que o SSR entrega os dados e que o retry refaz a leitura correta.
- [x] 3.2 Criar `app/pages/index.vue` com H1 “Painel de Destaques & Busca”, as quatro seções na ordem, `useHead` e sincronização de `software`, `tipo` e `pagina` com a URL; verificar `/` no SSR e a mudança de query ao filtrar.
- [x] 3.3 Criar `app/components/publico/PainelUltimaRelease.vue` com hero, chips, até três cards de chamadas, CTA para `/releases/{id}`, crédito do revisor e estado vazio; verificar com dados reais e com banco sem release publicada.
- [x] 3.4 Criar `app/components/publico/PainelManuaisDestaque.vue` com cards por item, ações condicionais de vídeo/manual/conteúdo, fallback de catálogo e estado vazio; verificar os `href` e a ausência de ações sem link.
- [x] 3.5 Criar `app/components/publico/PainelMaisVistas.vue` e `app/components/publico/PainelReleaseCard.vue` com ranking por views, fallback “Releases Recentes”, exclusão do hero e ocultação de views zero; verificar os três cenários de dados.
- [x] 3.6 Criar `app/components/publico/PainelHistorico.vue` com filtros `UiSelect`, grid de cards, contagens por tipo, “Carregar mais”, restauração por URL e estados vazio/erro; verificar filtros combinados e paginação sem duplicar itens.
- [x] 3.7 Aplicar responsividade e acessibilidade nos componentes: `aria-labelledby` por seção, `h3` nos cards, nomes acessíveis nos CTAs, `aria-live` nos resultados, `rel` seguro em links externos, foco `brand-focus` e tema escuro; verificar teclado, contraste e viewports 390/768/1024/1440.

## 4. Design system, vitrine e documentação

- [x] 4.1 Adicionar as variantes `correcao`, `melhoria` e `nova` ao `UiBadge`, com rótulos e ícones `Wrench`, `Sparkles` e `PlusCircle`; verificar com `npm run test` (incluindo `status-badge`) e com o uso real nos cards.
- [x] 4.2 Adicionar a seção **29. Painel de Destaques da Área Pública** em `app/pages/design.vue`, com dados de demonstração do hero, manuais, ranking e histórico; verificar o índice da vitrine e a ausência de overflow horizontal em 375/768/1024/1440.
- [x] 4.3 Atualizar `docs/01 - design_system.md` §2.1 (exceção do degradê do hero), §3 (shell/conteúdo público) e §5.2 (variantes de badge de tipo); verificar que os valores documentados coincidem com os tokens e com a vitrine.
- [x] 4.4 Atualizar `docs/18 - Sidebar e Header Area Publica.md` §12.4 e `docs/19` para apontar ao painel e ao novo contrato, e ajustar o `AGENTS.md` para a faixa de seções da vitrine; verificar que não restam referências ao `/` como placeholder.
- [x] 4.5 Revisar `docs/20` com o checklist final, os viewports verificados e as decisões de fallback de views e privacidade; verificar que o documento reflete o comportamento implementado.

## 5. Integração, qualidade e fechamento

- [x] 5.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; corrigir qualquer falha antes de considerar o change concluído.
- [x] 5.2 Executar a matriz manual de publicação: rascunho, em revisão, aprovado sem publicação, arquivado, publicação futura e publicado; verificar que o painel e as contagens só exibem o público.
- [x] 5.3 Executar a matriz de dados: release com e sem `destaque_semana`, todas as views zero, views parciais, `origem = 'Ambos'`, manual sem item e release sem chamadas; verificar os estados e fallbacks.
- [x] 5.4 Verificar os dois temas e os viewports 1440/1024/768/390, teclado, foco visível, `aria-live`, contraste e links externos; registrar o resultado no checklist do `docs/20`.
- [x] 5.5 Confirmar que nenhuma migration foi adicionada; se índices novos forem necessários, validar o runner, a idempotência e o rollback documentado.
- [x] 5.6 Rodar `openspec validate --change painel-publico-destaques --strict` e `openspec status --change painel-publico-destaques`; verificar que todos os artefatos estão concluídos.

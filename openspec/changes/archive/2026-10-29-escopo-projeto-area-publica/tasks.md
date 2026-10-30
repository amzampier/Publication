# Tasks

## 1. Contrato compartilhado e regras puras

- [x] 1.1 Adicionar em `shared/publico.ts` os DTOs `PublicoEscopoDetalhe`, `PublicoChamadaEscopo` e `PublicoEscopoChamadas`, reutilizando `PublicoSistemaResumo` e `TipoItem`; verificar com `npm run typecheck`.
- [x] 1.2 Adicionar helpers puros de normalização de `sistema`, `pagina` e `porPagina`, contagem de chamadas por sistema, seleção de sistema válido e rótulos de evidências; verificar com `npm run typecheck`.
- [x] 1.3 Criar `tests/publico-escopo.test.ts` cobrindo normalização, contagem por sistema, singular/plural, sistema inválido e montagem do resumo; verificar com `npm run test`.

## 2. Leitura pública no servidor

- [x] 2.1 Implementar em `server/utils/publico.ts` o helper de sistemas por escopo reaproveitando a agregação existente de `entregas_itens_softwares` com fallback para o software principal; verificar que `listarEscopos` continua retornando os mesmos sistemas e contagens.
- [x] 2.2 Implementar `buscarEscopoPublico(id)` com o gate de `projetos_escopo` (`Publicado`, não arquivado, `publicado_em <= NOW(6)`) e `404` para escopo inexistente/não público; verificar com consulta direta e resposta `404`.
- [x] 2.3 Implementar `listarChamadasEscopoPublico({ id, sistema, pagina, porPagina })` com o gate de `entregas_itens`, filtro `EXISTS` por `entregas_itens_softwares` + fallback, ordenação `ordem_apresentacao`/`chamada` e paginação de seis; verificar que chamadas em rascunho, revisão, arquivadas ou com publicação futura não aparecem.
- [x] 2.4 Carregar softwares e evidências (`anexos_midias` de imagem) em lote para as chamadas da página, sem N+1; verificar que uma chamada com dois softwares retorna os dois e que as evidências vêm ordenadas por capa/ordem.
- [x] 2.5 Criar `server/api/publico/escopos/[id].get.ts` com `Cache-Control: public, max-age=60, stale-while-revalidate=300`, validação do id e `404` para escopo não público; verificar com `GET` sem cookie.
- [x] 2.6 Criar `server/api/publico/escopos/[id]/chamadas.get.ts` com `Cache-Control: public, max-age=30, stale-while-revalidate=120`, normalização de `pagina`/`porPagina`, sistema desconhecido com lista vazia e `404` para escopo não público; verificar com `GET` sem cookie e com `pagina=abc&porPagina=999`.

## 3. Composable e componentes da página

- [x] 3.1 Criar `app/composables/usePublicoEscopo.ts` com as duas leituras, reação a `sistema`/`pagina` da rota, estados de carregamento/erro, `recarregar` e troca de página/sistema atualizando a query; verificar com navegação direta e troca de página.
- [x] 3.2 Criar `app/components/publico/EscopoCabecalho.vue` com versão, ano, chip do sistema quando houver, título, texto contextual, contagens do projeto/sistemas/sistema e “Voltar aos Destaques”; verificar visualmente os estados com e sem sistema.
- [x] 3.3 Criar `app/components/publico/EscopoChamadaCard.vue` com código, badge de tipo, softwares, parceiro, título, resumo em texto puro, tags, data de liberação e links externos condicionais; verificar que seções vazias não são renderizadas.
- [x] 3.4 Criar `app/components/publico/EscopoEvidencias.vue` com miniaturas, `legenda_alt`, contagem e galeria em `UiModal` com setas, `Escape` e foco controlado; verificar abertura, navegação e fechamento por teclado.
- [x] 3.5 Criar `app/pages/escopos/[id].vue` compondo cabeçalho, lista, `UiPagination`, estados de carregamento/vazio/erro e `useHead`; verificar `/escopos/{id}` e `/escopos/{id}?sistema=...`.
- [x] 3.6 Ajustar estados de borda da página: escopo sem chamadas, sistema sem chamadas com “Ver todas as chamadas”, sistema desconhecido sem quebrar o cabeçalho e erro transitório com “Tentar novamente”; verificar cada estado no navegador.
- [x] 3.7 Revisar responsividade e acessibilidade da página (`h1`/`h2`/`h3`, contagens com nome acessível, tags em lista, botões de evidência, `aria-busy`, `aria-live`, foco visível, tema escuro e ausência de overflow entre 320px e 1440px); verificar em 390/768/1024/1440.

## 4. Navegação do shell

- [x] 4.1 Ajustar `app/layouts/default.vue` para navegar em `selecionarEscopo` (`/escopos/{id}` ou `/escopos/{id}?sistema=...`), derivar a seleção da rota e fazer `irHome`/“Voltar aos Destaques” retornarem para `/`; verificar clique, URL direta e voltar/avançar.
- [x] 4.2 Adicionar em `app/components/layout/PublicSidebar.vue` a prop opcional de seleção de escopo sincronizada com a URL, preservando o estado local no demo do `/design`; verificar deep link, recarregar e demo sem navegação.
- [x] 4.3 Corrigir o `title` com typo em `app/components/layout/PublicSidebarEscopos.vue` e conferir os rótulos “Ver Tudo”, sistema ativo e `aria-current`; verificar no navegador e na seção 29 da vitrine.

## 5. Documentação e vitrine

- [x] 5.1 Criar `docs/21 - Módulo Escopo Projeto Área Pública.md` com papel/rota, navegação, cabeçalho, card, gate/contagens, contrato da API, visual/tokens, responsividade, acessibilidade, estados, componentização, desempenho, testes, governança e checklist; verificar que os links relativos e os nomes de campos batem com a implementação.
- [x] 5.2 Atualizar `docs/01 - design_system.md` (§2.1 e §3.6) para registrar a página, o hero compartilhado e a identidade púrpura do Escopo; verificar que a exceção de degradê aponta para o doc 21.
- [x] 5.3 Atualizar `docs/18 - Sidebar e Header Area Publica.md` (§4.6 e §12) e `docs/19 - API Pública de Navegação.md` (novos endpoints, DTOs, normalização e privacidade); verificar que o “Ver Tudo” e o “Voltar aos Destaques” apontam para a página e que os campos proibidos continuam fora do contrato.
- [x] 5.4 Atualizar `AGENTS.md` (faixa da vitrine e referência ao doc 21) e `docs/14 - Módulo do Escopo de Projetos.md` com referência cruzada; verificar que os caminhos citados existem.
- [x] 5.5 Adicionar a seção 30 em `app/pages/design.vue` com dados de demonstração do cabeçalho e dos cards do Escopo, usando os componentes reais; verificar em `/design` nos temas claro e escuro.

## 6. Integração e gates

- [x] 6.1 Verificar manualmente o gate público: escopo publicado aparece; escopo em rascunho/revisão/arquivado/publicação futura responde `404`; chamada não publicada não entra na lista nem nas contagens.
- [x] 6.2 Verificar contagens e filtro: “chamadas no projeto”, “sistemas contemplados” e “chamadas neste sistema” batem com a sidebar; chamada com dois softwares aparece nos dois sistemas e a soma pode superar o total.
- [x] 6.3 Verificar a experiência completa: sidebar -> sistema -> página, “Ver Tudo”, paginação, “Voltar aos Destaques”, URL direta, recarregar, voltar/avançar, galeria, 404, vazio e erro.
- [x] 6.4 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e corrigir qualquer falha.
- [x] 6.5 Executar `openspec validate "escopo-projeto-area-publica" --type change --strict` e confirmar que o change permanece válido.

## 7. Ajuste: descrição, solução e impacto

- [x] 7.1 Adicionar `solucao` e `impacto` ao DTO `PublicoChamadaEscopo` e o helper `rotuloImpacto`; atualizar spec/design e verificar com `npm run typecheck`.
- [x] 7.2 Selecionar e mapear `solucao`/`impacto` na leitura pública; verificar o retorno da API.
- [x] 7.3 Exibir descrição, solução e impacto no card; verificar visualmente na página e no `/design`.
- [x] 7.4 Atualizar testes e docs (21 e 19) e verificar com `npm run test`.
- [x] 7.5 Executar `npm run lint`, `npm run typecheck`, `npm run build` e `openspec validate --strict`.

## 8. Ajuste: shell público fixo

- [x] 8.1 Fixar o shell público com `h-screen`, header fixo no topo e sidebar `h-full`; verificar que apenas o `main` rola.
- [x] 8.2 Ajustar a sidebar desktop para `lg:static lg:h-full` e manter o drawer mobile; verificar desktop e mobile.
- [x] 8.3 Resetar a rolagem do `main` na troca de rota; verificar “Voltar aos Destaques” e navegação.
- [x] 8.4 Atualizar `docs/01`, `docs/18`, `docs/20` e `docs/21` com o shell fixo e a rolagem interna; verificar os links.
- [x] 8.5 Executar `npm run lint`, `npm run typecheck`, `npm run build` e `openspec validate --strict`.

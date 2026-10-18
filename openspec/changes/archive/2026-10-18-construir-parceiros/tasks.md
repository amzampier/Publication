# Tasks

## 1. Banco de dados

- [x] 1.1 Criar `server/migration/15_parceiros_codigo_regiao_logo.sql` com `ALTER TABLE parceiros` adicionando `codigo VARCHAR(20) NOT NULL` (+ Ã­ndice Ãºnico `uq_parceiros_codigo`), `regiao VARCHAR(20) NOT NULL DEFAULT ''` (posicionada com `AFTER estado`) e `logo_url VARCHAR(500) NULL`, com bloco REVERTER comentado e sem `USE`/`DROP`; verificar subindo o app (boot) e conferindo a estrutura da tabela em `information_schema.columns`.
- [x] 1.2 Espelhar a alteraÃ§Ã£o em `docs/bd/01 - banco_dados_mariadb.sql` (tabela `parceiros` = fonte de leitura) e verificar que o DDL documentado corresponde Ã  migration aplicada.

## 2. Componentes de kit + Design System (gate visual)

- [x] 2.1 Criar `app/components/ui/EntityCard.vue` (`UiEntityCard`) com props `codigo?`, `badge?` (`{label, variant}`), `titulo`, `subtitulo?`, `linhas?` (`{rotulo, valor, icone?}[]`) e slot `acoes` no topo direito, visÃ­vel no hover/foco (padrÃ£o `group`/`opacity` de `app/components/perfil/Avatar.vue`); verificar renderizando no `/design` que o card exibe cÃ³digo/badge/tÃ­tulo/subtÃ­tulo/linhas e que as aÃ§Ãµes aparecem no hover e no foco de teclado.
- [x] 2.2 Criar `app/components/ui/Pagination.vue` (`UiPagination`) reutilizÃ¡vel (pÃ¡gina atual, total, tamanho, navegaÃ§Ã£o e `update:modelValue`), seguindo o padrÃ£o visual de paginaÃ§Ã£o do `UiDataTable`; verificar no `/design` a troca de pÃ¡gina e os estados desabilitado (primeira/Ãºltima).
- [x] 2.3 Adicionar `docs/01 - design_system.md` Â§5.21 (`UiEntityCard`) e Â§5.22 (`UiPagination`) + linhas no sumÃ¡rio, refletindo os componentes reais; verificar que os nomes/props documentados batem com o cÃ³digo.
- [x] 2.4 Adicionar as seÃ§Ãµes **21** e **22** em `app/pages/design.vue` (nav `secoes` + conteÃºdo), espelhando `UiEntityCard` e `UiPagination`; verificar em `http://localhost:3000/design` que as seÃ§Ãµes aparecem na nav e renderizam os componentes.

## 3. Backend

- [x] 3.1 Criar `server/utils/parceiros.ts` com domÃ­nios (`SITUACOES`, `REGIOES`), validadores (razÃ£o social e nome fantasia obrigatÃ³rios, situaÃ§Ã£o/regiÃ£o no domÃ­nio, coerÃªncia UFâ†’RegiÃ£o), geraÃ§Ã£o de cÃ³digo `PAR-XXX` (`MAX + retry`, nÃ£o-PK) e `listar/buscar/criar/atualizar/excluir` com `409` para FK de entregas; verificar com testes unitÃ¡rios (`tests/parceiros-validadores.test.ts`) cobrindo cÃ³digo e validaÃ§Ãµes.
- [x] 3.2 Criar `server/api/parceiros/index.get.ts`, `index.post.ts`, `[id]/index.put.ts` e `[id]/index.delete.ts` com `requirePermission(event,'parceiros',aÃ§Ã£o)` e `registrarAuditoria` (recurso "Parceiros"); verificar chamadas autenticadas (201/200/404/409/403) e a trilha de auditoria.
- [x] 3.3 Adicionar o destino `'logos'` a `UPLOAD_DESTINOS` em `server/utils/uploads.ts` e exigir `parceiros/alterar` para esse destino em `server/api/uploads/index.post.ts`; verificar upload aceito com a permissÃ£o e `403` sem ela.
- [x] 3.4 Criar `server/api/parceiros/importar/index.post.ts` com revalidaÃ§Ã£o, dedup por razÃ£o social (case-insensitive), recusa total em invÃ¡lida/conflito e gravaÃ§Ã£o em transaÃ§Ã£o com cÃ³digos sequenciais, sob `parceiros/importar`; verificar com testes (`tests/parceiros-import-parser.test.ts` quando aplicÃ¡vel) e chamadas Ã  rota.

## 4. Frontend

- [x] 4.1 Adicionar o mapa `REGIAO_POR_UF` em `app/config/brasil.ts` (UFâ†’regiÃ£o das 5 regiÃµes) e um helper de derivaÃ§Ã£o; verificar com teste unitÃ¡rio (ex.: SPâ†’Sudeste, AMâ†’Norte, todos os 27 UFs mapeados).
- [x] 4.2 Criar `app/components/parceiros/useParceirosModelo.ts` (tipo `ParceiroModelo`, base via `GET /api/parceiros`, filtros por situaÃ§Ã£o/regiÃ£o/estado, busca e paginaÃ§Ã£o client-side, KPIs por situaÃ§Ã£o, escritas via API, `enviarLogo`); verificar que a base inicia vazia em falha e que os KPIs/filtros seguem o conjunto vigente.
- [x] 4.3 Criar `app/components/parceiros/Card.vue` (`ParceirosCard`) compondo `UiEntityCard` (cÃ³digo, badge de situaÃ§Ã£o, razÃ£o social, nome fantasia, localizaÃ§Ã£o `cidade - UF`, regiÃ£o) e as aÃ§Ãµes Editar/Excluir no slot `acoes`; verificar o conteÃºdo do card e as aÃ§Ãµes visÃ­veis no hover/foco.
- [x] 4.4 Criar `app/components/parceiros/Grade.vue` (`ParceirosGrade`) com busca, botÃ£o de importaÃ§Ã£o Ã  esquerda de "Filtros", grade de `ParceirosCard` e `UiPagination`; verificar busca, paginaÃ§Ã£o e o contador de filtros ativos.
- [x] 4.5 Criar `Cabecalho.vue` (tile `Handshake` `#047857`, "Novo Parceiro" e menu RelatÃ³rios PDF/CSV), `Kpis.vue` (Ativos/Inativos/Bloqueados) e `Filtros.vue` (SituaÃ§Ã£o, RegiÃ£o, Estado; Limpar/Cancelar/Aplicar); verificar cada um isoladamente na tela.
- [x] 4.6 Criar `Formulario.vue` (RazÃ£o Social, Nome Fantasia, Cidade, Estado, RegiÃ£o derivada, SituaÃ§Ã£o, Logo; seÃ§Ã£o InformaÃ§Ãµes de Cadastro com cÃ³digo somente leitura e timestamps na ediÃ§Ã£o) e `Exclusao.vue` (id/identificaÃ§Ã£o + confirmaÃ§Ã£o); verificar que a RegiÃ£o Ã© preenchida ao escolher o Estado e que a Logo sÃ³ aparece no modal.
- [x] 4.7 Criar `Importar.vue` + `lerPlanilhaParceiros.ts` (colunas RazÃ£o Social, Nome Fantasia, Cidade, Estado, RegiÃ£o, SituaÃ§Ã£o; classificaÃ§Ã£o pronta/jÃ¡-cadastrada/repetida/invÃ¡lida) e `gerarPdfParceiros.ts` (PDF/CSV do conjunto filtrado); verificar com teste unitÃ¡rio do parser e a geraÃ§Ã£o das exportaÃ§Ãµes.
- [x] 4.8 Criar `app/pages/admin/parceiros.vue` (layout `admin`, coordenaÃ§Ã£o dos modais, `UiLoading` inicial, toast de erro) e adicionar `to: '/admin/parceiros'` ao item Parceiros em `app/config/navigation.ts`; verificar a navegaÃ§Ã£o pela sidebar, o estado ativo (`aria-current`) e o carregamento sem conteÃºdo parcial.

## 5. DocumentaÃ§Ã£o e modelo

- [x] 5.1 Criar `docs/11 - MÃ³dulo de Parceiros.md` no molde do `docs/10` (rota, componentizaÃ§Ã£o, contrato de dados, fluxos, verificaÃ§Ã£o), mantendo spec â†” doc â†” cÃ³digo alinhados; verificar que os caminhos citados existem e batem com o comportamento implementado.
- [x] 5.2 Criar `docs/modelos/modelo-importacao-parceiros.xlsx` com o cabeÃ§alho RazÃ£o Social, Nome Fantasia, Cidade, Estado, RegiÃ£o e SituaÃ§Ã£o; verificar abrindo o arquivo e conferindo o cabeÃ§alho.

## 6. VerificaÃ§Ã£o de integraÃ§Ã£o

- [x] 6.1 Rodar os gates `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e corrigir falhas; verificar que todos passam.
- [ ] 6.2 ConferÃªncia manual em `http://localhost:3000/admin/parceiros`: listar (cards), incluir, editar, excluir, filtrar, paginar, buscar, exportar PDF/CSV e importar pela planilha modelo; verificar tambÃ©m que `/design` (seÃ§Ãµes 21 e 22) reflete os componentes reais.

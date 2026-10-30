# Tasks

## 1. Contrato e leitura pública

- [x] 1.1 Em `shared/publico.ts`, adicionar `PublicoChamadaCritica` e os campos `escopoDestaque` (`PublicoEscopoResumo | null`) e `chamadasCriticas` em `PublicoPainel`; verificar `npm run typecheck`.
- [x] 1.2 Adicionar `selecionarEscopoDestaque` (ordem por `publicadoEm` desc, ano e versão) e `limitarChamadasCriticas` (até 3, por `ordem_apresentacao` e `chamada`) com testes em `tests/publico-painel.test.ts`; verificar `npm run test`.
- [x] 1.3 Em `server/utils/publico.ts`, consultar o último escopo com `gatePai('p')`, carregar sistemas via `listarSistemasPorEscopo` e até três chamadas com `impacto = 'Crítico'` + `gateChamada('e')`, com sistemas via `carregarSoftwaresPorItem`; compor `escopoDestaque`/`chamadasCriticas` em `listarPainelPublico`; verificar `GET /api/publico/painel` com escopo, sem escopo (`null`/`[]`) e sem vazar campos internos.
- [x] 1.4 Atualizar `PAINEL_VAZIO` em `app/composables/usePublicoPainel.ts` com os novos campos; verificar que o painel renderiza o estado vazio sem erro de tipo.
- [x] 1.5 Atualizar `docs/19` com `escopoDestaque`, `chamadasCriticas` e o gate aplicado; conferir o contrato documentado contra a resposta real.

## 2. Seção no painel e vitrine

- [x] 2.1 Criar `app/components/publico/PainelEscopoDestaque.vue` com o card do escopo (indigo-700, contagens, sistemas e CTA “Ver escopo completo” para `/escopos/{id}`) e o card “Chamadas críticas” (rose-700, `AlertTriangle`, `UiBadge variant="critico"`, até três links); verificar escopo com críticas, escopo sem críticas e ausência de escopo.
- [x] 2.2 Inserir a seção em `app/pages/index.vue` antes do Histórico de Releases Week, renderizando apenas quando `escopoDestaque` existir; verificar `/` em 390px/1440px, temas claro/escuro e ausência de overflow.
- [x] 2.3 Adicionar dados de demonstração da seção 29 em `app/pages/design.vue`; verificar `/design`.
- [x] 2.4 Atualizar `docs/20` (layout, estados, contrato e componente) e `docs/21` (ligação do painel com o Escopo público); conferir a coerência com a spec.

## 3. Verificação integrada

- [x] 3.1 Conferir no painel real o último escopo por `publicado_em`, as críticas restritas ao escopo, o CTA, a seção oculta sem escopo e a acessibilidade (`h2`/`h3`, nomes dos links, foco e badge com texto).
- [x] 3.2 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; corrigir qualquer falha.
- [x] 3.3 Executar `openspec validate "painel-publico-escopo-e-criticas" --type change --strict` e confirmar que o change permanece válido.

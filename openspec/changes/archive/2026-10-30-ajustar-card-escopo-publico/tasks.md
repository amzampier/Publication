# Tasks

## 1. Card e página

- [x] 1.1 No `EscopoChamadaCard.vue`, reorganizar o topo para `#chamada`, `Parceiro`, `Tipo`, `Impacto`, `Sistema` e exibir somente `Publicado em` no bloco da direita; verificar com e sem `publicacao`, com dois sistemas e no mobile.
- [x] 1.2 Envolver o título em um container com `bg-gradient-to-r from-brand-primary to-brand-structure`, `border-l-[2.5px] border-l-brand-accent` e texto branco; verificar contraste e título longo.
- [x] 1.3 Na página `app/pages/escopos/[id].vue`, calcular `publicacao` com `formatarData(publicadoEm)` e passar `:publicacao` ao card; verificar que o HTML renderizado contém a data e não contém “Período”.
- [x] 1.4 Manter o rodapé “Liberada em” da chamada e conferir que ele não se confunde com “Publicado em” do escopo; verificar no card renderizado.
- [x] 1.5 Envolver a descrição em um container com `border-brand-focus/40` e a solução em um container com `border-brand-structure/40`, ambos com fundo leve e `rounded-lg`; verificar nos temas claro e escuro.
- [x] 1.6 Adicionar `manualTitulo` ao DTO `PublicoChamadaEscopo` e à consulta da lista (`e.manual_titulo`) e exibir **“Manual: {título}”** no rodapé quando existir; verificar o campo na API e no card.
- [x] 1.7 Aplicar o tratamento de ação primária ao link “Documentação Externa” e manter “Ver vídeo” como outline; verificar os dois links e o demo.
- [x] 1.8 Alinhar as tags à direita com o rótulo **“Tags:”**; verificar com uma e com várias tags no mobile e no desktop.
- [x] 1.9 Adicionar a variante `critico` ao `UiBadge` (rose-700, `AlertTriangle`, classes de tema escuro, sem pulso) e conferir com o rótulo “Impacto: Crítico”.
- [x] 1.10 Adicionar `varianteImpacto` em `shared/publico.ts` (`Crítico` → `critico`, demais → `neutral`) e cobrir com `tests/publico-escopo.test.ts`; verificar com `npm run test`.
- [x] 1.11 No card, aplicar moldura rose com barra de 4px na borda esquerda (acompanhando os cantos superior e inferior), anel/sombra e badge `critico` quando o impacto for `Crítico`, mantendo os demais impactos neutros; verificar crítico/não crítico, `Correção + Crítico`, 390px/1440px e tema escuro.

## 2. Vitrine e documentação

- [x] 2.1 Atualizar `app/pages/design.vue` (seção 30) para passar `publicacao` ao card e refletir o novo topo/container; verificar `/design` nos temas claro e escuro.
- [x] 2.2 Atualizar `docs/21` (anatomia/regras do card, containers, título do manual, botão primário, tags à direita e checklist) e registrar que a data pública é `publicado_em` e que o período não é exibido; verificar a coerência com a spec.
- [x] 2.3 Atualizar `docs/01` §2.1/§3.6 e `AGENTS.md` para permitir o container do título como superfície com o degradê do cabeçalho de modal e a borda accent; verificar links e regra.
- [x] 2.4 Atualizar `docs/19` com `manualTitulo` no DTO/privacidade; verificar `GET /api/publico/escopos/:id/chamadas` sem campos internos e com o título do manual.
- [x] 2.5 Atualizar `docs/01` §5.2 e a vitrine de badges com a variante `critico`, e `docs/21` com a regra do card crítico; verificar `/design` e a coerência com a spec.

## 3. Integração e gates

- [x] 3.1 Verificar manualmente: publicação formatada, ausência de período, título no container com degradê/borda, múltiplos sistemas, card crítico/não crítico, 390px/1440px e tema escuro.
- [x] 3.2 Executar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build` e corrigir qualquer falha.
- [x] 3.3 Executar `openspec validate "ajustar-card-escopo-publico" --type change --strict` e confirmar que o change permanece válido.

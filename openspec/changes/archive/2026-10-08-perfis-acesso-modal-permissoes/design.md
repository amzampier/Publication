# Design

## Context

Ver `proposal.md` — Why. Estado atual relevante:

- `perfis/Tabela.vue` emite `@permissoes`; a página converte em
  `avisoPermissoesPendentes()` (toast) — requisito "A ação de permissões avisa por toast e
  não abre modal" vive na spec principal.
- `usePerfisDemo.ts` já tem `MODULOS` (11), `ACOES` (4), `EXTRAS` (5),
  `PERMISSOES_POR_PERFIL = 99`, `MATRIZ_SEED` (`Record<PerfilId, Record<ModuloId,
  Permissao[]>>`), `matriz()` (sempre copia) e `salvarPerfil` (clone puro). A coluna
  Permissões e o KPI derivam de `contarPermissoes(perfil)` — editar a matriz recalcula sozinho.
- Kit: existe `UiCheckbox` (lime-500 no checked), mas **não** existe `Switch`/`Toggle`
  (pendência `docs/07` §13). Números de seção livres: `docs/01` §5.19; vitrine seção 20.
- Modal: `UiModal` com tamanhos `xs…xl` (`lg` = 880px), corpo rola com `overflow-y-auto`;
  a matriz de 9 colunas de ação precisa de rolagem horizontal **interna** em telas estreitas.

## Goals / Non-Goals

**Goals:**
- `UiSwitch` de kit nascente (spec própria + docs + vitrine — regra do repo).
- Modal de permissões 100% em memória, com rascunho isolado (nada muda antes de Salvar).
- Atalhos linha/coluna previsíveis (sem indeterminate, sem "Tudo" global — decisão do
  usuário).

**Non-Goals:**
- Filtros/exportação (change 2 do bloco B) · backend/`server/` · cor por perfil
  (`cor_identificacao`) · trava de Admin (decisão do usuário: editável) · reutilizar
  `UiDataTable` na matriz (layout matricial ≠ modelo de linhas).

## Decisions

1. **`UiSwitch` (`ui/Switch.vue`) — botão nativo com `role="switch"`.**
   `<button role="switch" :aria-checked>` + `v-model` (defineModel), `label` associado por
   `useId()` (clique no rótulo alterna), `disabled` (native + fora do Tab + sem
   alternância). Visual: trilha `w-9 h-5 rounded-full` (`slate-300` desligada →
   **`brand-focus` `#1a9e07`** ligada), knob branco `h-4 w-4 translate-x` com
   `transition-transform` (morre sob `prefers-reduced-motion`, ok), foco
   `focus-visible:outline-2 outline-offset-2 outline-brand-focus`.
   *Alternativa descartada:* `UiCheckbox` com estilo de toggle (mistura semântica — o
   checkbox já existe com papel próprio); `bg-lime-500` no ligado (mesmo motivo: não
   introduzir mais `lime-*` — verde canônico `#1a9e07` é o token sancionado).
   Tamanho único (36×20px) — já cabe na célula da matriz (coluna ~72px) e serve para usos
   gerais.

2. **Modal `perfis/Permissoes.vue` (`<PerfisPermissoes>`), molde da família.**
   Props `modelValue`, `perfil: PerfilDemo | null`; emite `update:modelValue`. Rascunho em
   `ref<Record<ModuloId, Permissao[]>>` copiado ao abrir (cópia profunda — nunca referencia
   a base). Cabeçalho: nome do perfil + contador **"n/99"** derivado do rascunho
   (`computed`). Tabela própria (`<table>` dentro de `overflow-x-auto`, primeira coluna
   `sticky left-0` com fundo) — **não** `UiDataTable`.
   - **Célula:** `UiSwitch` **somente nas 4 ações fixas** (44 no DOM).
   - **Extras:** coluna **Funcionalidades** com os 5 **chips clicáveis** (`UiCheckChip`,
     `size="sm"`, rótulo capitalizado) por módulo — cada chip alterna a ação extra no
     rascunho (mesmo `alternar` dos interruptores); decisão do usuário: chips editáveis no
     lugar do JSON somente leitura (modelo de referência com pílulas).
   - **Sem atalhos de lote** (interruptores de "selecionar todos" em linha/coluna
     retirados — decisão do usuário) e **sem toolbar de filtros** (busca/segmentado saem;
     a UI de filtros da tela será arquitetada depois).
   - **Linha em duas linhas de texto:** nome em `font-semibold` + descrição curta
     (`MODULOS[].descricao`, texto nova do change) em `text-[11px] slate-400`, dentro de
     tabela-cartão (`rounded-xl border`, cabeçalho `bg-slate-50`, headers em versalete).
   - **Identidade e navegação por sessão:** ícone+cor de cada módulo vindos da fonte única
     `config/navigation` (casados por rótulo — ids divergem em `perfis-acesso` ×
     `perfis-rbac`) e módulos particionados em **abas `UiTabs` pelas 4 sessões** da sidebar
     (decisão do usuário — no lugar de linhas de agrupamento na tabela; o contador "n/99"
     permanece global em todas as abas).
   - **Rodapé:** `UiButton outline` Cancelar + `UiButton primary` Salvar; Salvar grava via
     helper novo `salvarPermissoes(base, id, permissoes): { base }` (puro, clone — mesmo
     contrato de `salvarPerfil`), `toast.success`, fecha; a página vê coluna/KPIs
     recalcularem por `computed`.

3. **Página:** `@permissoes` deixa de chamar `avisoPermissoesPendentes()` e passa a
   `abrirPermissoes(perfil)` (`modalPermissoesAberto` + `perfilPermissoes` resolvido por
   `id`, mesmo padrão de `abrirEdicao`). `avisoPermissoesPendentes()` e o import do
   `useToast` associado saem se ficarem sem uso.

4. **Spec `perfis-acesso`: REMOVED+ADDED** para o requisito de toast (título muda — padrão
   já usado duas vezes) e **MODIFIED ×2** preservando todos os cenários existentes (só
   texto de WHEN/THEN + cenário novo em "contagens").

5. **Spec `design-system/switch` nova** com `## Purpose` (obrigatório p/ capability nova) e
   2 requisitos (contrato + teclado/foco/vitrine). `docs/01` §5.19 e vitrine seção 20
   espelham; a seção da vitrine usa o componente real (viva).

6. **`docs/07` sincronizado no mesmo change:** §1 (Permissões abre modal), §2 (árvore +
   `<PerfisPermissoes>`), §3.7 nova (o modal), §4 (kit agora tem `UiSwitch` + `UiTextarea`),
   §5 (tabela de ações sem linha de transição p/ Permissões), §11 (deltas das 2
   capabilities), §12 (checklist novo), §13 (remove "modal de permissões" e "componente de
   toggle" das pendências; filtros/exportação e backend permanecem).

## Risks / Trade-offs

- [99 `UiSwitch` + atalhos em modal de 880px; em 375px a tabela rola horizontalmente dentro
  do corpo] → `overflow-x-auto` + 1ª coluna sticky; conferir na task 3.3.
- [Atalho coluna desligar 11 células de uma vez pode parecer agressivo] → É o contrato
  pedido (célula + linha/coluna); contador ao vivo dá feedback imediato; Cancelar descarta.
- [Admin editável pode gerar perfil sem `excluir`/sem acesso a perfis] → Decisão do usuário
  (sem trava por papel — mesma filosofia da exclusão irrestrita já especificada).
- [`salvarPermissoes` novo ao lado de `salvarPerfil` duplica contrato de clone] → Assinatura
  idêntica (`{ base }`, puro) — extrair composable comum ficaria genérico demais p/ 2 usos.
- [KPI/contagem só mudam após Salvar] → Rascunho isolado evita estado fantasma na tabela
  (usuário que fecha com Escape não espera recálculo).

## Migration Plan

Sem migração: frontend puro, em memória. Rollback = reverter os componentes, a página, os
helpers e os docs; specs voltam pelo archive.

## Open Questions

<!-- nenhuma — Admin editável, atalhos linha/coluna sem "Tudo" e separação em 2 changes
     decididos com o usuário na rodada -->

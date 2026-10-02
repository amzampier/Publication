# RL01 — Relatório de Responsividade (Etapa 8 · QA UX)

| Campo | Valor |
| :--- | :--- |
| **ID** | RL01 |
| **Especialista** | QA UX / Responsividade (`docs/qa/05-qa-ux.md`) |
| **Base normativa** | `docs/qa/00-arquitetura-e-regras-gerais.md` · `openspec/specs/design-system/*` · `docs/01 - design_system.md` |
| **Data** | 02/10/2026 |
| **Escopo auditado** | Shell da Área Administrativa (`layouts/admin.vue` + `AppHeader` + `AppSidebar`), rota pública `/`, `/admin`, `/admin/configuracoes-globais` + 4 abas, vitrine `/design` e o UI kit (`app/components/ui/` — 21 componentes) |
| **Método** | Inspeção de código, conferência contra a fonte da verdade, SSR do dev server (`npm run dev`) e verificação de comportamento no navegador automatizado (Edge headless + CDP, com screenshots) |
| **Alterações de código** | Auditoria original: **nenhuma** — somente-leitura; as correções da auditoria eram *indicativas*. Aplicadas depois pelo fluxo OpenSpec: **Etapa 1** (BUG-01, change `montar-toast-container-global`), **Etapa 2** (BUG-02/03/04, change `tipografia-responsividade-erros-acessiveis`) e **Etapa 3** (BUG-05…BUG-12, change `polimento-404-kit-vitrine`) — todas em 02/10/2026 |

---

## 1. Resumo executivo

- **Status: APROVADO SEM RESSALVAS** — 0 bugs **Alta**, 0 **Médios**, 0 **Baixos** (12/12 bugs fechados em 02/10/2026: BUG-01 na Etapa 1; BUG-02…04 na Etapa 2; BUG-05…12 na Etapa 3 — change `polimento-404-kit-vitrine`), 4 melhorias não bloqueantes. *(Situação inicial da auditoria: REPROVADO — 1 bug Alta.)*
- **Risco: Baixo** — toasts globais, tipografia oficial, shell responsivo, erros acessíveis e todo o polimento (404 pt-BR, numéricos, slider, DatePicker/Calendar, vitrine, duplicata) estão operantes e verificados por checagens CDP (Etapa 3: 19/19 + gate 6.1: 23/23), E2E de toasts 24/24 e `npm run build` OK.
- **Gate da seção 6:** checklist **6.1 completa (verde)** — nenhum bug aberto restante; as melhorias da seção 7 (MEL-01…04) são opcionais (sem impacto funcional) e não bloqueiam o veredito.

| Severidade | Qtd | IDs |
| :--- | ---: | :--- |
| Alta | 0 | — (BUG-01 corrigido em 02/10/2026) |
| Média | 0 | — (BUG-02, BUG-03, BUG-04 corrigidos em 02/10/2026) |
| Baixa | 0 | — (BUG-05 … BUG-12 corrigidos em 02/10/2026 — Etapa 3) |
| Melhoria | 4 | MEL-01 … MEL-04 *(não bloqueantes)* |

---

## 2. Cobertura da auditoria

| Eixo | Situação |
| :--- | :--- |
| Clareza / consistência / mensagens | ✅ executado |
| Feedback visual | ✅ executado — **falha global encontrada (BUG-01)** |
| Loading / estados vazios | ✅ executado no kit; loadings de listagem **não aplicáveis** (sem `server/`/rede) |
| Erros de formulário | ✅ executado no kit (BUG-04) |
| Responsividade | ✅ executado (inspeção de breakpoints + SSR) |
| Acessibilidade | ✅ executado (ARIA, foco, teclado, labels) |
| Navegação | ✅ executado (shell, menus, abas, âncoras) |
| Distinção Área Pública × Área Administrativa | ✅ executado via SSR |
| Status de publicação → `Badge` | ⛔ **não aplicável** — módulos de publicação ainda não construídos |
| Autenticação/RBAC (fronteira de áreas) | ⛔ **não aplicável** — `server/` não existe; `/admin` responde 200 sem sessão → **encaminhar a qa-seguranca/qa-funcional** |
| Verificação visual em navegador | ✅ **revalidado em 02/10/2026** — navegador automatizado (Edge headless + CDP) com screenshots e medições a 375/768/1024px; na auditoria original era *parcial* (achados de layout apoiados em código + SSR) |

### Evidências de runtime (dev server, 4 rotas)

```
/                            status=200  viewport='width=device-width, initial-scale=1'  aria-live=0  sidebar=0  toggle=0
/admin                       status=200  viewport ok                                     aria-live=0  sidebar=2  toggle=1
/admin/configuracoes-globais status=200  viewport ok                                     aria-live=0  sidebar=2  toggle=1
/design                      status=200  viewport ok                                     aria-live=0  sidebar=0  toggle=0

CSS servido (/_nuxt/assets/css/main.css): jakarta=0  jetbrains=0  |  .bg-brand-primary=3  border-brand-focus=3
404 (/rota-inexistente): <title>404 - Page not found | Nuxt</title>
```

> `aria-live=0` em todas as rotas é a prova de que o `UiToastContainer` (que renderiza um `div` estático `role="status" aria-live="polite"`) **não estava montado**.
>
> **Revalidação pós-correção (02/10/2026):** SSR das 4 rotas com `aria-live=1` e `role=status=1` em cada uma; verificação funcional automatizada (Edge headless + CDP) com **24/24 asserções aprovadas** — salvar/atalizar/vitrine §8/auto-dismiss 5000 ms/fechamento manual/persistente `duration=0`/toast visível em `/`; `npm run build` OK.

---

## 3. ETAPA 1 — Desbloqueio (severidade Alta) · **obrigatória para sair de "Reprovado"**

### BUG-01 · `UiToastContainer` nunca é montado: nenhum toast aparece em nenhuma rota
**Severidade:** Alta · **Esforço:** S (linha única) · **Status:** **CORRIGIDO** em 02/10/2026 — change OpenSpec `montar-toast-container-global` (`<UiToastContainer />` montado em `app/app.vue` fora do `<NuxtLayout>`; validado por SSR nas 4 rotas + E2E 24/24 + `npm run build`)

| Campo | Detalhe |
| :--- | :--- |
| **Módulo** | Feedback global do Design System |
| **Arquivos** | `app/app.vue` (falta do componente) · `app/components/ui/ToastContainer.vue` (não referenciado) |
| **Referência da fonte da verdade** | `docs/01 - design_system.md:246` — "`ToastContainer` fica montado globalmente em `app/app.vue` — os toasts funcionam em qualquer rota"; `docs/02 - Guia de Arquitetura e Migrations.md:33` e `:599` |
| **Cenário** | Usuário clica em **"Salvar Alterações Globais"** (Configurações), em **"Atualizar"** (aba Segurança) ou nos botões **"Disparar Success/Warning/Danger/Info"** (vitrine §8) |
| **Esperado** | Toast de confirmação/erro no canto superior direito, com auto-dismiss de 5000 ms e barra de progresso |
| **Obtido** | **Nada é exibido.** O composable enfileira o item (`useToast().toast.success(...)`), mas não há componente renderizando a lista. A vitrine §8 anuncia "Experimente na Tela Agora … notificações reais no canto superior direito" e não entrega nada |

**Passos para reprodução**
1. `npm run dev`
2. Abrir `http://localhost:3000/admin/configuracoes-globais`
3. Alterar qualquer painel (ex.: Logomarcas) e clicar em "Salvar Alterações Globais"
4. Observar o canto superior direito — nenhum toast aparece (o botão apenas volta a ficar desabilitado)

**Evidências**
- Busca case-insensitive por `ToastContainer` em todo o repositório: **0 usos** fora do próprio componente e dos documentos (`docs/01`, `docs/02`, `docs/qa/05`)
- `app/app.vue` (8 linhas) contém somente `<NuxtRouteAnnouncer /> + <NuxtLayout> + <NuxtPage>`
- SSR: `role="status"` = 0 e `aria-live` = 0 nas 4 rotas
- `app/plugins/` vazio; nenhum layout (`default.vue`/`admin.vue`) monta o componente
- `ToastContainer.vue` importa o mesmo módulo dos consumidores (`../../composables/useToast`) — o estado é compartilhado; **o componente só precisa ser montado**

**Impacto:** todo o feedback de confirmação/aviso/erro da aplicação é invisível; usuário não sabe se a ação foi aplicada; divergência doc × código em duas páginas de documentação.

**Correção indicativa (não aplicada pelo QA)**
- `app/app.vue`: adicionar `<UiToastContainer />` dentro do `<div>` raiz (fora do `NuxtLayout`, para valer também em rotas com `layout: false`, como `/design`)
- Alternativa equivalente: montá-lo em `app/layouts/default.vue` **e** `app/layouts/admin.vue` — mas a 1ª opção é a que confere com `docs/01:246`

**Critério de aceite**
- [x] Após "Salvar Alterações Globais" aparece toast `success` "Configurações Globais …"
- [x] Após "Atualizar" (aba Segurança) aparece toast `info`
- [x] Vitrine §8: os 4 botões "Disparar …" exibem toast no canto superior direito
- [x] `role="status"` e `aria-live` presentes no HTML de `/`, `/admin`, `/admin/configuracoes-globais` e `/design`
- [x] Toast persistente (`duration = 0`) não removido automaticamente; com duração remove com a barra de progresso

---

## 4. ETAPA 2 — Conformidade visual e acessibilidade (severidade Média)

### BUG-02 · Tipografia do design system não é carregada (Plus Jakarta Sans + JetBrains Mono ausentes)
**Severidade:** Média · **Esforço:** M · **Status:** **CORRIGIDO** em 02/10/2026 — change OpenSpec `tipografia-responsividade-erros-acessiveis` (Google Fonts via `app.head.link` com `preconnect` em `nuxt.config.ts` + `theme.extend.fontFamily` no `tailwind.config.js`; CSS de dev `main.css` `jakarta=3 jetbrains=2` e CSS de produção `entry.*.css` `jakarta=3 jetbrains=2`; fontes reais aplicadas verificadas no navegador 7/7)

| Campo | Detalhe |
| :--- | :--- |
| **Módulo** | Design System — tipografia |
| **Arquivos** | `nuxt.config.ts` · `tailwind.config.js` · `app/assets/css/main.css` (sem `@font-face`) |
| **Referência** | `docs/01:53` "Fontes carregadas em `nuxt.config.ts` (Google Fonts)"; `docs/01:45` numéricos/códigos em `JetBrains Mono` + `tabular-nums`; `docs/01:58-67` escala tipográfica |
| **Cenário** | Qualquer tela renderizada |
| **Esperado** | `font-sans` = Plus Jakarta Sans; `font-mono` = JetBrains Mono |
| **Obtido** | Nenhuma fonte é carregada: sem Google Fonts, sem `@font-face`, sem `fontFamily` no `tailwind.config.js`, sem `@nuxtjs/google-fonts`; `public/` só tem `favicon.ico` e `robots.txt`. O CSS gerado contém **apenas** os stacks padrão do Tailwind (`ui-sans-serif, system-ui…` / `ui-monospace, SFMono-Regular, Menlo…`) |

**Passos para reprodução**
1. `npm run dev`
2. `curl http://localhost:3000/_nuxt/assets/css/main.css` → procurar `jakarta` e `jetbrains` (0 ocorrências)
3. Conferir que `nuxt.config.ts` não declara `app.head.link` nem `fontFamily`

**Evidências:** CSS servido com `jakarta=0 jetbrains=0`; `nuxt.config.ts` contém apenas `compatibilityDate`, `devtools` e `modules/tailwindcss`.

**Impacto:** toda a identidade tipográfica do sistema (títulos, corpo, labels) e a "precisão numérica" caem em fonte de sistema; a vitrine §1 rotula blocos como "Plus Jakarta Sans/JetBrains Mono" sem que existam; `font-variant-numeric: tabular-nums` está correto, mas sem a fonte prometida.

**Correção indicativa**
- Carregar as fontes via `nuxt.config.ts` → `app.head.link` (Google Fonts, com `preconnect`) **ou** pelo módulo `@nuxtjs/google-fonts` (adicionado a `modules`)
- Estender `tailwind.config.js` → `theme.extend.fontFamily`: `sans: ['"Plus Jakarta Sans"', …]`, `mono: ['"JetBrains Mono"', …]`
- Alternativa offline: self-host das fontes em `public/fonts/` + `@font-face` em `main.css`

**Critério de aceite**
- [x] CSS de saída contém `Plus Jakarta Sans` e `JetBrains Mono` *(dev `main.css` + build `entry.*.css`)*
- [x] `docs/01:53` passa a descrever exatamente o mecanismo implementado
- [x] Seção 1 da vitrine renderiza com as fontes oficiais *(computed `font-family` + `document.fonts`)*

---

### BUG-03 · Shell da Área Administrativa sem comportamento responsivo
**Severidade:** Média · **Esforço:** M-L · **Status:** **CORRIGIDO** em 02/10/2026 — change OpenSpec `tipografia-responsividade-erros-acessiveis` (init `matchMedia('(min-width: 1024px)')` com prevalência da preferência manual em `useSidebarExpandida.ts`; drawer `fixed` + backdrop abaixo de `lg` em `admin.vue`/`AppSidebar.vue`; `flex-wrap`/`w-full sm:w-auto` no `Cabecalho`; abas com `overflow-x-auto` + `shrink-0` no `UiTabs`; verificação automatizada 28/28 em 375/768/1024 + docs `03`/`04` atualizados)

| Campo | Detalhe |
| :--- | :--- |
| **Módulo** | Layout Área Administrativa |
| **Arquivos** | `app/layouts/admin.vue` · `app/components/layout/AppSidebar.vue` · `app/components/layout/AppHeader.vue` · `app/composables/useSidebarExpandida.ts` · `app/pages/admin/configuracoes-globais.vue` · `app/components/configuracoes/Cabecalho.vue` |
| **Referência** | `docs/qa/05-qa-ux.md:60` — "Responsividade: tabelas com rolagem, modais/ajustes a telas menores, **sidebar colapsável**"; `docs/01:49` "Layout Bimodal Retrátil" |
| **Cenário** | `/admin/configuracoes-globais` em viewport de 375px com a sidebar no padrão expandida |
| **Esperado** | Conteúdo utilizável sem overflow horizontal, sidebar com comportamento adaptativo (auto-rail ou drawer em telas pequenas) |
| **Obtido** | Sidebar ocupa `w-52` (208px) fixos → restam ~167px de conteúdo (135px após o `p-4`). O `UiButton` "Salvar Alterações Globais" (`Cabecalho.vue:37`, `shrink-0`, ~190px) não cabe na largura do `header` (`flex-wrap` em `Cabecalho.vue:18` não resolve, pois o item é maior que o próprio container) → overflow horizontal dentro de `main` (`overflow-y-auto`). As 4 abas do `UiTabs` (rótulos longos) quebram em ~4 linhas |

**Passos para reprodução**
1. `npm run dev` → `/admin/configuracoes-globais`
2. Reduzir a janela para 375px (DevTools device toolbar) mantendo a sidebar expandida
3. Observar: barra de rolagem horizontal na área de conteúdo, botão "Salvar" cortado, abas empilhadas

**Evidências (contagem de classes responsivas)**
| Arquivo | Classes `sm:/md:/lg:/xl:/max-*` |
| :--- | :---: |
| `app/layouts/admin.vue` | **0** |
| `app/components/layout/AppSidebar.vue` | **0** |
| `app/components/layout/AppHeader.vue` | **1** (`hidden sm:block` no nome da conta) |

- Grep por `matchMedia|window.innerWidth|useMediaQuery` em `app/`: **nenhuma** ocorrência de detecção de largura (apenas listeners de `resize` em `Select`/`Tooltip` para reposicionar popovers)
- `useSidebarExpandida.ts:5` inicia `true` em **qualquer** largura

**Impacto:** a Área Administrativa é praticamente inoperável em celular/tablet; o único recurso é o toggle manual do header.

**Correção indicativa**
- Em `AppSidebar`/`layouts/admin.vue`: comportamento responsivo, ex. abaixo de `lg` → sidebar começa em rail (`w-[46px]`) ou vira drawer com backdrop sobre o conteúdo; auto-colapsar no primeiro carregamento em telas estreitas (`matchMedia` no composable `useSidebarExpandida`, com respeito à preferência manual do usuário)
- Garantir `min-w-0` + `flex-wrap` real no cabeçalho de `Cabecalho.vue` (ou `w-full sm:w-auto` no botão Salvar) para não depender da sidebar estar recolhida
- Revisar `UiTabs`/grids das abas para telas < 400px (rolagem horizontal da barra de abas é alternativa aceitável)

**Critério de aceite**
- [x] 375px com sidebar expandida: **sem** overflow horizontal em Configurações Globais
- [x] 768px e 1024px: layouts íntegros (abas, cards, tabela)
- [x] Sidebar alterna/expande preservando estado (spec `layout-navigation`) em qualquer largura
- [x] Rail com tooltips não cortados em telas estreitas

---

### BUG-04 · Mensagem de erro dos campos é inacessível (tooltip só no hover, fora da árvore de acessibilidade)
**Severidade:** Média · **Esforço:** M · **Status:** **CORRIGIDO** em 02/10/2026 — change OpenSpec `tipografia-responsividade-erros-acessiveis` (texto persistente `<p role="alert">` + `aria-describedby` com id estável em `Input`/`Select`/`DatePicker`, mantendo ícone + tooltip como reforço; verificação automatizada 12/12 na vitrine, paridade de classes nos 3 componentes; `docs/01` atualizado — menções "tooltip-only/nunca texto abaixo" removidas)

| Campo | Detalhe |
| :--- | :--- |
| **Módulo** | UI kit — `UiInput`, `UiSelect`, `UiDatePicker` |
| **Arquivos** | `app/components/ui/Input.vue:117-130` · `Select.vue:312-327` · `DatePicker.vue:186-197` · `app/components/ui/Tooltip.vue:245` |
| **Referência** | `docs/qa/05-qa-ux.md:56` "Mensagens de erro claras e acionáveis; não expor detalhes técnicos"; `:61` "labels associados aos inputs … `aria` em componentes interativos" |
| **Cenário** | Campo com `error` preenchido; usuário navega por teclado, toque ou usa leitor de tela |
| **Esperado** | Texto do erro disponível no DOM e anunciável (`role="alert"` / `aria-describedby`), ou exibido de forma persistente abaixo do campo |
| **Obtido** | O texto existe **somente** dentro do balão do `UiTooltip`, que é renderizado com `v-if="isVisible"` (ausente do DOM sem hover) e é acionado por um botão com `aria-hidden="true"` e `tabindex="-1"` → **inalcançável por teclado e por AT**; não há `aria-describedby` nem região viva. A borda vermelha (`rose-700` + `.ds-bottom-clip`) está correta — só a mensagem é inacessível |

**Passos para reprodução**
1. Vitrine `/design`, seção 2/6/7 (demonstrações com `error`)
2. Focar o campo pela tecla `Tab` → a borda fica vermelha, mas a mensagem não aparece
3. Inspecionar o DOM: não há nó de texto com a mensagem enquanto o balão não é aberto por mouse

**Evidências:** `Tooltip.vue:245` (`v-if="isVisible"`), `Input.vue:118-129` (botão `aria-hidden` + `tabindex="-1"`), mesma estrutura em `Select` e `DatePicker`.

**Impacto:** usuário não consegue saber *qual* é o erro sem mouse; em formulários futuros de publicação isso vira bloqueio de preenchimento (WCAG 3.3.1/4.1.2).

**Correção indicativa**
- Manter o ícone/tooltip **e** adicionar texto persistente abaixo do campo: `<p v-if="error" role="alert" class="text-[11px] text-rose-700">`
- Alternativa mínima: `aria-describedby` apontando para o nó do tooltip + renderizar o conteúdo do erro no DOM desde a primeira renderização
- Padronizar nos 3 componentes

**Critério de aceite**
- [x] A mensagem de erro existe no DOM quando `error` está preenchido
- [x] Anunciada por leitor de tela (nó com `role="alert"` ou vinculado via `aria-describedby`)
- [x] Acessível sem mouse (teclado/toque) — nó estático no DOM, sem hover
- [x] Padrão idêntico em `Input`, `Select` e `DatePicker`

---

## 5. ETAPA 3 — Polimento (severidade Baixa) · **concluída em 02/10/2026 (8/8)**

### BUG-05 · Página 404 sem tratamento (idioma e visual fora do sistema)
- **Severidade:** Baixa · **Esforço:** S · **Arquivos:** ~~falta `app/error.vue`~~ `app/error.vue` criado
- **Status:** **CORRIGIDO** em 02/10/2026 — change OpenSpec `polimento-404-kit-vitrine` (`app/error.vue` standalone: pt-BR, tokens do DS, `UiButton` "Voltar ao início" → `/` + "Área Administrativa" → `/admin` só no 404; status HTTP 404 real preservado)
- **Cenário:** abrir `/rota-inexistente`
- **Esperado:** erro em pt-BR coerente com o design system, com volta para `/` e `/admin`
- **Obtido:** `status=404` com página padrão do Nuxt — `<title>404 - Page not found: /rota-inexistente | Nuxt</title>`
- **Passos:** `npm run dev` → `curl -i http://localhost:3000/rota-inexistente`
- **Correção indicativa:** criar `app/error.vue` (vueApp do Nuxt) com layout próprio, textos pt-BR, tokens do DS e CTAs de retorno
- **Aceite:** 404 renderizada em pt-BR com os tokens do `docs/01` e links de saída

### BUG-06 · `UiKpi` exibe métricas sem `font-mono`/`tabular-nums` (e coluna numérica centralizada sem `tabular-nums`)
- **Severidade:** Baixa · **Esforço:** S · **Arquivos:** `app/components/ui/Kpi.vue:50` · `app/components/ui/DataTable.vue:788,815` · `app/components/configuracoes/AbaSeguranca.vue:27-28`
- **Status:** **CORRIGIDO** em 02/10/2026 — change `polimento-404-kit-vitrine` (`Kpi.vue:49` ganhou `font-mono tabular-nums`; `DataTable.vue:789,817` aplica `tabular-nums` quando `col.isNumeric || col.align === 'right'` — CDP: KPI com JetBrains Mono, `right`=6/`tabular`=6 na vitrine, aba Segurança `center`+`tabular-nums`)
- **Referência:** `docs/01:66` "Monospace (Numérico) … valores numéricos e métricas, `tabular-nums`"; `docs/01:69` "`tabular-nums` … obrigatória em qualquer coluna/valor numérico"
- **Cenário:** cartões `UiKpi` e coluna "Tentativas" (aba Segurança, `align: 'center'` + `isNumeric: true`)
- **Esperado:** métricas em `font-mono tabular-nums`; toda coluna numérica com `tabular-nums`
- **Obtido:** `{{ valor }}` sem classes mono/tabular; `DataTable` só aplica `tabular-nums` quando `align === 'right'`
- **Correção indicativa:** `font-mono tabular-nums` no valor do `UiKpi`; aplicar `tabular-nums` quando `col.isNumeric` (independente do alinhamento); avaliar `align: 'right'` na coluna de demonstração
- **Aceite:** métricas e colunas numéricas com `font-mono tabular-nums` em todas as combinações de alinhamento

### BUG-07 · `UiSlider`: rótulos das marcas colidem em telas estreitas
- **Severidade:** Baixa · **Esforço:** S · **Arquivos:** `app/components/ui/Slider.vue:63-71` · `app/components/configuracoes/AbaRetencaoAuditoria.vue:64-75`
- **Status:** **CORRIGIDO** em 02/10/2026 — change `polimento-404-kit-vitrine` (`Slider.vue:65`: `flex-wrap justify-center sm:justify-between gap-x-2 gap-y-1`; cabeçalho de `AbaRetencaoAuditoria` com `flex-wrap` — CDP: retângulos dos 5 rótulos sem interseção a 320/375px)
- **Cenário:** corpo do painel com ~280px e 5 rótulos ("30 dias (1 mês)" … "730 dias (2 anos)")
- **Esperado:** rótulos legíveis, sem sobreposição
- **Obtido:** `flex justify-between gap-2` **sem `flex-wrap`** — `<span>` encolhem e quebram linha irregularmente; o bloco do valor (`text-4xl`, `flex items-start justify-between`) também comprime o texto em telas pequenas
- **Correção indicativa:** `flex-wrap` + `min-w-0` nos rótulos (ou rótulos abreviados abaixo de `sm`); `flex-wrap` no cabeçalho do card de retenção
- **Aceite:** em 320–375px os 5 rótulos permanecem legíveis e sem sobreposição

### BUG-08 · `UiDatePicker` não auto-inverte e `UiCalendar` tem largura fixa
- **Severidade:** Baixa · **Esforço:** S-M · **Arquivos:** `app/components/ui/DatePicker.vue:218` (`absolute top-full left-0` sempre) · `app/components/ui/Calendar.vue:194` (`w-72`)
- **Status:** **CORRIGIDO** em 02/10/2026 — change `polimento-404-kit-vitrine` (auto-inversão espelhando o `Select` com `nextTick` + `abreParaCima`/`alinhaDireita`; `Calendar.vue:194` → `w-72 max-w-full`; wrapper do popover → `max-w-[min(100%,calc(100vw-1rem))]`; demo do modal §15 passou a incluir `UiDatePicker` para tornar o aceite "dentro de UiModal" executável — CDP a 320px: popover em página **e** no modal dentro da viewport, 42 células íntegras, clique grava `15/10/2026`, `scrollWidth == 320`)
- **Referência:** `docs/01:481` — auto-inversão vertical documentada para o `UiSelect`
- **Cenário:** campo no fim de um formulário longo; `UiCalendar` dentro de `UiModal` (`p-5`) a 320px
- **Esperado:** consistência com o `UiSelect` (abrir para cima quando não há espaço); calendário nunca exceder a largura disponível
- **Obtido:** popover só abre para baixo (pode ser cortado pelo `overflow-y-auto` do corpo do modal); `w-72` = 288px > 280px disponíveis em 320px com `p-5`
- **Correção indicativa:** reaproveitar a lógica de auto-inversão do `Select.vue` no `DatePicker`; `w-72 max-w-full`
- **Aceite:** calendário visível sem corte em 320px, em página e dentro de modal, nas posições inicial e final do scroll

### BUG-09 · Vitrine §8 usa controles nativos paralelos ao kit
- **Severidade:** Baixa · **Esforço:** S · **Arquivo:** `app/pages/design.vue:1295,1305,1315` (2 `<input>` + 1 `<select>` nativos) e botões "Disparar …" com estilo próprio (18 `<button>` no arquivo)
- **Status:** **CORRIGIDO** em 02/10/2026 — change `polimento-404-kit-vitrine` (2 `<input>` → `UiInput` com `label` associado, `<select>` → `UiSelect` (`:clearable="false"`), submit → `UiButton primary` e os 4 gatilhos "Disparar …" → `UiButton` outline/danger com ícones semânticos — grep da §8: 0 `<select>`/`<input` nativo, 5 `UiButton`; E2E de toasts reexecutado com **24/24**)
- **Referência:** regra do projeto — "Nunca crie botão/campo/tooltip paralelos"; a mesma página já usa `UiInput` ×9, `UiSelect` ×5, `UiButton` ×20
- **Cenário:** seção 8 "Toasts & Alertas" → "Formulário Customizado"
- **Esperado:** demonstração construída com o kit (é a referência viva do sistema)
- **Obtido:** campos/botões com classes próprias (`h-[34px] … rounded-lg`)
- **Correção indicativa:** trocar por `UiInput`, `UiSelect` e `UiButton variant="primary"`; revisar os botões de demo paralelos
- **Aceite:** nenhum `<input>`/`<select>`/`<button>` estilizado manualmente nos formulários da vitrine (menus/ícones de navegação continuam aceitáveis)

### BUG-10 · Cópia morta idêntica do composable de toast
- **Severidade:** Baixa · **Esforço:** S · **Arquivos:** `app/components/composables/useToast.ts` (duplicata) vs `app/composables/useToast.ts` (canônico)
- **Status:** **CORRIGIDO** em 02/10/2026 — change `polimento-404-kit-vitrine` (`Test-Path` = false após remoção do arquivo e do diretório; grep por `useToast` em `app/` aponta só `app/composables/useToast.ts`; consumidores inalterados; build OK)
- **Evidências:** SHA256 idênticos (`C9E6F1CD…`); a cópia em `components/composables/` **não** é auto-importada (o Nuxt só auto-importa `app/composables/`); todos os consumidores importam `../../composables/useToast`
- **Risco:** editar uma cópia e não a outra → divergência silenciosa; polui o inventário do kit
- **Correção indicativa:** remover a duplicata `app/components/composables/useToast.ts`
- **Aceite:** `useToast.ts` existe apenas em `app/composables/`; build OK

### BUG-11 · Header da vitrine sem `flex-wrap`/`min-w-0` (suspeita de corte em 375px)
- **Severidade:** Baixa (evidência de layout por código — confirmar visualmente) · **Esforço:** S · **Arquivo:** `app/pages/design.vue:545-575`
- **Status:** **CORRIGIDO** em 02/10/2026 — change `polimento-404-kit-vitrine` (`min-h-16 py-2 flex-wrap gap-x-4 gap-y-2` + `min-w-0` no bloco de identidade — CDP 375px: título, badge `v2.0.0` e ações sem corte/sobreposição e `scrollWidth == innerWidth`; 1024px em uma linha)
- **Cenário:** `/design` a 375px
- **Esperado:** cabeçalho sem corte/sobreposição
- **Obtido:** `h-16 flex items-center justify-between` sem `flex-wrap`/`min-w-0`; bloco esquerdo (ícone + h1 + badge `v2.0.0` + subtítulo) ≈ 280px + bloco direito ("Imprimir Guia" + "Home") ≈ 170px > 375px, em altura fixa de 64px
- **Correção indicativa:** `flex-wrap` + `min-w-0`/`truncate` no bloco esquerdo e ações em nova linha abaixo de `sm`
- **Aceite:** 320–375px sem overflow nem corte de texto no cabeçalho da vitrine

### BUG-12 · Cabeçalhos de seção da vitrine com badge `shrink-0` sem `flex-wrap` → overflow horizontal *(novo, achado na revalidação da Etapa 2)*
- **Severidade:** Baixa · **Esforço:** S · **Arquivos:** `app/pages/design.vue:859-863` (§5 Input) · `:1125-1129` (§8 Toasts) · `:1372` (§9, `whitespace-nowrap`) · `:1540-1544` (§11 Checkbox — o maior: badge de 5 componentes ≈ 598px)
- **Status:** **CORRIGIDO** em 02/10/2026 — change `polimento-404-kit-vitrine` (`flex-wrap` + `min-w-0` nos 5 cabeçalhos com badge — §5/§8/§9/§11 e também §14 Shell, que exibia overflow residual de 3px em 375 — CDP: `document.scrollWidth <= innerWidth` em 375/768/1024/1440, **antes** 435/865/1161)
- **Cenário:** `/design` em 375/768/1024px (medição automatizada via CDP em 02/10/2026)
- **Esperado:** página sem `document.scrollWidth > innerWidth`
- **Obtido:** `scrollWidth` = **435 / 865 / 1161** (viewport 375 / 768 / 1024); o elemento mais à direita é o `span` badge dentro de `div.shrink-0` no cabeçalho flex da seção (container sem `flex-wrap`, `shrink-0` impede a compressão → estoura o layout)
- **Correção indicativa:** `flex-wrap` no container do cabeçalho de seção (ou mover o badge para nova linha abaixo de `sm`/`md`); `min-w-0` no bloco de título
- **Aceite:** `/design` sem overflow horizontal em 320–1440px
- **Nota:** coberto pela mudança da **Etapa 3** (vitrine), junto com BUG-09 e BUG-11

---

## 6. ETAPA 4 — Verificação final (gate para "Aprovado sem ressalvas")

### 6.1 Checklist de revalidação

**Ambiente**
```powershell
npm install        # se necessário
npm run dev        # http://localhost:3000
npm run build      # única verificação estrutural do repositório (não há lint/test)
```

**Bloqueador (BUG-01)**
```powershell
# HTML das 4 rotas deve conter aria-live (container montado)
foreach ($p in @('/','/admin','/admin/configuracoes-globais','/design')) {
  $h = (Invoke-WebRequest "http://localhost:3000$p" -UseBasicParsing).Content
  "{0} -> aria-live={1}" -f $p, ([regex]::Matches($h,'aria-live')).Count
}
# Esperado: aria-live >= 1 em todas as rotas
```
- [x] Toasts de sucesso/erro/aviso/info visíveis nas ações da rota e da vitrine §8 *(BUG-01 corrigido — E2E 24/24 em 02/10/2026)*

**Conformidade visual (BUG-02)**
```powershell
$css = (Invoke-WebRequest "http://localhost:3000/_nuxt/assets/css/main.css" -UseBasicParsing).Content
"jakarta=$(( [regex]::Matches($css,'(?i)jakarta') ).Count) jetbrains=$(( [regex]::Matches($css,'(?i)jetbrains') ).Count)"
# Esperado: ambos > 0
```
- [x] CSS com as duas famílias *(dev `main.css` `jakarta=3 jetbrains=2` + build `entry.*.css` `jakarta=3 jetbrains=2` — 02/10/2026)*
- [x] Fontes reais aplicadas no navegador (`document.fonts` + computed) *(7/7 — 02/10/2026)*

**Responsividade (BUG-03, BUG-07, BUG-08, BUG-11, BUG-12)** — DevTools, larguras **320, 375, 768, 1024, 1440 px**
- [x] `/admin/configuracoes-globais`: sem overflow horizontal, botão Salvar visível, abas utilizáveis *(verificação automatizada 28/28 em 375/768/1024 — 02/10/2026)*
- [x] Sidebar: comportamento adaptativo + toggle preservando estado (spec `layout-navigation`) *(mesma verificação)*
- [x] Aba "Retenção de Auditoria": rótulos do slider legíveis *(BUG-07 — CDP 02/10/2026: 5 rótulos sem interseção em 320/375px)*
- [x] `UiCalendar` em 320px (página e dentro de modal) sem corte *(BUG-08 — CDP: popover em página e no modal §15 a 320px dentro da viewport, 42 células íntegras, clique grava a data, `scrollWidth == 320`)*
- [x] Cabeçalho do `/design` sem corte em 375px *(BUG-11 — CDP: sem corte/sobreposição, `scrollWidth == innerWidth`; 1024px em uma linha)*
- [x] `/design` sem overflow horizontal (cabeçalhos de seção com badge — BUG-12, `scrollWidth` 435/865/1161 — Etapa 3) *(CDP: `scrollWidth <= innerWidth` em 375/768/1024/1440)*

**Acessibilidade (BUG-04)**
- [x] Mensagem de erro no DOM e anunciada por AT em `UiInput`, `UiSelect`, `UiDatePicker` *(nó `role="alert"` + `aria-describedby` sem hover; 12/12 — 02/10/2026)*
- [x] Navegação por teclado completa nos menus do header, abas (Setas/Home/End), modal (foco preso), tabela *(gate 6.1 via CDP 23/23 em 02/10/2026: abas respondem a Seta/End/Home; modal com foco preso em Tab×12 + Shift+Tab e Escape; menus do header abrem com Enter, recebem Tab nos `menuitem` e fecham com Escape; toolbar/paginação da tabela focáveis)*

**Demais baixos**
- [x] `/rota-inexistente` em pt-BR com estilo do DS (BUG-05) *(curl `404` com "Página não encontrada", sem `Page not found | Nuxt`, CTAs para `/` e `/admin`)*
- [x] `UiKpi`/colunas numéricas com `font-mono tabular-nums` (BUG-06) *(CDP: KPI em JetBrains Mono; `tabular-nums` em right/center/isNumeric)*
- [x] Vitrine §8 sem controles paralelos (BUG-09) *(grep: 0 `<input>`/`<select>` nativos no formulário; E2E de toasts 24/24)*
- [x] Duplicata `app/components/composables/useToast.ts` removida (BUG-10) *(`Test-Path` = false; grep só no canônico)*

**Regressão / consistência**
- [x] `/` renderiza **sem** shell; `/admin` **com** shell; `/design` fora do shell *(SSR 02/10/2026: `/` `id="app-sidebar"`=0; `/admin` =1 + toggle real de sidebar; `/design` =0 — o demo §14 é marcação própria da página, não o componente do shell)*
- [x] Zero-pill mantido (badges `rounded-md`); tokens `brand.*` intactos; foco `brand-focus` *(`Badge.vue:89` `rounded-md` — `rounded-full` só em dots/avatares circulares; CSS servido `brand-primary`=8, `brand-focus`=11, `brand-accent`=8, `.ds-bottom-clip`=1)*
- [x] `npm run build` sem erro *(02/10/2026 — executado após a Etapa 3, incluindo o campo de data no modal §15)*

### 6.2 Matriz de aprovação após correção

| Veredito | Condição |
| :--- | :--- |
| **Aprovado sem ressalvas** | 12 bugs (BUG-01…BUG-12) fechados + checklist 6.1 verde + `npm run build` OK |
| Aprovado com ressalvas | Restarem apenas bugs Médios/Baixos |
| Reprovado | Qualquer bug Alta/Crítico aberto *(situação da auditoria: BUG-01 — corrigido)* |

> As melhorias da seção 7 são **sem impacto funcional** e não impedem o veredito "Aprovado sem ressalvas"; recomenda-se, porém, endereçá-las no mesmo ciclo.

---

## 7. Melhorias (não bloqueantes)

| ID | Melhoria | Arquivos | Observação |
| :--- | :--- | :--- | :--- |
| **MEL-01** | Trocar `h-screen`/`min-h-screen` por `dvh` | `app/layouts/admin.vue:8`, `app/pages/design.vue:543` | Em mobile com barra de endereço, `100vh` cobre o rodapé do conteúdo |
| **MEL-02** | Estender `prefers-reduced-motion` | `ToastContainer.vue`, `Modal.vue`, `Select.vue`, `Badge.vue` | Hoje só `UiKpi:140-144` respeita; `animate-ping` e transições continuam ativas |
| **MEL-03** | Feedback para itens de navegação sem rota | `AppHeader.vue` (`accountMenuItens`), `AppSidebar.vue` | A spec `layout-navigation` permite item sem `to`, mas o clique apenas fecha/marca estado → sugerir estado "Em construção" (tooltip/disabled) |
| **MEL-04** | Indicador de carregamento de rota | `nuxt.config.ts` (`app.loadingIndicator`) | Irrelevante hoje (páginas estáticas); necessário quando houver listagens assíncronas |

---

## 8. Pontos conformes (não exigem ação)

- **Fronteira visual de áreas:** `/` sem shell (`sidebar=0`, `toggle=0`), `/admin` com shell completo, `/design` fora do shell; rótulos "Área Pública" e "Painel Executivo" presentes.
- **Viewport meta** em todas as rotas (`width=device-width, initial-scale=1`).
- **Tabelas responsivas:** `UiDataTable` com `overflow-x-auto`; cabeçalho/toolbar/rodapé em `flex-col sm:flex-row`; busca `w-full sm:w-64`.
- **Zero-pill:** `UiBadge` usa `rounded-md`; as 21 ocorrências de `rounded-full` são pontos/avatars/previews circulares.
- **Tokens de marca:** `.bg-brand-primary` e `.border-brand-focus` presentes no CSS servido; degradê restrito a `Button primary`, cabeçalho do `UiModal` e trilha do `UiSlider` (spec `brand-tokens`).
- **Acessibilidade do kit:** `UiModal` (focus trap, Esc, `aria-modal`, lock de scroll, `max-h-[75vh]`), `UiSelect` (label `for`+`id`, `combobox`/`listbox`, setas, auto-inversão, estado vazio), `UiTabs` (roving tabindex + Setas/Home/End), `UiCalendar` (`role="grid"` + `aria-selected`/`aria-current`), `UiTooltip` (`focusin` + correção por `translate`), `UiUploadFiles` (alvos de 44px em mobile), menus do header (`role="menu"`, Escape, clique fora, mutualmente exclusivos), `NuxtRouteAnnouncer`.
- **Breakpoints nas páginas:** `p-4 sm:p-6 lg:p-8`; grids `lg:grid-cols-2`, `md:grid-cols-2`, `sm:grid-cols-3`; vitrine `flex-col lg:flex-row`.
- **Estados vazios:** `DataTable` ("Nenhum dado encontrado com o filtro aplicado."), `Select` ("Nenhum resultado encontrado…"), notificações ("Nenhuma notificação nova."), `UploadFiles`.
- **Loading:** `UiButton` com `loading` (spinner + `disabled`).

---

## 9. Escopos não aplicáveis

| Escopo | Motivo |
| :--- | :--- |
| Status de publicação → variante `Badge` (listagem × detalhe × Área Pública) | Módulos de publicação (Release Week, Manuais, Escopo de Projetos) ainda não construídos |
| Loading/paginação reais, exportações, confirmação destrutiva | Sem `server/` e sem telas de CRUD |
| Autenticação/RBAC e proteção real de `/admin` | Camada de servidor inexistente → **encaminhar a qa-seguranca/qa-funcional** |
| Verificação visual em navegador (screenshots/medidas) | Auditoria original: parcial (código + SSR) — **revalidada por CDP** nas Etapas 1-3 (Edge headless, 320–1440px, screenshots de evidência) |

---

## 10. Veredito

**APROVADO SEM RESSALVAS** — os **12 bugs do relatório estão fechados** em 02/10/2026:

- **BUG-01 (Alta)** — change OpenSpec `montar-toast-container-global`: `<UiToastContainer />` montado globalmente; SSR com `role="status"`/`aria-live` nas 4 rotas + E2E de toasts **24/24**.
- **BUG-02, BUG-03, BUG-04 (Médios)** — change `tipografia-responsividade-erros-acessiveis`: Google Fonts + `fontFamily` (CSS `jakarta=3 jetbrains=2`, fontes aplicadas 7/7), shell responsivo com drawer `<lg`/rail + `matchMedia` (verificação 28/28 em 375/768/1024) e mensagens de erro acessíveis com `role="alert"` + `aria-describedby` (12/12).
- **BUG-05 … BUG-12 (Baixos)** — change `polimento-404-kit-vitrine`: `app/error.vue` pt-BR com status 404 real; `font-mono tabular-nums` em `UiKpi` e `tabular-nums` por `isNumeric` no `DataTable`; `flex-wrap` nas marcas do `UiSlider` e no cabeçalho de retenção; auto-inversão do `UiDatePicker` + `w-72 max-w-full` no `UiCalendar` (em página **e** no modal §15, verificado a 320px); vitrine §8 totalmente com o kit; duplicata do `useToast` removida; cabeçalho da vitrine e os 5 cabeçalhos de seção com `flex-wrap`/`min-w-0`.
- **Gate da seção 6:** checklist **6.1 completa (verde)** — checagem CDP unificada **19/19**, gate de revalidação **23/23** (teclado: abas/modal/menus/tabela; modal a 320px com foco preso), SSR das 3 frentes de shell, zero-pill/tokens conferidos e **`npm run build` OK** após todos os cambios.

A auditoria original não alterou código; as correções das Etapas 1, 2 e 3 foram aplicadas pelo fluxo de implementação do OpenSpec e validadas com evidência reproduzível (screenshots em `%TEMP%\opencode\etapa3-*.png` e `gate6-modal320.png`, scripts CDP reexecutáveis). Restam apenas as melhorias **MEL-01 … MEL-04** (seção 7), não bloqueantes.

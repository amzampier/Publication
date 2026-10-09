# 07 - Perfis de Acesso (RBAC) — Área Administrativa

**Versão:** 1.5.0 — **Data:** 2026-10-09 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal de Perfis de Acesso (RBAC) - listagem (base em memória) com cabeçalho
(Novo Perfil), KPIs e tabela com contagem de permissões e de usuários vinculados; **"Novo
Perfil" e "Editar" abrem o modal de cadastro/edição** (`PerfisFormulario`), **"Excluir" abre
o modal de confirmação com guarda de vínculo** e **"Configurar permissões" abre o modal da
matriz** (`PerfisPermissoes` — 4 ações fixas em interruptores, Funcionalidades em chips
clicáveis) — mais a **matriz normativa de
permissões** (4 perfis × 11 módulos × 9 ações) que este modal implementa (§7/§3.7)
**Arquivos-fonte:** [`app/pages/admin/perfis-acesso.vue`](../app/pages/admin/perfis-acesso.vue) ·
[`app/components/perfis/`](../app/components/perfis) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — **seção 19** espelha o `UiTextarea` e a
**seção 20** o `UiSwitch` do kit (§4); a seção 14 espelha o rótulo unificado do menu da conta
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) — componentes do kit
usados (`UiButton`, `UiBadge`, `UiKpi`, `UiDataTable`, `UiTooltip`, `UiInput`, `UiTextarea`,
`UiSegmented`, `UiSwitch`, `UiModal`)
**Autoridade de comportamento:** specs da capability `perfis-acesso`
(`openspec/specs/perfis-acesso`, sincronizada nesta change via `/opsx-sync`)

> Este documento é a referência da tela `/admin/perfis-acesso` e de tudo o que foi criado para
> ela — componentes de domínio, modais de cadastro/exclusão/**permissões** e, sobretudo, da
> **matriz de permissões normativa** (§7), a fonte que o modal de permissões por perfil (§3.7)
> implementa célula a célula.
> Toda alteração aqui deve manter as specs da change e a implementação coerentes.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (criados/alterados)](#4-componentes-de-kit-criadosalterados)
5. [Comportamento das ações (transição + modal de exclusão)](#5-comportamento-das-ações-transição--modal-de-exclusão)
6. [Dados de demonstração](#6-dados-de-demonstração)
7. [Matriz de permissões (normativa)](#7-matriz-de-permissões-normativa)
8. [Navegação até a tela](#8-navegação-até-a-tela)
9. [Estilo e CSS dedicado](#9-estilo-e-css-dedicado)
10. [Vitrine `/design`](#10-vitrine-design)
11. [Especificações OpenSpec](#11-especificações-openspec)
12. [Verificação](#12-verificação)
13. [Pendências e próximos passos](#13-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

Os Perfis de Acesso (RBAC) são a tela de administração de perfis e suas permissões da Área
Administrativa:

- **Rota:** `/admin/perfis-acesso` → `app/pages/admin/perfis-acesso.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`
  (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Modelo de dados:** conforme o `docs/02` §3.5 (tabelas `perfis`/`perfil_permissoes`) —
  `id` (UUID — identificador único, sem `codigo_perfil`), nome, descrição, `situacao`
  (Ativo/Inativo/Bloqueado), timestamps e a
  matriz de permissões por módulo (4 ações booleanas fixas + `permissoes_extras`).
  `padrao_sistema` e `cor_identificacao` são colunas futuras do banco, fora do UI atual
  (`docs/02` §3.5).
- **Fase 1:** listagem **inteiramente em memória** — `useState('perfis-base')`, sem `server/`,
  sem requisições de dados (API); a base se restaura a cada recarga.
- **Modal de cadastro/edição (change `perfis-acesso-modal-cadastro-edicao`):** "Novo Perfil"
  e "Editar" (`Pencil`) **abrem o modal** `PerfisFormulario` — nome, descrição
  (`UiTextarea`) e situação (sem campo de código: o identificador é o UUID gerado na
  criação); na edição a
  seção "Informações de Cadastro" exibe `criado_em`/`atualizado_em` desabilitados. Perfil
  novo nasce com matriz vazia (0/99) e 0 usuários.
- **Modal de exclusão (change `perfis-acesso-modal-exclusao`):** "Excluir" (`Trash2`) **abre o
  modal** `PerfisExclusao` (`UiModal size="sm"`); ao confirmar com usuários vinculados o modal
  fecha e um `toast.warning` informa o bloqueio (sem tocar na base) — espelho da validação
  futura do banco (docs/02 §3.5); sem vínculos a remoção acontece.
- **Modal de permissões (change `perfis-acesso-modal-permissoes`):** "Configurar
  permissões" (`KeyRound`) **abre o modal** `PerfisPermissoes` (`UiModal size="xl"`) com as
  4 ações fixas em interruptores, Funcionalidades em chips clicáveis, abas por sessão,
   rascunho isolado e gravação em memória (§3.7) — sem toast de
   transição. **Modal de filtros** (`PerfisFiltros`, §3.8) refina o conjunto vigente e o
   **menu "Relatórios"** do cabeçalho (§3.1) exporta em PDF/CSV sobre esse conjunto
   (change `perfis-acesso-filtros-exportacao`).
- **Matriz semeada:** a coluna "Permissões" e o KPI "Permissões concedidas" derivam da matriz
  declarada em `usePerfisDemo.ts` (§3.4) — a mesma que o §7 normatiza.

## 2. Estrutura da página (componentização)

A página é fina e **dona dos estados de coordenação** (modais de cadastro, exclusão e
permissões). Cada parte é um componente em `app/components/perfis/` (auto-import com
prefixo `Perfis*`):

```
admin/perfis-acesso.vue            (page - definePageMeta + composição + coordenação)
├── <PerfisCabecalho @novo />      → tile #f5b302 + título + menu "Relatórios" + "Novo Perfil"
├── <PerfisKpis class="mt-6" />    → 5 UiKpi do conjunto VIGENTE (filtrado, se houver filtro)
├── <PerfisTabela ref="tabelaRef"
│                  class="mt-5"
│                  @permissoes @editar @excluir @open-filters />  → UiDataTable (busca + Filtros + badges + ações)
├── <PerfisFiltros v-model="filtrosAbertos" />                    → modal de filtros (§3.8)
├── <PerfisFormulario v-model :modo :perfil />      → modal de cadastro/edição (§3.6)
├── <PerfisPermissoes v-model :perfil />            → modal da matriz — abas por sessão, fixas em switches + Funcionalidades em chips (§3.7)
└── <PerfisExclusao v-model :perfil @confirmar />   → modal de confirmação (§3.5)
```

- **Estado de coordenação:** `modalAberto`/`modo`/`perfilEditar` (cadastro/edição),
  `permissoesAbertas`/`perfilPermissoes` (permissões), `exclusaoAberta`,
  `perfilExcluir`, `filtrosAbertos` (filtros) e `tabelaRef<{ focarBusca }>` (mesmo padrão de
  `gestao-usuarios`). `abrirNovo()` abre em modo criação; `abrirEdicao(linha)` resolve o
  registro **completo** por `id` na base vigente (timestamps e matriz) e abre em modo edição;
  `abrirPermissoes(linha)` resolve o registro por `id` e abre a matriz; `abrirExclusao(perfil)`
  sempre abre o modal; `confirmarExclusao()` fecha e, **se
  `perfil.usuarios > 0`**, `toast.warning` de bloqueio **sem tocar na base**; sem vínculos
  chama `excluirPerfil()` → `toast.success` → `nextTick(focarBusca)`.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8` (mesmo
  padrão de Usuários e Auditoria).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<PerfisCabecalho>`

- Cabeçalho sem container (padrão `UsuariosCabecalho`): tile `bg-brand-primary` com
  `ShieldCheck` em `#f5b302`, título "Perfis de Acesso (RBAC)" e subtítulo "Administração dos
  perfis de acesso — permissões por módulo, usuários vinculados e status."
- **Botão "Novo Perfil"** (`UiButton` primary + `Plus`): **emite `@novo`** para a página, que
  abre o `PerfisFormulario` em modo criação (§3.6).
- **Menu "Relatórios"** (`UiButton` outline + `NotebookText` + `ChevronDown`, mini-menu
  `role="menu"` à esquerda de "Novo Perfil" — molde do `UsuariosCabecalho`; click-outside e
  `Escape` fecham, `aria-haspopup`/`aria-expanded` no gatilho):
  - **"Relação de perfis"** (`FileDown`) → `gerarPdfPerfis()` baixa `perfis.pdf` (A4
    paisagem + `jspdf-autotable`, logo de login quando houver, colunas Nome/Descrição/Status/
    Usuários/Permissões, paginação `Página X de Y`) — sem `window.print()`;
  - divisor (`role="separator"`);
  - **"Exportar em CSV"** (`FileSpreadsheet`) → `perfis.csv` com `;`, BOM UTF-8 e cabeçalho
    `Nome;Descrição;Status;Usuários;Permissões`.
  Ambos exportam o **conjunto vigente** (`perfisFiltrados` — com filtro aplicado, só o
  conjunto filtrado).

### 3.2 `Kpis.vue` → `<PerfisKpis>`

5 `UiKpi` em `grid sm:grid-cols-2 xl:grid-cols-5` (5 colunas só a partir de 1280px — em
1024–1279px o grid fica 2×N para o valor longo `171/396` não truncar, correção UX-M1), todos
derivados do conjunto vigente (`perfisFiltrados` do `useState` — a base completa sem filtro, o
conjunto filtrado com filtro do módulo aplicado):

| KPI | Valor (base demo) | Cor (`cor` do `UiKpi`) | Ícone |
| :--- | :--- | :--- | :--- |
| Total de perfis | `4` | `#f5b302` (dourado RBAC) | `ShieldCheck` |
| Ativos | `4` | `#047857` (esmeralda) | `UserCheck` |
| Inativos | `0` | `#64748b` (slate) | `UserX` |
| Bloqueados | `0` | `#be123c` (rose-700) | `ShieldOff` |
| Permissões concedidas | `171/396` | `#112051` (navy) | `KeyRound` |

- "Permissões concedidas" = **soma das permissões verdadeiras de todos os perfis /**
  **`perfis × 99`** (`99 = 11 módulos × 9 ações`).
- **Inativos e Bloqueados = 0 é comportamento esperado** (design D7): os 4 perfis demo são os
  canônicos em uso pelos 16 usuários da base de Gestão de Usuários, todos Ativo; a situação
  muda pelo modal de edição (§3.6).
- Os KPIs recalculam sempre que o conjunto de perfis muda — criação, edição, exclusão,
  mudança de situação **ou aplicação/limpeza de um filtro do módulo** (spec `perfis-acesso`;
  com filtro aplicado os cinco KPIs refletem só o conjunto filtrado — ex.: Status =
  Bloqueado → Total 0 e Permissões `0/0`).

### 3.3 `Tabela.vue` → `<PerfisTabela>`

- `UiDataTable` **com** `show-filters` (botão "Filtros" com badge de critérios ativos —
  `:filters-count="filtrosAtivosCount"`, emitindo `@open-filters` para a página abrir o
  `PerfisFiltros`, §3.8) além da busca textual do kit com `show-header-top`,
  `title="Perfis de Acesso"`,
  `subtitle="Base de demonstração — fase 1 em memória · Permissões: ações concedidas de 99 (11
módulos × 9 ações)"` (legenda do `n/99` — UX-B2), `default-page-size="5"`.
- **Colunas (6 — cinco de dados + Ações, sem rolagem horizontal em ≥ ~1280px):**

| Coluna | Origem | Formatação |
| :--- | :--- | :--- |
| Nome | `perfil.nome` | texto |
| Descrição | `perfil.descricao` | texto (elástica) |
| Usuários | `usuariosPorPerfil[nome]` — **derivada** da base de usuários | `align: 'right'`, `font-mono tabular-nums` |
| Permissões | `contarPermissoes(perfil)/99` — **derivada** da matriz | `align: 'right'`, `font-mono tabular-nums` |
| Status | `perfil.situacao` | `UiBadge` via `VARIANTE_POR_STATUS` (Ativo `done`, Inativo `neutral`, Bloqueado `blocked`) |
| Ações | gatilhos | `KeyRound` · `Pencil` · `Trash2` (tooltip + `aria-label` próprios) |

- As ações **emitem** `@permissoes`, `@editar` e `@excluir` com a linha (`LinhaPerfil`); a
  página converte Permissões em abertura do modal da matriz (`abrirPermissoes`), **Editar em
  abertura do modal de cadastro/edição** (`abrirEdicao`) e **Excluir em abertura do modal de
  exclusão** (`abrirExclusao`). Ícones em `text-slate-400` com cor semântica só no hover
  (âmbar para permissões, `brand-focus` para editar, `rose-700` para excluir) — mesmo padrão
  da tabela de usuários.
- **`defineExpose({ focarBusca })`** encadeia a busca do `UiDataTable` (cópia de
  `usuarios/Tabela.vue`): usado pela página após a exclusão confirmar, pois o `Trash2` sai do
  DOM com a linha.

### 3.4 `usePerfisDemo.ts` — composable de estado (matriz e contagens)

- **Tipos:** `PerfilDemo` (`id` UUID, `nome`, `descricao`, `situacao`, `criado_em`,
  `atualizado_em`, `permissoes`), `SituacaoPerfil` (`'Ativo' | 'Inativo' | 'Bloqueado'`),
  `ModoPerfis` (`'novo' | 'editar'`), `ModuloId` (11), `Acao` (4), `Extra` (5),
  `Permissao = Acao | Extra`.
- **Constantes:** `MODULOS` (11 rótulos idênticos aos da sidebar + `descricao` curta p/ a
  lista do modal), `ACOES`, `EXTRAS`,
  `PERMISSOES_POR_PERFIL = 99`, `VARIANTE_POR_STATUS` (3 estados: `done`/`neutral`/`blocked`).
- **`MATRIZ_SEED`:** `Record<PerfilId, Record<ModuloId, Permissao[]>>` montado por regras
  (`ACOES_TUDO`, `CONTEIDO_EDITOR`, `CONTEIDO_REVISOR`, `CONTEIDO_LEITOR`) — declaração
  única das regras do §7; `matriz()` sempre copia as listas (sem referência compartilhada);
  `matrizVazia()` devolve os 11 módulos sem ações (0/99) para perfis novos.
- **Helpers puros:** `contarPermissoes(perfil)` → soma dos módulos (99/45/21/6);
  `excluirPerfil(base, id)` → devolve a base nova sem o perfil (matriz vai junto, pois vive no
  objeto); `salvarPerfil(base, registro, modo)` → criação acrescenta clone ao fim da base,
  edição substitui o registro do mesmo id — mesmo contrato imutável de `excluirUsuario`;
  `salvarPermissoes(base, id, permissoes)` → troca a matriz do perfil (clone) — id
  inexistente devolve a base intacta.
- **Estado:** `useState('perfis-base', () => PERFIS_DEMO.map(clonar))` — clona a semente na
  carga; a recarga restaura. **Filtros** em `useState('perfis-filtros')` com o tipo
  `FiltrosPerfis` (`perfil`/`situacao`, `''` = todos) — também descartados na recarga.
- **Derivados (design D2/D3):** `perfisFiltrados` (aplica os critérios de `filtros`),
  `filtrosAtivosCount` (0..2), `opcoesPerfis` (nomes da **base** ordenados em pt-BR),
  `limparFiltros()`, `linhas` (a linha da tabela com `usuarios` e `permissoesTexto`),
  `usuariosPorPerfil` (conta `useUsuariosDemo().usuarios` por perfil), `totalPermissoesConcedidas`
  (171) e `totalPermissoesPossiveis` (396) — todos sobre o conjunto filtrado (KPIs e tabela
  refletem o filtro; a opção `SITUACOES` alimenta o select de Status do `PerfisFiltros`).
- **Dependência cross-module:** `perfis/` importa `usuarios/` somente para leitura (sem ciclo)
  — criar/excluir um usuário em `/admin/gestao-usuarios` altera a coluna "Usuários" sem
  recarregar a página.

### 3.5 `Exclusao.vue` → `<PerfisExclusao>` (modal de confirmação)

- **Apresentação pura** (a página é dona do estado e da gravação — molde de
  `usuarios/Exclusao.vue`): props `modelValue: boolean` + `perfil: LinhaPerfil | null`;
  emite `update:modelValue` e `confirmar`; sem toasts nem escrita na base.
- `UiModal` `size="sm"` com `title="Excluir Perfil"`, `subtitle="Confirme a exclusão do
  perfil da base em memória"` e ícone `Trash2` (herda todo o comportamento do kit: backdrop
  não fecha, `Escape`/`X`, focus-trap, devolução de foco — `docs/01` §5.12).
- Corpo (`UiModalSection` "Este perfil será excluído", ícone `ShieldX`): **nome** do perfil,
  **`Usuários Vinculados: N`** (`font-mono tabular-nums`) e o aviso rose `text-rose-700` com
  `AlertTriangle` ("Esta ação não pode ser desfeita…"). Sem descrição (identificação mínima,
  decisão da change).
- Rodapé: `UiButton outline` "Cancelar" + `UiButton danger` "Excluir" (habilitado desde a
  abertura — sem type-to-confirm; a trava é a guarda de vínculo na página, §2).

### 3.6 `Formulario.vue` → `<PerfisFormulario>` (modal de cadastro/edição)

- **Modal completo** no molde de `usuarios/Formulario.vue` (página dona da coordenação):
  props `modelValue: boolean`, `modo: ModoPerfis` (`'novo' | 'editar'`) e
  `perfil: PerfilDemo | null`; emite `update:modelValue`; grava via `salvarPerfil()` +
  `toast.success` ("Perfil criado com sucesso." / "Perfil atualizado com sucesso.").
- `UiModal` `size="md"`, `title="Novo Perfil"`/`"Editar Perfil"`, `subtitle="Dados
  cadastrais do perfil de acesso"` e ícone `ShieldCheck` (comportamento do kit: backdrop não
  fecha, `Escape`/`X`, focus-trap — `docs/01` §5.12).
- **Seção "Dados do Perfil"** (`UiModalSection`): **Nome** (`UiInput`, obrigatório);
  **Situação** (`UiSegmented` com `Ativo` emerald / `Inativo` slate / `Bloqueado` rose) —
  na mesma linha do Nome (grid sem buracos); **Descrição** (`UiTextarea` — componente novo do
  kit, §4/`docs/01` §5.18, `rows=3`) em largura cheia abaixo.
  **Sem campo de código** — o identificador é o `id` UUID gerado na criação (a tabela alvo
  não tem `codigo_perfil`, `docs/02` §3.5).
- **Seção "Informações de Cadastro"** (`v-if="modo === 'editar'"`, ícone `Clock`): **Data
  Cadastro** e **Data Alteração** (`UiInput` desabilitados — fundo `slate-200` de somente
  leitura, `dd/mm/yyyy` **sem horário**
  — a data de acesso de usuários mantém `dd/mm/yyyy HH:mm`). A criação abre só com a seção 1.
- **Mecânica (cópia do molde):** rascunho inicial vazio (criação) ou cópia do registro
  (edição); `validar()` puro reaparecendo só nos campos que já falharam; `ORDEM_FOCO`
  (`nome`) com foco no 1º erro; `Enter` navega em cadeia entre inputs (o
  `UiTextarea` é ignorado — Enter quebra linha). Ao salvar: criação grava `criado_em` =
  `atualizado_em` = instante atual; edição preserva `criado_em` e grava `atualizado_em` do
  salvamento. Perfil novo nasce com `id` gerado por `crypto.randomUUID()` (na gravação via
  `salvarPerfil`), `matrizVazia()` (**0/99**) e 0 usuários.
- **Aceite documentado (demo):** renomear um perfil zera a contagem de **Usuários** dele e
  diverge do dropdown fixo de `/admin/gestao-usuarios` (o casamento é por **nome literal**
  com `useUsuariosDemo`); universos desacoplados, restaurados na recarga — a consistência por
  construção vem quando o dropdown passar a derivar da base de perfis (§13, backend).

### 3.7 `Permissoes.vue` → `<PerfisPermissoes>` (modal da matriz de permissões)

- **Modal completo** (página dona da coordenação, mesmo padrão do `Formulario`): props
  `modelValue: boolean` e `perfil: PerfilDemo | null`; emite `update:modelValue`; grava via
  `salvarPermissoes()` + `toast.success` ("Permissões do perfil atualizadas com sucesso.").
- `UiModal` `size="xl"`, `title="Permissões"`, `subtitle="<nome> · matriz de 11 módulos
  (99 permissões)"` e ícone `KeyRound` (comportamento do kit: backdrop não fecha,
  `Escape`/`X`, focus-trap — `docs/01` §5.12).
- **Tabela-cartão própria** (modelo de referência do usuário): `<table>` dentro de
  `rounded-xl border border-slate-200` com cabeçalho `bg-slate-50` (headers em versalete
  `bold slate-500`) e 1ª coluna `sticky left-0` no scroll horizontal — **não** é
  `UiDataTable`. Linhas = módulos da aba ativa com **nome em `font-semibold` + descrição
  curta** (`MODULOS[].descricao`, em `slate-500` para contraste AA) embaixo — o hover da
  linha (`slate-50/70`) cobre também a coluna sticky; colunas = **as 4 ações fixas** (`visualizar`,
  `criar`, `alterar`, `excluir`) com um **`UiSwitch` por célula** (`aria-label`
  "<Módulo>: <ação>") e a coluna **Funcionalidades**, com os 5 **chips clicáveis**
  (`UiCheckChip size="sm"`, rótulo capitalizado) das ações extras — ligar/desligar atualiza
  o rascunho como os interruptores. **Sem atalhos de seleção em lote** (nenhum interruptor
  de "selecionar todos" em linha/coluna) e **sem toolbar de filtros** (busca/segmentados
  ficam para a arquitetura futura) — decisões do usuário.
- **Identidade e navegação por sessão (fonte única):** cada linha exibe o **ícone e a cor
  da sidebar** (`app/config/navigation.ts`, casados por rótulo — os 11 rótulos são
  idênticos) numa pílula `rounded-md` com fundo `${cor}1a`; os módulos ficam repartidos em
  **abas `UiTabs` pelas 4 sessões** da sidebar (Publicações/Movimentos/Cadastros/
  Administração — aba ativa volta à primeira na abertura, `role="tabpanel"` com
  `permissoes-panel-*`/`permissoes-tab-*`). O rodapé informativo com ícone `Info` explica a
  régua (fixas com interruptor, Funcionalidades em chip, nada vale até "Salvar") e o
  contador **"n/99"** **global** aparece num `UiBadge` (variant `done` em 99/99, `pending`
  parcial, `neutral` em 0; região viva `aria-live="polite"` — leitores de tela ouvem a nova
  contagem) — trocar de aba não muda o contador.
- **Rascunho isolado:** a matriz é copiada para um `ref` na abertura; nada altera a base
  antes de **Salvar** → `salvarPermissoes(perfis, id, rascunho)` → coluna Permissões + KPIs
  recalculam (computeds da §3.4) e o modal fecha; **Cancelar/Escape/X** descartam. Recarga
  restaura a semente.
- **Administrador editável como os demais** (decisão do usuário — sem trava por papel) e
  perfil novo (0/99) pode ter a matriz preenchida no mesmo modal.
- **Cópia entre perfis (rodapé):** dois ícones **alinhados à esquerda** do rodapé (grupo
  `mr-auto` no slot; `Cancelar`/`Salvar` seguem à direita) — `ClipboardPaste` **"Copiar
  permissões de outro perfil"** (tooltip "Copiar de outro perfil — vale após Salvar") abre
  o modal filho (`UiModal size="sm"`, subtítulo "Origem — substitui o rascunho; só vale após
  Salvar") com um `UiChoiceCard` por perfil candidato (nome, descrição e badge `n/99` com
  `badge-mono` — o perfil atual nunca aparece; sem candidatos, estado vazio) e **substitui o
  rascunho** por inteiro (clone via `clonarMatriz`, sem mescla) com `toast.info` reforçando
  "vale após Salvar"; `ClipboardCopy` **"Copiar permissões para outro perfil"** (tooltip
  "Copiar para outro perfil — grava imediatamente") abre o mesmo seletor (subtítulo
  "Destino — grava já a matriz salva; Cancelar não desfaz") e grava **imediatamente** no
  alvo a **matriz salva** do perfil corrente (nunca o rascunho, mesmo com células editadas)
  via `salvarPermissoes` + `toast.success` com o valor substituído (ex.: "substituiu 6/99") —
  a linha do alvo e os KPIs recalculam na hora e o Cancelar/Escape/X do modal pai **não
  desfaz** a cópia. O
  fechamento do filho devolve o foco ao ícone que o abriu (pilha de modais, `docs/01`
  §5.12); nenhuma das duas cópias faz HTTP e ambas se perdem na recarga.

### 3.8 `Filtros.vue` → `<PerfisFiltros>` (modal de filtros)

- **Apresentação pura + estado no composable** (molde exato de `usuarios/Filtros.vue`):
  props `modelValue: boolean`; emite `update:modelValue`; a página é dona do estado
  (`filtrosAbertos`) e o rascunho vive no próprio modal.
- `UiModal size="sm"` com `title="Filtros de Perfis"`, `subtitle="Perfil e status"` e ícone
  `Funnel`; duas `UiModalSection`:
  - **Perfil** (ícone `ShieldCheck`): `UiSelect` com as opções derivadas da **base**
    (`opcoesPerfis`, ordenadas em pt-BR — um filtro de Status não esconde opções de Perfil);
  - **Status** (ícone `Activity`): `UiSelect` com `Ativo`/`Inativo`/`Bloqueado` (`SITUACOES`).
  Ambos com `''` = todos (placeholder "Todos os perfis"/"Todos os status") e `clearable` — o
  `X` devolve o critério a "todos".
- **Rascunho sincronizado na abertura** (`watch` de `modelValue`): **Aplicar** grava
  `filtros.value` e fecha; **Cancelar**/`Escape`/`X` do cabeçalho fecham descartando;
  **Limpar Filtros** (rodapé esquerdo) zera rascunho **e** estado aplicado mantendo o modal
  aberto (Cancelar/Aplicar à direita — mesmo rodapé de `UsuariosFiltros`).
- **Estado aplicado** vive em `useState('perfis-filtros')` (§3.4): `perfisFiltrados`,
  `filtrosAtivosCount` (badge 0..2 do botão "Filtros") e `limparFiltros()`; tudo em memória,
  descartado na recarga — sem nenhuma requisição HTTP.

## 4. Componentes de kit (criados/alterados)

- **Criado: `UiTextarea`** (`app/components/ui/Textarea.vue`) — campo multilinha do kit para
  `descricao`, com o mesmo contrato visual e de acessibilidade do `UiInput`: foco recortado
  `.ds-bottom-clip` em `brand-focus`, erro em `rose-700` com ícone+tooltip e mensagem
  `sr-only` `role="alert"` via `aria-describedby`; `rows` (padrão 3), `resize-y`, Enter quebra
  linha e Tab sai do campo. Entra pelas três portas da regra do repo: spec
  `design-system/textarea` (+ `form-control-states` atualizada para incluir `Textarea`),
  seção **§5.18** do `docs/01` e **seção 19** da vitrine `/design`.
- **Criado: `UiSwitch`** (`app/components/ui/Switch.vue`) — interruptor binário para a matriz
  de permissões: `<button role="switch" aria-checked>`, `v-model`, `label` opcional associada
  e `ariaLabel` (células), trilha `slate-300` desligada → **`brand-focus #1a9e07`** ligada,
  Space/Enter alternam, foco `brand-focus`, `disabled` nativo. Spec `design-system/switch`,
  seção **§5.19** do `docs/01` e **seção 20** da vitrine.
- Os demais componentes usados (`UiButton`, `UiBadge`, `UiKpi`, `UiDataTable`, `UiTooltip`,
  `UiInput`, `UiSegmented`, `UiModal`, `UiModalSection`) permanecem sem alteração.
- **Nenhum CSS dedicado** (§9).

## 5. Comportamento das ações (modais)

**Novo Perfil e Editar** abrem o `PerfisFormulario` (§3.6); **Excluir** abre o
`PerfisExclusao` (§3.5); **Configurar permissões** abre o `PerfisPermissoes` (§3.7) — nenhum
controle de linha exibe mais toast de transição.

| Gatilho | Local | Comportamento atual | Pendência |
| :--- | :--- | :--- | :--- |
| **Novo Perfil** (`Plus`) | cabeçalho | abre `PerfisFormulario` modo criação (§3.6) | — (entregue) |
| **Configurar permissões** (`KeyRound`) | linha | abre `PerfisPermissoes` com a matriz do perfil (§3.7) | — (entregue) |
| **Editar perfil** (`Pencil`) | linha | abre `PerfisFormulario` modo edição com o registro completo (§3.6) | — (entregue) |
| **Excluir perfil** (`Trash2`) | linha | abre `PerfisExclusao` (§3.5); confirmar com vínculos → modal fecha + `toast.warning` de bloqueio (base intacta); sem vínculos → remove + `toast.success` + foco na busca | — (entregue) |

- Salvar no modal de permissões: `salvarPermissoes()` → linha/KPIs recalculam em memória →
  `toast.success` → modal fecha; descartar (Cancelar/Escape/X) não toca na base.
- **Filtros** (`Filtros`, §3.8): o botão "Filtros" da toolbar abre o `PerfisFiltros`;
  "Aplicar" grava o rascunho e fecha (tabela, KPIs e exportações passam a refletir o
  conjunto filtrado), "Cancelar"/`Escape`/`X` descartam o rascunho e "Limpar Filtros" zera
  rascunho e estado aplicado com o modal aberto — o badge do botão conta só o estado
  aplicado (0..2).
- **Cópias no rodapé do modal de permissões:** importar (`ClipboardPaste`) só substitui o
  rascunho (efeito no Salvar); exportar (`ClipboardCopy`) grava a matriz **salva** do
  perfil corrente no alvo na hora, com toast próprio — o descarte do modal corrente não
  desfaz a exportação.

- Salvar no modal: validação OK → `salvarPerfil()` → linha/tabela/KPIs atualizados em memória
  → `toast.success` → modal fecha. Erro de validação → modal aberto, mensagem no campo, foco
  no 1º erro.
- **Guarda de vínculo:** `perfil.usuarios > 0` barra a exclusão **no clique de "Excluir"** do
  modal (a contagem no corpo do modal antecipa o motivo) — espelho da validação de integridade
  que o backend imporá (docs/02 §3.5).
- **Busca** é recurso do `UiDataTable`: filtra a visualização **sem** alterar o conjunto
  vigente nem os KPIs.
- **Exportação** (menu "Relatórios" do cabeçalho, §3.1): "Relação de perfis" gera
  `perfis.pdf` e "Exportar em CSV" baixa `perfis.csv` (`;` + BOM UTF-8) — ambos sobre o
  conjunto vigente (filtrado, se houver filtro), sem `window.print()`.

## 6. Dados de demonstração

- Base de **4 perfis** (mesmos `PERFIS` de `useUsuariosDemo`), **todos Ativo**, com ids fixos
  (`p-001`…`p-004`) e timestamps fixos (`2026-01-05T08:00:00.000Z` — nada de `Date.now()`
  na semente, para não divergir a hidratação cliente/servidor):

| Perfil | Descrição | Usuários | Permissões |
| :--- | :--- | ---: | ---: |
| Administrador | Acesso total ao sistema, incluindo perfis de acesso e configurações globais. | 2 | 99/99 |
| Editor | Produz, publica e mantém conteúdos e cadastros do portal. | 5 | 45/99 |
| Revisor | Revisa e homologa conteúdos na esteira, sem criar nem excluir registros. | 4 | 21/99 |
| Leitor | Consulta e baixa os conteúdos publicados. | 5 | 6/99 |

- KPIs da base completa: **Total 4 · Ativos 4 · Inativos 0 · Bloqueados 0 · Permissões
  concedidas 171/396** (`99 + 45 + 21 + 6 = 171`; `4 × 99 = 396`). Criar um perfil na demo
  leva o KPI a `171/495` (matriz vazia não soma permissões).
- **Nenhuma persistência:** a recarga restaura a semente; o estado vive em `useState`
  (perde-se ao fechar a aba/sessão).
- **Contagens nunca digitadas:** usuários (2/5/4/5) vêm da base vigente de usuários e
  permissões (99/45/21/6) da matriz — ambas calculadas em `computed`.

## 7. Matriz de permissões (normativa)

**Esta seção é a fonte da verdade das permissões do sistema** e é o que o modal de
permissões por perfil (`PerfisPermissoes`, §3.7) implementa célula a célula. A listagem
exibe apenas a **contagem** derivada desta matriz (§3.4).

**Legenda de ações** (9 por módulo — `docs/02` §3.5):

| Fixas | Extras (`permissoes_extras`) |
| :--- | :--- |
| `visualizar` · `criar` · `alterar` · `excluir` | `publicar` · `arquivar` · `download` · `exportar` · `importar` |

**Módulos (11)** — mesmos rótulos da sessão correspondente da sidebar (`app/config/navigation.ts`):
Manuais, Release Week, Escopo de Projetos (Publicações); Esteira de Revisão, Lançar as
Chamadas (Movimentos); Parceiros, Softwares (Cadastros); Gestão de Usuários, Perfis de Acesso
(RBAC), Gestão de Auditoria, Configurações Globais (Administração).

### 7.1 Administrador — 99/99

Acesso irrestrito: **todas as 9 ações em todos os 11 módulos** (único perfil que acessa
Próprios **Perfis de Acesso (RBAC)** e **Configurações Globais**, e o único com `excluir` em
qualquer módulo).

### 7.2 Editor — 45/99

| Módulo | visualizar | criar | alterar | excluir | publicar | arquivar | download | exportar | importar |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Manuais | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | – |
| Release Week | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | – |
| Escopo de Projetos | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | ✔ | – |
| Esteira de Revisão | ✔ | ✔ | ✔ | – | ✔ | ✔ | – | – | – |
| Lançar as Chamadas | ✔ | ✔ | ✔ | – | ✔ | ✔ | ✔ | – | – |
| Parceiros | ✔ | ✔ | ✔ | – | – | – | – | ✔ | – |
| Softwares | ✔ | ✔ | ✔ | – | – | – | – | ✔ | – |
| Gestão de Usuários | ✔ | – | – | – | – | – | – | ✔ | ✔ |
| Perfis de Acesso (RBAC) | – | – | – | – | – | – | – | – | – |
| Gestão de Auditoria | ✔ | – | – | – | – | – | – | ✔ | – |
| Configurações Globais | – | – | – | – | – | – | – | – | – |

**Regras:** produz e publica conteúdo (sem `excluir` em lugar nenhum — usa `arquivar`);
mantém os cadastros do portal; importa/exporta usuários; não toca em perfis nem em
configurações globais.

### 7.3 Revisor — 21/99

| Módulo | visualizar | criar | alterar | excluir | publicar | arquivar | download | exportar | importar |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Manuais | ✔ | – | ✔ | – | – | – | ✔ | ✔ | – |
| Release Week | ✔ | – | ✔ | – | – | – | ✔ | ✔ | – |
| Escopo de Projetos | ✔ | – | ✔ | – | – | – | ✔ | ✔ | – |
| Esteira de Revisão | ✔ | – | ✔ | – | – | – | – | – | – |
| Lançar as Chamadas | ✔ | – | ✔ | – | – | – | – | – | – |
| Parceiros | ✔ | – | – | – | – | – | – | – | – |
| Softwares | ✔ | – | – | – | – | – | – | – | – |
| Gestão de Usuários | ✔ | – | – | – | – | – | – | – | – |
| Perfis de Acesso (RBAC) | – | – | – | – | – | – | – | – | – |
| Gestão de Auditoria | ✔ | – | – | – | – | – | – | ✔ | – |
| Configurações Globais | – | – | – | – | – | – | – | – | – |

**Regras:** só revisita — `visualizar` em todo o conteúdo, na Esteira de Revisão, em Lançar as
Chamadas, em Parceiros e Softwares, em Gestão de Usuários e na Auditoria; `alterar` apenas no
conteúdo, na esteira e nas Chamadas (homologação); `download`/`exportar` do conteúdo e
`exportar` da auditoria; **não cria, não exclui e não publica**; não acessa perfis nem
configurações globais.

### 7.4 Leitor — 6/99

| Módulo | visualizar | criar | alterar | excluir | publicar | arquivar | download | exportar | importar |
| :--- | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Manuais | ✔ | – | – | – | – | – | ✔ | – | – |
| Release Week | ✔ | – | – | – | – | – | ✔ | – | – |
| Escopo de Projetos | ✔ | – | – | – | – | – | ✔ | – | – |
| Esteira de Revisão | – | – | – | – | – | – | – | – | – |
| Lançar as Chamadas | – | – | – | – | – | – | – | – | – |
| Parceiros | – | – | – | – | – | – | – | – | – |
| Softwares | – | – | – | – | – | – | – | – | – |
| Gestão de Usuários | – | – | – | – | – | – | – | – | – |
| Perfis de Acesso (RBAC) | – | – | – | – | – | – | – | – | – |
| Gestão de Auditoria | – | – | – | – | – | – | – | – | – |
| Configurações Globais | – | – | – | – | – | – | – | – | – |

**Regras:** lê e baixa apenas os conteúdos publicados; sem acesso a movimentos, cadastros,
administração e configurações.

### 7.5 Consistência com a tela

| Perfil | Contagem da matriz | Coluna "Permissões" | Soma |
| :--- | ---: | :---: | ---: |
| Administrador | 99 | `99/99` | \- |
| Editor | 45 | `45/99` | \- |
| Revisor | 21 | `21/99` | \- |
| Leitor | 6 | `6/99` | \- |
| **Total** | **171** | KPI **`171/396`** | `99+45+21+6` |

Qualquer mudança nesta matriz SHALL atualizar `MATRIZ_SEED` em `usePerfisDemo.ts` no mesmo
change, mantendo contagens, KPI e este documento idênticos (verificado na §12 e no cenário
`docs/07`/consistência da spec `perfis-acesso`).

## 8. Navegação até a tela

- **Sidebar:** sessão "Administração" → item "Perfis de Acesso (RBAC)" com
  `to: '/admin/perfis-acesso'` (`app/config/navigation.ts`) — fica ativo na rota com
  `aria-current="page"` (spec `design-system/layout-navigation`).
- **Menu da conta:** item **"Perfis de Acesso (RBAC)"** com o mesmo `to` — rótulo **unificado**
  com a sidebar e com a página (era "Configuração de Perfis (RBAC)"); o menu fecha após a
  navegação.
- Os quatro itens da Administração têm rota (Configurações Globais, Gestão de Usuários, Gestão
  de Auditoria e Perfis de Acesso (RBAC)); os itens das demais sessões seguem sem rota e, ao
  serem acionados, exibem o toast "Módulo em construção." (`docs/03` §Observações — MEL-03 do
  `RL01` resolvido).

## 9. Estilo e CSS dedicado

- **Nenhum CSS dedicado novo** — só tokens e utilitários do DS (`bg-brand-primary`,
  `text-[#f5b302]`, `brand-focus` nos focos, variantes do `UiBadge`, `font-mono tabular-nums`
  nas colunas numéricas).
- **Nenhuma dependência nova** (`package.json` intocado).
- Cores dos KPIs seguem a paleta já usada nas demais telas (`#f5b302`, `#047857`, `#64748b`,
  `#be123c`, `#112051`); identidade do módulo `#f5b302` conforme `docs/01` §3.3/§4.

## 10. Vitrine `/design`

- **Seção 19 (Textarea — `UiTextarea`)** espelha o componente do kit (§4): um campo com
  `v-model` e outro fixado em erro/desabilitado para conferir o recorte `rose-700`, o ícone e
  a mensagem acessível (`docs/01` §5.18).
- **Seção 20 (Switch — `UiSwitch`)** espelha o interruptor do kit (§4): estados ligado,
  desligado, desabilitado e um sem `label` (só nome acessível) — `docs/01` §5.19.
- **Seção 14 (Shell de Layout & Impressão)** espelha automaticamente o rótulo unificado do menu da conta: a
  vitrine lê `app/config/navigation.ts` (requisito "Fonte única" de
  `design-system/layout-navigation`), sem edição manual.

## 11. Especificações OpenSpec

Change `openspec/changes/pagina-perfis-acesso-rbac` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `perfis-acesso` | **ADDED (capability nova)** — 8 requisitos: rota/shell com identidade `#f5b302`; itens de navegação com rota e rótulo unificado; KPIs derivados do conjunto vigente; `UiDataTable` com 6 colunas sem rolagem horizontal; contagens derivadas (matriz + base de usuários); ações em toast com nenhum `UiModal`; base em memória restaurada na recarga; `docs/07` como fonte normativa |
| `design-system/layout-navigation` | **MODIFIED** — o requisito do menu do Account nomeia o item como **"Perfis de Acesso (RBAC)"** (era "Configuração de Perfis (RBAC)"), mantendo a ordem canônica e somando o cenário de rótulo unificado |

Declarar a rota da sidebar é **uso** do requisito existente de itens com `to` (nenhuma delta
para esse requisito). As deltas são sincronizadas para `openspec/specs/` via `/opsx-sync`
**antes do archive** (fluxo adotado em `docs/06` §10).

Change `openspec/changes/perfis-acesso-modal-exclusao` (spec-driven) — modal de exclusão:

| Capability | Operação |
| :--- | :--- |
| `perfis-acesso` | **MODIFIED** — "As ações da fase 1 avisam por toast e não abrem modal" passa a cobrir só Novo/Editar/Permissões; Excluir abre o modal |
| `perfis-acesso` | **ADDED** — "O modal de exclusão confirma a remoção de um perfil": abertura sempre, identificação (nome + vínculos), bloqueio na confirmação (modal fecha + toast, base intacta), remoção sem vínculos com foco na busca, descarte, recarga |

Change `openspec/changes/perfis-acesso-modal-cadastro-edicao` (spec-driven) — modal de
cadastro/edição + `UiTextarea`:

| Capability | Operação |
| :--- | :--- |
| `perfis-acesso` | **REMOVED** "As ações da fase 1 avisam por toast e não abrem modal" + **ADDED** "A ação de permissões avisa por toast e não abre modal" (só `KeyRound` em transição) |
| `perfis-acesso` | **ADDED** — "O modal de cadastro/edição cria e altera perfis": abertura novo/edição, validação de nome, id UUID gerado na criação (sem campo de código), datas desabilitadas só na edição, salvar em memória (matriz vazia 0/99, `criado_em` preservado/`atualizado_em` atualizado), descarte, recarga |
| `perfis-acesso` | **MODIFIED** — KPIs ganham **"Bloqueados"** (5 KPIs); badge de Status distingue **Ativo/Inativo/Bloqueado** |
| `design-system/textarea` | **ADDED (capability nova)** — contrato do `UiTextarea` (props/v-model, disabled, rows, foco/erro da família, Enter quebra linha/Tab sai, mensagem `role="alert"`) |
| `design-system/form-control-states` | **MODIFIED** — foco, erro e mensagem persistente passam a incluir `Textarea` na família |

Change `openspec/changes/perfis-acesso-modal-permissoes` (spec-driven) — modal da matriz +
`UiSwitch`:

| Capability | Operação |
| :--- | :--- |
| `perfis-acesso` | **REMOVED** "A ação de permissões avisa por toast e não abre modal" + **ADDED** "A ação de permissões abre o modal de configuração" (só `KeyRound`, sem toast) |
| `perfis-acesso` | **ADDED** — "O modal de permissões configura a matriz do perfil": abertura com abas por sessão e linhas nome+descrição, interruptores das 4 ações fixas (rascunho + contador global), Funcionalidades em chips clicáveis, salvar em memória com recálculo, descarte, recarga, Admin editável e perfil novo 0/99 — sem atalhos de lote nem toolbar de filtros |
| `perfis-acesso` | **MODIFIED** — KPIs: recálculo inclui edição de permissões; contagens: novo cenário "Salvar a matriz recalcula a coluna Permissões" |
| `design-system/switch` | **ADDED (capability nova)** — contrato do `UiSwitch` (`role="switch"`/`aria-checked`, label associada, disabled, teclado Space/Enter, foco `#1a9e07`, espelhamento na vitrine) |

Change `openspec/changes/perfis-acesso-copiar-permissoes` (spec-driven) — cópia de matriz
entre perfis:

| Capability | Operação |
| :--- | :--- |
| `perfis-acesso` | **ADDED** — "O modal de permissões copia a matriz entre perfis": ícones `ClipboardPaste`/`ClipboardCopy` no rodapé esquerdo (Cancelar/Salvar à direita), importar substitui o rascunho (vale no Salvar), exportar grava a matriz **salva** no alvo imediatamente com toast (descarte não desfaz) e o seletor (modal filho com `UiChoiceCard`, `n/99`) exclui o perfil atual e oferece estado vazio |

Change `openspec/changes/perfis-acesso-filtros-exportacao` (spec-driven) — modal de filtros +
exportação:

| Capability | Operação |
| :--- | :--- |
| `perfis-acesso` | **ADDED** — "O modal de filtros refina o conjunto vigente de perfis": modal `sm` com sessões Perfil/Status, rascunho (Aplicar/Cancelar/Escape/X/Limpar), badge 0..2, tabela/KPIs/exportações sobre o conjunto filtrado, memória + descarte na recarga |
| `perfis-acesso` | **ADDED** — "A exportação gera arquivos sobre o conjunto de perfis vigente": menu "Relatórios" no cabeçalho (PDF paisagem + CSV `;`/BOM, divisor, sem `window.print()`), sobre o conjunto filtrado quando houver filtro |
| `perfis-acesso` | **MODIFIED** — "Os KPIs refletem o conjunto vigente de perfis": o conjunto vigente passa a incluir a refinação por filtro do módulo (cenário "Filtro do módulo recalcula os KPIs") |

## 12. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório) e
  `openspec validate "perfis-acesso-modal-permissoes" --strict`.
- Smoke SSR da rota: `/admin/perfis-acesso` responde 200 com shell, título "Perfis de Acesso
  (RBAC)", KPIs e **sem** marcação de modal (o `UiModal` só renderiza com `modelValue=true`).
- Checagem visual no dev server (`http://localhost:3000`):
  - **`/admin/perfis-acesso`:** KPIs **4 / 4 / 0 / 0 / 171·396** (5 cards); tabela com **6
    colunas**, busca filtrando a visualização, valores **99/99 · 45/99 · 21/99 · 6/99** e
    usuários **2 · 5 · 4 · 5**; badges de Status (Ativo/Inativo/Bloqueado);
    **Novo/Editar abrem o `PerfisFormulario`** (sem toast) — sem campo de código (id UUID
    gerado na criação), criação validando nome, perfil novo 0/99 com KPI `171/495`, edição com
    datas `dd/mm/yyyy` desabilitadas, `Escape`/Cancelar descartam;
    **Permissões (`KeyRound`) abre o `PerfisPermissoes`** (sem toast) — abas `UiTabs` por
    sessão com a tabela-cartão de módulos (nome + descrição) × 4 ações fixas em `UiSwitch`
    (sem atalhos de lote) + coluna "Funcionalidades" com chips `UiCheckChip` clicáveis,
    contador `n/99` global ao vivo,
    Salvar recalcula linha+KPIs com toast,
    Cancelar/Escape/X descartam, Admin editável, 375px com rolagem interna da tabela;
    **cópias no rodapé:** ícones `ClipboardPaste`/`ClipboardCopy` agrupados à esquerda
    (Cancelar/Salvar à direita), seletor filho sem o perfil atual (Esc/Tab só no filho,
    foco volta ao ícone), importar no Editor a matriz do Leitor → contador `6/99` com base
    intacta até Salvar (linha `6/99` e KPI `132/396` após salvar), exportar do Editor para
    o Leitor → linha `45/99` e KPI `210/396` na hora com toast, descarte não desfaz a
    exportação;
    **Excluir abre o `PerfisExclusao`** — confirmar
    com vínculos fecha o modal com `toast.warning` de bloqueio e base intacta; recarga
    restaura a base; **sem rolagem horizontal** a 1280px (e layout íntegro a 375px).
  - **`/design` seções 19 e 20:** `UiTextarea` (campo `v-model` + erro/desabilitado) e
    `UiSwitch` (ligado, desligado, desabilitado, só `ariaLabel`).
  - **Navegação:** clique na sidebar e no menu da conta navega (o menu fecha); item da sidebar
    ativo inclusive por URL direta; rótulo "Perfis de Acesso (RBAC)" nos dois lugares.
  - **Regressão:** `/admin/gestao-usuarios` e demais seções da vitrine inalterados.
  - **Pós-QA (Lote A):** KPIs sem truncamento a 1024px (grade 2×N, `xl:grid-cols-5` só a
    partir de 1280px) e `171/396` legível; colunas Usuários/Permissões com `text-align: right`
    em `th` e `td`; legenda do `n/99` presente no subtítulo da tabela.
- **Consistência `docs/07` ↔ tela (§7.5):** as contagens do documento reproduzem exatamente
  os valores da tabela e do KPI.

## 13. Pendências e próximos passos

- **Backend:** `server/` com tabelas `perfis`/`perfil_permissoes` (DDL alvo em `docs/02` §3.5)
  e o helper `requirePermission(event, modulo, acao)` (docs/02 §3.5/§7) — a página troca o
  composable por dados reais sem mudar o contrato visual; a §7 vira os **seeds** da migration.
  Nesse momento entram: **`padrao_sistema`** (flag de perfil nativo bloqueado para exclusão +
  guarda correspondente no modal de exclusão), **`cor_identificacao`** (badge colorido —
  componente de cor novo no kit) e o **dropdown de perfis de `/admin/gestao-usuarios`**
  derivando da base (elimina a divergência nome × contagem aceita na demo, §3.6).
- **Situação do perfil** hoje só na demo: modelar no backend a regra de bloqueio (perfil
  Inativo/Bloqueado não atribuível a novos usuários).

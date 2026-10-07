# 07 - Perfis de Acesso (RBAC) — Área Administrativa

**Versão:** 1.0.0 — **Data:** 2026-10-07 — **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela principal de Perfis de Acesso (RBAC) - listagem (base em memória) com cabeçalho
(Novo Perfil), KPIs e tabela com contagem de permissões e de usuários vinculados, **todas as
ações em contrato de transição (toast, sem modal) — fase 1** — mais a **matriz normativa de
permissões** (4 perfis × 11 módulos × 9 ações) que o modal da fase 2 implementará
**Arquivos-fonte:** [`app/pages/admin/perfis-acesso.vue`](../app/pages/admin/perfis-acesso.vue) ·
[`app/components/perfis/`](../app/components/perfis) ·
[`app/config/navigation.ts`](../app/config/navigation.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — **sem seção nova** (a fase 1 não cria nem
altera componente de kit; a seção 14 espelha o rótulo unificado do menu da conta)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) — componentes do kit
usados (`UiButton`, `UiBadge`, `UiKpi`, `UiDataTable`, `UiTooltip`)
**Autoridade de comportamento:** specs da capability `perfis-acesso`
(`openspec/specs/perfis-acesso`, sincronizada nesta change via `/opsx-sync`)

> Este documento é a referência da tela `/admin/perfis-acesso` e de tudo o que foi criado para
> ela — componentes de domínio, contrato de transição e, sobretudo, da **matriz de permissões
> normativa** (§7), a fonte que o modal de permissões por perfil da fase 2 SHALL implementar.
> Toda alteração aqui deve manter as specs da change e a implementação coerentes.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (criados/alterados)](#4-componentes-de-kit-criadosalterados)
5. [Comportamento: ações em contrato de transição](#5-comportamento-ações-em-contrato-de-transição)
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
  nome, descrição, status e a matriz de permissões por módulo (4 ações booleanas fixas +
  `permissoes_extras`).
- **Fase 1:** listagem **inteiramente em memória** — `useState('perfis-base')`, sem `server/`,
  sem requisições de dados (API); a base se restaura a cada recarga.
- **Sem modais:** "Novo Perfil" e as três ações de linha (Editar, Excluir, Permissões) exibem
  **toast** de transição e não abrem nenhum `UiModal` (§5). Os modais de CRUD, filtros e
  permissões são a fase 2 (§13).
- **Matriz semeada:** a coluna "Permissões" e o KPI "Permissões concedidas" derivam da matriz
  declarada em `usePerfisDemo.ts` (§3.4) — a mesma que o §7 normatiza.

## 2. Estrutura da página (componentização)

A página é fina e **não tem estado de modal nenhum** — só os handlers de toast (decisão D1 do
`design.md` da change). Cada parte é um componente em `app/components/perfis/` (auto-import com
prefixo `Perfis*`):

```
admin/perfis-acesso.vue            (page - definePageMeta + composição + toast de transição)
├── <PerfisCabecalho @novo />      → tile #f5b302 + título + "Novo Perfil"
├── <PerfisKpis class="mt-6" />    → 4 UiKpi do conjunto VIGENTE
└── <PerfisTabela class="mt-5"
                  @permissoes @editar @excluir />  → UiDataTable (busca + badges + ações)
```

- **Estado de coordenação:** nenhum `ref` de modal na página; os gatilhos dos componentes
  **emitem** e a página responde com `avisoProximaEtapa(acao)` →
  `toast.info('Perfis de Acesso (RBAC)', '<Ação>: funcionalidade disponível na próxima etapa.')`
  — os mesmos emits são o ponto de encaixe dos modais na fase 2, sem reescrever componentes.
- **Largura:** container `mx-auto max-w-7xl` dentro do padding `p-4 sm:p-6 lg:p-8` (mesmo
  padrão de Usuários e Auditoria).

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<PerfisCabecalho>`

- Cabeçalho sem container (padrão `UsuariosCabecalho`): tile `bg-brand-primary` com
  `ShieldCheck` em `#f5b302`, título "Perfis de Acesso (RBAC)" e subtítulo "Administração dos
  perfis de acesso — permissões por módulo, usuários vinculados e status."
- **Botão "Novo Perfil"** (`UiButton` primary + `Plus`): **emite `@novo`** para a página, que
  exibe o toast de transição (fase 2 abrirá o modal de criação).
- Sem menu de relatórios nesta fase (a listagem de perfis não tem exportação na fase 1).

### 3.2 `Kpis.vue` → `<PerfisKpis>`

4 `UiKpi` em `grid sm:grid-cols-2 xl:grid-cols-4` (4 colunas só a partir de 1280px — em
1024–1279px o grid fica 2×2 para o valor longo `171/396` não truncar, correção UX-M1), todos
derivados do conjunto vigente
(`perfis` do `useState`):

| KPI | Valor (base demo) | Cor (`cor` do `UiKpi`) | Ícone |
| :--- | :--- | :--- | :--- |
| Total de perfis | `4` | `#f5b302` (dourado RBAC) | `ShieldCheck` |
| Ativos | `4` | `#047857` (esmeralda) | `UserCheck` |
| Inativos | `0` | `#64748b` (slate) | `UserX` |
| Permissões concedidas | `171/396` | `#112051` (navy) | `KeyRound` |

- "Permissões concedidas" = **soma das permissões verdadeiras de todos os perfis /**
  **`perfis × 99`** (`99 = 11 módulos × 9 ações`).
- **Inativos = 0 é comportamento esperado** (design D7): os 4 perfis demo são os canônicos em
  uso pelos 16 usuários da base de Gestão de Usuários.
- Os KPIs recalculam sempre que o conjunto de perfis muda (spec `perfis-acesso`).

### 3.3 `Tabela.vue` → `<PerfisTabela>`

- `UiDataTable` **sem** `show-filters` (não há modal de filtros na fase 1 — a busca textual já
  vem do kit com `show-header-top`), `title="Perfis de Acesso"`,
  `subtitle="Base de demonstração — fase 1 em memória · Permissões: ações concedidas de 99 (11
módulos × 9 ações)"` (legenda do `n/99` — UX-B2), `default-page-size="5"`.
- **Colunas (6 — cinco de dados + Ações, sem rolagem horizontal em ≥ ~1280px):**

| Coluna | Origem | Formatação |
| :--- | :--- | :--- |
| Nome | `perfil.nome` | texto |
| Descrição | `perfil.descricao` | texto (elástica) |
| Usuários | `usuariosPorPerfil[nome]` — **derivada** da base de usuários | `align: 'right'`, `font-mono tabular-nums` |
| Permissões | `contarPermissoes(perfil)/99` — **derivada** da matriz | `align: 'right'`, `font-mono tabular-nums` |
| Status | `perfil.status` | `UiBadge` via `VARIANTE_POR_STATUS` (Ativo `done`, Inativo `neutral`) |
| Ações | gatilhos | `KeyRound` · `Pencil` · `Trash2` (tooltip + `aria-label` próprios) |

- As ações **emitem** `@permissoes`, `@editar` e `@excluir` com a linha (`LinhaPerfil`); a
  página converte em toast. Ícones em `text-slate-400` com cor semântica só no hover
  (âmbar para permissões, `brand-focus` para editar, `rose-700` para excluir) — mesmo padrão
  da tabela de usuários.

### 3.4 `usePerfisDemo.ts` — composable de estado (matriz e contagens)

- **Tipos:** `PerfilDemo` (`id`, `nome`, `descricao`, `status`, `permissoes`),
  `ModuloId` (11), `Acao` (4), `Extra` (5), `Permissao = Acao | Extra`.
- **Constantes:** `MODULOS` (11 rótulos idênticos aos da sidebar), `ACOES`, `EXTRAS`,
  `PERMISSOES_POR_PERFIL = 99`, `VARIANTE_POR_STATUS`.
- **`MATRIZ_SEED`:** `Record<PerfilId, Record<ModuloId, Permissao[]>>` montado por regras
  (`ACOES_TUDO`, `CONTEIDO_EDITOR`, `CONTEIDO_REVISOR`, `CONTEIDO_LEITOR`) — declaração
  única das regras do §7; `matriz()` sempre copia as listas (sem referência compartilhada).
- **Helpers puros:** `contarPermissoes(perfil)` → soma dos módulos (99/45/21/6).
- **Estado:** `useState('perfis-base', () => PERFIS_DEMO.map(clonar))` — clona a semente na
  carga; a recarga restaura.
- **Derivados (design D2/D3):** `linhas` (a linha da tabela com `usuarios` e
  `permissoesTexto`), `usuariosPorPerfil` (conta `useUsuariosDemo().usuarios` por perfil),
  `totalPermissoesConcedidas` (171) e `totalPermissoesPossiveis` (396).
- **Dependência cross-module:** `perfis/` importa `usuarios/` somente para leitura (sem ciclo)
  — criar/excluir um usuário em `/admin/gestao-usuarios` altera a coluna "Usuários" sem
  recarregar a página.

## 4. Componentes de kit (criados/alterados)

- **Nenhum componente novo e nenhum alterado.** A fase 1 usa exclusivamente `UiButton`,
  `UiBadge`, `UiKpi`, `UiDataTable` e `UiTooltip` já vigentes (`docs/01` §5).
- **Nenhuma seção nova na vitrine `/design`** (§10) e **nenhum CSS dedicado** (§9).
- O candidato a componente novo (toggle de permissão) só nasce com o modal da fase 2 — momento
  em que entra com spec `design-system/*`, seção em `docs/01` §5 e seção na vitrine (§13).

## 5. Comportamento: ações em contrato de transição

Todos os gatilhos da fase 1 seguem o mesmo contrato (spec `perfis-acesso`): **toast
informativo e nenhum `UiModal` aberto**.

| Gatilho | Local | Comportamento de fase 1 | Fase 2 |
| :--- | :--- | :--- | :--- |
| **Novo Perfil** (`Plus`) | cabeçalho | toast "Novo Perfil: funcionalidade disponível na próxima etapa." | modal de criação |
| **Configurar permissões** (`KeyRound`) | linha | toast "Configurar permissões: …" | modal de permissões do perfil |
| **Editar perfil** (`Pencil`) | linha | toast "Editar perfil: …" | modal de edição |
| **Excluir perfil** (`Trash2`) | linha | toast "Excluir perfil: …" | modal de confirmação |

- Mensagem padrão: `toast.info('Perfis de Acesso (RBAC)', '<Ação>: funcionalidade disponível
  na próxima etapa.')`.
- **Busca** é recurso do `UiDataTable`: filtra a visualização **sem** alterar o conjunto
  vigente nem os KPIs.
- **Sem botão "Filtros" e sem exportação** nesta fase — ambos entram junto dos seus modais/
  relatórios, na fase 2.

## 6. Dados de demonstração

- Base de **4 perfis** (mesmos `PERFIS` de `useUsuariosDemo`), **todos Ativo**:

| Perfil | Descrição | Usuários | Permissões |
| :--- | :--- | ---: | ---: |
| Administrador | Acesso total ao sistema, incluindo perfis de acesso e configurações globais. | 2 | 99/99 |
| Editor | Produz, publica e mantém conteúdos e cadastros do portal. | 5 | 45/99 |
| Revisor | Revisa e homologa conteúdos na esteira, sem criar nem excluir registros. | 4 | 21/99 |
| Leitor | Consulta e baixa os conteúdos publicados. | 5 | 6/99 |

- KPIs da base completa: **Total 4 · Ativos 4 · Inativos 0 · Permissões concedidas 171/396**
  (`99 + 45 + 21 + 6 = 171`; `4 × 99 = 396`).
- **Nenhuma persistência:** a recarga restaura a semente; o estado vive em `useState`
  (perde-se ao fechar a aba/sessão).
- **Contagens nunca digitadas:** usuários (2/5/4/5) vêm da base vigente de usuários e
  permissões (99/45/21/6) da matriz — ambas calculadas em `computed`.

## 7. Matriz de permissões (normativa)

**Esta seção é a fonte da verdade das permissões do sistema** e é o que o modal de
permissões por perfil da fase 2 SHALL implementar célula a célula. A tela da fase 1 exibe
apenas a **contagem** derivada desta matriz (§3.4).

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
  de Auditoria e Perfis de Acesso (RBAC)); os itens das demais sessões seguem sem rota
  (MEL-03 do `RL01`).

## 9. Estilo e CSS dedicado

- **Nenhum CSS dedicado novo** — só tokens e utilitários do DS (`bg-brand-primary`,
  `text-[#f5b302]`, `brand-focus` nos focos, variantes do `UiBadge`, `font-mono tabular-nums`
  nas colunas numéricas).
- **Nenhuma dependência nova** (`package.json` intocado).
- Cores dos KPIs seguem a paleta já usada nas demais telas (`#f5b302`, `#047857`, `#64748b`,
  `#112051`); identidade do módulo `#f5b302` conforme `docs/01` §3.3/§4.

## 10. Vitrine `/design`

- **Nenhuma seção nova:** nenhum componente de kit foi criado ou alterado, então a vitrine não
  muda (a fase 1 fica fora da vitrine — `docs/01` §5 só documenta componentes de kit).
- **Seção 14 (Shell de Layout & Impressão)** espelha automaticamente o rótulo unificado do menu da conta: a
  vitrine lê `app/config/navigation.ts` (requisito "Fonte única" de
  `design-system/layout-navigation`), sem edição manual.

## 11. Especificações OpenSpec

Change `openspec/changes/pagina-perfis-acesso-rbac` (spec-driven):

| Capability | Operação |
| :--- | :--- |
| `perfis-acesso` | **ADDED (capability nova)** — 8 requisitos: rota/shell com identidade `#f5b302`; itens de navegação com rota e rótulo unificado; 4 KPIs derivados do conjunto vigente (4/4/0/171·396); `UiDataTable` com 6 colunas sem rolagem horizontal; contagens derivadas (matriz + base de usuários); ações em toast com nenhum `UiModal`; base em memória restaurada na recarga; `docs/07` como fonte normativa |
| `design-system/layout-navigation` | **MODIFIED** — o requisito do menu do Account nomeia o item como **"Perfis de Acesso (RBAC)"** (era "Configuração de Perfis (RBAC)"), mantendo a ordem canônica e somando o cenário de rótulo unificado |

Declarar a rota da sidebar é **uso** do requisito existente de itens com `to` (nenhuma delta
para esse requisito). As deltas são sincronizadas para `openspec/specs/` via `/opsx-sync`
**antes do archive** (fluxo adotado em `docs/06` §10).

## 12. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório) e
  `openspec validate "pagina-perfis-acesso-rbac" --strict`.
- Smoke SSR da rota: `/admin/perfis-acesso` responde 200 com shell, título "Perfis de Acesso
  (RBAC)", KPIs e **sem** marcação de modal.
- Checagem visual no dev server (`http://localhost:3000`):
  - **`/admin/perfis-acesso`:** KPIs **4 / 4 / 0 / 171·396**; tabela com **6 colunas**, busca
    filtrando a visualização, valores **99/99 · 45/99 · 21/99 · 6/99** e usuários
    **2 · 5 · 4 · 5**; badges de Status; os **4 gatilhos** exibem toast e **nenhum `UiModal`
    abre**; recarga restaura a base; **sem rolagem horizontal** a 1280px (e layout íntegro a
    375px).
  - **Navegação:** clique na sidebar e no menu da conta navega (o menu fecha); item da sidebar
    ativo inclusive por URL direta; rótulo "Perfis de Acesso (RBAC)" nos dois lugares.
  - **Regressão:** `/admin/gestao-usuarios` e `/design` inalterados (a seção 14 da vitrine
    espelha o novo rótulo do menu da conta).
  - **Pós-QA (Lote A):** KPIs sem truncamento a 1024px (grade 2×2, `xl:grid-cols-4` só a partir
    de 1280px) e `171/396` legível; colunas Usuários/Permissões com `text-align: right` em
    `th` e `td`; legenda do `n/99` presente no subtítulo da tabela.
- **Consistência `docs/07` ↔ tela (§7.5):** as contagens do documento reproduzem exatamente
  os valores da tabela e do KPI.

## 13. Pendências e próximos passos

- **Fase 2 — modais:** cadastro/edição de perfil (nome, descrição, status), exclusão com
  confirmação e **modal de permissões por perfil** implementando a matriz da §7 célula a célula
  (hoje todos os gatilhos avisam por toast, §5).
- **Filtros e exportação** da listagem (junto dos respectivos modais/relatórios).
- **Componente de kit para o toggle de permissão** (não existe `Switch`/`Toggle` no kit):
  nasce com o modal e entra com spec `design-system/*`, seção em `docs/01` §5 e seção na
  vitrine `/design`.
- **Backend:** `server/` com tabelas `perfis`/`perfil_permissoes` e o helper
  `requirePermission(event, modulo, acao)` (docs/02 §3.5/§7) — a página troca o composable por
  dados reais sem mudar o contrato visual; a §7 vira os **seeds** da migration.
- **Status do perfil** hoje só na demo: modelar no backend a regra de bloqueio (perfil Inativo
  não atribuível a novos usuários).

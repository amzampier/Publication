# 05 — Gestão de Auditoria · Área Administrativa

**Versão:** 1.1.0 · **Data:** 2026-10-15 · **Idioma:** Português do Brasil (pt-BR)
**Escopo:** tela de Gestão de Auditoria — consulta dos registros de operações **persistidos no
banco (fase 2, via API)** com KPIs, filtros em modal, tabela, detalhe do registro e exportação
CSV/PDF, mais o backend da trilha (`registrarAuditoria` + `GET /api/auditoria`)
**Arquivos-fonte:** [`app/pages/admin/auditoria.vue`](../app/pages/admin/auditoria.vue) ·
[`app/components/auditoria/`](../app/components/auditoria) ·
[`app/components/ui/DataTable.vue`](../app/components/ui/DataTable.vue) ·
[`app/config/navigation.ts`](../app/config/navigation.ts) ·
[`server/utils/audit.ts`](../server/utils/audit.ts) ·
[`server/api/auditoria/index.get.ts`](../server/api/auditoria/index.get.ts)
**Vitrine:** [`/design`](../app/pages/design.vue) — seção **13. DataTable** (busca + botão Filtros)
**Autoridade visual:** [`01 - design_system.md`](01%20-%20design_system.md) §5.11 ·
**Autoridade de comportamento:** spec `openspec/specs/auditoria/spec.md`
(atualizada pela change `openspec/changes/auditoria-backend-integracao`)

> Este documento é a referência da tela `/admin/auditoria` e de tudo o que foi criado para ela:
> componentes de domínio, backend da trilha, navegação e specs. Toda alteração aqui deve
> atualizar também `01 - design_system.md` (§5.11) e a seção 13 do `/design`.

---

## Sumário

1. [Visão geral e rota](#1-visão-geral-e-rota)
2. [Estrutura da página (componentização)](#2-estrutura-da-página-componentização)
3. [Componentes de domínio](#3-componentes-de-domínio)
4. [Componentes de kit (criados/alterados)](#4-componentes-de-kit-criadosalterados)
5. [Comportamento: filtros, busca e exportação](#5-comportamento-filtros-busca-e-exportação)
6. [Backend da trilha (fase 2)](#6-backend-da-trilha-fase-2)
7. [Dados iniciais (seed)](#7-dados-iniciais-seed)
8. [Navegação até a tela](#8-navegação-até-a-tela)
9. [Estilo e CSS dedicado](#9-estilo-e-css-dedicado)
10. [Vitrine `/design` §13](#10-vitrine-design-§13)
11. [Especificações OpenSpec](#11-especificações-openspec)
12. [Verificação](#12-verificação)
13. [Pendências e próximos passos](#13-pendências-e-próximos-passos)

---

## 1. Visão geral e rota

A Gestão de Auditoria é a tela de consulta da trilha de operações da Área Administrativa:

- **Rota:** `/admin/auditoria` → `app/pages/admin/auditoria.vue` com
  `definePageMeta({ layout: 'admin' })` — herda o shell (header + sidebar) por `/admin/**`
  (ver [`03 - Header e Sidebar.md`](03%20-%20Header%20e%20Sidebar.md) §1).
- **Modelo de registro:** conforme o `registrarAuditoria` do
  [`02 - Guia de Arquitetura e Migrations.md`](02%20-%20Guia%20de%20Arquitetura%20e%20Migrations.md) §3.6 —
  data/hora, usuário (id + nome), ação, recurso, detalhes e IP.
- **Fase 2 (atual):** os registros vêm do banco via `GET /api/auditoria`
  ([`server/api/auditoria/index.get.ts`](../server/api/auditoria/index.get.ts)); as operações de
  escrita do sistema gravam na tabela `auditoria` pelo helper
  [`server/utils/audit.ts`](../server/utils/audit.ts) (seção 6). A página abre com **overlay de
  loading no F5** (padrão Meu Perfil/Configurações Globais) e, na falha do GET, exibe toast de
  erro com a tabela vazia — **nunca** a antiga base de demonstração fingindo ser persistida.
- **Filtros:** estruturais (datas/usuário/ação/recurso) são aplicados **no servidor** (query
  params do GET) e preservados em `useState` durante a navegação do ciclo (zerados no F5).

## 2. Estrutura da página (componentização)

A página é fina: estado de coordenação (modal de filtros, registro em detalhe), carga inicial
com loading e composição. Cada parte é um componente em `app/components/auditoria/`
(auto-import com prefixo `Auditoria*`):

```
admin/auditoria.vue                    (carregando, filtrosAbertos, detalheAberto, registroDetalhe)
├── <UiLoading v-if="carregando"       ← overlay "Carregando auditoria…" durante o GET inicial
│          message="Carregando auditoria…" />
├── <div v-else class="mx-auto max-w-7xl">
│   ├── <AuditoriaCabecalho />             ← título + menu "Exportar" (CSV / Download em PDF)
│   ├── <AuditoriaKpis class="mt-6" />     ← 4 UiKpi do conjunto FILTRADO
│   ├── <AuditoriaTabela class="mt-5"
│   │      @open-filters="filtrosAbertos = true"
│   │      @open-details="abrirDetalhe" /> ← UiDataTable (busca + Filtros + badges + ações)
│   ├── <AuditoriaFiltros v-model="filtrosAbertos" />   ← UiModal com datas + selects
│   ├── <AuditoriaDetalhe v-model="detalheAberto"
│   │      :registro="registroDetalhe" />  ← UiModal de detalhe do registro
│   └── <footer>                           ← nota de retenção + link p/ Configurações Globais
```

- **Loading no F5:** `carregando = ref(true)` → `onMounted` → `carregarAuditoria()` →
  `finally` libera; falha → `toast.danger` ("Não foi possível carregar os registros de
  auditoria…") com a lista vazia. Mesmo padrão de `configuracoes-globais.vue`/`meu-perfil.vue`.
- **Sem botão "Salvar":** a página é de consulta (não altera estado persistido); o `Cabecalho`
  só oferece o menu Exportar — o botão **Filtros** vive na toolbar da tabela (decisão 13 do
  `design.md` da change `gestao-auditoria`), evitando duplicidade e seguindo o padrão herdados
  pelas próximas páginas de listagem.
- **Largura:** o conteúdo vive num container `mx-auto max-w-7xl` dentro do padding
  `p-4 sm:p-6 lg:p-8` (ampliado de `max-w-6xl` para dar folga à grid e evitar rolagem
  horizontal — ver §3.4).
- **Fluxo dos eventos:** `AuditoriaTabela` emite `open-filters` (vem do `UiDataTable`) e
  `open-details` (clique no olho da coluna Ações); a página coordena os dois `UiModal`.

## 3. Componentes de domínio

### 3.1 `Cabecalho.vue` → `<AuditoriaCabecalho>`

- Cabeçalho sem container (padrão `ConfiguracoesCabecalho`): tile `bg-brand-primary` com
  `ScrollText` em `#2dd4bf` (cor do item de navegação), título "Gestão de Auditoria" e subtítulo.
- **Menu "Exportar"** (`UiButton` outline + `ChevronDown`, `aria-haspopup="menu"` +
  `aria-expanded`): mini-menu `role="menu"` "Opções de exportação" com **Exportar em CSV** e
  **Download em PDF** — itens em `text-xs font-light text-slate-700` (`px-3 py-2`), **idênticos
  em fonte, tamanho e peso aos do menu suspenso da conta** do `AppHeader` (Plus Jakarta Sans
  herdada do `body`); fecha por `Escape` e por clique fora (mesma mecânica do menu da conta;
  markup de domínio, **não** é componente de kit).
- **Exportar em CSV:** monta o CSV dos `registrosFiltrados` com `Blob` + **BOM UTF-8**
  (`'\uFEFF'`), cabeçalho escapado e linhas entre aspas separadas por `;`, baixado como
  `auditoria.csv`.
- **Download em PDF:** chama `gerarPdfAuditoria` (`./gerarPdfAuditoria.ts`) com
  `registrosFiltrados`, os rótulos dos filtros vigentes e o preview da **logo de login**
  (composable `app/composables/useLogomarcaLogin.ts` — estado compartilhado com Configurações,
  espelho do `useLogomarcaHeader`; o bloco da logo de login em `AbaLogomarcas` passou a usá-lo).
  O gerador monta o `auditoria.pdf` em **A4 paisagem** com `jspdf` + `jspdf-autotable`:
  cabeçalho com a logo à esquerda (rasterizada via canvas — sem logo ou caminho sem arquivo →
  só o título), título "Relatório de Gestão de Auditoria" + "Gerado em …", filtros vigentes,
  linha divisória navy, colunas com o cabeçalho repetido a cada página, rodapé "Página X de Y" e
  `save('auditoria.pdf')` — **`window.print()` não é mais usado nesta tela**.

### 3.2 `Kpis.vue` → `<AuditoriaKpis>`

4 `UiKpi` em `grid sm:grid-cols-2 lg:grid-cols-4`, todos derivados do conjunto **filtrado**
(vindo da API com os filtros aplicados):

| KPI | Valor |
| :--- | :--- |
| Registros | contagem de `registrosFiltrados` |
| Período | intervalo de datas vigente em `dd/mm` (ex.: "01/10 – 02/10"); sem datas, "Tudo" |
| Usuários distintos | `Set` de nomes do conjunto filtrado |
| Última atividade | `data/hora` do registro mais recente (`DD/MM HH:mm`), `—` se vazio |

### 3.3 `Filtros.vue` → `<AuditoriaFiltros>`

- `UiModal` `size="sm"` ("Filtros de Auditoria") **com `:icon` (`Funnel`)** — o cabeçalho tem
  ícone + separador + título/subtítulo, igual aos demais `UiModal` do kit.
- **Corpo em três sessões `UiModalSection`** sobre o fundo cinza do modal: **"Período"**
  (`CalendarDays`) com os dois `UiDatePicker`, **"Usuário"** (`User`) com um `UiSelect` e
  **"Ação e Recurso"** (`Tags`) com dois `UiSelect`, espaçadas pelo grid nativo da sessão
  (sem wrapper manual de espaçamento).
- **Cinco campos:** `UiDatePicker` **Data Inicial** e **Data Final** (sessão "Período";
  `grid sm:grid-cols-2`, valor `Date` do componente; estado gravado como `yyyy-mm-dd` e filtrado
  por dia local, inclusivo) e os filtros **Usuário**, **Ação** e **Recurso** como **`UiSelect`
  de seleção única** — sessão "Usuário" com um select **sem `label`** (o título da sessão
  identifica o campo, evitando repetição; placeholder "Todos os usuários") e sessão "Ação e
  Recurso" com labels **"Ação"**/"**Recurso**" (placeholders "Todas as ações"/"Todos os
  recursos"). O estado vazio (`''`) equivale a "todos" — o placeholder exibe "Todos/Todas" e o
  `X` do select (`clearable`) devolve o filtro a "todos"; o dropdown do `UiSelect` mede o corpo
  rolável do modal e **abre para cima** quando não há espaço abaixo (auto-inversão do kit), sem
  criar scrollbar no corpo.
- **Opções dos selects:** derivam do conjunto **não filtrado** (servidas pela API em
  `opcoes.usuarios`/`opcoes.recursos`) — aplicar um filtro nunca esconde opções do modal.
- **Rascunho local:** o modal edita uma cópia dos filtros; **Aplicar** grava no composable,
  **refaz o `GET /api/auditoria`** com os novos parâmetros e fecha; **Cancelar** fecha **sem**
  aplicar nem buscar (próxima abertura ressincroniza com o vigente); **Limpar Filtros** zera
  composable + rascunho e recarrega (modal permanece aberto).
- **`Escape` com precedência para o popup:** com o dropdown de um `UiSelect` (ou o calendário
  de um `UiDatePicker`) aberto, o `Escape` fecha apenas o popup e preserva o rascunho — o
  modal fecha no `Escape` seguinte, quando não há popup aberto (consumo no componente via
  `stopPropagation`; ver `docs/01` §4.81/§5.11).
- **Rodapé:** "Limpar Filtros" à esquerda; "Cancelar" (outline) + "Aplicar" (primary) à direita.

### 3.4 `Tabela.vue` → `<AuditoriaTabela>`

- `UiDataTable` com `title="Registros de Auditoria"`, `subtitle="Ordenados do mais recente
  para o mais antigo — registros persistidos no banco"`, `show-header-top` (busca) e
  `show-filters` + `:filters-count="filtrosAtivosCount"` + `@open-filters` (repassa o evento do
  kit para a página).
- Colunas: Data / Hora (formato pt-BR), Usuário, Ação, Recurso, Detalhes e IP — dados já em
  ordem decrescente (ordenados pelo servidor).
- **Sem rolagem horizontal nas larguras usuais:** `minWidth` das colunas 130/160/120/140/220/120
  (soma 890px; com a coluna Ações `w-20` o chão da tabela é 970px) combinado ao container
  `max-w-7xl` da página (§2) — as sete colunas cabem sem barra horizontal mesmo quando a
  scrollbar vertical do `main` aparece ao aumentar "Linhas por página" (~15px que antes
  estouravam o chão de 1060px); abaixo de ~1280px de janela a rolagem horizontal permanece
  como fallback. Os `minWidth` só grampeiam o piso — em telas normais a tabela continua
  `w-full` e distribui a largura extra.
- **Ação em `UiBadge`** via slot `cell(acao)`: Inclusão → `done`, Alteração → `inReview`,
  Exclusão → `blocked` (dot pulsante — gotcha conhecida, aceita) e Homologação → `reconciled`.
- **Coluna Ações:** slot `#actions` com `UiTooltip` "Ver detalhes" + botão `Eye` (padrão da aba
  Segurança) → emite `open-details` com o registro.

### 3.5 `Detalhe.vue` → `<AuditoriaDetalhe>`

`UiModal` `size="sm"` ("Detalhe do Registro") **com `:icon` (`Eye`)** no cabeçalho — ícone +
separador + título/subtítulo, igual aos demais `UiModal` do kit — com o corpo dentro de uma
sessão **`UiModalSection` "Dados do Registro"** (`:icon="Eye"`; o `v-if` do registro vive na
sessão, evitando card vazio) contendo um `dl` de duas colunas:
Data/Hora (`mono`), Usuário, Ação (badge), Recurso, IP (`mono`) e Detalhes; rodapé com
"Fechar" como **botão primário** (X/Escape também fecham, pelo `UiModal`).

### 3.6 `useAuditoriaModelo.ts` — composable de estado (API-backed)

- **Contrato público estável desde a fase 1** (mesmo precedente de `usePerfisModelo`): `filtros`,
  `registrosFiltrados`, `filtrosAtivosCount`, `periodoRotulo`, `opcoesUsuarios`,
  `opcoesRecursos`, `limparFiltros` + helpers (`formatarDataHora`, `diaLocal`,
  `dataIsoParaDate`/`dateParaIso`, `VARIANTE_POR_ACAO`, `ACOES`).
- **Origem dos dados:** `useState('auditoria-registros')` inicia **vazia**;
  `carregarAuditoria()` chama `useApiFetch('/api/auditoria')` com os filtros vigentes como
  `query` e preenche `registros` + `opcoes` (usa `carregando`/`carregado` em `useState`);
  falha → `false` com a lista zerada (nunca demo). `registrosFiltrados` é o conjunto vindo do
  servidor (filtros estruturais no backend).
- `useState('auditoria-filtros')` preserva os filtros na navegação do mesmo ciclo; zeram no F5.
- Arquivo em `components/auditoria/` (não é auto-importado): consumidores importam
  explicitamente de `./useAuditoriaModelo` (ou `../../components/auditoria/useAuditoriaModelo`
  na página).

## 4. Componentes de kit (criados/alterados)

**Nenhum componente novo de kit.** Apenas o `UiDataTable` foi evoluído (task 2 da change
`gestao-auditoria`):

- **Busca → `UiInput`:** o `<input>` hand-rolled da toolbar virou o controle do kit (`leftIcon`
  lupa, limpar via `rightIcon` + `rightIconClick`, `v-model="searchQuery"`), com foco
  `brand-focus` recortado (`.ds-bottom-clip`); placeholder, busca case-insensitive e estado
  vazio inalterados.
- **Botão Filtros (opt-in):** props `showFilters` (default `false`) e `filtersCount` (badge com
  a quantidade quando > 0) + emit `open-filters`; `UiButton` outline à direita da busca. Sem
  `showFilters` a toolbar **não muda** (nenhum consumidor existente ativa por padrão).
- **`docs/01` §5.11** atualizado: props novas, linha de emits (`open-filters`), bullet da busca
  e do botão, exemplo com `show-filters`/`:filters-count`/`@open-filters`.

## 5. Comportamento: filtros, busca e exportação

- **Duas superfícies complementares:** a **busca** da `UiDataTable` é texto livre instantâneo
  (foco na digitação, limpar restaura — recurso do componente, sem rede); os **filtros** são
  estruturais (intervalo de datas + selects de usuário/ação/recurso), aplicados pelo modal e
  **enviados ao servidor** na query do `GET /api/auditoria`, refletidos no badge do botão
  (`filtersCount` — até 5: data inicial, data final, usuário, ação e recurso).
- **KPIs recalculam** a cada mudança de filtro (spec `auditoria`: "Registros" é a contagem do
  filtrado — não da base inteira).
- **Exportação** opera sempre sobre os registros filtrados; o PDF é um **arquivo de relatório
  baixado** (`auditoria.pdf`, folha paisagem) — não é o diálogo de impressão do navegador.
- **Rodapé:** "Registros sujeitos à política de retenção de logs de auditoria — ajustar em
  Configurações Globais" (link para `/admin/configuracoes-globais`).

## 6. Backend da trilha (fase 2)

### 6.1 `server/utils/audit.ts` — `registrarAuditoria`

- Assinatura: `registrarAuditoria(event, { acao, recurso, entidadeId?, detalhes, sessao? })`,
  com `acao` restrita aos 5 tipos (`Inclusão`, `Alteração`, `Exclusão`, `Homologação` e
  `Acesso`).
- Preenche `usuario_id`/`usuario_nome`/`usuario_perfil` da sessão (`getSessionUser`) e
  `endereco_ip` (`ipDoCliente` — xForwardedFor quando houver proxy); `id` via `UUID()` e
  `data_hora` pelo DEFAULT da coluna.
- **`sessao` (sobrescrita opcional):** quando o request não carrega a sessão — login (os
  cookies pertencem à **resposta**) e `esqueci-senha` (rota pública) — o chamador informa
  `{ id, nome, perfil }`; sem isso o registro sairia como "Desconhecido".
- **Resiliência:** tudo em `try/catch` com `console.error` — a falha na auditoria **nunca**
  interrompe a operação principal (verificado com a tabela renomeada: a escrita respondeu 201
  e só o console registrou `[auditoria] Falha ao registrar evento de auditoria:`).
- **Mapeamento com a tabela** (migration 01 §18): `recurso` da tela → coluna `entidade`;
`entidade_id` = id da entidade afetada (`''` quando não aplicável); `acao` guarda o **tipo**
(é o que mantém o badge da tabela íntegro); o texto humano vai em `detalhes`. Em Softwares, `entidade_id` usa `softwares.uuid`; o código `SFT-XXX` permanece legível em `detalhes`.

### 6.2 Rotas auditadas (59 pontos)

| Rota | acao | recurso |
| :--- | :--- | :--- |
| `POST /api/usuarios` | Inclusão | Usuários |
| `PUT /api/usuarios/:id` | Alteração | Usuários |
| `PUT /api/usuarios/:id/situacao` | Alteração | Usuários |
| `DELETE /api/usuarios/:id` | Exclusão | Usuários |
| `POST /api/usuarios/importar` | Inclusão (1 evento com a contagem) | Usuários |
| `PATCH /api/usuarios/eu` | Alteração | Meu Perfil |
| `POST /api/perfis` | Inclusão | Perfis de Acesso |
| `PUT /api/perfis/:id` | Alteração | Perfis de Acesso |
| `DELETE /api/perfis/:id` | Exclusão | Perfis de Acesso |
| `PUT /api/perfis/:id/permissoes` | Alteração | Perfis de Acesso |
| `POST /api/perfis/:id/permissoes/copiar` | Alteração | Perfis de Acesso |
| `POST /api/softwares` | Inclusão | Softwares |
| `PUT /api/softwares/:codigo` | Alteração | Softwares |
| `DELETE /api/softwares/:codigo` | Exclusão | Softwares |
| `POST /api/softwares/importar` | Inclusão (1 evento com a contagem) | Softwares |
| `POST /api/parceiros` | Inclusão | Parceiros |
| `PUT /api/parceiros/:id` | Alteração | Parceiros |
| `DELETE /api/parceiros/:id` | Exclusão | Parceiros |
| `POST /api/parceiros/importar` | Inclusão (1 evento com a contagem) | Parceiros |
| `POST /api/release-week` | Inclusão (Homologação se publicar) | Release Week |
| `PUT /api/release-week/:id` | Alteração (Homologação se publicar) | Release Week |
| `PUT /api/release-week/:id/publicar` | Homologação | Release Week |
| `PUT /api/release-week/:id/arquivar` | Alteração | Release Week |
| `DELETE /api/release-week/:id` | Exclusão | Release Week |
| `POST /api/release-week/importar` | Inclusão (1 evento com a contagem) | Release Week |
| `POST /api/manuais` | Inclusão | Manuais Mensais |
| `PUT /api/manuais/:id` | Alteração | Manuais Mensais |
| `PUT /api/manuais/:id/publicar` | Homologação | Manuais Mensais |
| `PUT /api/manuais/:id/arquivar` | Alteração | Manuais Mensais |
| `DELETE /api/manuais/:id` | Exclusão | Manuais Mensais |
| `POST /api/manuais/importar` | Inclusão (1 evento com a contagem) | Manuais Mensais |
| `POST /api/lancar-chamadas` | Inclusão | Lançar as Chamadas |
| `PUT /api/lancar-chamadas/:id` | Alteração | Lançar as Chamadas |
| `PUT /api/lancar-chamadas/:id/aprovar` | Homologação | Lançar as Chamadas |
| `PUT /api/lancar-chamadas/:id/desaprovar` | Alteração | Lançar as Chamadas |
| `PUT /api/lancar-chamadas/:id/recusar` | Alteração | Lançar as Chamadas |
| `DELETE /api/lancar-chamadas/:id` | Exclusão | Lançar as Chamadas |
| `POST /api/lancar-chamadas/importar` | Inclusão (1 evento com a contagem) | Lançar as Chamadas |
| `POST /api/escopo-projetos` | Inclusão | Escopo de Projetos |
| `PUT /api/escopo-projetos/:id` | Alteração | Escopo de Projetos |
| `PUT /api/escopo-projetos/:id/publicar` | Homologação | Escopo de Projetos |
| `PUT /api/escopo-projetos/:id/arquivar` | Alteração | Escopo de Projetos |
| `DELETE /api/escopo-projetos/:id` | Exclusão | Escopo de Projetos |
| `POST /api/escopo-projetos/importar` | Inclusão (1 evento com a contagem) | Escopo de Projetos |
| `PUT /api/esteira-revisao/:id/aprovar` | Homologação | Esteira de Revisão |
| `PUT /api/esteira-revisao/:id/publicar` | Homologação | Esteira de Revisão |
| `PUT /api/esteira-revisao/:id/recusar` | Alteração | Esteira de Revisão |
| `PUT /api/esteira-revisao/:id/reabrir` | Alteração | Esteira de Revisão |
| `PUT /api/esteira-revisao/:id/suspender` | Alteração | Esteira de Revisão |
| `PUT /api/configuracoes` | Alteração | Configurações Globais |
| `POST /api/uploads` | Inclusão | Logomarcas / Avatares / Logos / Lançar as Chamadas |
| `POST /api/convite` | Inclusão | Usuários |
| `POST /api/seguranca/liberar` (conta existente) | Alteração | Rate Limits |
| `POST /api/seguranca/liberar` (e-mail inexistente) | Alteração | Rate Limits |
| `POST /api/auth/login` (sucesso) | **Acesso** | Autenticação |
| `POST /api/auth/logout` (com sessão) | **Acesso** | Autenticação |
| `POST /api/auth/trocar-senha` | **Acesso** | Autenticação |
| `POST /api/auth/esqueci-senha` (conta ativa) | **Acesso** | Autenticação |
| `POST /api/auth/esqueci-senha` (e-mail sem conta ativa) | **Acesso** | Autenticação |

- A chamada só acontece **após o sucesso da operação** — validação/conflito/erro de banco
  (400/404/409) não inserem nada (verificado).
- **Autenticação (tipo `Acesso`, badge variante neutra):** login registra a conta
  autenticada (sessão informada — ver §6.1); logout só gera evento quando há sessão
  identificada (sem cookie, o idempotente não insere nada); recuperação registra nos dois
  caminhos (conta ativa ou não) mantendo a resposta genérica anti-enumeração.
- **Tentativas de credencial inválida ficam fora da trilha:** vão exclusivamente ao log
  `seguranca_eventos_login` (aba Segurança de Configurações Globais) — os dois logs têm
  papéis distintos (segurança operacional × governança).
- `Homologação` cobre a aprovação de chamadas (`PUT /api/lancar-chamadas/:id/aprovar`). O RBAC por módulo
  (`requirePermission`) já exige a permissão nas rotas administrativas (ver `docs/02` §3.5).

### 6.3 `GET /api/auditoria` — `server/api/auditoria/index.get.ts`

- Protegido pelo middleware global `auth-api.ts`: **sem sessão → 401**.
- Query params opcionais: `dataInicial`, `dataFinal` (`yyyy-mm-dd`, janela inclusiva do dia),
  `usuario` (nome exato), `acao`, `recurso`, `busca` (texto), `ordenar`/`direcao`, `pagina`,
  `porPagina`, `exportar` — vazio/ausente = todos; `acao` fora dos 5 tipos resulta em conjunto
  vazio (sem erro).
- Resposta `{ registros, total, kpis, opcoes, pagina, porPagina }`: `registros` com
  `{ id, registradoEm, usuario: { id, nome }, acao, recurso, detalhes, ip, entidadeId }`
  ordenados por `data_hora DESC, id DESC`; `kpis` do conjunto filtrado; `opcoes` com usuários
  e recursos distintos do conjunto **não** filtrado.
- Validação de data: uma data presente porém inválida (formato ou data inexistente) responde `400`.

## 7. Dados iniciais (seed)

- **A trilha nasce vazia.** A tabela `auditoria` não recebe registro de demonstração no
  provisionamento: um banco novo termina as migrations com `SELECT COUNT(*) FROM auditoria = 0` e
  a trilha é preenchida **exclusivamente** por operações reais (escritas administrativas e eventos
  de autenticação via `registrarAuditoria`).
- As migrations históricas [`07_seed_auditoria.sql`](../server/migration/07_seed_auditoria.sql) e
  [`13_reconciliar_seed_e_indice.sql`](../server/migration/13_reconciliar_seed_e_indice.sql) ainda
  contêm o antigo seed (25 linhas `log-seed-001`…`log-seed-025`) e **não são editadas** (convenção
  `docs/qa/03`: nunca editar migration já executada). A migration
  [`18_remover_seed_auditoria.sql`](../server/migration/18_remover_seed_auditoria.sql) roda por
  último e apaga essas linhas (`DELETE FROM auditoria WHERE id LIKE 'log-seed-%'`), tanto em banco
  novo quanto em banco já provisionado — o `DELETE` é escopado ao prefixo do seed (ids reais são
  `UUID()`), sem tocar em registros de operações.
- O runner de migrations é idempotente (`_migrations`; errno 1062 tolerado) — re-execução não
  duplica; a `18` é naturalmente idempotente (reexecução apaga 0 linhas).
- **Nomenclatura canônica:** o nome da tabela é **`auditoria`** (a query do banner de
  `AbaRetencaoAuditoria` exibe `DELETE FROM auditoria WHERE data_hora < NOW() - INTERVAL N DAY`
  — coluna `data_hora` da migration 01 §18; a versão anterior da tela citava um nome de coluna
  inexistente e foi corrigida).

## 8. Navegação até a tela

- **Sidebar:** sessão "Administração" → item "Gestão de Auditoria" com `to: '/admin/auditoria'` (rótulo unificado com a página e o menu da conta)
  (`app/config/navigation.ts`) — fica ativo na rota (spec `layout-navigation`).
- **Menu da conta:** item "Gestão de Auditoria" com o mesmo `to`.
- Na Administração os quatro itens têm rota (Configurações Globais, Gestão de Usuários, Gestão de
  Auditoria e Perfis de Acesso (RBAC)); todos os itens atuais da sidebar têm rota, inclusive o
  Painel Executivo.

## 9. Estilo e CSS dedicado

- **Nenhum CSS dedicado novo** — só tokens e utilitários do DS (`bg-brand-primary`,
  `text-[#2dd4bf]`, `brand-focus`, `mono`/`tabular-nums` em IPs e datas).
- Exportação PDF: `jspdf` + `jspdf-autotable` (dependências novas, aprovadas pelo usuário) — a
  tela **não** usa mais o `@media print` de `main.css` (que continua no projeto para outros
  consumidores).

## 10. Vitrine `/design` §13

- A demo `show-header-top` da seção 13 passou a incluir `show-filters`,
  `:filters-count="filtrosDemo"` e `@open-filters="abrirFiltrosDemo"`: o clique alterna o
  contador 0 ↔ 2 e dispara `toast.info` (demonstra emit + badge sem modal real).
- A busca da §13 é a mesma `UiInput` (prova visual do padrão DS em tabela com agrupamento).

## 11. Especificações OpenSpec

- **Spec principal:** `openspec/specs/auditoria/spec.md` (capability `auditoria`) — fonte da
  verdade de comportamento.
- **Change `gestao-auditoria`** (arquivada, 2026-10-02): criou a tela (fase 1 em memória) +
  `design-system/data-table` (busca no kit + botão Filtros).
- **Change `relatorio-pdf-auditoria`** (arquivada): exportação em download de PDF.
- **Change `auditoria-backend-integracao`** (ativa → sincronizada): capability `auditoria`
  — **REMOVED** "fase 1 sem persistência"; **MODIFIED** cenários que citavam demonstração;
  **ADDED** carga via API com loading/toast, contrato do `GET /api/auditoria` e registro de
  trilha pelas operações de escrita.

## 12. Verificação

- `npm run build` (gate estrutural — não há lint/test no repositório).
- **Fase 1 (arquivada):** checagem CDP (Edge headless): rota 200 com shell + navegação, kit da
  toolbar (9/9), componentes de domínio (14/14), modal de filtros v2 (9/9), exportação CSV (4/4);
  `relatorio-pdf-auditoria` (CDP 8/8).
- **Fase 2 (change `auditoria-backend-integracao`):**
  - Seed: `SELECT COUNT(*) FROM auditoria WHERE id LIKE 'log-seed-%'` = **0** após o boot (trilha
    nasce vazia; a migration 18 remove o seed das 07/13). Em banco novo, `SELECT COUNT(*) FROM
    auditoria` = **0** antes da primeira operação; após o login, a trilha contém só o evento `Acesso`.
  - `GET /api/auditoria`: 401 sem sessão; 200 com `{ registros, total, kpis, opcoes, pagina, porPagina }`; ordenação
    decrescente; filtro `acao` → só o tipo pedido com `opcoes` intactas; ação desconhecida →
    200 vazio.
  - Escritas: 15 pontos de `registrarAuditoria` exercícados (perfis CRUD/matriz/cópia,
    usuários, configurações, upload, convite, liberar) — cada sucesso insere 1 registro com
    tipo/recurso corretos; 404 não insere.
  - Resiliência: com a tabela renomeada, `POST /api/usuarios` seguiu respondendo 201 e o
    console registrou `[auditoria] Falha ao registrar evento de auditoria: Table … doesn't exist`.
  - Autenticação (tipo `Acesso`): login registra a conta autenticada no topo (`usuario_id`
    preenchido — nunca "Desconhecido"); credencial inválida (401) não gera evento; logout
    com sessão registra e sem cookie não insere nada; troca de senha (usuário QA) e
    recuperação de senha (e-mail inexistente — resposta genérica intacta) registram com o
    e-mail/conta alvo; path de e-mail do `esqueci-senha` com conta existente coberto por
    code review (sem disparo de e-mail real no teste).
  - Greps: `REGISTROS`/`dataAtras` = 0 em `app/`; "fase 1 em memória" = 0 em `app/`;
    nenhuma referência à coluna antiga da retenção em `app/` e `docs/`.

## 13. Pendências e próximos passos

- **RBAC nas rotas:** `requirePermission(event, modulo, acao)` **já é aplicado** nas rotas
  administrativas (ver `docs/02` §3.5).
- **Filtros avançados:** o modal foi desenhado para crescer (IP, recurso com busca, faixa de
  datas) — novas opções entram nele sem tocar na toolbar.
- **Paginação server-side:** a listagem de auditoria **já é paginada no servidor** — `GET /api/auditoria`
  devolve `pagina`/`porPagina`/`total` e o `UiDataTable` opera em modo servidor.
- **`UiMenu` no kit:** o mini-menu do Exportar duplica a mecânica Esc/clique-fora do menu da
  conta; extrair para o kit é candidato a próxima evolução.
- **Gotcha do badge `Exclusão`:** a variante `blocked` força o dot pulsante; se poluir em uso
  real, trocar por variante neutra é ajuste de uma linha.
- **Expurgo automático:** a rotina diária é um **EVENT** do MariaDB (`ev_expurgo_auditoria`, migrations
  10/11), com catch-up no boot; a política segue `dias_retencao_auditoria`.
- Nenhum item de navegação sem rota no estado atual.

> **Contagem:** a tabela lista os **59 pontos** de auditoria (42 originais + 2 caminhos duplos de `esqueci-senha`/`seguranca/liberar` + 15 de Parceiros/Release Week/Esteira). A fonte executável é `registrarAuditoria` em `server/**`; a contagem é validada por busca de chamadas no código (59 chamadas + a definição em `server/utils/audit.ts`).
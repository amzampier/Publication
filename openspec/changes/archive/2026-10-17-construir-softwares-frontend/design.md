# Design

## Context

Ver `proposal.md` — Why. O módulo **Softwares** não tem nenhuma tela hoje (o item da sidebar é
botão morto), mas a tabela `softwares` já existe no banco (`docs/bd/01` §7 / `server/migration/01_create_tables.sql`)
e a chave de permissão `softwares` já está registrada em `app/components/perfis/usePerfisModelo.ts`.

O molde mais próximo é o módulo **Perfis de Acesso** (`app/components/perfis/`, `app/pages/admin/perfis-acesso.vue`):
página fina que compõe `Cabecalho` + `Kpis` + `Tabela` (`UiDataTable`) + modal de filtros e gera
PDF/CSV no cliente sobre o conjunto filtrado. As dependências `jspdf`/`jspdf-autotable` e `exceljs`
já estão no `package.json`. O backend de softwares (`server/api/softwares/**`) **não existe** e fica
fora desta change.

## Goals / Non-Goals

**Goals:**

- Entregar a página `/admin/softwares` componentizada, no padrão visual e de interação do kit.
- Fixar o **contrato de leitura** `GET /api/softwares` que o backend implementará depois.
- Filtros (categoria/situação), KPIs, listagem e exportações PDF/CSV funcionais no cliente.
- Versionar o modelo de importação em `docs/modelos/modelo-importacao-softwares.xlsx`.

**Non-Goals:**

- Backend/API real, migrations, seed e persistência de softwares (as escritas chamam o contrato, mas
  o endpoint não é criado aqui).
- A execução da importação (modal, parser e gravação).
- Paginação/filtragem no servidor (fica para quando o backend existir).
- Gating de rota por permissão RBAC (mantém-se só a guarda de sessão, como as telas atuais).

## Decisions

### D1 — Contrato primeiro, sem dado fictício

`useSoftwaresModelo.ts` já consome `GET /api/softwares` (espelho do padrão `usePerfisModelo`, com
`useState` + `useApiFetch`). Enquanto o endpoint não existir, a chamada falha e a tela exibe
**estado vazio/erro** — nunca uma base de demonstração (regra `RL02 DIV-12/13`).
Contrato previsto: array de softwares com `id`, `descricao`, `categoria`, `situacao`, `criado_em`,
`atualizado_em` (ISO 8601).

- *Alternativas:* (a) amostra local em memória para validar o visual — descartada por violar a regra de
  "sem demo"; (b) mock API Nitro temporário — descartada por adicionar um endpoint descartável que
  o backend real substituiria.

### D2 — Reuso do kit, sem componente `Ui*` novo

Todos os elementos têm par no kit: `UiButton`, `UiBadge` (`Ativo`→`done`, `Inativo`→`neutral`),
`UiKpi`, `UiDataTable` (`show-header-top` + `show-filters`), `UiSelect`, `UiModal`/`UiModalSection`,
`UiTooltip`, `UiLoading`. Logo, `docs/01` e a vitrine `/design` não são alterados.

- *Alternativa:* criar um `UiBadgeCategoria` dedicado — rejeitada por não haver semântica nova;
  categoria é texto simples (o realce é da situação).

### D3 — Filtros, KPIs e busca no cliente

Filtros (categoria/situação) e KPIs operam em memória sobre o conjunto retornado pela API, no mesmo
recorte da fase 1 de `perfis-acesso`. A `UiDataTable` faz busca/ordenação/paginação no cliente.

- *Trade-off:* não escala para catálogos grandes; aceitável agora e migrável para server-side
  quando o backend existir (a `UiDataTable` suporta modo servidor, como em `gestao-usuarios`).

### D4 — Exportações no cliente

`gerarPdfSoftwares.ts` (jsPDF A4 paisagem + autotable, com a logomarca via `useLogomarcaLogin`) e o
CSV (delimitador `;`, BOM UTF-8, neutralização de fórmula) geram sobre o **conjunto filtrado**,
espelhando `perfis/gerarPdfPerfis.ts` e o CSV de `perfis/Cabecalho.vue`.

### D5 — Componentização e navegação

Página fina `app/pages/admin/softwares.vue` (`definePageMeta({ layout: 'admin' })`), dona do estado de
coordenação, composta por `app/components/softwares/`:

```
admin/softwares.vue               (page: composição + coordenação)
├── <SoftwaresCabecalho @novo />  tile Boxes (#0364f7) + título + menu "Relatórios" + ação primária
├── <SoftwaresKpis />             UiKpi do conjunto vigente (Total, Ativos, Inativos, por Categoria)
├── <SoftwaresTabela @editar @excluir @importar @open-filters />  UiDataTable + Import (à esquerda de Filtros)
├── <SoftwaresFiltros v-model />  modal de filtros (Categoria, Situação)
├── <SoftwaresFormulario v-model :modo :software />  modal de cadastro/edição
└── <SoftwaresExclusao v-model :software @confirmar />  modal de confirmação
    useSoftwaresModelo.ts         estado/computed + filtros + salvarSoftware/excluirSoftware
    gerarPdfSoftwares.ts          PDF do conjunto filtrado
```

`app/config/navigation.ts`: o item `softwares` (grupo Cadastros) passa a declarar `to: '/admin/softwares'`.

### D6 — Formatação de timestamps

`criado_em`/`atualizado_em` chegam ISO 8601 e são exibidos em `pt-BR` (`dd/mm/aaaa hh:mm`) na tabela
e nas exportações — o mesmo tratamento das telas existentes.

### D7 — Modelo de importação

`docs/modelos/modelo-importacao-softwares.xlsx` é gerado com `exceljs` (dependência existente) para
garantir um `.xlsx` válido, com cabeçalho **Descrição, Categoria, Situação**, alinhado ao molde
`modelo-importacao-usuarios.xlsx`. Nenhum parser/modal é criado nesta change.

### D8 — Escritas pelo contrato da API

`salvarSoftware` (POST/PUT `/api/softwares`) e `excluirSoftware` (DELETE `/api/softwares/:id`) são as
únicas portas de gravação — o cliente envia só os campos editáveis (`descricao`, `categoria`,
`situacao`); o servidor gera o `id` e resolve os timestamps. Enquanto o backend não existir, a
chamada falha e o erro vira `toast.danger` (mesma postura do restante do sistema).

- *Alternativa:* mutar a base local em memória — descartada por simular persistência (RL02 DIV-12/13).

### D9 — Modais componentizados no molde Perfis/Usuários

`Formulario.vue` (cadastro/edição) e `Exclusao.vue` (confirmação) replicam o molde de
`perfis/Formulario.vue`/`perfis/Exclusao.vue`: a página é dona da coordenação; o formulário valida
Descrição (obrigatória, ≤200) e salvaguarda categoria/situação; na edição exibe a seção "Informações
de Cadastro" com os timestamps desabilitados. A exclusão é apresentação pura e emite `confirmar`.

### D10 — Affordância de importação à esquerda de Filtros

O botão de importação (`Import`) usa o slot `filtersLeft` da `UiDataTable` (imediatamente à esquerda
do botão "Filtros") e emite `importar`; a execução da importação é adiada — por ora, a ação informa
que será habilitada com o backend (sem botão morto).

## Risks / Trade-offs

- **Backend inexistente → tela sempre vazia** → Mitigação: contrato documentado na spec e estado
  vazio/erro explícito; o backend pluga depois sem refazer a página.
- **Filtros/exports no cliente não escalam** → Mitigação: registrar como follow-up a migração para
  server-side quando `GET /api/softwares` suportar paginação/filtros.
- **Divergência doc × código** → Mitigação: `docs/10` é criado junto e espelha a implementação; a
  capability `softwares` é a fonte da verdade do comportamento.

## Migration Plan

1. Adicionar `to: '/admin/softwares'` ao item `softwares` em `app/config/navigation.ts`.
2. Criar a página e os componentes de domínio.
3. Criar `docs/10 - Módulo dos Softwares.md` e `docs/modelos/modelo-importacao-softwares.xlsx`.
4. Verificar com `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`, além da
   conferência visual em `http://localhost:3000/admin/softwares` (estado vazio até o backend).

Rollback: remover a rota do item de navegação e os arquivos novos; nenhum dado persistido é afetado.

## Open Questions

- Quando o backend existir, os filtros/busca/paginação devem migrar para server-side? (decidível
  depois, sem mudar o comportamento especificado agora.)

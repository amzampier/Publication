# Proposal

## Why

Ao lançar uma chamada, hoje é possível vincular **um único software** (`entregas_itens.software_id`).
Na prática, uma mesma correção/melhoria costuma atingir dois ou três softwares (ex.: `Teorema ERP` e
`Arquivos Digitais - SPED`), o que obriga o operador a duplicar a chamada ou a registrar um software
genérico — perdendo a rastreabilidade por software nas listas, filtros, relatórios e no Escopo de Projetos.

## What Changes

- A chamada passa a vincular **um ou mais softwares** (mínimo um continua obrigatório).
- Nova tabela de junção `entregas_itens_softwares` (`entrega_item_id`, `software_codigo`,
  `software_nome`, `ordem`) com chaves estrangeiras para `entregas_itens` e `softwares`.
- `entregas_itens.software_id`/`software` são preservados como o **software principal** (primeiro
  selecionado), mantendo compatibilidade com listas, filtros e leituras existentes; registros antigos
  são lidos como uma lista de um item.
- Novo componente de design system **`UiMultiSelect`** (busca + chips) para escolher os softwares no
  formulário; o filtro da listagem passa a aceitar múltiplos softwares.
- Busca textual, importação XLSX (códigos separados por `;`) e os detalhes passam a considerar todos os
  softwares; os **softwares contemplados** do Escopo de Projetos passam a ser derivados de todos os
  vínculos das chamadas.

## Capabilities

### New Capabilities
- `design-system/multi-select`: contrato do componente de seleção múltipla do kit (busca, chips,
  teclado, foco/erro da família, estados vazio/limite), reutilizável por outros formulários.

### Modified Capabilities
- `lancar-chamadas`: o cadastro/edição vincula N softwares; a validação exige ao menos um; a busca e o
  filtro consideram todos; o backend persiste a junção e expõe a lista; a importação aceita vários
  códigos; os detalhes e a listagem exibem os softwares.
- `escopo-projetos`: os softwares contemplados passam a ser derivados de **todos** os softwares das
  chamadas vinculadas (sem repetição), e não mais de um único `software_id` por item.

## Impact

- **Banco:** nova tabela `entregas_itens_softwares` + migration (aditiva, idempotente, com rollback).
- **Backend:** `server/utils/lancar-chamadas.ts` (resolver/gravar/ler a junção, snapshots, busca),
  `server/utils/escopo-projetos.ts` (derivação dos softwares contemplados).
- **Frontend:** novo `app/components/ui/MultiSelect.vue`; `Formulario.vue`, `Filtros.vue`,
  `Detalhes.vue`, `Tabela.vue`; tipos/validação em `shared/lancar-chamadas.ts`.
- **Importação:** `lerPlanilhaLancarChamadas.ts` e `server/utils/lancar-chamadas.ts` (múltiplos códigos).
- **Design system:** `app/pages/design.vue` (nova seção) e `docs/01 - design_system.md`.
- **Docs:** `docs/15 - Módulo Lançar Chamadas.md` e `docs/14 - Módulo do Escopo de Projetos.md`.
- **Fora de escopo:** Área Pública, alterar o catálogo de `softwares` e o vínculo 1:1 de parceiro.

# Proposal

## Why

O modal Novo Usuário / Editar Usuário está com o respiro vertical entre linhas de campos grande demais: todos os gaps verticais são `gap-4` (16px), e o usuário pediu para encolher **5px** em cada um deles (16px → 11px) do primeiro bloco até o fim do container, sem alterar o espaçamento horizontal entre colunas.

## What Changes

- `app/components/ui/ModalSection.vue` **não muda** — os defaults do kit seguem `gap-4` (16px) para todos os demais modais (Filtros de Usuários, Filtros de Auditoria, Importar, Exclusão, Detalhe da Auditoria, Câmera e vitrine §15).
- `app/components/usuarios/Formulario.vue` (o único componente atrás dos modais **Novo Usuário** e **Editar Usuário**) passa a aplicar `gap-y-[11px]` na vertical em todos os seus grids:
  - nível A — grid raiz entre os cards de seção (`:393`);
  - nível C — grids de campos com linhas quebradas (`:396`, `:407`, `:447`, `:488`, `:559`, `:643`), preservando `gap-x-4` (16px) entre colunas;
  - nível B — grid interno do `UiModalSection`, por override pontual: `class="[&>div.grid]:gap-y-[11px]"` passada nas quatro `<UiModalSection>` do formulário (fallthrough de attrs para o `<section>` raiz).
- Documentação: novo bullet em `docs/06 - Gestão de Usuários.md` §3.4 registrando o ritmo vertical 11px / horizontal 16px do modal e o mecanismo de override.
- Sem mudança de comportamento, validação, teclado, foco ou dados — apenas ritmo visual.

## Capabilities

### New Capabilities

*(nenhuma)*

### Modified Capabilities

*(nenhuma — nenhum requisito de spec é afetado; `skip_specs: true` declarado no `.openspec.yaml`. A spec `gestao-usuarios` descreve blocos, campos e validação do modal, mas nenhum requisito fixa valores de gap; `design-system/modais` cobre apenas teclado/empilhamento.)*

## Impact

- **Código:** `app/components/usuarios/Formulario.vue` (classes em 1 grid raiz + 6 grids de campos + atributo `class` em 4 `UiModalSection`).
- **Docs:** `docs/06 - Gestão de Usuários.md` §3.4 (verdade visual do módulo). `docs/01` §5.12 permanece correto — os defaults do kit não mudam.
- **Sem impacto:** outros modais, componentes do kit, specs OpenSpec, validação, teclado/foco, dados em memória.
- **Verificação:** `npm run build` + conferência visual em `http://localhost:3000/admin/gestao-usuarios` (Novo Usuário e Editar, desktop e largura estreita) e regressão visual nos modais não afetados.

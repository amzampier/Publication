# Proposal

## Why

Com nove colunas de dados, a listagem de Lançar as Chamadas excede a largura útil da área administrativa em notebooks e a coluna **Ações** fica no fim da rolagem horizontal. O usuário precisa rolar até o fim para editar, excluir ou abrir o menu de aprovação/recusa, o que quebra o fluxo operacional da tela.

## What Changes

- Adicionar ao `UiDataTable` a prop opt-in `stickyActions` (default `false`) para fixar a coluna de Ações à direita durante a rolagem horizontal, incluindo cabeçalho, células e rodapé.
- Manter fundo opaco, largura estável e sombra sutil à esquerda na coluna fixa, com hover coerente com a linha.
- Ativar `stickyActions` somente na tabela de Lançar as Chamadas.
- Atualizar a documentação do design system e do módulo.
- Sem alteração de API, banco, regra de negócio ou payload.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `design-system/data-table`: novo comportamento opcional de fixação da coluna de Ações, desligado por padrão.
- `lancar-chamadas`: a coluna de Ações permanece visível durante a rolagem horizontal da listagem.

## Impact

- `app/components/ui/DataTable.vue`: nova prop e classes de fixação.
- `app/components/lancar-chamadas/Tabela.vue`: ativação da prop.
- `docs/01 - design_system.md` e `docs/15 - Módulo Lançar Chamadas.md`: documentação.
- Sem migrations, endpoints ou dependências novas.

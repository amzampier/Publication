# Proposal

## Why

Dois resíduos funcionais após as correções de mídia e da Esteira:

1. ao remover uma imagem de uma chamada, o arquivo original é apagado, mas a miniatura antiga no padrão `radical-320.webp` permanece no disco; o nome novo `<arquivo-completo>-320.webp` é limpo, porém as miniaturas legadas não;
2. a inspeção da Esteira usa o item resumido da listagem, que não contém `descricao_completa`, `descricao_html`, `solucao` nem `solucao_html`; por isso o modal mostra “Descrição completa” e “Solução” vazias. O rótulo também deve passar a ser **Descrição do Resumo**.

## What Changes

- Remover, na limpeza de imagens da chamada, tanto a variante nova quanto a legada (`radical-320.webp`), com a mesma checagem de referência por outra chamada.
- Buscar o detalhe completo em `GET /api/esteira-revisao/:id` ao abrir a inspeção da Esteira, em vez de usar somente o item da listagem; atualizar o item após decisões.
- Renomear o rótulo da seção de conteúdo da Esteira para **Descrição do Resumo**.
- Nenhuma mudança de schema, migrations ou dados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. As specs de `uploads` e `esteira-revisao` já exigem a limpeza de mídias e a exibição de descrição/solução; é correção de implementação. O change declara `skip_specs: true`.

## Impact

- Servidor: `server/utils/lancar-chamadas.ts` (limpeza de miniaturas).
- Cliente: `app/pages/admin/esteira-revisao.vue` e `app/components/esteira/Detalhe.vue`.
- Documentação: `docs/16`.
- Testes: unidade da limpeza e E2E de inspeção.

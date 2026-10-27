# Proposal

## Why

As imagens da chamada são persistidas em `anexos_midias` e aparecem na tela de Lançar as Chamadas, mas a listagem da Esteira de Revisão monta os itens sem carregar essas mídias. O modal de detalhe recebe `item.imagens` vazio e exibe "Nenhuma imagem anexada". O upload também gera, de propósito, o original e uma miniatura WebP de 320 px; a galeria deve usar essa miniatura e não tratar o segundo arquivo como duplicidade.

## What Changes

- Carregar as mídias relacionais em `listarChamadasParaEsteira`, para que o board e o detalhe recebam `imagens` de `anexos_midias`.
- Usar `urlMiniatura` na grade e nas miniaturas do detalhe da Esteira, com fallback para o original quando a variante não existir.
- Documentar que o upload grava o original e a variante `-320.webp` intencionalmente.
- Nenhuma mudança de schema, migrations ou dados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

Nenhuma. A spec de `lancar-chamadas` e a de `esteira-revisao` já exigem a exibição das imagens e o uso de miniaturas; trata-se de correção de implementação. O change declara `skip_specs: true`.

## Impact

- Servidor: `server/utils/lancar-chamadas.ts` (`listarChamadasParaEsteira`).
- Cliente: `app/components/esteira/Detalhe.vue`.
- Documentação: `docs/15` e `docs/16`.
- Testes: verificação de API/E2E do board/detalhe com uma chamada que possui imagem.

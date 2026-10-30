# Proposal

## Why

Os cards de chamada do Escopo usam uma barra estática na borda esquerda para sinalizar impacto Crítico ou Alto. O destaque chama pouca atenção e não traduz a ideia de alerta em movimento. Uma luz percorrendo o contorno do card comunica melhor o destaque sem depender de mais texto ou de uma cor de fundo.

## What Changes

- Substituir a barra estática de 4px por uma borda base discreta (1px) e um cometa SVG que percorre o contorno do card.
- Usar rose para Crítico e orange para Alto, com o mesmo loop de 5s, linear e infinito.
- Manter o badge, o ícone e o texto do impacto como sinal principal; o cometa é reforço visual.
- Em prefers-reduced-motion, ocultar o cometa e manter uma borda estática de 2px na cor do impacto.
- Não pausar a animação no hover ou no foco.
- Atualizar docs, a vitrine e a spec de escopo-publico; sem API, migration ou dependência nova.

## Capabilities

### New Capabilities

- Nenhuma.

### Modified Capabilities

- `escopo-publico`: o destaque dos impactos Crítico e Alto passa de moldura/barra estática para borda com cometa SVG, com fallback estático em movimento reduzido.

## Impact

- **App:** `app/components/publico/EscopoChamadaCard.vue` (SVG e classes de animação), `app/pages/design.vue` (vitrine).
- **Docs/specs:** `docs/01`, `docs/21` e a spec `escopo-publico`.
- **Testes:** verificação visual e de `prefers-reduced-motion`; sem teste unitário de CSS.
- **Dependências:** nenhuma nova; sem alteração de API, banco ou permissões.

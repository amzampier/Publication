# Design

## Context

Ver proposal.md - Why. O EscopoChamadaCard já calcula critico e alto e aplica borda, barra esquerda, anel e sombra estáticos; o UiBadge já tem as variantes critico e alto. O main.css já usa um disco cônico giratório no UiLoading e possui uma regra global de prefers-reduced-motion.

## Goals / Non-Goals

**Goals:**

- Trocar a barra estática por um cometa que percorre o contorno do card.
- Manter o destaque legível sem animação e sem depender apenas de cor.
- Usar o mesmo ritmo nos dois impactos, sem novas dependências.

**Non-Goals:**

- Criar um componente genérico de borda animada para todos os cards.
- Alterar a API, o banco ou a Área Administrativa.
- Animar todos os cards; só Crítico e Alto recebem o cometa.

## Decisions

### D1. SVG com stroke-dasharray e stroke-dashoffset

O card recebe um SVG absoluto, pointer-events-none e aria-hidden, com um rect de rx 16 (mesmo raio do rounded-2xl), pathLength 100, stroke-dasharray 22 78, stroke-linecap round e cor rose-600 ou orange-500. A animação vai de stroke-dashoffset 0 a -100, criando um segmento de luz que percorre o perímetro. Alternativa descartada: anel cônico com máscara, que exige @property ou um disco grande girando e pinta mais área.

### D2. Mesmo ritmo: 5s linear infinito

Os dois impactos usam 5s linear infinite. O crítico não é mais rápido que o alto; a diferença fica só na cor e no badge. A animação começa no canto superior esquerdo e não pausa no hover/focus.

### D3. Borda base e fallback de movimento reduzido

A barra esquerda de 4px sai. Fica uma borda base de 1px (border-rose-300/border-orange-300) para delimitar o card. Em prefers-reduced-motion reduce, o SVG é ocultado e a borda base passa a 2px na cor do impacto (rose-600/orange-500), preservando o destaque sem animação. O badge, o ícone e o texto continuam iguais.

### D4. Acessibilidade e desempenho

O cometa é decorativo (aria-hidden), não recebe foco e não substitui o texto Impacto: Crítico/Alto. A animação de stroke-dashoffset pinta apenas a área do SVG; como no máximo três cards são destacados, o custo é baixo. Não há will-change nem camadas grandes.

## Risks / Trade-offs

- **SVG em cada card destacado** → o markup é pequeno e só aparece para Crítico/Alto; não há IDs de gradiente, então não há colisão.
- **Animação contínua** → o loop de 5s é lento; a regra global de movimento reduzido e o fallback estático cobrem quem prefere menos movimento.
- **Borda base + cometa** → a borda pode competir com o anel; o anel/sombra existente será reduzido para manter o cometa como foco.

## Migration Plan

Sem migration. Alteração de UI e documentação; rollback é reverter o commit.

## Open Questions

Nenhuma.

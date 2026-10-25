# Spec Delta

## ADDED Requirements

### Requirement: Miniaturas legadas têm fallback

Quando uma mídia de chamada não possuir a variante `-320.webp`, a galeria/rota SHALL usar o arquivo
original como fallback, sem exibir imagem quebrada nem responder erro.

#### Scenario: Mídia antiga sem miniatura
- **WHEN** a galeria renderiza uma imagem cuja variante `-320.webp` não existe
- **THEN** o original é exibido e a página não registra erro de imagem

#### Scenario: Miniatura existente
- **WHEN** a variante `-320.webp` existe
- **THEN** ela continua sendo usada para reduzir banda
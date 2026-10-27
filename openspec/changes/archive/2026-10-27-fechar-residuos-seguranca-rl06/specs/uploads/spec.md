# Spec Delta

## ADDED Requirements

### Requirement: A miniatura da mídia de chamada é autorizada pela URL exata do original

O sistema SHALL gerar a variante reduzida com nome derivado do arquivo original completo (`<arquivo>-320.webp`), de modo que duas imagens com o mesmo radical e extensões diferentes não compartilhem a mesma miniatura. O servimento da miniatura SHALL autorizar a URL exata do original em `anexos_midias`; NÃO SHALL usar busca por prefixo/radical. A pré-visualização administrativa SHALL exigir sessão server-side válida, ativa e não provisória, além da permissão de visualização de Chamadas. O gate anônimo permanece: chamada `Publicado`, `publicado_em <= NOW(6)` e ao menos um vínculo pai publicado e não arquivado.

#### Scenario: Miniatura de imagem não publicada

- **WHEN** uma imagem pertence a uma chamada não publicada e um visitante anônimo abre sua miniatura
- **THEN** a rota responde `404`, mesmo que exista uma imagem publicada com o mesmo radical

#### Scenario: Mesmo radical, extensões diferentes

- **WHEN** existem `imagem.png` publicada e `imagem.jpg` não publicada
- **THEN** `imagem.png-320.webp` é servida apenas pelo vínculo de `imagem.png`, e `imagem.jpg-320.webp` permanece negada ao anônimo

#### Scenario: Sessão revogada ou provisória

- **WHEN** um access token revogado, de conta inativa ou de senha provisória tenta abrir uma mídia não publicada
- **THEN** a rota não autoriza a pré-visualização administrativa e responde `404` ou `401`

#### Scenario: Miniatura antiga

- **WHEN** a miniatura no formato antigo (`<radical>-320.webp`) não corresponde a um original exato autorizado
- **THEN** ela não é servida; o cliente usa o fallback para a imagem original

# Spec Delta

## MODIFIED Requirements

### Requirement: Tokens de cor da marca resolvem na folha de estilo
O sistema SHALL expor os tokens `brand.primary`, `brand.structure`, `brand.accent`, `brand.primary-raised` e `brand.focus` de modo que as classes utilitárias correspondentes gerem CSS real, incluindo suas variantes com opacidade.

#### Scenario: Classe primária gera fundo
- **WHEN** qualquer componente renderiza `bg-brand-primary`
- **THEN** o CSS gerado contém uma regra para `.bg-brand-primary` e o fundo resultante é `#112051`

#### Scenario: Variante de estrutura com opacidade
- **WHEN** um componente renderiza `bg-brand-structure/10`
- **THEN** o fundo resultante é `#0364f7` com 10% de opacidade

#### Scenario: Nenhuma classe brand fica sem regra
- **WHEN** o projeto é compilado
- **THEN** toda classe `brand-*` referenciada no código-fonte tem regra correspondente no CSS de saída (contagem de `brand` no CSS gerado maior que zero)

#### Scenario: Classe de foco resolve no verde canônico
- **WHEN** qualquer componente renderiza `border-brand-focus`
- **THEN** o CSS gerado contém uma regra para `.border-brand-focus` e a cor resultante é `#1a9e07`

#### Scenario: Anel de foco aceita opacidade
- **WHEN** um componente renderiza `ring-brand-focus/30`
- **THEN** o anel resultante é `#1a9e07` com 30% de opacidade

### Requirement: Paleta oficial com as três cores atualizadas
O sistema SHALL tratar como paleta oficial as oito cores de marca, com Navy em `#112051`, Estrutural em `#0364f7`, Accent em `#4ed813` e Vermelho Rosa (erro e validação) em `#be123c` — o mesmo valor da classe `bg-rose-700`, de modo que hex exibido e classe aplicada nunca divirjam.

#### Scenario: Vitrine exibe os novos hexes
- **WHEN** a seção 2 da página `/design` renderiza
- **THEN** os swatches mostram `#112051`, `#0364f7` e `#4ed813` nos lugares dos hexes antigos

#### Scenario: Copiar HEX entrega o valor novo
- **WHEN** o usuário aciona "Copiar HEX" em um swatch atualizado
- **THEN** a área de transferência recebe o hex novo correspondente

#### Scenario: Documentação acompanha a paleta
- **WHEN** `docs/01 - design_system.md` §2 é lido
- **THEN** os hexes da tabela coincidem com os valores dos tokens e não restam menções aos hexes antigos

#### Scenario: Swatch do vermelho coincide com a classe
- **WHEN** o swatch "Vermelho Rosa (Erro & Alerta)" da seção 2 é comparado com a classe `bg-rose-700`
- **THEN** ambos exibem `#be123c`, sem restar `#b91c1c`

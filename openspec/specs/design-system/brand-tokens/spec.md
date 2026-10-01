# Brand Tokens Specification

## Purpose

Define as cores oficiais da marca do Publications, os tokens Tailwind que as tornam utilizáveis pelos componentes, e as regras de aplicação — cor sólida × degradê, estados de interação e papel do accent — para que a vitrine `/design`, os componentes `app/components/ui/` e a documentação de design system exibam sempre o mesmo valor.

## Requirements

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

### Requirement: Botão primário e header de modal usam degradê
O sistema SHALL renderizar o botão na variante `primary` e o cabeçalho do modal com um degradê horizontal, da esquerda para a direita, do `brand.primary` ao `brand.structure`.

#### Scenario: Degradê no botão primário
- **WHEN** um `Button` com `variant="primary"` é renderizado
- **THEN** o fundo é um degradê de `#112051` (esquerda) até `#0364f7` (direita)

#### Scenario: Degradê no cabeçalho do modal
- **WHEN** um modal é aberto
- **THEN** o seu cabeçalho exibe o mesmo degradê horizontal, preservando o filete de accent de 2,5px na borda esquerda

#### Scenario: Demais superfícies primárias continuam sólidas
- **WHEN** superfícies como o cabeçalho da `DataTable`, tooltip, checkbox marcada, dia selecionado do calendário e menus dark são renderizadas
- **THEN** receem fundo sólido do `brand.primary`, sem degradê

#### Scenario: Hover e active preservam o degradê
- **WHEN** o botão primário recebe hover ou é pressionado
- **THEN** o degradê permanece e apenas o brilho do fundo varia, sem trocar para uma cor plana

### Requirement: Accent dos componentes coincide com o token
O sistema SHALL renderizar as superfícies de accent que hoje usavam `lime-400` com o valor do token `brand.accent`.

#### Scenario: Badge da grid usa o token
- **WHEN** a `DataTable` renderiza seus badges e indicadores de accent
- **THEN** a cor aplicada é `#4ed813`, e não o `#a3e635` do `lime-400` do Tailwind

#### Scenario: Filete do modal usa o token
- **WHEN** o cabeçalho do modal renderiza o filete esquerdo
- **THEN** a cor do filete é `#4ed813`

#### Scenario: Vitrine e componente mostram a mesma cor
- **WHEN** o swatch de accent da seção 2 é comparado com um componente real de accent
- **THEN** ambos exibem `#4ed813`

### Requirement: Superfícies de marca não carregam hex fixado no componente
Os componentes em `app/components/` SHALL obter as cores de marca dos tokens, sem hexes de marca embutidos em estilo inline ou em classe arbitrária; a vitrine `/design` pode exibir hexes literalmente por ser a própria amostragem da paleta.

#### Scenario: Cabeçalho do app é tokenizado
- **WHEN** o cabeçalho da aplicação é renderizado
- **THEN** seu fundo vem da classe de token `brand.primary`, sem `style="background-color:#…"` embutido

#### Scenario: Nenhum hex antigo sobrevive
- **WHEN** `#00259c`, `#087df9` e `#49de10` são procurados em `app/`
- **THEN** não há ocorrências

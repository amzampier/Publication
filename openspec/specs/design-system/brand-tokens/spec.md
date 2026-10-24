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
O sistema SHALL renderizar com degradê: o botão na variante `primary`, o cabeçalho do modal (do
`brand.primary` ao `brand.structure`), a região preenchida do slider `UiSlider` (de `#112051`
por `#0364f7` até `#4ed813`, esticada da origem até o thumb), a região preenchida da barra de
progresso do `UiLoading` (de `#112051` por `#0364f7` até `#4ed813`, da origem até a posição
atual) com degradê horizontal, da esquerda para a direita; a borda da caixa do `UiLoading` com
degradê cônico giratório percorrendo as
mesmas três cores na mesma ordem (`#112051` → `#0364f7` → `#4ed813`) ao redor da caixa; e o
**card de resumo da tela Meu Perfil** com degradê vertical suave, do `brand.structure` bem diluído
no topo esmaecendo até o branco na base.

#### Scenario: Degradê no botão primário
- **WHEN** um `Button` com `variant="primary"` é renderizado
- **THEN** o fundo é um degradê de `#112051` (esquerda) até `#0364f7` (direita)

#### Scenario: Degradê no cabeçalho do modal
- **WHEN** um modal é aberto
- **THEN** o seu cabeçalho exibe o mesmo degradê horizontal, preservando o filete de accent de 2,5px na borda esquerda

#### Scenario: Degradê na trilha do slider
- **WHEN** um `UiSlider` é renderizado com um valor intermediário
- **THEN** a região preenchida da track exibe o degradê `#112051` → `#0364f7` → `#4ed813` terminando junto ao thumb, e a região não preenchida é `slate-200`

#### Scenario: Degradê na barra de progresso do UiLoading
- **WHEN** o `UiLoading` é renderizado com `current`/`total` informados
- **THEN** a região preenchida da barra exibe o degradê `#112051` → `#0364f7` → `#4ed813` da esquerda até a posição atual, e a trilha não preenchida é `slate-200`

#### Scenario: Degradê na borda do UiLoading
- **WHEN** o overlay do `UiLoading` está aberto
- **THEN** a borda da caixa exibe o degradê giratório `#112051` → `#0364f7` → `#4ed813` na mesma ordem das demais superfícies de degradê da marca

#### Scenario: Degradê no card de resumo do Meu Perfil
- **WHEN** o card lateral de `/admin/meu-perfil` (o container do Avatar) é renderizado
- **THEN** o fundo é um degradê vertical do `brand.structure` diluído (opacidade baixa) no topo até o branco na base, partindo da classe de token e sem hex fixado no componente

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

### Requirement: As superfícies usam tokens de cor, sem hex fora da paleta
As superfícies e detalhes da interface SHALL derivar as cores dos tokens do design system
(`brand.*`), sem hex fixado **fora da paleta** — em particular, os links/realces das telas de
autenticação não podem usar `#2161ef` (cor fora da paleta). A escala navy do fundo das telas de
autenticação é a paleta documentada do `AuthBackground` (`docs/08` §7) e permanece permitida.

#### Scenario: Nenhum hex fora da paleta em telas administrativas
- **WHEN** as telas administrativas (incluindo as telas de autenticação) são inspecionadas
- **THEN** as cores provêm dos tokens do design system, sem valores hex fora da paleta (como `#2161ef`)

### Requirement: O accent usa o token, sem resíduos de lime
Os indicadores e realces de accent SHALL usar `brand-accent` (`#4ed813`), sem resíduos de
`lime-500`/`lime-400` em componentes do kit (ex.: filete/realce da `DataTable`, `Checkbox`,
`CheckCard`, `ChoiceCard`, `UploadFiles`).

#### Scenario: Accent sem lime-500
- **WHEN** os componentes do kit que usam accent são inspecionados
- **THEN** não há classes `lime-500`/`lime-400`; o accent usa o token `brand-accent`

### Requirement: Os dots de status e badges usam a paleta documentada
Os indicadores de status (dots do `UiBadge` e o sino de notificações do header) SHALL usar as cores semânticas documentadas do design system (`#047857`/`#be123c` e equivalentes), sem valores crus `*-500` (`emerald-500`, `rose-500`, `blue-500`, etc.) fora da paleta.

#### Scenario: Dots usam a paleta documentada
- **WHEN** os dots de status do `UiBadge` e o sino do header são inspecionados
- **THEN** as cores provêm da paleta documentada, sem classes `*-500` cruas fora dela

### Requirement: O texto secundário atende ao contraste mínimo
O texto de apoio (legendas, estados vazios, rótulos secundários) sobre superfícies claras SHALL atender ao contraste mínimo AA (razão ≥ 4,5:1), não usando tons como `slate-400` que ficam abaixo do mínimo sobre branco.

#### Scenario: Texto de apoio legível
- **WHEN** um texto de apoio é exibido sobre superfície clara
- **THEN** a cor usada atende ao contraste AA (razão ≥ 4,5:1)

### Requirement: A paleta de texto rico é uma allowlist de conteúdo documentada

O sistema SHALL documentar, para os campos de texto rico, uma allowlist de cores de **conteúdo**
distinta das cores de **estado**. A allowlist SHALL incluir uma opção sem cor e tons com contraste AA
sobre superfície clara, entre eles o **vermelho de conteúdo** `#dc2626`, que NÃO SHALL ser confundido
com o vermelho de erro `#be123c` (`rose-700`) usado em validação. A aplicação do texto rico SHALL usar
apenas valores dessa allowlist.

#### Scenario: Vermelho de conteúdo distinto do vermelho de erro

- **WHEN** a paleta de texto rico e o vermelho de erro do design system são comparados
- **THEN** o vermelho de conteúdo é `#dc2626` e o vermelho de erro permanece `#be123c`, com a distinção documentada

#### Scenario: Nenhuma cor fora da allowlist

- **WHEN** um conteúdo formatado é inspecionado
- **THEN** todas as cores de texto pertencem à allowlist documentada

#### Scenario: Documentação acompanha a paleta

- **WHEN** `docs/01 - design_system.md` §2 é lido
- **THEN** a paleta de texto rico está documentada com o vermelho de conteúdo e a distinção em relação ao erro

### Requirement: O mesmo status usa a mesma variante em todas as telas

O sistema SHALL manter um mapa canônico de status editorial para variante de `UiBadge` e SHALL usá-lo
em todas as telas que exibem o mesmo status — Painel Executivo, Release Week, Manuais, Escopo,
Lançar as Chamadas e Esteira. Um mesmo status NÃO SHALL aparecer com variantes diferentes entre
listagem, detalhe, modal e painel.

#### Scenario: Status igual em Painel e módulo
- **WHEN** uma Release Week com status `Em Revisão` aparece no Painel e na tela de Release Week
- **THEN** as duas exibições usam a mesma variante de badge

#### Scenario: Status de Escopo consistente
- **WHEN** um Escopo `Concluído` aparece no Painel e na grade de Escopo
- **THEN** ambos usam a variante de “concluído” definida no mapa canônico

#### Scenario: Status de Chamada consistente
- **WHEN** uma chamada `Publicado` aparece na listagem, no detalhe e na Esteira
- **THEN** as três exibições usam a mesma variante

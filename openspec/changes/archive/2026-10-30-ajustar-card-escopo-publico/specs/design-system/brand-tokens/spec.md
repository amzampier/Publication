# Spec Delta

## MODIFIED Requirements

### Requirement: Botão primário e header de modal usam degradê
O sistema SHALL renderizar com degradê: o botão na variante `primary`, o cabeçalho do modal (do
`brand.primary` ao `brand.structure`), a região preenchida do slider `UiSlider` (de `#112051`
por `#0364f7` até `#4ed813`, esticada da origem até o thumb), a região preenchida da barra de
progresso do `UiLoading` (de `#112051` por `#0364f7` até `#4ed813`, da origem até a posição
atual) com degradê horizontal, da esquerda para a direita; a borda da caixa do `UiLoading` com
degradê cônico giratório percorrendo as
mesmas três cores na mesma ordem (`#112051` → `#0364f7` → `#4ed813`) ao redor da caixa; o
**card de resumo da tela Meu Perfil** com degradê vertical suave, do `brand.structure` bem diluído
no topo esmaecendo até o branco na base; e o **container do título dos cards da página pública de
Escopo de Projetos**, com o mesmo degradê horizontal do cabeçalho de modal e o filete de accent de
2,5px na borda esquerda.

#### Scenario: Degradê no botão primário
- **WHEN** um `Button` com `variant="primary"` é renderizado
- **THEN** o fundo é um degradê de `#112051` (esquerda) até `#0364f7` (direita)

#### Scenario: Degradê no cabeçalho do modal
- **WHEN** um modal é aberto
- **THEN** o seu cabeçalho exibe o mesmo degradê horizontal, preservando o filete de accent de 2,5px na borda esquerda

#### Scenario: Degradê no título do card do Escopo público
- **WHEN** o container do título de um card da página pública de Escopo de Projetos é renderizado
- **THEN** ele exibe o degradê horizontal `brand.primary` → `brand.structure` e o filete de accent de
  2,5px na borda esquerda, com o título em texto legível

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

### Requirement: A Área Pública usa a paleta editorial documentada como exceção

O sistema SHALL permitir, exclusivamente no shell e no conteúdo da Área Pública, a paleta editorial
composta por indigo para a navegação principal, esmeralda para Manuais Mensais e púrpura para Escopo
de Projetos, sobre neutros `slate`, sem alterar a paleta das telas administrativas. O foco dos
controles SHALL continuar em `brand.focus` (`#1a9e07`) e o erro/validação SHALL continuar em
`rose-700` (`#be123c`). Nenhuma superfície pública SHALL usar `lime-500` para foco nem introduzir
degradê fora das superfícies já permitidas pelo design system, exceto os heros do **Painel de
Destaques da Área Pública** e da **página pública de Escopo de Projetos**, que SHALL usar o mesmo
degradê escuro sutil delimitado ao conteúdo público, e o **container do título dos cards da página
pública de Escopo de Projetos**, que SHALL usar o degradê horizontal do cabeçalho de modal com o
filete de accent de 2,5px na borda esquerda. A identidade púrpura do Escopo de Projetos SHALL
permanecer nos chips, ícones e badges da página pública do escopo. No painel público, os badges de
tipo SHALL usar `rose-700` para **Correção**, `emerald-700` para **Melhoria** e `indigo-700` para
**Nova Funcionalidade**, sempre com rótulo textual e ícone, sem substituir o `rose-700` canônico de
erro/validação.

#### Scenario: Seções usam a paleta editorial

- **WHEN** o shell público é renderizado no tema claro
- **THEN** a navegação principal usa indigo, Manuais Mensais usa esmeralda e Escopo de Projetos usa
  púrpura, sobre neutros `slate`

#### Scenario: Foco e erro permanecem canônicos

- **WHEN** um controle público recebe foco ou apresenta erro de validação
- **THEN** o foco usa `brand.focus` (`#1a9e07`) e o erro usa `rose-700` (`#be123c`)

#### Scenario: Administração permanece na paleta atual

- **WHEN** uma tela da Área Administrativa é renderizada
- **THEN** ela continua usando os tokens navy/verde do design system, sem a paleta editorial pública

#### Scenario: Degradê no hero do painel público

- **WHEN** o hero do Painel de Destaques da Área Pública é renderizado
- **THEN** ele usa o degradê escuro sutil aprovado para o conteúdo público, sem aplicar o degradê a
  outras superfícies públicas

#### Scenario: Degradê no hero do escopo público

- **WHEN** o cabeçalho da página pública de Escopo de Projetos é renderizado
- **THEN** ele usa o mesmo degradê escuro sutil do Painel de Destaques, delimitado ao conteúdo
  público, com a identidade púrpura nos chips, ícones e badges

#### Scenario: Degradê no título do card do Escopo público

- **WHEN** o container do título de um card da página pública de Escopo de Projetos é renderizado
- **THEN** ele usa o degradê horizontal do cabeçalho de modal e o filete de accent de 2,5px na borda
  esquerda, com contraste legível

#### Scenario: Badges de tipo com rótulo e cor

- **WHEN** um card do painel público exibe o tipo de uma chamada
- **THEN** o badge usa a cor semântica do tipo e mantém o rótulo textual “Correção”, “Melhoria” ou
  “Nova Funcionalidade”, sem depender apenas de cor

#### Scenario: Sem resíduos de lime ou degradê indevido

- **WHEN** o shell público é inspecionado
- **THEN** não há `lime-500` em foco nem degradê fora do `UiButton primary`, do cabeçalho de modal,
  da trilha do `UiSlider`/`UiLoading`, do card de resumo do Meu Perfil, dos heros das páginas
  públicas de conteúdo e do container do título dos cards da página pública de Escopo

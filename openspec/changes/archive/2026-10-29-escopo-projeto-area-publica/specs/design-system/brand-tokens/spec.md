# Spec Delta

## MODIFIED Requirements

### Requirement: A Área Pública usa a paleta editorial documentada como exceção

O sistema SHALL permitir, exclusivamente no shell e no conteúdo da Área Pública, a paleta editorial
composta por indigo para a navegação principal, esmeralda para Manuais Mensais e púrpura para Escopo
de Projetos, sobre neutros `slate`, sem alterar a paleta das telas administrativas. O foco dos
controles SHALL continuar em `brand.focus` (`#1a9e07`) e o erro/validação SHALL continuar em
`rose-700` (`#be123c`). Nenhuma superfície pública SHALL usar `lime-500` para foco nem introduzir
degradê fora das superfícies já permitidas pelo design system, exceto os heros do **Painel de
Destaques da Área Pública** e da **página pública de Escopo de Projetos**, que SHALL usar o mesmo
degradê escuro sutil delimitado ao conteúdo público. A identidade púrpura do Escopo de Projetos SHALL
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

#### Scenario: Badges de tipo com rótulo e cor

- **WHEN** um card do painel público exibe o tipo de uma chamada
- **THEN** o badge usa a cor semântica do tipo e mantém o rótulo textual “Correção”, “Melhoria” ou
  “Nova Funcionalidade”, sem depender apenas de cor

#### Scenario: Sem resíduos de lime ou degradê indevido

- **WHEN** o shell público é inspecionado
- **THEN** não há `lime-500` em foco nem degradê fora do `UiButton primary`, do cabeçalho de modal,
  da trilha do `UiSlider`/`UiLoading`, do card de resumo do Meu Perfil e dos heros das páginas
  públicas de conteúdo

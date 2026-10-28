# Spec Delta

## ADDED Requirements

### Requirement: A Área Pública usa a paleta editorial documentada como exceção
O sistema SHALL permitir, exclusivamente no shell e no conteúdo da Área Pública, a paleta editorial
composta por indigo para a navegação principal, esmeralda para Manuais Mensais e púrpura para Escopo
de Projetos, sobre neutros `slate`, sem alterar a paleta das telas administrativas. O foco dos
controles SHALL continuar em `brand.focus` (`#1a9e07`) e o erro/validação SHALL continuar em
`rose-700` (`#be123c`). Nenhuma superfície pública SHALL usar `lime-500` para foco nem introduzir
degradê fora das superfícies já permitidas pelo design system.

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

#### Scenario: Sem resíduos de lime ou degradê indevido
- **WHEN** o shell público é inspecionado
- **THEN** não há `lime-500` em foco nem degradê fora do `UiButton primary`, do cabeçalho de modal,
  da trilha do `UiSlider`/`UiLoading` e do card de resumo do Meu Perfil

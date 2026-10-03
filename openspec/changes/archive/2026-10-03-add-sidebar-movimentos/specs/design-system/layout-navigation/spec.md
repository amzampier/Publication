# Spec Delta

## MODIFIED Requirements

### Requirement: A sidebar apresenta o item raiz e as sessões com os itens canônicos
O sistema SHALL exibir na sidebar, acima das sessões, o item raiz **Painel Executivo** e, em seguida,
quatro sessões com estes itens, nesta ordem: **Publicações** (Manuais, Release Week, Escopo de Projetos),
**Movimentos** (Esteira de Revisão, Lançar as Chamadas), **Cadastros** (Parceiros, Softwares) e
**Administração** (Gestão de Usuários, Perfis de Acesso (RBAC), Auditoria, Configurações Globais).

#### Scenario: Árvore completa
- **WHEN** a sidebar está expandida com todas as sessões abertas
- **THEN** são exibidos o item raiz e os onze itens das quatro sessões, na ordem definida

#### Scenario: Resquícios antigos ausentes
- **WHEN** a sidebar é inspecionada
- **THEN** não existem as sessões "Governança & Multi-Filiais" nem o item "Empresas & Filiais"

#### Scenario: Recolhimento individual das sessões
- **WHEN** o cabeçalho de uma sessão é ativado
- **THEN** apenas aquela sessão recolhe/expande, as demais mantêm o estado, e todas iniciam abertas

### Requirement: Shell e vitrine `/design` observam a mesma navegação
O sistema SHALL manter a árvore de navegação e o menu do Account definidos em um único ponto de
configuração, de modo que a seção 14 da vitrine `/design` exiba exatamente os mesmos grupos, itens,
ícone/rotulo do item raiz, ordem do menu e larguras do shell real.

#### Scenario: Fonte única
- **WHEN** um item é adicionado, renomeado ou removido na configuração de navegação
- **THEN** a sidebar real e a seção 14 do `/design` refletem a mudança sem edição manual em duas fontes

#### Scenario: Vitrine espelha o item raiz e o menu
- **WHEN** a seção 14 do `/design` é renderizada
- **THEN** ela mostra o item raiz "Painel Executivo" acima das quatro sessões e o menu do Account com a
  mesma ordem e divisores do shell real

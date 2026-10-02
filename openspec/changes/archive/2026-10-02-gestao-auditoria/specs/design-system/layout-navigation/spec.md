# Spec Delta

## MODIFIED Requirements

### Requirement: A sidebar apresenta o item raiz e as sessões com os itens canônicos
O sistema SHALL exibir na sidebar, acima das sessões, o item raiz **Painel Executivo** e, em seguida,
três sessões com estes itens, nesta ordem: **Publicações** (Manuais, Release Week, Escopo de Projetos),
**Cadastros** (Parceiros, Softwares) e **Administração** (Gestão de Usuários, Perfis de Acesso (RBAC),
Gestão de Auditoria, Configurações Globais).

#### Scenario: Árvore completa
- **WHEN** a sidebar está expandida com todas as sessões abertas
- **THEN** são exibidos o item raiz e os nove itens das três sessões, na ordem definida

#### Scenario: Resquícios antigos ausentes
- **WHEN** a sidebar é inspecionada
- **THEN** não existem as sessões "Governança & Multi-Filiais" nem o item "Empresas & Filiais"

#### Scenario: Recolhimento individual das sessões
- **WHEN** o cabeçalho de uma sessão é ativado
- **THEN** apenas aquela sessão recolhe/expande, as demais mantêm o estado, e todas iniciam abertas
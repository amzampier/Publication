# Spec Delta

## MODIFIED Requirements

### Requirement: A zona direita do header oferece notificações e o bloco Account
O sistema SHALL exibir na zona direita do header a central de notificações e o bloco Account, com o
Account ocupando o extremo direito, oposto ao botão de alternância. Ambos os painéis SHALL ser
operáveis por teclado: navegação por setas (`↑`/`↓`) entre os itens, `Home`/`End` para os extremos,
`Escape` para fechar — devolvendo o foco ao gatilho — e fechamento ao perder o foco (`focusout`) do
painel.

#### Scenario: Account no extremo direito
- **WHEN** o header é renderizado
- **THEN** o bloco Account está à direita da central de notificações e no extremo direito da barra

#### Scenario: Menus são mutuamente exclusivos
- **WHEN** a central de notificações está aberta e o usuário abre o menu do Account (ou vice-versa)
- **THEN** o outro painel é fechado

#### Scenario: Navegação por teclado no painel aberto
- **WHEN** o usuário abre o painel de notificações ou o menu do Account e usa as setas/Home/End/Escape
- **THEN** o foco percorre os itens, `Escape` fecha o painel devolvendo o foco ao gatilho, e o painel também fecha ao perder o foco
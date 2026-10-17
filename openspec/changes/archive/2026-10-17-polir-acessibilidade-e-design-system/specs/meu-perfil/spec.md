# Spec Delta

## ADDED Requirements

### Requirement: A falha de carga do Meu Perfil mostra estado de erro recuperável
Quando a carga do registro do próprio usuário falhar, a página `/admin/meu-perfil` SHALL exibir um estado de erro com contexto e uma ação de **tentar novamente** — nunca uma tela em branco nem apenas um toast transitório.

#### Scenario: Falha exibe estado de erro com ação
- **WHEN** o `GET` do próprio registro falha (rede/banco)
- **THEN** a página mostra uma mensagem de erro e um botão/ação para tentar novamente, mantendo a área de conteúdo utilizável

#### Scenario: Tentar novamente recarrega
- **WHEN** o usuário aciona "tentar novamente"
- **THEN** a carga é refeita e, em sucesso, a página exibe o resumo e as abas
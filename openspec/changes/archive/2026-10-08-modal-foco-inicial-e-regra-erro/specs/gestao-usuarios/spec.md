# Spec Delta

## MODIFIED Requirements

### Requirement: O formulário de usuário valida antes de gravar
O sistema SHALL recusar o salvamento e manter o modal aberto quando: Nome, E-mail, Perfil ou Situação estiverem vazios; o E-mail estiver em formato inválido ou já pertencer a outro usuário da base vigente; na criação, Senha ou Confirmar Senha estiverem vazias, com menos de 8 caracteres ou divergentes entre si; na edição, exatamente um dos dois campos de senha estiver preenchido ou os dois divergirem. Cada campo inválido SHALL exibir o erro de forma persistente — ícone `AlertCircle` `rose-700` à direita dentro do campo com a mensagem em tooltip no hover, e a mensagem no DOM como região viva (`role="alert"`) associada ao controle —, com label e recorte em `rose-700`, e o foco SHALL ir ao primeiro campo inválido.

#### Scenario: E-mail duplicado
- **WHEN** em modo de criação o usuário informa um e-mail já existente na base e tenta salvar
- **THEN** o modal permanece aberto, o campo E-mail exibe erro persistente apontando a duplicidade e o foco vai ao E-mail

#### Scenario: Senha inválida na criação
- **WHEN** em modo de criação a senha tem menos de 8 caracteres ou não confere com a confirmação
- **THEN** o modal permanece aberto e os campos de senha exibem erro persistente com o foco no primeiro deles

#### Scenario: Senha parcial na edição
- **WHEN** em modo de edição apenas um dos campos de senha é preenchido
- **THEN** o modal permanece aberto e o campo de senha vazio (ou a confirmação) exibe erro, sem apagar os demais dados digitados

#### Scenario: Formulário válido grava
- **WHEN** todas as regras estão satisfeitas e o usuário aciona "Salvar"
- **THEN** as validações não bloqueiam o fechamento e a gravação ocorre

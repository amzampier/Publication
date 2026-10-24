# Spec Delta

## ADDED Requirements

### Requirement: O parecer da recusa é obrigatório e o botão explica a indisponibilidade

No modal de decisão da esteira, o parecer da recusa SHALL ser marcado como obrigatório e validado no
clique de confirmação, com mensagem persistente e foco no campo quando vazio. O botão de confirmação
NÃO SHALL ficar silenciosamente desabilitado: enquanto a ação estiver disponível, o clique SHALL
revelar a validação; se o botão estiver desabilitado por outro motivo, o motivo SHALL ser acessível
por tooltip/`aria-describedby`.

#### Scenario: Parecer vazio revela a validação

- **WHEN** o usuário aciona “Recusar” na esteira com o parecer vazio
- **THEN** o modal permanece aberto, exibe o erro de obrigatoriedade e leva o foco ao parecer

#### Scenario: Parecer preenchido confirma

- **WHEN** o usuário informa um parecer válido e confirma
- **THEN** a recusa é enviada e o modal fecha após o sucesso

#### Scenario: Indisponibilidade explicada

- **WHEN** o botão de recusa está desabilitado por permissão ou estado
- **THEN** o motivo é anunciado de forma acessível, sem deixar o usuário supor falta de permissão

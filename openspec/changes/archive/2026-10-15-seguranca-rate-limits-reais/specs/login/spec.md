# Spec Delta

## MODIFIED Requirements

### Requirement: A proteção contra força bruta bloqueia temporariamente a conta
O sistema SHALL contar as falhas consecutivas de login por usuário e, ao alcançar 5 falhas,
bloquear a conta temporariamente por 15 minutos: enquanto o bloqueio estiver vigente, o login
SHALL recusar qualquer tentativa (mesmo com a senha correta) com aviso de conta bloqueada
temporariamente, sem autenticar. O bloqueio expira sozinho ao fim do período e uma tentativa
bem-sucedida SHALL zerar o contador de falhas. Tentativas contra um **e-mail inexistente**
SHALL receber o mesmo tratamento: ao acumular 5 tentativas em uma janela de 15 minutos, as
próximas tentativas com aquele e-mail SHALL ser recusadas com o **mesmo** aviso de bloqueio
temporário e pelo restante da janela — bloqueio derivado do log de eventos, sem estado na
tabela de usuários. Em ambos os casos as respostas SHALL ser idênticas para e-mails existentes
e inexistentes (mesmos códigos e mensagens), de modo que a tentativa de bloqueio não revele se
a conta existe.

#### Scenario: Bloqueio após falhas consecutivas
- **WHEN** o usuário erra a senha 5 vezes seguidas e, na 6ª tentativa, informa a senha correta
  dentro do período de bloqueio
- **THEN** um toast informa que a conta está bloqueada temporariamente, o login não é concluído
  e a sessão não é gravada

#### Scenario: Bloqueio expira e o login volta a funcionar
- **WHEN** o período de bloqueio expira e o usuário informa credenciais corretas
- **THEN** o login é aceito normalmente e o contador de falhas volta a zero

#### Scenario: E-mail inexistente bloqueia após 5 tentativas na janela
- **WHEN** 5 tentativas de login falham com um e-mail inexistente e uma 6ª tentativa ocorre
  dentro de 15 minutos
- **THEN** as cinco primeiras respondem o erro genérico de credenciais e a 6ª é recusada com o
  mesmo aviso de bloqueio temporário das contas, sem criar sessão

#### Scenario: Resposta uniforme não revela existência da conta
- **WHEN** um e-mail existente (5 senhas erradas) e um e-mail inexistente (5 tentativas) são
  testados lado a lado
- **THEN** ambos respondem o mesmo erro genérico nas cinco primeiras tentativas e o mesmo
  bloqueio temporário na sexta, sem diferença observável entre os dois casos

#### Scenario: Bloqueio de e-mail inexistente expira sozinho
- **WHEN** as 5 tentativas com e-mail inexistente ficam com mais de 15 minutos e uma nova
  tentativa é feita
- **THEN** o login volta a responder o erro genérico de credenciais (tentativa normal), sem
  bloqueio vigente

# Spec Delta

## MODIFIED Requirements

### Requirement: A recuperação de senha só altera a senha após a entrega do e-mail
O sistema SHALL somente substituir a senha vigente do usuário pela senha provisória **após** o
e-mail de recuperação ser efetivamente entregue; se o envio falhar, a senha anterior SHALL
permanecer válida, de modo que o usuário nunca fique sem uma senha conhecida. A entrega do e-mail e
a subsequente gravação da nova senha SHALL ocorrer **fora do caminho da resposta HTTP** (após a
resposta genérica ter sido emitida), preservando a ordem "entrega antes da troca" sem atrasar a
resposta ao solicitante.

#### Scenario: Falha no envio preserva a senha anterior
- **WHEN** a recuperação é solicitada para uma conta ativa e o provedor de e-mail falha ao enviar
- **THEN** a senha anterior continua autenticando e a nova provisória não passa a valer

#### Scenario: Envio bem-sucedido ativa a provisória
- **WHEN** o e-mail de recuperação é entregue com sucesso
- **THEN** a senha provisória passa a autenticar e a anterior deixa de valer

#### Scenario: A senha só muda depois da entrega, mesmo com a resposta imediata
- **WHEN** a recuperação é solicitada e a resposta genérica é emitida antes da conclusão do envio
- **THEN** a troca da senha só é efetivada depois que o envio conclui com sucesso (falha do envio mantém a senha anterior)

### Requirement: O login e a recuperação não revelam existência da conta por tempo de resposta
O sistema SHALL responder às solicitações de login e de recuperação sem diferença de tempo
observável entre uma conta existente e uma inexistente (mesma forma e duração aproximada da
resposta), de modo que a existência de um cadastro não seja inferível pela latência. Em particular,
a resposta de `POST /api/auth/esqueci-senha` SHALL ser produzida **sem aguardar o envio do e-mail**:
a geração da senha provisória, o envio e a gravação ocorrem fora do caminho da resposta, de modo
que o tempo de resposta seja equivalente para e-mail cadastrado e não cadastrado.

#### Scenario: Latências equivalentes
- **WHEN** a mesma operação é executada para um e-mail cadastrado e para um e-mail inexistente
- **THEN** o tempo de resposta é equivalente nos dois casos, sem diferença observável

#### Scenario: Recuperação responde antes de enviar o e-mail
- **WHEN** `POST /api/auth/esqueci-senha` é chamado para um e-mail cadastrado
- **THEN** a resposta genérica é emitida sem esperar o envio pelo provedor (o envio e a gravação ocorrem após a resposta), com o mesmo tempo de um e-mail não cadastrado
# Spec Delta

## MODIFIED Requirements

### Requirement: As rotas de autenticação respeitam o limite de requisições
O sistema SHALL aplicar às rotas de autenticação (login, refresh, recuperação, troca de senha
e convite) um limite de requisições por IP, derivado da configuração global de limite de
requisições do sistema, respondendo `429` com mensagem genérica quando excedido e sem executar
a operação. O IP considerado SHALL ser o da conexão do cliente, e o cabeçalho `X-Forwarded-For`
SHALL ser levado em conta **somente** quando a implantação declarar uma lista de proxies
confiáveis (por configuração), de modo que um cliente não consiga contornar o limite forjando
esse cabeçalho.

#### Scenario: Exceder o limite responde 429
- **WHEN** um mesmo IP dispara mais requisições de login do que o limite permitido por minuto
- **THEN** as requisições excedentes respondem `429` e o cliente exibe toast de erro genérico
  (nenhuma validação de credencial é executada nas excedentes)

#### Scenario: Uso normal não é afetado pelo limite
- **WHEN** o usuário opera login/recuperação dentro do volume normal do limite configurado
- **THEN** nenhuma requisição é rejeitada por 429 e os fluxos funcionam como esperado

#### Scenario: Cabeçalho de encaminhamento não contorna o limite
- **WHEN** um cliente varia o `X-Forwarded-For` a cada requisição sem que existam proxies confiáveis configurados
- **THEN** o limite continua contando pelo IP real da conexão e as requisições excedentes seguem respondendo `429`

## ADDED Requirements

### Requirement: A recuperação de senha só altera a senha após a entrega do e-mail
O sistema SHALL somente substituir a senha vigente do usuário pela senha provisória **após** o
e-mail de recuperação ser efetivamente entregue; se o envio falhar, a senha anterior SHALL
permanecer válida, de modo que o usuário nunca fique sem uma senha conhecida.

#### Scenario: Falha no envio preserva a senha anterior
- **WHEN** a recuperação é solicitada para uma conta ativa e o provedor de e-mail falha ao enviar
- **THEN** a senha anterior continua autenticando e a nova provisória não passa a valer

#### Scenario: Envio bem-sucedido ativa a provisória
- **WHEN** o e-mail de recuperação é entregue com sucesso
- **THEN** a senha provisória passa a autenticar e a anterior deixa de valer

### Requirement: O login e a recuperação não revelam existência da conta por tempo de resposta
O sistema SHALL responder às solicitações de login e de recuperação sem diferença de tempo
observável entre uma conta existente e uma inexistente (mesma forma e duração aproximada da
resposta), de modo que a existência de um cadastro não seja inferível pela latência.

#### Scenario: Latências equivalentes
- **WHEN** a mesma operação é executada para um e-mail cadastrado e para um e-mail inexistente
- **THEN** o tempo de resposta é equivalente nos dois casos, sem diferença observável

### Requirement: Os links dos e-mails usam a origem configurada
Os links de acesso presentes nos e-mails (convite e recuperação) SHALL ser construídos a partir da
origem configurada do sistema (ex.: `APP_URL`), e **não** do cabeçalho `Host` da requisição, de
modo que um `Host` forjado não redirecione o destinatário para outro domínio.

#### Scenario: Host forjado não altera o link
- **WHEN** uma solicitação de recuperação/convite chega com um cabeçalho `Host` diferente do domínio configurado
- **THEN** o link enviado no e-mail aponta para a origem configurada, não para o Host recebido

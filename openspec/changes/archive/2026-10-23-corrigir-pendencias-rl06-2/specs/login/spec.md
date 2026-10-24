# Spec Delta

## MODIFIED Requirements

### Requirement: As rotas de autenticação respeitam o limite de requisições
O sistema SHALL aplicar às rotas de autenticação (login, refresh, recuperação, troca de senha
e convite) um limite de requisições por IP, derivado da configuração global de limite de
requisições do sistema, respondendo `429` com mensagem genérica quando excedido e sem executar
a operação. O IP considerado SHALL ser o da conexão do cliente, e o cabeçalho `X-Forwarded-For`
SHALL ser levado em conta **somente** quando a implantação declarar uma lista de proxies
confiáveis (por configuração) **e o IP da conexão pertencer a um dos IPs/CIDRs dessa lista**;
fora dela, o `X-Forwarded-For` SHALL ser ignorado. A lista SHALL ser validada por IP/CIDR, não
apenas por estar preenchida, de modo que um cliente não consiga contornar o limite forjando
esse cabeçalho.

#### Scenario: Exceder o limite responde 429
- **WHEN** um mesmo IP dispara mais requisições de login do que o limite permitido por minuto
- **THEN** as requisições excedentes respondem `429` e o cliente exibe toast de erro genérico (nenhuma validação de credencial é executada nas excedentes)

#### Scenario: Uso normal não é afetado pelo limite
- **WHEN** o usuário opera login/recuperação dentro do volume normal do limite configurado
- **THEN** nenhuma requisição é rejeitada por 429 e os fluxos funcionam como esperado

#### Scenario: Cabeçalho de encaminhamento não contorna o limite
- **WHEN** um cliente varia o `X-Forwarded-For` a cada requisição sem que a conexão venha de um proxy da lista confiável
- **THEN** o limite continua contando pelo IP real da conexão e as requisições excedentes seguem respondendo `429`

#### Scenario: Proxy confiável encaminha o IP real
- **WHEN** a conexão vem de um IP/CIDR declarado em `TRUSTED_PROXIES` e o cabeçalho informa o cliente
- **THEN** o limite e a auditoria usam o IP encaminhado, não o IP do proxy
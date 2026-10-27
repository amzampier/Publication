# Login Specification

## Purpose

Definir o comportamento da tela de login da Área Administrativa — rota, composição, validação
de credenciais no banco via API (bcrypt, situação, lockout e rate limit), sessão real por
cookies HttpOnly com refresh rotativo, guarda global das rotas `/admin/**`, logout,
recuperação de senha por e-mail (Resend) e identidade do usuário logado — para que o acesso à
Área Administrativa exija autenticação contra o backend.

## Requirements

### Requirement: O sistema serve o login em `/admin/login` sem o shell da Área Administrativa

O sistema SHALL servir a tela de login em `/admin/login` (`app/pages/admin/login.vue`) renderizada
**sem** o shell da Área Administrativa (sem header nem sidebar), como uma página de largura
integral com o `AuthBackground` (canvas animado) ao fundo e, centralizado sobre ele, um card
branco com cantos arredondados contendo o `AuthLoginHeader` (identidade — a logomarca de
Configurações > Logomarcas ou, sem personalização, a marca padrão do sistema) e o `AuthLoginForm`.
O cabeçalho do card SHALL exibir somente a identidade, sem subtítulo ou texto auxiliar abaixo da
logomarca. A rota SHALL ser liberada pela guarda global
mesmo sem sessão, e as rotas de autenticação — `/admin/login`, `/admin/esqueci-senha` e
`/admin/primeiro-acesso` — SHALL ser as únicas rotas sob `/admin/**` sem o shell.

#### Scenario: Tela renderiza sem shell e com composição canônica

- **WHEN** o visitante abre `/admin/login` sem sessão
- **THEN** a página não exibe header nem sidebar da Área Administrativa, e o card centralizado
  exibe o cabeçalho (somente a identidade, sem subtítulo) acima do formulário de login, sobre o canvas animado

#### Scenario: Logada, a rota de login redireciona para o painel

- **WHEN** um usuário com sessão ativa abre `/admin/login`
- **THEN** o navegador o redireciona imediatamente para `/admin`

#### Scenario: Primeiro acesso também fica fora do shell

- **WHEN** o usuário com senha provisória abre `/admin/primeiro-acesso`
- **THEN** a página renderiza com o layout de autenticação, sem header nem sidebar administrativa

### Requirement: O formulário de login usa os componentes do design system e valida os campos no cliente
O formulário SHALL conter um `UiInput` de e-mail (`autocomplete="username"`, ícone `Mail` à
esquerda), um `UiInput` de senha (`autocomplete="current-password"`, ícone `Lock` à esquerda), a
checkbox `UiCheckbox` "Lembrar-me", o link "Esqueceu a senha?" e o `UiButton` de envio
("Entrar no Portal", com spinner durante o carregamento) — todos consumindo os componentes do kit
conforme seus contratos (`leftIcon`/`rightIcon` e slots de ícone), sem paralelos. A submissão
SHALL validar no cliente: e-mail obrigatório com formato válido e senha obrigatória, exibindo os
erros com o padrão do design system (`error` no controle = recorte `rose-700`, ícone `AlertCircle`
e mensagem em tooltip + região viva) e devolvendo o foco ao **primeiro** campo inválido; erros
SHALL ser limpos ao digitar no campo correspondente. Enquanto houver erro de validação, nenhuma
tentativa de autenticação SHALL ocorrer.

#### Scenario: Campos vazios bloqueiam a submissão e focam o primeiro erro
- **WHEN** o usuário aciona "Entrar no Portal" com e-mail e senha vazios
- **THEN** o e-mail recebe o erro "Informe o e-mail.", o foco vai para o campo e-mail e nenhuma
  autenticação é tentada

#### Scenario: E-mail com formato inválido
- **WHEN** o usuário informa `abc` no e-mail e uma senha e envia
- **THEN** o campo e-mail exibe "Informe um e-mail válido." no padrão de erro do design system

#### Scenario: Digitar limpa o erro do campo
- **WHEN** um campo está em erro e o usuário digita nele
- **THEN** o erro daquele campo desaparece imediatamente

### Requirement: A autenticação valida as credenciais no banco e reflete o estado da conta
O sistema SHALL validar as credenciais contra a base de usuários do banco via
`POST /api/auth/login`: e-mail cadastrado, senha conferida com bcrypt contra o `hash_senha`
vigente e situação **Ativo**. Credenciais incorretas (e-mail inexistente ou senha errada)
SHALL exibir um **único** toast de erro genérico — "E-mail ou senha inválidos."— sem revelar
qual campo falhou. Situação **Inativo** SHALL receber toast de aviso específico ("Usuário
inativo. Contate o administrador.") e não logar. Conta com bloqueio de tentativas ativo SHALL
receber o aviso de bloqueio temporário e não logar. Durante a validação o botão SHALL ficar em
estado de carregamento e nova submissão SHALL ser ignorada. Em sucesso, o sistema SHALL
atualizar o último acesso do usuário no banco, estabelecer a sessão (cookies HttpOnly), aplicar
o "Lembrar-me" (apenas o e-mail) e navegar para `/admin` ou para a rota originalmente
solicitada (`?redirect=`).

#### Scenario: Credenciais corretas logam e atualizam o último acesso
- **WHEN** o usuário informa `admin@empresa.com.br` e `Public@2026` e envia
- **THEN** a sessão é estabelecida, o último acesso do registro no banco passa a refletir o
  instante do login e o navegador vai para `/admin`

#### Scenario: Senha errada ou e-mail desconhecido produzem o mesmo erro
- **WHEN** o usuário informa um e-mail inexistente no banco ou a senha incorreta e envia
- **THEN** um toast exibe "E-mail ou senha inválidos.", a sessão não é gravada e o usuário
  permanece no login

#### Scenario: Usuário inativo é bloqueado com aviso próprio
- **WHEN** o usuário informa o e-mail de um cadastro cuja situação no banco é Inativo com a
  senha correta
- **THEN** um toast exibe "Usuário inativo. Contate o administrador." e o login não é concluído

#### Scenario: Lembrar-me preenche o e-mail no retorno
- **WHEN** o usuário loga com "Lembrar-me" marcado e, numa próxima visita, abre
  `/admin/login` após sair da sessão
- **THEN** o campo e-mail já vem preenchido com o e-mail lembrado e a checkbox vem marcada

#### Scenario: Login com a senha provisória do fluxo de recuperação
- **WHEN** o usuário informa um e-mail cadastrado e a senha provisória enviada por e-mail pelo
  fluxo `/admin/esqueci-senha` (hash gravado no banco) e envia
- **THEN** o login é aceito normalmente (sessão estabelecida, último acesso atualizado,
  navegação para `/admin`), com a senha anterior deixando de valer para aquele registro

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

### Requirement: As rotas de autenticação respeitam o limite de requisições

O sistema SHALL aplicar às rotas de autenticação (login, refresh, recuperação, troca de senha e
convite) um limite de requisições por IP, derivado da configuração global de limite de requisições
do sistema, respondendo `429` com mensagem genérica quando excedido e sem executar a operação. O IP
considerado SHALL ser o da conexão do cliente, e o cabeçalho `X-Forwarded-For` SHALL ser levado em
conta **somente** quando a implantação declarar uma lista de proxies confiáveis (por configuração)
**e o IP da conexão pertencer a um dos IPs/CIDRs dessa lista**; fora dela, o `X-Forwarded-For` SHALL
ser ignorado. A lista SHALL ser validada por IP/CIDR, não apenas por estar preenchida, de modo que um
cliente não consiga contornar o limite forjando esse cabeçalho. Os contadores SHALL ser persistidos
em banco e compartilhados entre processos/instâncias, sobrevivendo a reinícios; a chave SHALL
combinar IP e rota. Quando o armazenamento persistente estiver indisponível, o sistema SHALL usar o
contador local em memória como fallback, sem derrubar a autenticação.

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

#### Scenario: Restart preserva a janela
- **WHEN** o processo é reiniciado dentro da mesma janela de contagem
- **THEN** o contador persistido continua valendo e novas requisições acima do limite seguem recebendo `429`

#### Scenario: Instâncias compartilham o contador
- **WHEN** duas instâncias da aplicação recebem requisições do mesmo IP/rota na mesma janela
- **THEN** elas consultam o mesmo contador e o limite total é respeitado

#### Scenario: Falha do banco usa fallback local
- **WHEN** o banco de contadores está indisponível durante a autenticação
- **THEN** o sistema usa o contador em memória e não bloqueia o login por falha do armazenamento

### Requirement: A sessão é mantida por cookies HttpOnly com refresh rotativo e encerrada pelo menu do Account
O sistema SHALL manter a sessão em cookie HttpOnly de acesso (JWT de curta duração, ~15
minutos) em conjunto com cookie de refresh cujo token opaco (hash) é gravado na tabela de
sessões; a renovação SHALL rotacionar o refresh (invalidando o anterior) e o logout SHALL
revogar a sessão e limpar os cookies. O prazo de validade da sessão de refresh SHALL corresponder
ao período configurado do sistema (por padrão, **7 dias**) e o registro de sessão no servidor
(`expira_em`) SHALL expirar no **mesmo** prazo anunciado no `Max-Age` do cookie de refresh, de
modo que a sessão sobreviva além da janela do token de acesso. A rotação SHALL ser **atômica no
servidor**: requisições de renovação concorrentes com o mesmo refresh token SHALL ser
serializadas, de modo que apenas uma rotação seja aceita e as demais falhem; o **reuso** de um
refresh token já rotacionado (ou revogado) SHALL ser recusado com `401`. Em recarga de página
(F5), a sessão SHALL ser restaurada via API — renovando o accesso expirado pelo refresh, sem
exibir o login. Token inválido, expirado, adulterado ou de sessão revogada SHALL ser tratado como
sem sessão. O cliente SHALL renovar automaticamente quando uma requisição receber `401` e refazer
a requisição original, sem interromper a experiência. O item **Encerrar Sessão** do menu do
Account SHALL chamar o logout na API e navegar para `/admin/login`.

#### Scenario: F5 em página administrativa mantém o acesso
- **WHEN** o usuário com sessão ativa recarrega qualquer página `/admin/**`
- **THEN** a sessão é restaurada (renovando o accesso expirado, se necessário) e a página
  renderiza normalmente, sem redirecionamento para o login

#### Scenario: Encerrar Sessão volta para o login
- **WHEN** o usuário logado abre o menu do Account e clica em "Encerrar Sessão"
- **THEN** a sessão é revogada no servidor (cookies limpos) e o navegador vai para
  `/admin/login`

#### Scenario: Sessão expirada é renovada automaticamente
- **WHEN** o tempo de vida do accesso expira com a sessão ainda aberta e o usuário executa
  uma ação (ou recarrega a página)
- **THEN** o refresh renova os cookies silenciosamente e a ação completa normalmente, sem
  redirecionamento ao login

#### Scenario: Sessão sobrevive além da janela do access
- **WHEN** o accesso (~15 minutos) expira e o usuário volta a agir dentro do prazo de refresh configurado (padrão 7 dias)
- **THEN** a sessão é renovada silenciosamente sem exigir novo login, e o registro de sessão no servidor expira no mesmo prazo anunciado pelo cookie de refresh

#### Scenario: Token inválido ou revogado não autentica
- **WHEN** o cookie de acesso for inexistente, inválido ou apontar para sessão revogada
- **THEN** o acesso é tratado como não autenticado e o navegador vai para `/admin/login`

#### Scenario: Reuso de refresh já rotacionado é recusado
- **WHEN** um refresh token que já foi rotacionado (ou revogado) é reutilizado em `POST /api/auth/refresh`
- **THEN** a resposta é `401` e nenhuma nova sessão é emitida

#### Scenario: Renovações concorrentes do mesmo refresh não duplicam sessão
- **WHEN** duas requisições de renovação chegam simultaneamente com o mesmo refresh token válido
- **THEN** apenas uma rotação é aceita e a outra é recusada (`401`), sem emissão de duas sessões válidas

### Requirement: A guarda global protege a Área Administrativa e libera a Área Pública
O sistema SHALL aplicar `app/middleware/auth.global.ts` em toda navegação: rotas da Área Pública
(raiz e demais rotas fora de `/admin/**`), `/admin/login` e `/admin/esqueci-senha` são livres;
qualquer outra rota `/admin/**` SHALL exigir sessão ativa e, sem ela, redirecionar para
`/admin/login?redirect=<rota originalmente solicitada>`. Após login bem-sucedido com `?redirect=`
apontando para uma rota `/admin/**`, o usuário SHALL ser levado à rota solicitada em vez de
`/admin`.

#### Scenario: Acesso sem sessão redireciona preservando o destino
- **WHEN** um visitante sem sessão abre `/admin/perfis-acesso` diretamente pelo endereço
- **THEN** o navegador o leva para `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`

#### Scenario: Login com redirect volta à rota pretendida
- **WHEN** o usuário se autentica a partir de `/admin/login?redirect=%2Fadmin%2Fperfis-acesso`
- **THEN** o navegador vai para `/admin/perfis-acesso`

#### Scenario: Área Pública permanece anônima
- **WHEN** o visitante abre `/` sem sessão
- **THEN** a página renderiza normalmente, sem redirecionamento para o login

#### Scenario: A rota de recuperação é livre sem sessão
- **WHEN** um visitante sem sessão abre `/admin/esqueci-senha`
- **THEN** a página renderiza normalmente, sem exigir sessão e sem redirecionamento

#### Scenario: Logada, a rota de recuperação manda para o painel
- **WHEN** um usuário com sessão ativa abre `/admin/esqueci-senha`
- **THEN** o navegador o redireciona imediatamente para `/admin` (mesmo tratamento de `/admin/login`)

### Requirement: O bloco Account exibe o usuário autenticado e a identidade das telas de autenticação

O bloco Account do header SHALL exibir nome, perfil e iniciais do usuário logado (derivados da sessão), e não mais valores fixos. O cabeçalho do card de qualquer tela de autenticação (`/admin/login`, `/admin/esqueci-senha`, `/admin/primeiro-acesso`) SHALL exibir a identidade do sistema no lugar do título: a logomarca escolhida em Configurações > Logomarcas (`useLogomarcaLogin`, preview ou caminho) quando personalizada, ou — sem personalização — a marca padrão do sistema (ícone `Building2` + nome "Publications", idêntica ao cabeçalho do shell), sem subtítulo ou texto auxiliar abaixo da identidade. O `AuthBackground` SHALL usar a paleta do design system (azuis `#112051`/`#0364f7`/`#50a1ff` e verde `#4ed813`/`#1a9e07`), substituindo a paleta teal/ciano original.

#### Scenario: Header reflete o usuário logado

- **WHEN** usuário diferente de Ana Carolina (ex. `rafael.souza@empresa.com.br`, Editor) está logado e abre qualquer página administrativa
- **THEN** o bloco Account exibe "Rafael Souza" e o perfil Editor, com as iniciais "RS"

#### Scenario: Logomarca da tela acompanha as configurações

- **WHEN** uma logomarca foi configurada em Configurações > Logomarcas e o visitante abre `/admin/login`
- **THEN** o cabeçalho do card exibe aquela logomarca; sem personalização, exibe a marca padrão do sistema (ícone `Building2` + nome "Publications"), sem subtítulo abaixo

#### Scenario: Cabeçalho idêntico na tela de recuperação

- **WHEN** o visitante abre `/admin/esqueci-senha`
- **THEN** o card exibe a mesma identidade, sem subtítulo, do card de login

#### Scenario: Cabeçalho idêntico no primeiro acesso

- **WHEN** o usuário com senha provisória abre `/admin/primeiro-acesso`
- **THEN** o card exibe a mesma identidade, sem subtítulo, do card de login

### Requirement: A página `/admin/esqueci-senha` envia a senha provisória por e-mail
O sistema SHALL servir `/admin/esqueci-senha` com a mesma composição das telas de
autenticação (sem shell, `AuthBackground`, card com `AuthLoginHeader`, divisor e formulário),
contendo um `UiInput` de e-mail (obrigatório e com formato válido, erros no padrão do design
system) e um `UiButton` de envio com estado de carregamento. O envio SHALL chamar a API de
recuperação com resposta **sempre genérica**: para e-mail cadastrado e não cadastrado a
aparência da resposta SHALL ser idêntica (nenhuma mensagem, tempo ou sinal indica existência).
Quando o e-mail existir no banco, o servidor SHALL gerar uma senha provisória, gravar o hash
como senha vigente (marcada como provisória) e **enviá-la por e-mail via Resend** (template do
sistema) — a senha **não** é exibida na tela. O estado de sucesso do card SHALL exibir apenas
a confirmação genérica de que as instruções foram enviadas ao e-mail informado, com o botão
"Voltar ao login" e o link "Enviar para outro e-mail". O link "Esqueceu a senha?" do
`AuthLoginForm` SHALL navegar para esta rota; a rota SHALL ser livre sem sessão e, com sessão
ativa, SHALL redirecionar para `/admin`.

#### Scenario: Envio com e-mail cadastrado envia a senha provisória por e-mail
- **WHEN** o usuário informa um e-mail cadastrado no banco com formato válido e aciona o envio
- **THEN** o card exibe o estado de sucesso genérico (sem senha na tela), o e-mail sai com a
  senha provisória e aquela senha passa a autenticar o usuário no `/admin/login`

#### Scenario: E-mail não cadastrado recebe a mesma aparência de resposta
- **WHEN** o usuário envia um e-mail que não existe no banco
- **THEN** o estado de sucesso é idêntico ao de um e-mail cadastrado (mesma forma e latência),
  sem qualquer indicação de existência ou inexistência, e nenhum e-mail é enviado

#### Scenario: E-mail vazio ou inválido bloqueia o envio
- **WHEN** o usuário aciona o envio com o campo vazio ou com formato inválido (ex.: `abc`)
- **THEN** o campo exibe o erro no padrão do design system, o foco vai para ele e nenhuma
  requisição é feita

#### Scenario: O link do login leva à recuperação
- **WHEN** o usuário clica em "Esqueceu a senha?" no formulário de login
- **THEN** o navegador vai para `/admin/esqueci-senha` e nenhum toast "Funcionalidade em
  breve." é exibido

#### Scenario: Retorno ao login
- **WHEN** o usuário aciona o retorno em `/admin/esqueci-senha`
- **THEN** o navegador vai para `/admin/login`

### Requirement: A tela de login é documentada no `docs/08`
O sistema SHALL manter o documento `docs/08 - Login de Autenticação.md` documentando a página
(rota, componentes, composição e comportamento), o fluxo de recuperação com envio **real** da
senha provisória por e-mail (rota `/admin/esqueci-senha`, chamada da API, estado de sucesso
genérico sem senha na tela, login com a provisória), a sessão real (cookies HttpOnly, refresh
rotativo, lockout e rate limit), a guarda das rotas, as credenciais de demonstração aplicáveis
(apenas o administrador provisionado; demais contas entram pelo convite da Gestão de Usuários) e
a arquitetura do backend de autenticação (endpoints, cookies, Resend), na mesma estrutura dos
demais documentos de tela.

#### Scenario: Documento existe e bate com a tela
- **WHEN** o `docs/08` é consultado
- **THEN** ele descreve rota, componentes, fluxos (inclusive o de recuperação por e-mail e a
  sessão com refresh), credenciais vigentes e a arquitetura de autenticação coerentes com o
  comportamento implementado

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

### Requirement: Os links dos e-mails usam a origem configurada
Os links de acesso presentes nos e-mails (convite e recuperação) SHALL ser construídos a partir da
origem configurada do sistema (ex.: `APP_URL`), e **não** do cabeçalho `Host` da requisição, de
modo que um `Host` forjado não redirecione o destinatário para outro domínio.

#### Scenario: Host forjado não altera o link
- **WHEN** uma solicitação de recuperação/convite chega com um cabeçalho `Host` diferente do domínio configurado
- **THEN** o link enviado no e-mail aponta para a origem configurada, não para o Host recebido

### Requirement: O login recusa perfis não ativos
O sistema SHALL recusar a autenticação de um usuário cujo **perfil** esteja **Inativo** ou
**Bloqueado**, exibindo um aviso próprio e sem estabelecer sessão — além da checagem já existente
da situação do próprio usuário.

#### Scenario: Perfil inativo bloqueia o login
- **WHEN** o usuário informa credenciais corretas de um cadastro cujo perfil está Inativo (ou Bloqueado)
- **THEN** o login é recusado com aviso de perfil não ativo e a sessão não é criada

### Requirement: O logout descarta o estado de sessão mantido no cliente
Ao encerrar a sessão, o cliente SHALL descartar **todo** o estado derivado da sessão mantido em
memória compartilhada — em particular as listas e contadores administrativos (perfis, usuários,
auditoria), a matriz de permissões e o cache de configurações globais. Um novo login na mesma
instância do navegador SHALL recarregar esse estado a partir do servidor, de modo que nenhum dado
do usuário anterior seja exibido.

#### Scenario: Novo login na mesma aba não vê dados do usuário anterior
- **WHEN** um usuário encerra a sessão e outro usuário faz login na mesma aba, sem recarregar o navegador
- **THEN** as telas administrativas não exibem listas, contadores, matriz de permissões ou preferências pertencentes ao usuário anterior, e recarregam os dados do usuário atual a partir do servidor

#### Scenario: Estado de sessão é recarregado após novo login
- **WHEN** o novo usuário abre um módulo administrativo após o login na mesma aba
- **THEN** a carga é refeita no servidor (não servida de cache da sessão anterior) e reflete as permissões e dados do usuário atual

### Requirement: O evento de recuperação reflete o resultado do envio
O evento registrado na trilha para a solicitação de recuperação de senha SHALL refletir o resultado real do envio: quando o e-mail de recuperação for entregue, o detalhe informa que a senha provisória foi enviada; quando o envio falhar, o detalhe SHALL indicar a falha — nunca afirmar "enviada" em um envio malsucedido.

#### Scenario: Detalhe reflete o envio bem-sucedido
- **WHEN** a recuperação é solicitada e o e-mail de recuperação é entregue
- **THEN** o evento da trilha descreve que a senha provisória foi enviada

#### Scenario: Detalhe reflete a falha de envio
- **WHEN** a recuperação é solicitada e o provedor de e-mail falha
- **THEN** o evento da trilha indica que o envio falhou (sem afirmar que a senha provisória foi enviada)

### Requirement: A recuperação de senha rotula o envio da senha provisória

A tela `/admin/esqueci-senha` SHALL rotular a ação principal como envio de **senha provisória**
(ex.: “Enviar senha provisória”), e não como envio de link. A confirmação de sucesso SHALL informar
que uma senha provisória foi enviada e que a troca será exigida no primeiro acesso, sem prometer um
link de redefinição.

#### Scenario: Ação principal com rótulo correto

- **WHEN** a tela de recuperação é exibida
- **THEN** o botão principal informa que envia uma senha provisória

#### Scenario: Confirmação compatível com o mecanismo

- **WHEN** o envio é concluído
- **THEN** a mensagem confirma o envio da senha provisória e a troca obrigatória, sem mencionar link

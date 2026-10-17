# Spec Delta

## MODIFIED Requirements

### Requirement: A sessão é mantida por cookies HttpOnly com refresh rotativo e encerrada pelo menu do Account
O sistema SHALL manter a sessão em cookie HttpOnly de acesso (JWT de curta duração, ~15
minutos) em conjunto com cookie de refresh cujo token opaco (hash) é gravado na tabela de
sessões; a renovação SHALL rotacionar o refresh (invalidando o anterior) e o logout SHALL
revogar a sessão e limpar os cookies. A rotação SHALL ser **atômica no servidor**: requisições de
renovação concorrentes com o mesmo refresh token SHALL ser serializadas, de modo que apenas uma
rotação seja aceita e as demais falhem; o **reuso** de um refresh token já rotacionado (ou
revogado) SHALL ser recusado com `401`. Em recarga de página (F5), a sessão SHALL ser restaurada
via API — renovando o accesso expirado pelo refresh, sem exibir o login. Token inválido,
expirado, adulterado ou de sessão revogada SHALL ser tratado como sem sessão. O cliente SHALL
renovar automaticamente quando uma requisição receber `401` e refazer a requisição original,
sem interromper a experiência. O item **Encerrar Sessão** do menu do Account SHALL chamar o
logout na API e navegar para `/admin/login`.

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

#### Scenario: Token inválido ou revogado não autentica
- **WHEN** o cookie de acesso for inexistente, inválido ou apontar para sessão revogada
- **THEN** o acesso é tratado como não autenticado e o navegador vai para `/admin/login`

#### Scenario: Reuso de refresh já rotacionado é recusado
- **WHEN** um refresh token que já foi rotacionado (ou revogado) é reutilizado em `POST /api/auth/refresh`
- **THEN** a resposta é `401` e nenhuma nova sessão é emitida

#### Scenario: Renovações concorrentes do mesmo refresh não duplicam sessão
- **WHEN** duas requisições de renovação chegam simultaneamente com o mesmo refresh token válido
- **THEN** apenas uma rotação é aceita e a outra é recusada (`401`), sem emissão de duas sessões válidas

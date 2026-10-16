# Spec Delta

## Purpose

Forçar a troca da senha provisória no primeiro acesso: enquanto a senha do usuário for provisória,
a sessão sinaliza essa condição, as APIs administrativas negam o uso com `403` e o cliente conduz a
uma tela dedicada de definição da nova senha, liberando o acesso após a troca.

## ADDED Requirements

### Requirement: O login com senha provisória sinaliza a troca obrigatória
O sistema SHALL marcar como **provisória** a autenticação de um usuário cujo registro tenha
`senha_provisoria = 1`, sinalizando essa condição na sessão (resposta do login e sessão restaurada
por `GET /api/auth/seguro`). A senha provisória SHALL continuar autenticando o login (a sessão é
estabelecida), mas o acesso pleno SHALL ficar condicionado à troca.

#### Scenario: Login com provisória sinaliza a troca
- **WHEN** o usuário informa a senha provisória vigente e envia o login
- **THEN** a sessão é estabelecida e a resposta sinaliza a condição de senha provisória

#### Scenario: Sessão restaurada mantém a sinalização
- **WHEN** um usuário com senha provisória recarrega uma página administrativa (F5)
- **THEN** a sessão restaurada continua sinalizada como provisória até a troca

### Requirement: O acesso administrativo é bloqueado enquanto a senha for provisória
Enquanto a sessão estiver sinalizada como provisória, o sistema SHALL recusar as APIs
administrativas com `403` e mensagem própria (troca obrigatória), **sem** executar a operação. As
rotas de troca de senha, logout e refresh (e a identidade pública) SHALL permanecer acessíveis
para que a troca possa ser concluída.

#### Scenario: Rota administrativa é negada até a troca
- **WHEN** uma sessão com senha provisória chama uma rota administrativa (ex.: `GET /api/usuarios`)
- **THEN** a API responde `403` com o motivo de troca obrigatória e nenhum dado é acessado

#### Scenario: Rotas necessárias à troca permanecem acessíveis
- **WHEN** uma sessão com senha provisória chama `/api/auth/trocar-senha`, `/api/auth/logout` ou `/api/auth/refresh`
- **THEN** a requisição é processada normalmente

### Requirement: A troca da senha provisória libera o acesso
O sistema SHALL oferecer uma tela dedicada de primeiro acesso (`/admin/primeiro-acesso`, no layout
de autenticação) que coleta a senha atual (provisória) e a nova senha; ao confirmar com sucesso, a
flag `senha_provisoria` SHALL ser limpa, a sessão SHALL ser reemitida **sem** a condição de
provisória e o usuário SHALL ser conduzido à Área Administrativa. O cliente SHALL redirecionar para
essa tela toda vez que a sessão estiver sinalizada como provisória e a rota corrente não for a
própria tela de primeiro acesso.

#### Scenario: Fluxo completo de primeiro acesso
- **WHEN** o usuário com senha provisória define uma nova senha válida na tela de primeiro acesso
- **THEN** a troca é confirmada, a condição de provisória desaparece e o usuário passa a usar a Área Administrativa normalmente

#### Scenario: Redirecionamento forçado no cliente
- **WHEN** o usuário com sessão provisória navega para qualquer rota `/admin/**` que não seja a de primeiro acesso
- **THEN** o navegador o redireciona para `/admin/primeiro-acesso`

#### Scenario: Troca inválida mantém a obrigatoriedade
- **WHEN** o usuário informa uma senha atual incorreta ou uma nova senha inválida
- **THEN** a troca é recusada com erro e o acesso administrativo continua bloqueado

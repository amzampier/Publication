# Spec Delta

## MODIFIED Requirements

### Requirement: Mídias de chamadas são servidas sob autorização e visibilidade

As mídias gravadas em `uploads/chamadas/<ano>/<mes>/` NÃO SHALL ser servidas como ativo estático
público. O acesso SHALL ocorrer por rota da aplicação que:
- exige sessão válida e a permissão `lancar-chamadas`/`visualizar` para leitura administrativa; ou
- para requisição anônima, exige que a mídia esteja referenciada em `anexos_midias` por uma chamada
  com status `Publicado` e `publicado_em` não nulo e não futuro, que ao menos um vínculo ativo da
  chamada aponte para conteúdo pai `Publicado`, com `publicado_em` não nulo e não futuro, e não
  arquivado.

O servimento autorizado SHALL manter `X-Content-Type-Options: nosniff` e CSP que impeça execução,
usar o tipo de mídia derivado do conteúdo real e responder `404` quando o arquivo não existir ou não
estiver visível, sem revelar a existência de conteúdo não publicado. A rota SHALL rejeitar tentativas
de travessia de diretório com `400` ou `404`, sem sair de `uploads/chamadas/`. Mídias publicadas
SHALL permitir cache público reutilizável; a pré-visualização administrativa SHALL permanecer
privada.

#### Scenario: Anônimo não acessa mídia de chamada em revisão
- **WHEN** um visitante sem sessão requisita a URL de uma mídia vinculada a chamada em `Revisar`, `Aprovado` ou `Publicar`
- **THEN** a resposta é `404` (ou `401`) e o conteúdo não é servido

#### Scenario: Anônimo não acessa mídia de chamada cujo pai está arquivado
- **WHEN** um visitante sem sessão requisita a URL de uma mídia de chamada `Publicado` cujo único vínculo ativo aponta para conteúdo pai arquivado
- **THEN** a resposta é `404` (ou `401`) e o conteúdo não é servido

#### Scenario: Anônimo acessa mídia publicada
- **WHEN** um visitante sem sessão requisita a URL de uma mídia vinculada a chamada `Publicado` com ao menos um vínculo ativo para conteúdo pai `Publicado`, ambos com `publicado_em` efetivo
- **THEN** a imagem é exibida com `nosniff`, sem exigir sessão

#### Scenario: Mídia com data futura não é pública
- **WHEN** a chamada está `Publicado`, mas o `publicado_em` da chamada ou do pai é posterior a agora
- **THEN** a mídia não é servida anonimamente até a data efetiva

#### Scenario: Perfil autorizado acessa mídia em revisão
- **WHEN** um usuário autenticado com `lancar-chamadas`/`visualizar` requisita a URL de uma mídia em revisão
- **THEN** a imagem é exibida para o tratamento administrativo

#### Scenario: Perfil sem a permissão de chamadas não acessa mídia em revisão
- **WHEN** um usuário autenticado sem `lancar-chamadas`/`visualizar` requisita a URL de uma mídia não publicada
- **THEN** a resposta é `404` (ou `403`) e o conteúdo não é servido

#### Scenario: Travessia de diretório é recusada
- **WHEN** a URL tenta sair de `uploads/chamadas/` (ex.: `../fora`)
- **THEN** a resposta é `400` ou `404` e nenhum arquivo é servido

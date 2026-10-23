# Spec Delta

## REMOVED Requirements

### Requirement: Arquivos gravados são servidos publicamente

**Reason**: O servimento público irrestrito de `uploads/**` expõe mídias de chamadas não publicadas a qualquer visitante anônimo (RL06-C-01). A regra é substituída pelo servimento público apenas dos destinos de identidade e pelo servimento autorizado das mídias de chamadas.

**Migration**: Consumidores que exibem logomarcas, avatares ou logos de parceiros continuam usando as URLs `/uploads/<destino>/...` sem alteração. Consumidores de mídias de chamadas passam a usar as URLs retornadas pelo upload; o acesso passa a exigir sessão com permissão de leitura de chamadas ou, no caso anônimo, conteúdo publicado. Nenhuma URL existente precisa ser regravada.

## ADDED Requirements

### Requirement: Arquivos de identidade são servidos publicamente

Os arquivos gravados nos destinos de identidade (`logomarcas`, `avatares` e `logos`) SHALL continuar sendo servidos pela aplicação em `/uploads/**` tanto em desenvolvimento quanto em produção, sem depender de cópia no build, com `X-Content-Type-Options: nosniff` e sem nunca serem interpretados como documento executável. As respostas SHALL usar um tipo de mídia derivado do tipo real da imagem (ou um tipo neutro), nunca `text/html`.

#### Scenario: Logomarca pública acessível
- **WHEN** um navegador abre a URL `/uploads/logomarcas/<nome>` retornada pelo upload
- **THEN** a imagem é exibida com `nosniff`, sem exigir sessão

#### Scenario: Avatar público acessível
- **WHEN** um navegador abre a URL `/uploads/avatares/<nome>` retornada pelo upload
- **THEN** a imagem é exibida com `nosniff`, sem exigir sessão

#### Scenario: Logo de parceiro público acessível
- **WHEN** um navegador abre a URL `/uploads/logos/<nome>` retornada pelo upload
- **THEN** a imagem é exibida com `nosniff`, sem exigir sessão

#### Scenario: Arquivo de identidade nunca é servido como HTML
- **WHEN** um arquivo de identidade é requisitado
- **THEN** a resposta nunca traz `Content-Type: text/html` para o conteúdo gravado

### Requirement: Mídias de chamadas são servidas sob autorização e visibilidade

As mídias gravadas em `uploads/chamadas/<ano>/<mes>/` NÃO SHALL ser servidas como ativo estático público. O acesso SHALL ocorrer por rota da aplicação que:
- exige sessão válida e a permissão `lancar-chamadas`/`visualizar` para leitura administrativa; ou
- para requisição anônima, exige que a mídia esteja referenciada em `anexos_midias` por uma chamada com status `Publicado` e que ao menos um vínculo ativo da chamada aponte para conteúdo pai `Publicado` e não arquivado.

O servimento autorizado SHALL manter `X-Content-Type-Options: nosniff` e CSP que impeça execução, usar o tipo de mídia derivado do conteúdo real e responder `404` quando o arquivo não existir ou não estiver visível, sem revelar a existência de conteúdo não publicado. A rota SHALL rejeitar tentativas de travessia de diretório com `400` ou `404`, sem sair de `uploads/chamadas/`.

#### Scenario: Anônimo não acessa mídia de chamada em revisão
- **WHEN** um visitante sem sessão requisita a URL de uma mídia vinculada a chamada em `Revisar`, `Aprovado` ou `Publicar`
- **THEN** a resposta é `404` (ou `401`) e o conteúdo não é servido

#### Scenario: Anônimo não acessa mídia de chamada cujo pai está arquivado
- **WHEN** um visitante sem sessão requisita a URL de uma mídia de chamada `Publicado` cujo único vínculo ativo aponta para conteúdo pai arquivado
- **THEN** a resposta é `404` (ou `401`) e o conteúdo não é servido

#### Scenario: Anônimo acessa mídia publicada
- **WHEN** um visitante sem sessão requisita a URL de uma mídia vinculada a chamada `Publicado` com ao menos um vínculo ativo para conteúdo pai `Publicado` e não arquivado
- **THEN** a imagem é exibida com `nosniff`, sem exigir sessão

#### Scenario: Perfil autorizado acessa mídia em revisão
- **WHEN** um usuário autenticado com `lancar-chamadas`/`visualizar` requisita a URL de uma mídia em revisão
- **THEN** a imagem é exibida para o tratamento administrativo

#### Scenario: Perfil sem a permissão de chamadas não acessa mídia em revisão
- **WHEN** um usuário autenticado sem `lancar-chamadas`/`visualizar` requisita a URL de uma mídia não publicada
- **THEN** a resposta é `404` (ou `403`) e o conteúdo não é servido

#### Scenario: Travessia de diretório é recusada
- **WHEN** a URL tenta sair de `uploads/chamadas/` (ex.: `../fora`)
- **THEN** a resposta é `400` ou `404` e nenhum arquivo é servido

## MODIFIED Requirements

### Requirement: Uploads de chamadas usam subpastas de ano e mês

Além das subpastas fixas por finalidade, o endpoint SHALL aceitar o destino `chamadas` acompanhado de
`ano` e `mes`, gravando a imagem em `uploads/chamadas/<ano>/<mes>/<nome>` e respondendo com a URL
`/uploads/chamadas/<ano>/<mes>/<nome>`. A URL retornada é um identificador de acesso controlado: o
arquivo NÃO SHALL ser servido como ativo estático público e SHALL seguir o contrato de autorização e
visibilidade das mídias de chamadas. O `ano` SHALL ter quatro dígitos e o `mes` SHALL estar
entre `01` e `12`; valores ausentes, inválidos ou com tentativa de travessia de diretório SHALL ser
rejeitados com `400` sem gravar nada. O upload para `chamadas` SHALL exigir `criar` ou `alterar` no
módulo `lancar-chamadas`.

#### Scenario: Upload de imagem de chamada

- **WHEN** a requisição envia uma imagem válida com destino `chamadas`, `ano=2026` e `mes=10`
- **THEN** o arquivo é gravado em `uploads/chamadas/2026/10/` e a resposta traz a URL `/uploads/chamadas/2026/10/<nome>`

#### Scenario: Ano ou mês inválido

- **WHEN** a requisição envia `ano` fora de quatro dígitos ou `mes` fora de `01` a `12`
- **THEN** o servidor responde `400` e nenhum arquivo é criado

#### Scenario: Travessia de diretório

- **WHEN** `ano`, `mes` ou o nome do arquivo tentam sair de `uploads/chamadas/` (ex.: `../fora`)
- **THEN** o servidor responde `400` e nada é gravado

#### Scenario: Perfil sem permissão de escrita

- **WHEN** um perfil sem `criar` e sem `alterar` em `lancar-chamadas` envia uma imagem para `chamadas`
- **THEN** o servidor responde `403` e nenhum arquivo é criado

#### Scenario: URL retornada não é pública por padrão

- **WHEN** o upload de chamada conclui e a URL é aberta por um visitante anônimo sem que a chamada e o pai estejam publicados
- **THEN** a mídia não é servida
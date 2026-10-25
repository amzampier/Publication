# Uploads Specification

## Purpose

Contrato do serviço de uploads: recepção multipart, organização em subpastas por finalidade, validação de tipo/tamanho e servimento. Logomarcas, avatares e logos são públicos; mídias de chamadas são servidas pela rota autorizada com gate de publicação.

## Requirements

### Requirement: Upload de imagem via endpoint multipart

O sistema SHALL expor um endpoint `POST /api/uploads` que aceita upload multipart com um arquivo de imagem e o destino (`pasta`), grava o arquivo em `uploads/<pasta>/` no servidor e responde com a URL do arquivo no formato `/uploads/<pasta>/<nome>`. Os destinos permitidos SHALL ser `logomarcas`, `avatares`, `logos` e `chamadas`; `avatares` é autoatendimento (sessão), `logomarcas` exige `configuracoes-globais`/`alterar`, `logos` exige `parceiros`/`alterar` e `chamadas` exige `lancar-chamadas`/`criar` ou `alterar` com `ano`/`mes`.

#### Scenario: Upload de logomarca
- **WHEN** a requisição envia uma imagem válida com destino `logomarcas`
- **THEN** o arquivo é gravado em `uploads/logomarcas/` e a resposta traz a URL `/uploads/logomarcas/<nome>`

#### Scenario: Subpasta por finalidade
- **WHEN** a requisição envia uma imagem válida com destino `avatares`
- **THEN** o arquivo é gravado em `uploads/avatares/` e a resposta traz a URL `/uploads/avatares/<nome>`

#### Scenario: Logo de parceiro
- **WHEN** a requisição envia uma imagem válida com destino `logos`
- **THEN** o arquivo é gravado em `uploads/logos/` e a resposta traz a URL `/uploads/logos/<nome>`

#### Scenario: Destino não permitido é rejeitado
- **WHEN** a requisição envia um destino fora da lista de subpastas permitidas (ex.: `../fora`)
- **THEN** o servidor responde com erro 400 e nada é gravado

### Requirement: Somente imagens dentro dos limites são aceitas

O endpoint SHALL aceitar apenas arquivos que sejam **imagens reais** (PNG, JPEG, WebP, GIF) de até
5 MB, validando o **conteúdo** do arquivo (assinatura/magic bytes) **e** a coerência entre o tipo
detectado e a extensão/nome do arquivo; requisições sem arquivo, com outro tipo de arquivo
(incluindo HTML, SVG, JavaScript, XML ou qualquer conteúdo que se declare imagem), com extensão
executável (ex.: `.html`, `.htm`, `.svg`, `.js`, `.xml`) ou acima do limite SHALL receber resposta
de erro 400 sem gravar nada. O arquivo gravado SHALL usar uma extensão segura derivada do tipo real
de imagem detectado (nunca a extensão arbitrária enviada pelo cliente). Um corpo multipart acima do
envelope de segurança (5 MB de arquivo + folga do envelope) SHALL ser recusado com `413` antes de
ser totalmente consumido, inclusive quando o tamanho não vier em `Content-Length` (requisição
`chunked`), caso em que o limite SHALL ser aplicado durante a leitura.

#### Scenario: Arquivo não-imagem rejeitado
- **WHEN** a requisição envia um arquivo de texto (ex.: `.txt`)
- **THEN** o servidor responde com erro 400 e nenhum arquivo é criado em `uploads/`

#### Scenario: Conteúdo que não é imagem é rejeitado mesmo declarando imagem
- **WHEN** a requisição envia um arquivo HTML/SVG declarando `Content-Type: image/png`
- **THEN** o servidor responde com erro 400 (a assinatura do conteúdo não confere com uma imagem) e nada é gravado

#### Scenario: Conteúdo que inicia como imagem mas carrega payload executável é servido sem risco
- **WHEN** a requisição envia um arquivo cujo conteúdo começa com uma assinatura de imagem válida (ex.: PNG) seguida de HTML/script, com nome terminando em `.html`
- **THEN** o servidor grava o arquivo com a extensão canônica do tipo real (`.png`) e o serve como `image/png` com `X-Content-Type-Options: nosniff`, nunca como documento HTML

#### Scenario: Extensão executável é recusada mesmo com imagem válida
- **WHEN** a requisição envia uma imagem real com nome de extensão executável (ex.: `logo.svg`, `foto.html`)
- **THEN** o servidor responde com erro 400 ou grava o arquivo com extensão segura derivada do tipo real, e nunca preserva a extensão executável no nome final

#### Scenario: Arquivo acima do limite rejeitado
- **WHEN** a requisição envia uma imagem maior que 5 MB
- **THEN** o servidor responde com erro 400 e nenhum arquivo é criado

#### Scenario: Envelope acima do limite responde 413
- **WHEN** o corpo multipart declarado excede 5 MB mais a folga do envelope
- **THEN** o servidor responde `413` antes de processar o arquivo

#### Scenario: Requisição sem arquivo rejeitada
- **WHEN** a requisição chega sem o campo de arquivo
- **THEN** o servidor responde com erro 400

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

### Requirement: A autorização do destino precede o consumo do corpo

A rota de upload SHALL validar o destino e a permissão correspondente antes de consumir o corpo
multipart. A autorização SHALL usar o destino declarado na query (`pasta`); requisições sem `pasta`
na query SHALL responder `400` antes do parse, e um destino presente apenas no corpo NÃO SHALL ser
usado para postergar a checagem. Requisições para um destino não autorizado SHALL responder `403`
sem bufferizar o arquivo; requisições com destino inválido SHALL responder `400` sem gravar nada. O
limite de corpo SHALL ser aplicado antes da leitura completa, não apenas após o parse.

#### Scenario: Destino proibido nega antes do parse
- **WHEN** um perfil sem `configuracoes-globais`/`alterar` envia um multipart grande para `logomarcas`
- **THEN** a resposta é `403` e o corpo não é processado como arquivo

#### Scenario: Destino apenas no corpo é recusado
- **WHEN** a requisição omite `pasta` na query e envia `pasta` no corpo
- **THEN** a resposta é `400` antes do parse, sem autorização tardia

#### Scenario: Corpo acima do teto não é bufferizado
- **WHEN** a requisição declara `Content-Length` ou usa `chunked` acima do teto do envelope
- **THEN** a resposta é `413` e o servidor não mantém o corpo inteiro em memória

### Requirement: Miniaturas legadas têm fallback

Quando uma mídia de chamada não possuir a variante `-320.webp`, a galeria/rota SHALL usar o arquivo
original como fallback, sem exibir imagem quebrada nem responder erro.

#### Scenario: Mídia antiga sem miniatura
- **WHEN** a galeria renderiza uma imagem cuja variante `-320.webp` não existe
- **THEN** o original é exibido e a página não registra erro de imagem

#### Scenario: Miniatura existente
- **WHEN** a variante `-320.webp` existe
- **THEN** ela continua sendo usada para reduzir banda

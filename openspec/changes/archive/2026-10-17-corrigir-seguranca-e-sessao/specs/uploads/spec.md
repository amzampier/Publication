# Spec Delta

## MODIFIED Requirements

### Requirement: Somente imagens dentro dos limites são aceitas
O endpoint SHALL aceitar apenas arquivos que sejam **imagens reais** (PNG, JPEG, WebP, GIF) de até
5 MB, validando o **conteúdo** do arquivo (assinatura/magic bytes) **e** a coerência entre o tipo
detectado e a extensão/nome do arquivo; requisições sem arquivo, com outro tipo de arquivo
(incluindo HTML, SVG, JavaScript, XML ou qualquer conteúdo que se declare imagem), com extensão
executável (ex.: `.html`, `.htm`, `.svg`, `.js`, `.xml`) ou acima do limite SHALL receber resposta
de erro 400 sem gravar nada. O arquivo gravado SHALL usar uma extensão segura derivada do tipo real
de imagem detectado (nunca a extensão arbitrária enviada pelo cliente).

#### Scenario: Arquivo não-imagem rejeitado
- **WHEN** a requisição envia um arquivo de texto (ex.: `.txt`)
- **THEN** o servidor responde com erro 400 e nenhum arquivo é criado em `uploads/`

#### Scenario: Conteúdo que não é imagem é rejeitado mesmo declarando imagem
- **WHEN** a requisição envia um arquivo HTML/SVG declarando `Content-Type: image/png`
- **THEN** o servidor responde com erro 400 (a assinatura do conteúdo não confere com uma imagem) e nada é gravado

#### Scenario: Conteúdo que inicia como imagem mas carrega payload executável é rejeitado
- **WHEN** a requisição envia um arquivo cujo conteúdo começa com uma assinatura de imagem válida (ex.: PNG) seguida de HTML/script, com nome terminando em `.html`
- **THEN** o servidor responde com erro 400 e nenhum arquivo é gravado em `uploads/`

#### Scenario: Extensão executável é recusada mesmo com imagem válida
- **WHEN** a requisição envia uma imagem real com nome de extensão executável (ex.: `logo.svg`, `foto.html`)
- **THEN** o servidor responde com erro 400 ou grava o arquivo com extensão segura derivada do tipo real, e nunca preserva a extensão executável no nome final

#### Scenario: Arquivo acima do limite rejeitado
- **WHEN** a requisição envia uma imagem maior que 5 MB
- **THEN** o servidor responde com erro 400 e nenhum arquivo é criado

#### Scenario: Requisição sem arquivo rejeitada
- **WHEN** a requisição chega sem o campo de arquivo
- **THEN** o servidor responde com erro 400

### Requirement: Arquivos gravados são servidos publicamente
Os arquivos gravados em `uploads/` SHALL ser servidos pela aplicação em `/uploads/**` tanto em
desenvolvimento quanto em produção, sem depender de cópia no build, e o servimento SHALL incluir o
cabeçalho `X-Content-Type-Options: nosniff` (o navegador não deve adivinhar o tipo do arquivo).
O servimento SHALL garantir que nenhum arquivo gravado seja interpretado como documento executável:
a resposta SHALL usar um tipo de mídia derivado do tipo real de imagem (ou um tipo neutro), **nunca**
`text/html`, e conteúdo não-imagem não SHALL ser servido como HTML.

#### Scenario: Acesso à URL retornada pelo upload
- **WHEN** um navegador abre a URL `/uploads/logomarcas/<nome>` retornada pelo upload
- **THEN** a imagem é exibida

#### Scenario: Arquivo enviado em produção continua acessível
- **WHEN** o servidor de produção está no ar e um upload é feito em runtime
- **THEN** a URL retornada já exibe o arquivo imediatamente, sem novo build

#### Scenario: Servimento inclui nosniff
- **WHEN** um arquivo de `/uploads/**` é servido
- **THEN** a resposta inclui o cabeçalho `X-Content-Type-Options: nosniff`

#### Scenario: Arquivo gravado nunca é servido como documento executável
- **WHEN** um arquivo de `/uploads/**` é requisitado
- **THEN** a resposta nunca traz `Content-Type: text/html` para o conteúdo gravado (mesmo que o nome do arquivo tenha extensão executável), de modo que o navegador não execute script na origem da aplicação
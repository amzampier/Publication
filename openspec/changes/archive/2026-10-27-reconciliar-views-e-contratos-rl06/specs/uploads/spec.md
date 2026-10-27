# Spec Delta

## MODIFIED Requirements

### Requirement: Somente imagens dentro dos limites são aceitas

O endpoint SHALL aceitar apenas arquivos que sejam **imagens reais** (PNG, JPEG, WebP, GIF) de até 5 MB, validando o **conteúdo** do arquivo (assinatura/magic bytes) **e** a coerência entre o tipo detectado e a extensão/nome do arquivo; requisições sem arquivo, com outro tipo de arquivo (incluindo HTML, SVG, JavaScript, XML ou qualquer conteúdo que se declare imagem), com extensão executável (ex.: `.html`, `.htm`, `.svg`, `.js`, `.xml`) ou acima do limite SHALL receber resposta de erro 400 sem gravar nada. O arquivo gravado SHALL usar uma extensão segura derivada do tipo real de imagem detectado (nunca a extensão arbitrária enviada pelo cliente). Um corpo multipart acima do envelope de segurança (5 MB de arquivo + folga do envelope) SHALL ser recusado com `413` antes de ser totalmente consumido. Requisições `chunked` sem `Content-Length` SHALL ser recusadas imediatamente com `413`, sem leitura incremental do corpo.

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

#### Scenario: Chunked sem Content-Length responde 413

- **WHEN** a requisição usa `Transfer-Encoding: chunked` sem `Content-Length`
- **THEN** o servidor responde `413` imediatamente, sem ler o corpo inteiro

#### Scenario: Requisição sem arquivo rejeitada

- **WHEN** a requisição chega sem o campo de arquivo
- **THEN** o servidor responde com erro 400

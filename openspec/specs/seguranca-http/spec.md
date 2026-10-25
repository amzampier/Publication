# seguranca-http Specification

## Purpose

Definir os headers globais e a proteção CSRF das requisições autenticadas por cookie, sem quebrar o editor rico nem os fluxos de autenticação.

## Requirements

### Requirement: A aplicação envia headers globais de segurança

Toda resposta HTTP da aplicação SHALL incluir `X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritiva e
`X-Frame-Options: DENY` (ou `frame-ancestors 'none'` na CSP). Em produção HTTPS, SHALL incluir
`Strict-Transport-Security`. A `Content-Security-Policy` SHALL permitir o funcionamento do editor
rico, fontes e estilos do design system sem liberar scripts arbitrários; em desenvolvimento, a CSP
pode ser mais permissiva, mas os demais headers SHALL permanecer.

#### Scenario: Headers presentes em rota administrativa
- **WHEN** uma resposta de `/admin` ou de uma API administrativa é inspecionada
- **THEN** ela contém `nosniff`, `Referrer-Policy`, `Permissions-Policy` e proteção contra frame

#### Scenario: HSTS somente em produção HTTPS
- **WHEN** a aplicação roda em produção com HTTPS
- **THEN** a resposta inclui `Strict-Transport-Security`; em desenvolvimento HTTP ele não é exigido

#### Scenario: CSP não quebra o editor
- **WHEN** o editor de texto rico é aberto em uma rota administrativa
- **THEN** o conteúdo e a toolbar funcionam sem violação de CSP no console

### Requirement: Escritas autenticadas por cookie são protegidas contra CSRF

Requisições de escrita (`POST`, `PUT`, `PATCH`, `DELETE`) sob `/api/**` que dependam de cookies de
sessão SHALL ser rejeitadas com `403` quando a origem não for confiável. A validação SHALL aceitar
`Origin`/`Referer` same-origin ou um token CSRF de duplo envio (cookie + header). As rotas públicas
de autenticação (`/api/auth/login`, `/api/auth/refresh`, `/api/auth/esqueci-senha`) SHALL permanecer
acessíveis sem token, e o token NÃO SHALL ser exigido em `GET`/`HEAD`/`OPTIONS`.

#### Scenario: Origem cruzada é recusada
- **WHEN** um site externo tenta um `POST` autenticado por cookie com `Origin` diferente da aplicação
- **THEN** a API responde `403` e não executa a escrita

#### Scenario: Mesma origem é aceita
- **WHEN** a aplicação envia `POST`/`PUT`/`DELETE` com `Origin` igual à origem configurada
- **THEN** a requisição prossegue para a validação normal

#### Scenario: Token de duplo envio
- **WHEN** a requisição de escrita envia `X-CSRF-Token` igual ao cookie CSRF emitido pela aplicação
- **THEN** a validação passa mesmo sem `Origin` (cliente não-browser)

#### Scenario: Leitura não exige CSRF
- **WHEN** um `GET` autenticado é feito sem token CSRF
- **THEN** a requisição é processada normalmente

### Requirement: A saturação do pool responde 503 com Retry-After

Quando a fila do pool de conexões estiver saturada (`Queue limit reached` ou `ER_CON_COUNT_ERROR`),
a aplicação SHALL responder `503` com `Retry-After`, inclusive quando a falha ocorrer na validação
de sessão, no carregamento do RBAC ou em listagens, e NÃO SHALL responder `500` genérico para esse
caso.

#### Scenario: Saturação na sessão
- **WHEN** a primeira consulta de sessão de uma requisição encontra a fila do pool cheia
- **THEN** a resposta é `503` com `Retry-After`

#### Scenario: Saturação no RBAC/listagem
- **WHEN** a saturação ocorre ao carregar permissões ou ao executar uma listagem
- **THEN** a resposta é `503` com `Retry-After`, não `500`

#### Scenario: Erro não relacionado
- **WHEN** o erro não é de fila/conexão
- **THEN** a resposta continua sendo o erro original (ex.: `500`), sem mascaramento

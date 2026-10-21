# Spec Delta

## ADDED Requirements

### Requirement: Uploads de chamadas usam subpastas de ano e mês

Além das subpastas fixas por finalidade, o endpoint SHALL aceitar o destino `chamadas` acompanhado de
`ano` e `mes`, gravando a imagem em `uploads/chamadas/<ano>/<mes>/<nome>` e respondendo com a URL
pública `/uploads/chamadas/<ano>/<mes>/<nome>`. O `ano` SHALL ter quatro dígitos e o `mes` SHALL estar
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

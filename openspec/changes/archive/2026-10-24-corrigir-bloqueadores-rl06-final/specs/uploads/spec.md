# Spec Delta

## MODIFIED Requirements

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
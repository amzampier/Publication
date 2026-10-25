# Spec Delta

## MODIFIED Requirements

### Requirement: A exportação CSV é entregue em fluxo

Os endpoints de exportação SHALL oferecer CSV em fluxo (`text/csv` + `Content-Disposition`) quando
solicitado `formato=csv`, lendo os registros por cursor/keyset e escrevendo cada linha na resposta
sem montar o arquivo inteiro em memória. A contagem e os KPIs SHALL ser calculados uma única vez por
exportação, não a cada lote. A ordem SHALL ser estável e a resposta SHALL encerrar corretamente em
sucesso, erro ou desconexão do cliente.

#### Scenario: CSV grande em fluxo
- **WHEN** o usuário exporta um conjunto maior que o limite de página
- **THEN** a resposta chega como `text/csv` em partes e o servidor não carrega todas as linhas antes de responder

#### Scenario: Cursor estável
- **WHEN** a exportação percorre mais de um lote
- **THEN** o cursor avança sem repetir nem omitir registros, mesmo com empates na ordenação

#### Scenario: Contagem única
- **WHEN** a exportação processa N lotes
- **THEN** `COUNT`/KPIs são executados uma vez, não uma vez por lote

#### Scenario: Desconexão do cliente
- **WHEN** o cliente aborta o download no meio
- **THEN** o servidor interrompe a leitura e libera os recursos da consulta
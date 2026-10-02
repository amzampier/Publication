# Spec Delta

## MODIFIED Requirements

### Requirement: Marcas rotuladas exibem-se sob a track
O sistema SHALL exibir, quando informadas `marks` (`{ value, label }[]`), uma legenda com os rótulos alinhados sob a track, **legível e sem sobreposição em telas estreitas (a partir de 320px)**, sem interferir na operação do slider.

#### Scenario: Marcas renderizam
- **WHEN** `marks` é passado com 5 entradas
- **THEN** os 5 rótulos aparecem sob a track na ordem informada

#### Scenario: Sem marcas
- **WHEN** `marks` não é informado
- **THEN** nenhuma legenda é renderizada e o controle opera normalmente

#### Scenario: Rótulos legíveis em telas estreitas
- **WHEN** o slider com 5 marcas de rótulos longos (ex.: "30 dias (1 mês)" … "730 dias (2 anos)") é exibido em um contêiner estreito de 320–375px (ex.: painel de retenção de auditoria)
- **THEN** todos os rótulos permanecem legíveis e sem sobreposição entre si, quebrando linha quando necessário

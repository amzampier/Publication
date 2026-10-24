# Spec Delta

## ADDED Requirements

### Requirement: A dica padrão do upload reflete os formatos realmente aceitos

A dica padrão exibida pelo `UiUploadFiles` SHALL listar apenas formatos aceitos pelo componente e
pelo servidor, sem citar SVG quando SVG não é aceito. O chamador SHALL poder substituir a dica por
uma lista específica do seu contexto, e a substituição SHALL prevalecer sobre o padrão.

#### Scenario: Dica padrão sem formato não aceito

- **WHEN** o componente é renderizado sem uma dica customizada
- **THEN** a dica não cita SVG e lista os formatos de imagem efetivamente aceitos

#### Scenario: Dica customizada prevalece

- **WHEN** o chamador informa uma dica própria
- **THEN** o componente exibe exatamente a dica informada, sem concatenar o texto padrão

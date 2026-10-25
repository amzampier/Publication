# entrega-assets Specification

## Purpose

Definir a entrega de assets estáticos com cache e compressão adequados e um critério verificável de
prontidão para produção.

## Requirements

### Requirement: Assets com hash usam cache imutável

Os arquivos gerados sob `/_nuxt/**` SHALL ser servidos com `Cache-Control` público de longa duração
e `immutable`, pois o nome contém hash de conteúdo. HTML e respostas administrativas NÃO SHALL
receber cache público. Assets públicos de identidade (`/uploads/logomarcas`, `/uploads/avatares`,
`/uploads/logos`) SHALL ser servidos com `Cache-Control` curto e revalidável, inclusive no build de
produção.

#### Scenario: Chunk com hash
- **WHEN** um arquivo `/_nuxt/...js` é requisitado
- **THEN** a resposta permite cache público imutável de longa duração

#### Scenario: HTML administrativo
- **WHEN** uma página `/admin/**` é requisitada
- **THEN** a resposta não é cacheada publicamente

#### Scenario: Identidade em produção
- **WHEN** uma logomarca/avatar/logo é requisitado no build de produção
- **THEN** a resposta traz `Cache-Control` curto e revalidável

### Requirement: A resposta negocia compressão

O servidor/proxy SHALL comprimir respostas textuais com Brotli ou gzip quando o cliente enviar
`Accept-Encoding` compatível, sem comprimir mídias já comprimidas. O `Vary: Accept-Encoding` SHALL
ser preservado e NÃO SHALL aparecer duplicado. A compressão SHALL cobrir também respostas dinâmicas
(HTML/API/CSV) no Nitro ou no proxy documentado.

#### Scenario: Navegador com Brotli
- **WHEN** o cliente envia `Accept-Encoding: br, gzip`
- **THEN** um asset textual é servido comprimido e a resposta informa `Vary: Accept-Encoding`

#### Scenario: Resposta dinâmica
- **WHEN** o cliente requisita HTML/API/CSV com `Accept-Encoding: br, gzip`
- **THEN** a resposta textual é comprimida pelo Nitro ou pelo proxy documentado

#### Scenario: Imagem já comprimida
- **WHEN** o cliente requisita uma imagem WebP/PNG
- **THEN** a resposta não é recomprimida desnecessariamente
### Requirement: A entrega de produção tem critério verificável

O projeto SHALL manter um checklist de produção com HTTPS/proxy confiável, headers, migrations, backup/restore, e-mail real, limites de banco, compressão/CDN e teste de carga, de modo que o go-live possa ser validado sem depender de conhecimento tácito. Cada item SHALL ter comando/verificação e critério de aceite.

#### Scenario: Checklist executável
- **WHEN** o operador segue o checklist de produção
- **THEN** cada item tem comando/verificação e critério de aceite

#### Scenario: Regressão de headers/cache
- **WHEN** a entrega é validada após o deploy
- **THEN** headers, cache e compressão conferem com este contrato

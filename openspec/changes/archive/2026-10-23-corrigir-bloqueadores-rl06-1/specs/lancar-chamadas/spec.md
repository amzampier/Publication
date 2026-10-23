# Spec Delta

## ADDED Requirements

### Requirement: As mídias da chamada têm acesso controlado

As imagens persistidas em `anexos_midias` SHALL ser exibidas na Área Administrativa para usuários com
`lancar-chamadas`/`visualizar` e SHALL permanecer inacessível a visitantes anônimos enquanto a
chamada não estiver publicada. Uma mídia de chamada SHALL ser considerada pública somente quando:
- a chamada estiver com status `Publicado`; e
- ao menos um vínculo ativo da chamada apontar para conteúdo pai com status `Publicado` e
  `arquivada = 0`.

A URL da mídia SHALL ser servida pela aplicação com `nosniff` e sem possibilidade de execução; quando
o acesso não for permitido, a resposta SHALL ser `404` (ou `401`/`403`), sem revelar se o arquivo
existe. A listagem, os detalhes, a galeria e os relatórios administrativos SHALL continuar exibindo
as mídias para os perfis autorizados, inclusive de chamadas em revisão.

#### Scenario: Mídia de chamada em revisão não é pública
- **WHEN** uma chamada em `Revisar`, `Aprovado` ou `Publicar` possui imagens e um visitante anônimo abre a URL de uma delas
- **THEN** a imagem não é servida

#### Scenario: Mídia de chamada publicada é pública
- **WHEN** a chamada está `Publicado`, o pai está `Publicado` e não arquivado, e um visitante anônimo abre a URL da mídia
- **THEN** a imagem é servida com `nosniff`

#### Scenario: Mídia de chamada com pai arquivado não é pública
- **WHEN** a chamada está `Publicado`, mas o único vínculo ativo aponta para um pai arquivado, e um visitante anônimo abre a URL da mídia
- **THEN** a imagem não é servida

#### Scenario: Mídia com múltiplos vínculos e um pai publicado
- **WHEN** a chamada está `Publicado` e possui dois vínculos, um com pai publicado e não arquivado e outro com pai arquivado
- **THEN** a mídia é pública pelo vínculo ativo publicado

#### Scenario: Admin consulta mídia em revisão
- **WHEN** um usuário com `lancar-chamadas`/`visualizar` abre a galeria de uma chamada em revisão
- **THEN** as imagens são exibidas normalmente na Área Administrativa

#### Scenario: Perfil sem permissão de chamadas não consulta mídia em revisão
- **WHEN** um usuário autenticado sem `lancar-chamadas`/`visualizar` requisita a URL de uma mídia em revisão
- **THEN** a mídia não é servida
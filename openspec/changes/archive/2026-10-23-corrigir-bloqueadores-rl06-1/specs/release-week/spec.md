# Spec Delta

## MODIFIED Requirements

### Requirement: Backend da Release Week
O sistema SHALL servir `/api/release-week/**` sob a permissão do módulo `release-week`:
`GET /api/release-week` (visualizar) devolve as releases não arquivadas com `itensCount`;
`GET /api/release-week/:id/itens` (visualizar_itens) devolve os itens; `POST /api/release-week`
(criar) cria; `PUT /api/release-week/:id` (alterar) edita; `PUT /api/release-week/:id/publicar`
(publicar) muda o status para `Publicado` e grava `data_aprovacao`; `PUT /api/release-week/:id/arquivar`
(arquivar) marca `arquivada`; `DELETE /api/release-week/:id` (excluir) remove. O servidor SHALL gerar
o `codigo` `RW-XX/AAAA` a partir de `semana`/`ano` (na criação e **regenerar** na edição quando
`semana`/`ano` mudarem), recusando com `409` a duplicidade de `codigo`/`(ano, semana)`. O servidor
SHALL validar os campos obrigatórios, exigir que **`data_publicacao`** caia em uma segunda-feira ou,
quando a segunda-feira for feriado nacional, no próximo dia útil (`400` caso contrário; as demais
datas não têm essa restrição), aplicar a guarda de exclusão (arquivada ou com itens → `409`) e
registrar a operação na trilha de auditoria com recurso **"Release Week"**. A listagem e os itens
SHALL refletir o banco, e a release arquivada SHALL deixar de aparecer na listagem.

A transição de status para `Publicado` SHALL exigir a permissão `publicar` em **qualquer** caminho:
no endpoint dedicado, na criação com `status=Publicado` e na edição que altere o status para
`Publicado`. Sem essa permissão, a operação SHALL ser recusada com `403` e nenhum dado SHALL ser
alterado — mesmo que o perfil possua `criar` ou `alterar`. Quando a transição para `Publicado` for
autorizada pela edição ou criação, o servidor SHALL gravar `data_aprovacao` e SHALL auditar a
operação como **"Homologação"**, não como simples "Alteração". Quando a release deixar de estar
`Publicado`, o servidor SHALL limpar `data_aprovacao`.

#### Scenario: Criar gera código e registra auditoria
- **WHEN** um usuário com `release-week`/`criar` cria uma release válida
- **THEN** o registro é gravado com `codigo` derivado de `semana`/`ano`, a resposta é `201` e a trilha registra uma Inclusão do recurso "Release Week"

#### Scenario: Semana duplicada responde 409
- **WHEN** a criação ou edição tenta usar um `(ano, semana)` já existente
- **THEN** a API responde `409` sem gravar

#### Scenario: Data de publicação fora de segunda-feira é recusada
- **WHEN** a criação ou edição envia `data_publicacao` que não é segunda-feira nem o próximo dia útil de uma segunda-feira que seja feriado nacional
- **THEN** a API responde `400` e nada é gravado

#### Scenario: Próximo dia útil após feriado na segunda-feira
- **WHEN** a criação ou edição envia `data_publicacao` no próximo dia útil de uma segunda-feira que é feriado nacional (ex.: 03/11/2026, após 02/11/2026 — Finados)
- **THEN** a API aceita a data e grava a release

#### Scenario: Edição regenera o código
- **WHEN** a edição altera `semana` ou `ano`
- **THEN** o `codigo` é regenerado e a unicidade é validada

#### Scenario: Publicar e arquivar
- **WHEN** o usuário publica ou arquiva uma release
- **THEN** o status/`arquivada` são gravados e a trilha registra a operação

#### Scenario: Sem permissão a escrita é negada
- **WHEN** um perfil sem a funcionalidade exigida chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

#### Scenario: Edição não publica sem a permissão publicar
- **WHEN** um perfil com `release-week`/`alterar` e sem `publicar` envia `PUT /api/release-week/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece inalterado e nenhuma chamada filha é publicada

#### Scenario: Criação não publica sem a permissão publicar
- **WHEN** um perfil com `release-week`/`criar` e sem `publicar` envia `POST /api/release-week` com `status=Publicado`
- **THEN** a API responde `403` e nenhuma release é criada

#### Scenario: Edição autorizada publica e homologa
- **WHEN** um perfil com `publicar` envia `PUT /api/release-week/:id` mudando o status para `Publicado`
- **THEN** o status passa a `Publicado`, `data_aprovacao` é gravada, a cascata publica as filhas em `Publicar` e a trilha registra "Homologação"

#### Scenario: Reabrir limpa a aprovação
- **WHEN** uma release `Publicado` é editada para outro status
- **THEN** `data_aprovacao` é limpa e as filhas em `Publicado` sem outro pai publicado voltam para `Publicar`
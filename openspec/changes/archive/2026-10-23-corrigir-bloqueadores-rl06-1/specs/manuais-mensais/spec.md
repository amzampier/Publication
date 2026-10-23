# Spec Delta

## MODIFIED Requirements

### Requirement: Backend dos Manuais
O sistema SHALL servir `/api/manuais/**` sob a permissão do módulo `manuais`:
`GET /api/manuais` (visualizar; `?exportar=1` → exportar) devolve os catálogos não arquivados com
`itensCount`; `GET /api/manuais/:id/itens` (visualizar_itens) devolve os itens; `POST /api/manuais`
(criar) cria; `PUT /api/manuais/:id` (alterar) edita; `PUT /api/manuais/:id/publicar` (publicar)
muda o status para `Publicado` e preenche a `data_publicacao` sem sobrescrever uma data histórica;
`PUT /api/manuais/:id/arquivar` (arquivar) marca `arquivada`; `DELETE /api/manuais/:id` (excluir)
remove; `POST /api/manuais/importar` (importar) importa. O servidor SHALL gerar o `codigo`
`MAN-XX/AAAA` a partir de `mes`/`ano` (na criação e **regenerar** na edição quando `mes`/`ano`
mudarem), recusando com `409` a duplicidade de `codigo`/`(ano, mes_numero)`. O servidor SHALL
validar título, mês, ano e status; derivar `autorNome`/`revisorNome` de `usuarios`; gravar
`autor_id` da sessão e `data_criacao` (histórica ou atual); aplicar a guarda de exclusão (arquivada,
com itens ou com anexos → `409`); e registrar a operação na trilha de auditoria com recurso
**"Manuais Mensais"**.

A transição de status para `Publicado` SHALL exigir a permissão `publicar` em **qualquer** caminho:
no endpoint dedicado, na criação com `status=Publicado` e na edição que altere o status para
`Publicado`. Sem essa permissão, a operação SHALL ser recusada com `403` e nenhum dado SHALL ser
alterado — mesmo que o perfil possua `criar` ou `alterar`. Quando a transição para `Publicado` for
autorizada pela edição ou criação, o servidor SHALL preencher `data_publicacao` (preservando uma
data histórica existente) e SHALL auditar a operação como **"Homologação"**, não como simples
"Alteração".

#### Scenario: Criar gera código e registra auditoria
- **WHEN** um usuário com `manuais`/`criar` cria um catálogo válido
- **THEN** o registro é gravado com `codigo` derivado de `mes`/`ano`, a resposta é `201` e a trilha registra uma Inclusão do recurso "Manuais Mensais"

#### Scenario: Mês/ano duplicado responde 409
- **WHEN** a criação ou edição tenta usar um `(ano, mes_numero)` já existente
- **THEN** a API responde `409` com o erro no campo `mes` e nada é gravado

#### Scenario: Edição regenera o código
- **WHEN** a edição altera `mes` ou `ano`
- **THEN** o `codigo` é regenerado e a unicidade é validada

#### Scenario: Publicar e arquivar
- **WHEN** o usuário publica ou arquiva um catálogo
- **THEN** o status/`arquivada` são gravados, a data histórica é preservada e a trilha registra a operação

#### Scenario: Exclusão bloqueada no servidor
- **WHEN** `DELETE /api/manuais/:id` é chamado para um catálogo arquivado ou com itens/anexos
- **THEN** a API responde `409` com o motivo e nenhum registro é removido

#### Scenario: Sem permissão a escrita é negada
- **WHEN** um perfil sem a funcionalidade exigida chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

#### Scenario: Edição não publica sem a permissão publicar
- **WHEN** um perfil com `manuais`/`alterar` e sem `publicar` envia `PUT /api/manuais/:id` com `status=Publicado`
- **THEN** a API responde `403`, o status permanece inalterado e nenhuma chamada filha é publicada

#### Scenario: Criação não publica sem a permissão publicar
- **WHEN** um perfil com `manuais`/`criar` e sem `publicar` envia `POST /api/manuais` com `status=Publicado`
- **THEN** a API responde `403` e nenhum catálogo é criado

#### Scenario: Edição autorizada publica e homologa
- **WHEN** um perfil com `publicar` envia `PUT /api/manuais/:id` mudando o status para `Publicado`
- **THEN** o status passa a `Publicado`, `data_publicacao` é preenchida se vazia, a cascata publica as filhas em `Publicar` e a trilha registra "Homologação"
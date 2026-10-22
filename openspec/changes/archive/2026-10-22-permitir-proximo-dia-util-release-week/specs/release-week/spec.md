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

#### Scenario: Criar gera código e registra auditoria
- **WHEN** um usuário com `release-week`/`criar` cria uma release válida
- **THEN** o registro é gravado com `codigo` derivado de `semana`/`ano`, a resposta é `201` e a
  trilha registra uma Inclusão do recurso "Release Week"

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

### Requirement: Importação de Release Weeks por planilha
O sistema SHALL importar Release Weeks de uma planilha `.xlsx` com as colunas **Nome, Semana, Ano,
Mês, Data Início, Data Finaliza, Data Publicação, Status, Versão, Release, Descrição e Destaque** por
`POST /api/release-week/importar`, sob a permissão `release-week`/`importar`. O servidor SHALL
revalidar cada linha (campos obrigatórios, semana 1–52, mês do domínio, datas `AAAA-MM-DD` e
`data_publicacao` em segunda-feira ou no próximo dia útil de uma segunda-feira que seja feriado
nacional), recusar a importação inteira (`400`, com os motivos) quando houver linha inválida, tratar
`(ano, semana)` já cadastrado como conflito (sem gravar) e, quando tudo estiver válido, gravar em
**transação** gerando os códigos. A importação bem-sucedida SHALL ser registrada na trilha de
auditoria.

#### Scenario: Importar linhas válidas
- **WHEN** um usuário com `release-week`/`importar` envia linhas válidas
- **THEN** cada Release Week é gravada com o código gerado e a resposta informa quantas foram importadas

#### Scenario: Linha inválida recusa a importação inteira
- **WHEN** alguma linha tem campo obrigatório vazio, semana fora de 1–52 ou data inválida
- **THEN** a API responde `400` com os motivos e nada é gravado

#### Scenario: Semana já cadastrada é conflito
- **WHEN** a planilha traz um `(ano, semana)` já existente na base
- **THEN** nenhuma release é gravada e a resposta identifica os conflitos

#### Scenario: Importação exige a permissão de importar
- **WHEN** um perfil sem `release-week`/`importar` chama a rota de importação
- **THEN** a API responde `403` e nada é gravado

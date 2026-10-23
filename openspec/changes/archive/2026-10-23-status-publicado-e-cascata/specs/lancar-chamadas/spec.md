# Spec Delta

## ADDED Requirements

### Requirement: A chamada possui o status Publicado

O sistema SHALL representar a chamada já publicada no portal com o status `Publicado`, distinto de
`Publicar` (aguardando a publicação do conteúdo pai). Uma chamada SHALL assumir `Publicado` quando o
conteúdo pai vinculado for publicado e a chamada estiver em `Publicar`, ou quando a ação **Publicar
Item** for confirmada e ao menos um vínculo ativo já apontar para conteúdo pai `Publicado`. O status
`Publicado` NÃO SHALL ser editável no formulário de Lançar as Chamadas nem na importação XLSX. A
listagem, os detalhes, os filtros e os relatórios SHALL exibir `Publicado` com o mesmo tratamento
visual dos demais status. A chamada em `Publicado` SHALL permanecer visível no portal somente
enquanto ao menos um vínculo ativo apontar para conteúdo pai `Publicado` e não arquivado.

#### Scenario: Chamada publicada por cascata

- **WHEN** o conteúdo pai vinculado passa a `Publicado` e a chamada está em `Publicar`
- **THEN** a chamada passa a `Publicado`, o histórico registra a transição e ela fica visível no portal

#### Scenario: Publicar item com pai já publicado

- **WHEN** o usuário confirma Publicar Item em uma chamada `Aprovado` cujo vínculo ativo já aponta para conteúdo pai `Publicado`
- **THEN** a chamada passa diretamente a `Publicado` e fica visível no portal

#### Scenario: Chamada em revisão não é publicada pela cascata

- **WHEN** o conteúdo pai é publicado e a chamada está em `Revisar`, `Aprovado` ou `Recusado`
- **THEN** o status da chamada é preservado e ela não fica visível no portal

#### Scenario: Status não editável

- **WHEN** o formulário de Lançar as Chamadas é aberto para criar ou editar uma chamada
- **THEN** o status `Publicado` não é oferecido como campo editável

## MODIFIED Requirements

### Requirement: A aprovação altera o status da chamada

A tela SHALL oferecer a ação **Aprovar**, com confirmação, que altera o status da chamada para
`Aprovado`. A ação SHALL ser exibida sob a permissão `publicar` (única funcionalidade de fluxo do
catálogo atual) e SHALL ficar desabilitada com motivo quando o status não for `Revisar`.

#### Scenario: Aprovar chamada

- **WHEN** o usuário confirma a aprovação de uma chamada com status `Revisar`
- **THEN** o status passa a `Aprovado` e a listagem é atualizada

#### Scenario: Já aprovada, recusada ou publicada

- **WHEN** a chamada está com status `Aprovado`, `Recusado`, `Publicar` ou `Publicado`
- **THEN** a ação fica desabilitada e informa o motivo

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`publicar`
- **THEN** a ação não é exibida

### Requirement: A recusa altera o status da chamada

A tela SHALL oferecer a ação **Recusar**, com confirmação, que altera o status da chamada para
`Recusado`. A ação SHALL ser exibida sob a permissão `alterar` e SHALL ficar desabilitada com motivo
quando o status não for `Revisar`.

#### Scenario: Recusar chamada

- **WHEN** o usuário confirma a recusa de uma chamada com status `Revisar`
- **THEN** o status passa a `Recusado` e a listagem é atualizada

#### Scenario: Já aprovada, recusada ou publicada

- **WHEN** a chamada está com status `Aprovado`, `Recusado`, `Publicar` ou `Publicado`
- **THEN** a ação fica desabilitada e informa o motivo

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`alterar`
- **THEN** a ação não é exibida

### Requirement: A exclusão é condicionada ao status e ao histórico

A tela SHALL permitir excluir uma chamada somente quando o status for `Revisar` e a chamada não
possuir histórico na esteira de revisão. Caso contrário, a ação SHALL ficar desabilitada com motivo
acessível. A exclusão SHALL exigir confirmação e, quando concluída, remover a chamada da listagem e
recalcular os KPIs.

#### Scenario: Exclusão permitida

- **WHEN** a chamada está em `Revisar` e sem histórico e o usuário confirma a exclusão
- **THEN** a chamada é removida da listagem e os KPIs são recalculados

#### Scenario: Exclusão bloqueada por status

- **WHEN** a chamada está em `Aprovado`, `Recusado`, `Publicar` ou `Publicado`
- **THEN** a ação de excluir fica desabilitada e informa que a chamada já avançou na esteira

#### Scenario: Exclusão bloqueada por histórico

- **WHEN** a chamada possui histórico na esteira de revisão
- **THEN** a ação de excluir fica desabilitada e informa o motivo

#### Scenario: Sem permissão

- **WHEN** o perfil não concede `lancar-chamadas`/`excluir`
- **THEN** a ação não é exibida

### Requirement: O backend persiste as chamadas em `entregas_itens`

A tela SHALL ler e gravar as chamadas pela API, sem dataset em memória. A API SHALL listar as
chamadas persistidas, criar com status inicial `Revisar`, editar, aprovar para `Aprovado`, recusar
para `Recusado` e excluir somente quando o status permitir. A API SHALL persistir as transições de
publicação realizadas pela Esteira ou pela cascata do conteúdo pai, que podem resultar em `Publicar`
(aguardando pai) ou `Publicado`. A gravação SHALL preencher os campos de `entregas_itens`, incluindo
`manual_titulo`, `descricao_html`, `solucao` e `solucao_html`, e SHALL manter os textos derivados de
release, projeto, manual, software, parceiro, módulo e menu como snapshot da chamada. O HTML recebido
SHALL ser sanitizado no servidor e o texto puro de `descricao_completa` e `solucao` SHALL ser
derivado desse HTML, preservando as quebras de linha; sem HTML, o servidor SHALL usar o texto puro
recebido. O valor de `chamada` SHALL ser único; duplicatas SHALL ser rejeitadas com `409`, e registros
inexistentes com `404`. Toda escrita SHALL gerar auditoria com o recurso e a ação correspondentes.

#### Scenario: Cadastro persiste e sobrevive ao recarregamento

- **WHEN** o usuário cria uma chamada válida e recarrega a página
- **THEN** a chamada aparece na listagem com os mesmos dados, status `Revisar` e a data de criação

#### Scenario: Formatação persiste

- **WHEN** o usuário salva uma chamada com Descrição ou Solução formatadas e recarrega a página
- **THEN** o HTML sanitizado e o texto puro correspondente são relidos e a formatação é exibida novamente

#### Scenario: Conteúdo malicioso é neutralizado

- **WHEN** o payload de gravação contém marcação fora da allowlist (ex.: `script`, evento ou `style` não permitido)
- **THEN** o servidor grava apenas a marcação permitida e o conteúdo executável é removido

#### Scenario: Edição persiste

- **WHEN** o usuário altera uma chamada existente e salva
- **THEN** a listagem e os detalhes exibem os novos valores após recarregar a página

#### Scenario: Aprovação e recusa persistem

- **WHEN** o usuário aprova, recusa ou publica uma chamada
- **THEN** o novo status é gravado no banco e permanece após recarregar a página

#### Scenario: Chamada duplicada

- **WHEN** o usuário tenta salvar uma chamada com um número de `chamada` já existente
- **THEN** a API responde `409` e a tela exibe a mensagem de duplicidade sem perder os dados do formulário

#### Scenario: Chamada inexistente

- **WHEN** a API recebe edição, aprovação, recusa, publicação ou exclusão de um id inexistente
- **THEN** responde `404` e não altera nenhum registro

### Requirement: O vínculo move o conteúdo pai para revisão

Ao criar, importar ou alterar os vínculos de uma chamada, o sistema SHALL atualizar o status de cada
conteúdo pai vinculado para `Em Revisão` (Release Week e Manuais) ou `Homologação` (Escopo de
Projetos), quando ele ainda não estiver nesse status. A atualização SHALL ocorrer na mesma transação
da gravação da chamada e SHALL ser idempotente. Conteúdos pai em `Aprovado` ou `Publicado` também
SHALL ser reabertos para o status de revisão; a publicação do conteúdo pai permanece uma ação
explícita do módulo correspondente. Quando a reabertura retirar o pai de `Publicado`, as chamadas
filhas em `Publicado` que não tenham outro vínculo ativo publicado SHALL voltar para `Publicar` e
receber a transição no histórico. Filhas em `Publicado` que ainda tenham outro pai ativo publicado
SHALL permanecer em `Publicado`.

#### Scenario: Chamada criada com Release Week

- **WHEN** uma chamada é criada vinculada a uma Release Week
- **THEN** a Release Week passa a `Em Revisão`

#### Scenario: Chamada criada com Manual

- **WHEN** uma chamada é criada vinculada a um Manual Mensal
- **THEN** o Manual passa a `Em Revisão`

#### Scenario: Chamada criada com Escopo de Projetos

- **WHEN** uma chamada é criada vinculada a um Escopo de Projetos
- **THEN** o Escopo passa a `Homologação`

#### Scenario: Importação move os pais

- **WHEN** uma importação XLSX cria chamadas vinculadas a Release Week, Manuais ou Escopo
- **THEN** todos os conteúdos pai vinculados são movidos para o status de revisão na mesma transação

#### Scenario: Edição com novo vínculo

- **WHEN** uma chamada existente é editada e o vínculo é adicionado ou trocado
- **THEN** o novo conteúdo pai é movido para o status de revisão

#### Scenario: Pai já em revisão

- **WHEN** o conteúdo pai já está em `Em Revisão` (ou `Homologação` no Escopo)
- **THEN** o status é preservado, sem reescrita desnecessária

#### Scenario: Pai publicado é reaberto

- **WHEN** uma chamada é vinculada a um conteúdo pai `Publicado`
- **THEN** o pai volta para `Em Revisão` (ou `Homologação`) e as filhas em `Publicado` sem outro pai publicado voltam para `Publicar`

#### Scenario: Múltiplos vínculos preservam a publicação

- **WHEN** uma filha em `Publicado` tem dois pais e apenas um deles é reaberto
- **THEN** a filha permanece em `Publicado` porque o outro vínculo ativo continua `Publicado`

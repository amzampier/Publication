# Spec Delta

## ADDED Requirements

### Requirement: As transições de status registram histórico, parecer e critérios

As ações **Aprovar**, **Recusar** e **Desaprovar** de Lançar as Chamadas SHALL usar a mesma regra de
transição da Esteira de Revisão e SHALL gravar uma linha em `historico_esteira_revisao` com status
anterior, novo status, responsável (id, nome e perfil), parecer, critérios de aceite, tempo no estágio
e data/hora, além de atualizar o status da chamada na mesma transação. A aprovação SHALL preservar a
`data_liberacao` existente e herdar a `data_publicacao` da release somente quando ela estiver vazia.
A recusa NÃO SHALL alterar a `data_liberacao` e SHALL exigir parecer não vazio. A desaprovação SHALL
voltar a chamada para `Revisar`, limpar a `data_liberacao` e gravar a transição. A ação SHALL ser
recusada com conflito quando o status da chamada tiver mudado desde a leitura.

#### Scenario: Aprovar grava histórico

- **WHEN** o usuário confirma a aprovação de uma chamada em `Revisar`
- **THEN** o status passa a `Aprovado`, a `data_liberacao` existente é preservada (ou herdada da release quando vazia) e o histórico registra a transição

#### Scenario: Recusar exige parecer e grava histórico

- **WHEN** o usuário confirma a recusa de uma chamada em `Revisar` com parecer
- **THEN** o status passa a `Recusado`, a `data_liberacao` não é alterada e o histórico registra o parecer

#### Scenario: Recusar sem parecer é bloqueado

- **WHEN** o usuário tenta recusar uma chamada sem preencher o parecer
- **THEN** o formulário exibe erro, mantém o modal aberto e não grava a transição

#### Scenario: Desaprovar limpa a data de liberação

- **WHEN** o usuário confirma a desaprovação de uma chamada em `Aprovado`
- **THEN** o status volta a `Revisar`, a `data_liberacao` é limpa e o histórico registra a transição

#### Scenario: Conflito de status

- **WHEN** a chamada já avançou na esteira antes da confirmação
- **THEN** a API responde com conflito e a transição não é gravada

#### Scenario: Histórico compartilhado com a Esteira

- **WHEN** uma chamada é aprovada ou recusada em Lançar as Chamadas
- **THEN** a Esteira de Revisão exibe o novo status e o histórico correspondente

### Requirement: O vínculo move o conteúdo pai para revisão

Ao criar, importar ou alterar os vínculos de uma chamada, o sistema SHALL atualizar o status de cada
conteúdo pai vinculado para `Em Revisão` (Release Week e Manuais) ou `Homologação` (Escopo de
Projetos), quando ele ainda não estiver nesse status. A atualização SHALL ocorrer na mesma transação
da gravação da chamada e SHALL ser idempotente. Conteúdos pai em `Aprovado` ou `Publicado` também
SHALL ser reabertos para o status de revisão; a publicação do conteúdo pai permanece uma ação
explícita do módulo correspondente.

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
- **THEN** o pai volta para `Em Revisão` (ou `Homologação`) e deixa a vitrine pública até ser publicado novamente

### Requirement: Só conteúdos pai em status vinculável aparecem nas opções

O formulário de Lançar as Chamadas SHALL oferecer para vínculo apenas conteúdos pai com status
compatível com o fluxo: **Release Week** em `Aberta` ou `Em Revisão`; **Manuais** em `Rascunho` ou
`Em Revisão` (o Manual não possui o status `Aberta`; `Rascunho` é o equivalente inicial); **Escopo de
Projetos** em `Em Andamento` ou `Homologação`. A importação XLSX SHALL rejeitar linhas que referenciem
conteúdo pai fora desses status. O vínculo já existente de uma chamada em edição SHALL continuar
visível mesmo que o pai tenha mudado de status.

#### Scenario: Release fora do status vinculável

- **WHEN** uma Release Week está em `Aprovado` ou `Publicado`
- **THEN** ela não aparece nas opções de vínculo do formulário

#### Scenario: Manual fora do status vinculável

- **WHEN** um Manual está em `Alterações Solicitadas`, `Aprovado` ou `Publicado`
- **THEN** ele não aparece nas opções de vínculo do formulário

#### Scenario: Escopo fora do status vinculável

- **WHEN** um Escopo está em `Concluído` ou `Publicado`
- **THEN** ele não aparece nas opções de vínculo do formulário

#### Scenario: Importação com pai fora do status

- **WHEN** uma linha da planilha referencia uma Release, Manual ou Escopo fora dos status vinculáveis
- **THEN** a linha é marcada como inválida e a importação não grava nada

#### Scenario: Edição preserva o vínculo atual

- **WHEN** uma chamada existente é aberta para edição e o pai atual não está mais em status vinculável
- **THEN** o vínculo atual continua exibido, mas novos vínculos seguem a lista filtrada

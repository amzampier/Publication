# Spec Delta

## MODIFIED Requirements

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando o usuário aciona os controles ainda sem modal — as ações de linha de enviar o convite e bloquear —, permanecendo nenhum `UiModal` aberto por esses controles; o botão "Novo Usuário" e a ação de editar da linha deixam de exibir toast e abrem o modal de usuário, a ação de excluir da linha deixa de exibir toast e abre o modal de confirmação de exclusão, o botão "Filtros" deixa de exibir toast e abre o modal de filtros, e o ícone "Importar" da toolbar deixa de exibir toast e abre o modal de importação.

#### Scenario: Novo Usuário
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de usuário abre em modo de criação

#### Scenario: Importar na toolbar
- **WHEN** o usuário passa o mouse sobre o ícone de importar à esquerda do botão "Filtros"
- **THEN** um tooltip exibe "Importar Novos Usuários" e, ao clicar, nenhum toast de "próxima etapa" é exibido e o modal de importação abre

#### Scenario: Filtros na toolbar
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de filtros abre

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um usuário os controles de enviar o convite (ícone de e-mail confirmado) ou bloquear (cadeado) (ícones reduzidos com cores semânticas, cada um com tooltip e `aria-label` próprios)
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Excluir deixou de avisar por toast
- **WHEN** o usuário clica no ícone de excluir (`Trash2`) de uma linha
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de confirmação de exclusão abre

## ADDED Requirements

### Requirement: O modal de importação carrega usuários de uma planilha modelo
O sistema SHALL abrir um modal de importação de usuários ao acionar o ícone "Importar" da toolbar da tabela, aceitando somente arquivos `.xlsx` cujo cabeçalho corresponda ao modelo oficial de quatro colunas obrigatórias — **Nome**, **E-mail**, **Perfil**, **Status** —, modelo esse versionado no repositório (`docs/modelos/`) para consulta da equipe. Um arquivo com cabeçalho divergente ou ilegível SHALL exibir erro no modal sem montar a pré-visualização. Com arquivo válido, o modal SHALL exibir uma tabela temporária de pré-visualização com coluna de seleção e a coluna **Situação** de cada linha, em quatro estados: **"Pronto para importar"** (linha válida e e-mail ausente da base vigente), **"E-mail já cadastrado"** (e-mail presente na base vigente, comparado sem distinção de maiúsculas), **"Repetido no arquivo"** (segunda ocorrência do mesmo e-mail entre as linhas válidas do arquivo) e **"Linha inválida"** (nome ou e-mail ausentes, e-mail malformado ou Perfil/Status fora dos valores permitidos, com o motivo exibido) — as três últimas com seleção desabilitada. As linhas "Pronto para importar" SHALL chegar pré-selecionadas, e o rodapé SHALL exibir a contagem de selecionados no botão "Importar (n)", desabilitado quando n for zero. Confirmar SHALL adicionar à base em memória somente os registros selecionados — nascendo **sem senha** (a ser atribuída pelo envio manual de convite numa próxima etapa), com Data Cadastro e Última Atualização iguais ao instante da gravação, Status conforme o valor da planilha e os demais campos vazios — recalcular os KPIs, exibir toast de sucesso com a contagem e fechar o modal. **"Cancelar"**, `Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o arquivo carregado sem alterar a base. Filtros aplicados SHALL permanecer intactos pela importação: registros fora do filtro vigente só passam a aparecer na tabela e nos KPIs quando o filtro for limpo. Toda a operação SHALL ocorrer sem nenhuma requisição HTTP e ser descartada na recarga da página.

#### Scenario: Abertura pelo ícone Importar
- **WHEN** o usuário clica no ícone "Importar" da toolbar (com tooltip "Importar Novos Usuários")
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de importação abre vazio, sem tabela de pré-visualização

#### Scenario: Arquivo válido monta a pré-visualização com linhas prontas selecionadas
- **WHEN** o usuário seleciona um `.xlsx` cujo cabeçalho corresponde ao modelo e cujas linhas são válidas com e-mails fora da base
- **THEN** a tabela temporária é montada exibindo Nome, E-mail, Perfil, Status e a Situação "Pronto para importar" em cada linha, com seus checkboxes já marcados

#### Scenario: Linhas com problemas ganham Situação própria e ficam não selecionáveis
- **WHEN** o arquivo contém um e-mail já existente na base, um e-mail repetido no arquivo e uma linha com Perfil fora dos valores permitidos
- **THEN** essas linhas exibem, respectivamente, "E-mail já cadastrado", "Repetido no arquivo" e "Linha inválida" (com o motivo) na coluna Situação e seus checkboxes permanecem desabilitados

#### Scenario: Arquivo fora do modelo
- **WHEN** o usuário seleciona um arquivo cujo cabeçalho não corresponde ao modelo oficial ou que não pode ser lido
- **THEN** o modal exibe uma mensagem de erro e a tabela de pré-visualização não é montada

#### Scenario: Selecionar todos os prontos
- **WHEN** na pré-visualização o usuário aciona o checkbox "Selecionar todos os prontos"
- **THEN** todas as linhas "Pronto para importar" são marcadas (ou desmarcadas, quando já estavam todas marcadas), as demais permanecem desmarcadas e o checkbox fica desabilitado quando não há linhas prontas

#### Scenario: Arquivo com cabeçalho válido e nenhuma linha de dados
- **WHEN** o usuário seleciona um `.xlsx` cujo cabeçalho corresponde ao modelo mas que não contém nenhuma linha de dados
- **THEN** o modal exibe a mensagem "O arquivo não contém nenhuma linha de dados." e a tabela de pré-visualização não é montada

#### Scenario: Importar grava os selecionados e fecha
- **WHEN** com "n" registros selecionados o usuário aciona "Importar (n)"
- **THEN** somente os registros selecionados entram na base em memória sem senha e com as datas do instante da gravação, os KPIs recalculam, um toast de sucesso confirma a contagem importada e o modal fecha

#### Scenario: Seleção zerada desabilita o botão
- **WHEN** nenhum registro está selecionado
- **THEN** o botão exibe "Importar (0)" e fica desabilitado

#### Scenario: Reimportar o mesmo arquivo marca como já cadastrado as linhas cujo e-mail consta na base
- **WHEN** após importar o usuário carrega novamente o mesmo arquivo
- **THEN** todas as linhas cujo e-mail consta na base exibem "E-mail já cadastrado" (as demais mantêm sua situação de validação) e nenhuma fica selecionada

#### Scenario: Descarte por Cancelar
- **WHEN** com arquivo carregado o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha, a base permanece idêntica ao estado anterior e nenhum toast de sucesso é exibido

#### Scenario: Filtros preservados na importação
- **WHEN** com filtros aplicados o usuário importa registros que não atendem ao filtro vigente
- **THEN** os filtros e o badge permanecem como estavam e os registros importados só passam a aparecer na tabela e nos KPIs quando o filtro for limpo

#### Scenario: Recarga restaura a base
- **WHEN** a página é recarregada após uma importação
- **THEN** a base de demonstração original volta a ser exibida, sem os registros importados

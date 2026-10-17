# Spec Delta

## MODIFIED Requirements

### Requirement: A importação grava os registros selecionados via API
O sistema SHALL abrir um modal de importação de usuários ao acionar o ícone "Importar" da
toolbar da tabela, aceitando somente arquivos `.xlsx` cujo cabeçalho corresponda ao modelo
oficial de quatro colunas obrigatórias — **Nome**, **E-mail**, **Perfil**, **Status** —,
modelo versionado no repositório (`docs/modelos/`) para consulta da equipe. Um arquivo com
cabeçalho divergente ou ilegível SHALL exibir erro no modal sem montar a pré-visualização.
Com arquivo válido, o modal SHALL exibir uma tabela temporária de pré-visualização com
coluna de seleção e a coluna **Situação** de cada linha, em quatro estados: **"Pronto para
importar"** (linha válida e e-mail ausente da base), **"E-mail já cadastrado"**
(e-mail presente na base, comparado sem distinção de maiúsculas), **"Repetido no
arquivo"** (segunda ocorrência do mesmo e-mail entre as linhas válidas do arquivo) e
**"Linha inválida"** (nome ou e-mail ausentes, e-mail malformado ou Perfil/Status fora dos
valores permitidos, com o motivo exibido) — as três últimas com seleção desabilitada. A
avaliação das situações SHALL considerar a **base completa (todas as páginas)**, e não apenas o
conjunto de usuários atualmente carregado na tabela (que pode estar paginado ou filtrado);
"Pronto para importar" exige, portanto, que o e-mail não exista em nenhuma página da base. As
linhas "Pronto para importar" SHALL chegar pré-selecionadas, e o rodapé SHALL exibir a
contagem de selecionados no botão "Importar (n)", desabilitado quando n for zero.
Confirmar SHALL enviar as linhas selecionadas à API de importação, que as revalida contra o
banco (unicidade de e-mail, perfil existente) e grava em transação os registros selecionados
— nascendo **sem senha autenticável** (a ser atribuída pelo envio manual de convite), com a
situação da planilha e os demais campos vazios —, devolvendo a contagem gravada; o cliente
recalcula os KPIs, exibe toast de sucesso com a contagem e fecha o modal. Quando a API reportar
no commit que um ou mais e-mails já constam na base (ex.: cadastro concorrente entre a
pré-visualização e a gravação), as linhas correspondentes SHALL passar à situação **"E-mail já
cadastrado"** e ser desmarcadas na própria pré-visualização, mantendo o arquivo carregado e as
demais linhas, de modo que a correção seja refletida e o reenvio das linhas restantes seja
possível. **"Cancelar"**, `Escape` ou o `X` do cabeçalho SHALL fechar o modal descartando o
arquivo carregado sem nenhuma requisição. Filtros aplicados SHALL permanecer intactos pela
importação: registros fora do filtro vigente só passam a aparecer na tabela e nos KPIs quando o
filtro for limpo. Os registros importados SHALL persistir na recarga.

#### Scenario: Abertura pelo ícone Importar
- **WHEN** o usuário clica no ícone "Importar" da toolbar (com tooltip "Importar Novos Usuários")
- **THEN** nenhum toast de "próxima etapa" é exibido e o modal de importação abre vazio, sem tabela de pré-visualização

#### Scenario: Arquivo válido monta a pré-visualização com linhas prontas selecionadas
- **WHEN** o usuário seleciona um `.xlsx` cujo cabeçalho corresponde ao modelo e cujas linhas são válidas com e-mails fora da base
- **THEN** a tabela temporária é montada exibindo Nome, E-mail, Perfil, Status e a Situação "Pronto para importar" em cada linha, com seus checkboxes já marcados

#### Scenario: Linhas com problemas ganham Situação própria e ficam não selecionáveis
- **WHEN** o arquivo contém um e-mail já existente na base, um e-mail repetido no arquivo e uma linha com Perfil fora dos valores permitidos
- **THEN** essas linhas exibem, respectivamente, "E-mail já cadastrado", "Repetido no arquivo" e "Linha inválida" (com o motivo) na coluna Situação e seus checkboxes permanecem desabilitados

#### Scenario: E-mail existente fora da página carregada é marcado como já cadastrado
- **WHEN** a tabela exibe apenas a primeira página (20 usuários) e o arquivo traz um e-mail que existe na base, porém em outra página
- **THEN** a linha exibe "E-mail já cadastrado" com o checkbox desabilitado, e não é pré-selecionada

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
- **THEN** somente os registros selecionados são enviados à API, revalidados e gravados no
  banco sem senha autenticável, os KPIs recalculam, um toast de sucesso confirma a contagem
  importada e o modal fecha

#### Scenario: Seleção zerada desabilita o botão
- **WHEN** nenhum registro está selecionado
- **THEN** o botão exibe "Importar (0)" e fica desabilitado

#### Scenario: Reimportar o mesmo arquivo marca como já cadastrado as linhas cujo e-mail consta na base
- **WHEN** após importar o usuário carrega novamente o mesmo arquivo
- **THEN** todas as linhas cujo e-mail consta na base exibem "E-mail já cadastrado" (as demais mantêm sua situação de validação) e nenhuma fica selecionada

#### Scenario: Conflito reportado pela API é refletido na pré-visualização
- **WHEN** o commit é recusado porque um e-mail passou a existir na base entre a pré-visualização e a gravação
- **THEN** as linhas daquele e-mail passam à situação "E-mail já cadastrado" e são desmarcadas, o arquivo permanece carregado e as demais linhas continuam disponíveis para um novo envio

#### Scenario: Descarte por Cancelar
- **WHEN** com arquivo carregado o usuário aciona "Cancelar", pressiona `Escape` ou clica no `X` do cabeçalho
- **THEN** o modal fecha sem nenhuma requisição, a base permanece idêntica ao estado anterior e nenhum toast de sucesso é exibido

#### Scenario: Filtros preservados na importação
- **WHEN** com filtros aplicados o usuário importa registros que não atendem ao filtro vigente
- **THEN** os filtros e o badge permanecem como estavam e os registros importados só passam a aparecer na tabela e nos KPIs quando o filtro for limpo

#### Scenario: Recarga mantém os registros importados
- **WHEN** a página é recarregada após uma importação
- **THEN** a listagem da API exibe também os registros importados (nada é descartado)

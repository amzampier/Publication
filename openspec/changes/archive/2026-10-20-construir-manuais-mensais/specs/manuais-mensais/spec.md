# Spec Delta: manuais-mensais

## Purpose

Define a página administrativa do catálogo mensal de manuais na fase frontend: o cabeçalho do mês,
seus KPIs, a listagem com filtros e ações, a clonagem, o arquivamento soft, a guarda de exclusão, a
expansão somente leitura dos itens, as exportações, o dataset em memória de rascunho e a navegação
até a tela — fixando o contrato que o backend servirá depois.

## ADDED Requirements

### Requirement: A página de Manuais Mensais existe em /admin/manuais
O sistema SHALL expor a tela de Manuais Mensais em `/admin/manuais`, renderizada dentro do shell da
Área Administrativa (header + sidebar) como as demais rotas sob `/admin/**`. A tela SHALL ser
alcançável pelo item **Manuais** da sessão **Publicações** da sidebar, que passa a declarar a rota
`/admin/manuais` e a navegar ao clique. O acesso SHALL estar sujeito à mesma guarda de sessão das
demais telas administrativas.

#### Scenario: Item Manuais navega pela sidebar
- **WHEN** o usuário clica em "Manuais" na sidebar
- **THEN** o navegador vai para `/admin/manuais` e a tela é renderizada dentro do shell

#### Scenario: Item Manuais fica ativo na própria rota
- **WHEN** a rota corrente é `/admin/manuais`
- **THEN** o item "Manuais" da sidebar é exibido como ativo, com `aria-current="page"`

#### Scenario: Rota protegida exige sessão
- **WHEN** um visitante sem sessão tenta abrir `/admin/manuais`
- **THEN** ele é redirecionado para `/admin/login?redirect=/admin/manuais`

### Requirement: A tela representa o catálogo mensal de manuais
Cada catálogo mensal SHALL ser representado pelos campos do cabeçalho: `codigo` (`MAN-XX/AAAA`),
`titulo`, `descricao`, `ano`, `mes` (por extenso), `mes_numero` (1 a 12),
`status` (`Rascunho` | `Em Revisão` | `Alterações Solicitadas` | `Aprovado` | `Publicado`),
`destaque_mes`, `destaque_semana`, `total_visualizacoes`, `autor_nome`, `revisor_nome`, `arquivada`,
`criado_em`, `atualizado_em` e `data_publicacao`. O status SHALL ser exibido em `UiBadge` com
variantes distintas para os cinco valores. O `codigo`, os carimbos, a data de publicação e os nomes
de autor/revisor SHALL ser gerados pelo sistema, nunca digitados na tela.

#### Scenario: Cabeçalho exibe os campos do mês
- **WHEN** um catálogo mensal é exibido
- **THEN** ele apresenta código, título, mês/ano, status em `UiBadge`, autor e data de publicação,
  com as datas formatadas em pt-BR

#### Scenario: Status restrito ao domínio
- **WHEN** o status é apresentado ou editado
- **THEN** apenas `Rascunho`, `Em Revisão`, `Alterações Solicitadas`, `Aprovado` e `Publicado` são
  oferecidos

#### Scenario: Destaques identificados
- **WHEN** um catálogo mensal está marcado como destaque do mês ou destaque da semana
- **THEN** a listagem exibe o indicador de destaque correspondente ao lado do título

### Requirement: Listagem, busca, ordenação e paginação
A tela SHALL exibir os catálogos mensais em uma tabela com as colunas **Código, Título, Mês/Ano,
Status, Autor, Publicação** e a coluna de ações, oferecendo busca, ordenação e paginação no cliente
sobre o conjunto vigente. A tela SHALL exibir o cabeçalho e os KPIs mesmo com a lista vazia, e a
tabela SHALL distinguir base vazia de filtro sem resultado. Os catálogos arquivados NÃO SHALL fazer
parte do conjunto exibido.

#### Scenario: Colunas da listagem
- **WHEN** a listagem é exibida
- **THEN** a tabela mostra as colunas Código, Título, Mês/Ano, Status, Autor, Publicação e ações

#### Scenario: Busca, ordenação e paginação no cliente
- **WHEN** o usuário usa a busca, ordena uma coluna ou troca de página
- **THEN** a tabela reflete a interação sobre o conjunto vigente

#### Scenario: Base vazia
- **WHEN** não há catálogo mensal cadastrado
- **THEN** a tabela exibe o estado vazio de base sem registros e nenhum dado fictício é mostrado

### Requirement: KPIs do conjunto vigente
A tela SHALL exibir cinco indicadores derivados do conjunto vigente (o conjunto filtrado, quando
houver filtro): **Rascunho**, **Em Revisão**, **Alterações Solicitadas**, **Aprovado** e
**Publicado**. Os catálogos arquivados NÃO SHALL ser contados.

#### Scenario: KPIs acompanham os filtros
- **WHEN** um filtro refina o conjunto exibido
- **THEN** os cinco KPIs são recalculados sobre o conjunto filtrado

#### Scenario: Arquivado sai dos KPIs
- **WHEN** um catálogo mensal é arquivado
- **THEN** ele deixa de ser contado em todos os cinco KPIs

### Requirement: Filtros estruturais em modal
A tela SHALL oferecer um modal de filtros acionado pela toolbar da tabela, com **Status**, **Ano**,
**Mês**, **Autor** e **Destaque** (vazio = todos; o filtro de destaque oferece "Todos", "Destaque do
mês" e "Destaque da semana") e os botões "Limpar Filtros", "Cancelar" e "Aplicar". Aplicar SHALL
refinar o conjunto vigente; limpar SHALL zerar rascunho e estado; a toolbar SHALL indicar a
quantidade de filtros ativos no badge do botão "Filtros". Os filtros SHALL operar inteiramente em
memória e ser descartados na recarga da página.

#### Scenario: Aplicar refina a listagem e os KPIs
- **WHEN** o usuário seleciona filtros e clica em "Aplicar"
- **THEN** a tabela e os KPIs passam a refletir apenas os catálogos que casam com os filtros

#### Scenario: Limpar restaura o conjunto
- **WHEN** o usuário clica em "Limpar Filtros"
- **THEN** os filtros são zerados e a listagem completa volta a ser exibida

#### Scenario: Cancelar descarta o rascunho
- **WHEN** o usuário altera seleções e clica em "Cancelar"
- **THEN** o modal fecha e o conjunto vigente permanece inalterado

#### Scenario: Contador de filtros ativos
- **WHEN** há filtros ativos
- **THEN** o botão "Filtros" exibe a quantidade de filtros aplicados

### Requirement: Inclusão de catálogo mensal
O sistema SHALL oferecer o botão "Novo Manual", que abre um modal de cadastro com **Título**
(obrigatório, até 255), **Mês** (obrigatório, 1 a 12), **Ano** (obrigatório), **Descrição**,
**Status** (padrão `Rascunho`), **Destaque do mês** e **Destaque da semana**. O formulário SHALL
validar os campos no cliente, impedir a combinação `(ano, mês)` já existente no conjunto e focar o
primeiro problema; salvar SHALL incluir o catálogo no conjunto vigente com código gerado pelo
sistema e fechar o modal com aviso de sucesso. A ação SHALL respeitar a permissão de `criar` do
módulo `manuais`.

#### Scenario: Abrir o cadastro com padrões
- **WHEN** o usuário aciona "Novo Manual"
- **THEN** o modal abre vazio, com status `Rascunho` e destaques desligados

#### Scenario: Campos obrigatórios
- **WHEN** o usuário tenta salvar sem título, mês ou ano
- **THEN** o primeiro campo inválido recebe o erro e o foco, e nada é incluído

#### Scenario: Mês já cadastrado
- **WHEN** o usuário tenta salvar um `(ano, mês)` que já existe no conjunto
- **THEN** o erro é exibido no campo e nenhum segundo catálogo é criado

#### Scenario: Inclusão com sucesso
- **WHEN** o usuário salva um formulário válido
- **THEN** o catálogo entra na listagem com o código gerado, o modal fecha e um aviso de sucesso é
  exibido

### Requirement: Edição de catálogo mensal
O sistema SHALL oferecer a ação de linha **Editar**, que abre o mesmo modal preenchido com o
registro, em modo edição, exibindo o **Código** somente leitura, a **Data de publicação** somente
leitura (quando houver) e a seção **Informações de Cadastro** com `criado_em` e `atualizado_em`
desabilitados. Salvar SHALL atualizar o catálogo no conjunto e fechar o modal com aviso de sucesso. A
ação SHALL respeitar a permissão de `alterar`.

#### Scenario: Abrir edição preenchida
- **WHEN** o usuário aciona "Editar" em uma linha
- **THEN** o modal abre preenchido, com Código e carimbos de cadastro somente leitura

#### Scenario: Atualização com sucesso
- **WHEN** o usuário salva alterações válidas
- **THEN** a linha reflete os novos dados, o modal fecha e um aviso de sucesso é exibido

#### Scenario: Mês/ano em conflito na edição
- **WHEN** a edição tenta usar um `(ano, mês)` já ocupado por outro catálogo
- **THEN** o erro é exibido no campo e nada é alterado

### Requirement: Clonagem de catálogo mensal
O sistema SHALL oferecer a ação de linha **Clonar**, que abre o modal de cadastro em modo criação com
**Título**, **Descrição**, **Destaque do mês** e **Destaque da semana** preenchidos a partir do
registro de origem. Os demais campos — **Código**, **Mês**, **Ano**, datas, **Status** e os
**itens/anexos** — SHALL abrir em branco (status volta ao padrão `Rascunho`). A clonagem NÃO SHALL
copiar os itens nem os anexos, nem gravar nada antes de o usuário salvar. A ação SHALL ser exibida
somente quando o perfil conceder **`clonar`**; a gravação SHALL usar a mesma criação e exigir
**`criar`** no servidor.

#### Scenario: Clonar abre o formulário parcialmente preenchido
- **WHEN** o usuário aciona "Clonar" em um catálogo mensal
- **THEN** o modal abre com Título, Descrição e Destaques copiados, os demais campos vazios e status
  `Rascunho`, sem criar um novo registro ainda

#### Scenario: Clonar não copia itens nem anexos
- **WHEN** o catálogo de origem possui itens ou anexos vinculados
- **THEN** o formulário de clonagem não os traz e o novo registro nasce sem itens/anexos

#### Scenario: Sem a permissão de clonar a ação não aparece
- **WHEN** o perfil do usuário não concede `manuais`/`clonar`
- **THEN** a ação "Clonar" não é oferecida na linha

#### Scenario: Clonar sem criar é recusado
- **WHEN** um perfil concede `clonar` mas não `criar` e tenta gravar a clonagem
- **THEN** a gravação é recusada e nenhum catálogo é criado

### Requirement: Publicar e arquivar catálogo mensal
O sistema SHALL oferecer as ações de linha **Publicar** e **Arquivar**, ambas com confirmação.
Publicar SHALL alterar o status para `Publicado` e preencher a **Data de publicação**. Arquivar SHALL
marcar o catálogo como **arquivado** (`arquivada = true`), sem excluir nenhum dado, e o catálogo
arquivado SHALL deixar de aparecer na listagem/KPIs. Arquivar SHALL respeitar a permissão de
`arquivar`; publicar, a de `publicar`.

#### Scenario: Publicar altera o status
- **WHEN** o usuário confirma "Publicar"
- **THEN** o status passa a `Publicado`, a data de publicação é preenchida e a listagem/KPIs refletem
  a mudança

#### Scenario: Arquivar remove da listagem sem excluir
- **WHEN** o usuário confirma "Arquivar"
- **THEN** o catálogo é marcado como arquivado, deixa de aparecer na listagem e seus dados e itens
  permanecem intactos

#### Scenario: Catálogo arquivado não aparece
- **WHEN** a listagem é exibida
- **THEN** os catálogos arquivados não fazem parte do conjunto exibido nem dos KPIs

### Requirement: Exclusão condicionada de catálogo mensal
O sistema SHALL oferecer a ação **Excluir** somente quando o catálogo **não estiver arquivado** e
**não possuir nenhum item/relacionamento** vinculado. Quando uma dessas condições falhar, a ação
SHALL ficar indisponível com a indicação acessível do motivo (catálogo arquivado ou catálogo com
itens), e nenhum dado SHALL ser removido. A confirmação de exclusão SHALL remover o registro do
conjunto vigente e fechar o modal com aviso de sucesso. A ação SHALL respeitar a permissão de
`excluir`.

#### Scenario: Excluir catálogo sem vínculos
- **WHEN** o catálogo não está arquivado e não possui itens, e o usuário confirma a exclusão
- **THEN** o registro é removido da listagem e um aviso de sucesso é exibido

#### Scenario: Catálogo com itens não pode ser excluído
- **WHEN** o catálogo possui itens vinculados
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

#### Scenario: Catálogo arquivado não pode ser excluído
- **WHEN** o catálogo está arquivado
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

### Requirement: Flag de itens e expansão somente leitura
A tabela SHALL oferecer um **controle no cabeçalho** que habilita a visualização dos itens. Enquanto
habilitado, cada catálogo mensal SHALL exibir um sinal **"+"**; ao acioná-lo, a linha SHALL expandir
e revelar os **itens do manual** (`entregas_itens` com `origem='Manual'` e `manual_id` vinculado) em
modo somente leitura, com Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status e Data
de liberação. Acionar novamente recolhe a linha. Catálogo sem itens SHALL exibir um estado vazio
próprio dentro da expansão. A coluna de expansão não SHALL afetar ordenação, busca ou paginação. A
flag e a expansão SHALL exigir a permissão **`manuais`/`visualizar_itens`**; sem ela, a flag não é
exibida.

#### Scenario: Habilitar a flag revela o sinal de "+"
- **WHEN** o usuário marca a flag de itens no cabeçalho da tabela
- **THEN** cada catálogo mensal passa a exibir um sinal "+" para expandir

#### Scenario: Expandir mostra os itens do manual
- **WHEN** o usuário aciona o "+" de um catálogo com itens
- **THEN** a linha expande e exibe os itens daquele manual em modo somente leitura

#### Scenario: Catálogo sem itens
- **WHEN** o usuário expande um catálogo sem itens
- **THEN** a expansão exibe um estado vazio informando que não há itens

#### Scenario: Recolher a expansão
- **WHEN** o usuário aciona novamente o controle de uma linha expandida
- **THEN** a linha recolhe e os itens deixam de ser exibidos

#### Scenario: Itens exigem a permissão própria
- **WHEN** o perfil não concede `manuais`/`visualizar_itens`
- **THEN** a flag de itens não é exibida na tabela

### Requirement: Exportações PDF e CSV
A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a **listagem em PDF** e a **exportação em
CSV** do conjunto filtrado vigente, com as colunas da listagem. O CSV SHALL usar `;` com BOM UTF-8 e
neutralizar fórmulas de planilha; falhas na geração SHALL produzir aviso de erro sem interromper a
tela. Em caso de lista vazia, a exportação SHALL informar que não há dados. A exportação SHALL
respeitar a permissão de `exportar`.

#### Scenario: Exportar o conjunto filtrado
- **WHEN** o usuário escolhe "Exportar em CSV" ou "Listagem em PDF"
- **THEN** o arquivo é gerado com os catálogos do conjunto filtrado e as colunas da listagem

#### Scenario: Falha na exportação
- **WHEN** a geração falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

### Requirement: Dataset em memória de rascunho
Nesta fase, a tela SHALL operar sobre um **dataset em memória** (`useState`) com catálogos mensais e
itens de exemplo, de modo que as ações possam ser exercitadas sem backend. O dataset NÃO SHALL ser
persistido: recarregar a página restaura o conjunto inicial e nenhum registro SHALL ser gravado no
banco. As inclusões, edições, clonagens, publicações, arquivamentos e exclusões SHALL atualizar
apenas esse conjunto em memória. O contrato de leitura futura (`GET /api/manuais`) e a coluna
`arquivada` SHALL ser documentados como a substituição desse dataset na fase backend.

#### Scenario: Ações operam sobre o conjunto em memória
- **WHEN** o usuário inclui, edita, clona, publica, arquiva ou exclui um catálogo mensal
- **THEN** a listagem e os KPIs refletem a mudança imediatamente, sem requisição ao servidor

#### Scenario: Recarregar descarta as mudanças
- **WHEN** o usuário recarrega a página
- **THEN** o dataset volta ao conjunto inicial em memória e nada foi persistido

### Requirement: Affordância de importação
A toolbar da tabela SHALL apresentar o ícone de **importação** imediatamente à **esquerda** do botão
"Filtros", sob a permissão de `importar`. Nesta fase o ícone SHALL ser apenas uma affordância:
acioná-lo NÃO SHALL abrir modal, executar leitura de planilha nem disparar requisição. A execução da
importação SHALL permanecer como pendência para a fase backend.

#### Scenario: Ícone de importação visível ao lado de Filtros
- **WHEN** a toolbar da tabela é exibida para um perfil com `importar`
- **THEN** o ícone de importação aparece imediatamente à esquerda do botão "Filtros"

#### Scenario: Importação não executa nesta fase
- **WHEN** o usuário aciona o ícone de importação
- **THEN** nenhum modal é aberto e nenhuma requisição é disparada

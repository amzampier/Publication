# Spec Delta: manuais-mensais

## MODIFIED Requirements

### Requirement: Inclusão de catálogo mensal
O sistema SHALL oferecer o botão "Novo Manual", que abre um modal de cadastro com **Título**
(obrigatório, até 255), **Mês** (obrigatório, 1 a 12), **Ano** (obrigatório), **Descrição**,
**Status** (padrão `Rascunho`), **Destaque do mês** e **Destaque da semana**. O formulário SHALL
validar os campos no cliente, impedir a combinação `(ano, mês)` já existente no conjunto e focar o
primeiro problema; salvar SHALL persistir o catálogo via `POST /api/manuais` (201), com o código
gerado pelo servidor, o autor da sessão, a data de criação do servidor e a data de publicação
preenchida quando o status for `Publicado`, e fechar o modal com aviso de sucesso. Conflito de
`(ano, mês)` no banco SHALL responder `409` com erro no campo. A ação SHALL respeitar a permissão de
`criar` do módulo `manuais`.

#### Scenario: Abrir o cadastro com padrões
- **WHEN** o usuário aciona "Novo Manual"
- **THEN** o modal abre vazio, com status `Rascunho` e destaques desligados

#### Scenario: Campos obrigatórios
- **WHEN** o usuário tenta salvar sem título, mês ou ano
- **THEN** o primeiro campo inválido recebe o erro e o foco, e nada é incluído

#### Scenario: Mês já cadastrado
- **WHEN** o usuário tenta salvar um `(ano, mês)` que já existe no conjunto ou no banco
- **THEN** o erro é exibido no campo, a API responde `409` e nenhum segundo catálogo é criado

#### Scenario: Inclusão com sucesso
- **WHEN** o usuário salva um formulário válido
- **THEN** o catálogo é persistido pela API com o código gerado, entra na listagem, o modal fecha e
  um aviso de sucesso é exibido

### Requirement: Edição de catálogo mensal
O sistema SHALL oferecer a ação de linha **Editar**, que abre o mesmo modal preenchido com o
registro, em modo edição, exibindo o **Código** somente leitura, a **Data de publicação** somente
leitura (quando houver) e a seção **Informações de Cadastro** com `criado_em` e `atualizado_em`
desabilitados. Salvar SHALL persistir a alteração via `PUT /api/manuais/:id` (200), regenerando o
`codigo` se `mes`/`ano` mudarem e recusando conflito `(ano, mês)` com `409`, e fechar o modal com
aviso de sucesso. A ação SHALL respeitar a permissão de `alterar`.

#### Scenario: Abrir edição preenchida
- **WHEN** o usuário aciona "Editar" em uma linha
- **THEN** o modal abre preenchido, com Código e carimbos de cadastro somente leitura

#### Scenario: Atualização com sucesso
- **WHEN** o usuário salva alterações válidas
- **THEN** a linha reflete os novos dados persistidos pela API, o modal fecha e um aviso de sucesso
  é exibido

#### Scenario: Mês/ano em conflito na edição
- **WHEN** a edição tenta usar um `(ano, mês)` já ocupado por outro catálogo
- **THEN** o erro é exibido no campo, a API responde `409` e nada é alterado

### Requirement: Publicar e arquivar catálogo mensal
O sistema SHALL oferecer as ações de linha **Publicar** e **Arquivar**, ambas com confirmação.
Publicar SHALL chamar `PUT /api/manuais/:id/publicar`, alterar o status para `Publicado` e preencher
a **Data de publicação** (`COALESCE(data_publicacao, CURRENT_DATE)`), preservando uma data histórica
já existente. Arquivar SHALL chamar `PUT /api/manuais/:id/arquivar`, marcar o catálogo como
**arquivado** (`arquivada = true`), sem excluir nenhum dado, e o catálogo arquivado SHALL deixar de
aparecer na listagem/KPIs. Arquivar SHALL respeitar a permissão de `arquivar`; publicar, a de
`publicar`.

#### Scenario: Publicar altera o status
- **WHEN** o usuário confirma "Publicar"
- **THEN** o status passa a `Publicado`, a data de publicação é preenchida (se vazia) e a
  listagem/KPIs refletem a mudança

#### Scenario: Publicação preserva data histórica
- **WHEN** o catálogo já possui uma `data_publicacao` vinda da importação
- **THEN** a publicação mantém essa data em vez de sobrescrevê-la

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
SHALL ficar indisponível com a indicação acessível do motivo (catálogo arquivado, com itens ou com
anexos), e nenhum dado SHALL ser removido. A confirmação SHALL chamar `DELETE /api/manuais/:id`; a
API SHALL reaplicar a guarda e responder `409` mesmo que a chamada contorne a interface. A exclusão
bem-sucedida SHALL remover o registro do conjunto vigente e fechar o modal com aviso de sucesso. A
ação SHALL respeitar a permissão de `excluir`.

#### Scenario: Excluir catálogo sem vínculos
- **WHEN** o catálogo não está arquivado e não possui itens/anexos, e o usuário confirma a exclusão
- **THEN** o registro é removido pela API, sai da listagem e um aviso de sucesso é exibido

#### Scenario: Catálogo com itens não pode ser excluído
- **WHEN** o catálogo possui itens vinculados
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

#### Scenario: Catálogo arquivado não pode ser excluído
- **WHEN** o catálogo está arquivado
- **THEN** a ação de exclusão fica indisponível com o motivo informado e nada é removido

#### Scenario: A API recusa a exclusão bloqueada
- **WHEN** `DELETE /api/manuais/:id` é chamado para um catálogo arquivado ou com itens/anexos
- **THEN** a API responde `409` com o motivo e nenhum registro é removido

### Requirement: Flag de itens e expansão somente leitura
A tabela SHALL oferecer um **controle no cabeçalho** que habilita a visualização dos itens. Enquanto
habilitado, cada catálogo mensal SHALL exibir um sinal **"+"**; ao acioná-lo, a linha SHALL expandir
e revelar os **itens do manual** (`entregas_itens` com `manual_id` vinculado) em modo somente
leitura, com Chamada, Título, Software, Módulo, Tipo, Impacto, Situação, Status e Data de liberação,
obtidos sob demanda de `GET /api/manuais/:id/itens`. Acionar novamente recolhe a linha. Catálogo sem
itens SHALL exibir um estado vazio próprio dentro da expansão. A coluna de expansão não SHALL afetar
ordenação, busca ou paginação. A flag, a expansão e o endpoint de itens SHALL exigir a permissão
**`manuais`/`visualizar_itens`**; sem ela, a flag não é exibida e a API responde `403`.

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
- **THEN** a flag de itens não é exibida na tabela e `GET /api/manuais/:id/itens` responde `403`

### Requirement: Exportações PDF e CSV
A tela SHALL oferecer, no menu "Relatórios" do cabeçalho, a **listagem em PDF** e a **exportação em
CSV** do conjunto filtrado vigente, com as colunas da listagem. Antes de gerar, a tela SHALL chamar
`GET /api/manuais?exportar=1` como guarda da permissão `exportar`. O CSV SHALL usar `;` com BOM
UTF-8 e neutralizar fórmulas de planilha; falhas na geração ou na guarda SHALL produzir aviso de erro
sem interromper a tela. Em caso de lista vazia, a exportação SHALL informar que não há dados.

#### Scenario: Exportar o conjunto filtrado
- **WHEN** o usuário escolhe "Exportar em CSV" ou "Listagem em PDF"
- **THEN** a guarda de `exportar` é validada na API e o arquivo é gerado com os catálogos do conjunto
  filtrado e as colunas da listagem

#### Scenario: Falha na exportação
- **WHEN** a geração ou a guarda de permissão falha
- **THEN** um aviso de erro é exibido e a tela permanece utilizável

## REMOVED Requirements

### Requirement: Dataset em memória de rascunho
**Reason**: A fase frontend foi substituída pela persistência real; os dados agora vêm de
`GET /api/manuais` e as mutações gravam no banco.
**Migration**: A tela usa `useApiFetch`; os registros vivem em `manuais_mensal` e os itens em
`entregas_itens`. Recarregar não restaura mais um dataset de exemplo.

### Requirement: Affordância de importação
**Reason**: A importação deixou de ser um ícone inerte e passou a ser funcional.
**Migration**: O ícone abre `ManuaisImportar`, que lê a planilha, pré-visualiza as linhas e grava por
`POST /api/manuais/importar`.

## ADDED Requirements

### Requirement: A tela carrega e persiste Manuais pela API
A tela SHALL carregar os catálogos de `GET /api/manuais` na montagem e exibir um overlay
`UiLoading` ("Carregando Manuais Mensais…") enquanto a requisição estiver em voo, sem conteúdo
parcial; em falha, SHALL exibir toast de erro e manter a tabela vazia. Toda mutação bem-sucedida
(inclusão, edição, clonagem, publicação, arquivamento, exclusão e importação) SHALL ser refletida na
tabela e nos KPIs, e a recarga da página SHALL rebuscar pela API — o que foi gravado persiste, sem
base de demonstração. A listagem SHALL usar o `itensCount` devolvido pela API para a contagem de
itens e a guarda visual de exclusão.

#### Scenario: Carga inicial pela API
- **WHEN** o navegador abre `/admin/manuais`
- **THEN** o overlay de carregamento é exibido enquanto `GET /api/manuais` responde e, em seguida, a
  tabela exibe os catálogos persistidos (ou o estado vazio)

#### Scenario: Falha na carga não simula dados
- **WHEN** `GET /api/manuais` falha
- **THEN** um toast de erro é exibido e a tabela permanece vazia, sem dados de demonstração

#### Scenario: Mutação persiste e a recarga a mantém
- **WHEN** o usuário inclui, edita, clona, publica, arquiva, exclui ou importa catálogos e recarrega
- **THEN** a mudança persiste e volta da API com os valores gravados

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

#### Scenario: Criar gera código e registra auditoria
- **WHEN** um usuário com `manuais`/`criar` cria um catálogo válido
- **THEN** o registro é gravado com `codigo` derivado de `mes`/`ano`, a resposta é `201` e a trilha
  registra uma Inclusão do recurso "Manuais Mensais"

#### Scenario: Mês/ano duplicado responde 409
- **WHEN** a criação ou edição tenta usar um `(ano, mes_numero)` já existente
- **THEN** a API responde `409` com o erro no campo `mes` e nada é gravado

#### Scenario: Edição regenera o código
- **WHEN** a edição altera `mes` ou `ano`
- **THEN** o `codigo` é regenerado e a unicidade é validada

#### Scenario: Publicar e arquivar
- **WHEN** o usuário publica ou arquiva um catálogo
- **THEN** o status/`arquivada` são gravados, a data histórica é preservada e a trilha registra a
  operação

#### Scenario: Exclusão bloqueada no servidor
- **WHEN** `DELETE /api/manuais/:id` é chamado para um catálogo arquivado ou com itens/anexos
- **THEN** a API responde `409` com o motivo e nenhum registro é removido

#### Scenario: Sem permissão a escrita é negada
- **WHEN** um perfil sem a funcionalidade exigida chama a rota de escrita
- **THEN** a API responde `403` e nenhum dado é alterado

### Requirement: Importação de Manuais por planilha
O sistema SHALL importar catálogos mensais de uma planilha `.xlsx` com as colunas **Título, Mês,
Ano, Descrição, Status, Data de Criação, Data de Publicação, Destaque do mês e Destaque da semana**
por `POST /api/manuais/importar`, sob a permissão `manuais`/`importar`. O parser SHALL classificar
cada linha como `pronto`, `já cadastrado`, `repetido no arquivo` ou `inválida`. O servidor SHALL
revalidar título, mês, ano, status e datas (formato civil válido), exigir **Data de Publicação**
quando o status for `Publicado`, tratar `(ano, mes_numero)` já cadastrado como conflito (sem gravar)
e recusar a importação inteira (`400`, com os motivos) quando houver linha inválida ou duplicada.
Quando tudo estiver válido, SHALL gravar em **transação** (códigos gerados, autor = usuário da
sessão, `data_criacao` e `data_publicacao` da planilha) e registrar auditoria com a contagem. O
limite SHALL ser de 500 linhas. O autor histórico NÃO SHALL ser preservado por esta importação:
todos os registros ficam com o usuário que executa a importação.

#### Scenario: Importar linhas válidas
- **WHEN** um usuário com `manuais`/`importar` envia linhas válidas
- **THEN** cada catálogo é gravado com o código gerado, as datas históricas e a resposta informa
  quantos foram importados

#### Scenario: Publicação histórica sem data é inválida
- **WHEN** uma linha tem status `Publicado` e a Data de Publicação está vazia ou é inválida
- **THEN** a linha é marcada como inválida e a importação não grava nada

#### Scenario: Linha inválida recusa a importação inteira
- **WHEN** alguma linha tem campo obrigatório vazio, mês/ano/status inválido ou data inválida
- **THEN** a API responde `400` com os motivos e nada é gravado

#### Scenario: Mês já cadastrado é conflito
- **WHEN** a planilha traz um `(ano, mês)` já existente na base (inclusive arquivado)
- **THEN** nenhum catálogo é gravado e a resposta identifica os conflitos

#### Scenario: Importação exige a permissão de importar
- **WHEN** um perfil sem `manuais`/`importar` chama a rota de importação
- **THEN** a API responde `403` e nada é gravado

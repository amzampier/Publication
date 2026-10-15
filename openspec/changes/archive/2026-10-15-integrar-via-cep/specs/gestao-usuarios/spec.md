# Spec Delta

## ADDED Requirements

### Requirement: O modal de usuário reúne os blocos de cadastro com busca de CEP
O sistema SHALL exibir um único modal de usuário, aberto em modo de criação pelo botão "Novo Usuário" do cabeçalho e em modo de edição pelo lápis da linha, com os blocos **Dados do Usuário** (avatar, Nome, E-mail, Telefone, Função, Departamento e, numa linha própria de largura total começando abaixo do avatar, Status — em controle segmentado Ativo/Inativo, sem dropdown —, Perfil, Senha e Confirmar Senha — sem seção/cabeçalho próprio de "Acesso ao Sistema"), **Endereço** (CEP, Endereço, Número, Complemento, Bairro, Cidade, Estado, Região) e **Configurações de E-mail** (E-mail SMTP, Senha SMTP, Provedor, Servidor SMTP, Porta, Segurança, ações de teste e Status da Configuração) nos dois modos, acrescidos do bloco **Informações de Cadastro** (Data Cadastro e Última Atualização, ambos desabilitados) **somente em modo de edição** — o modo de criação SHALL abrir o modal apenas com os três blocos anteriores, sem a seção "Informações de Cadastro" e sem os campos de data. O ícone de busca de CEP SHALL consultar a ViaCEP e preencher o endereço conforme a capability `busca-cep` (com estado de carregamento, feedback de falha e bloqueio de cliques), sem nenhum toast de "próxima etapa".

#### Scenario: Abertura em modo de criação
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** o modal abre vazio, com Perfil e Situação sem seleção, exibindo somente os blocos "Dados do Usuário", "Endereço" e "Configurações de E-mail" — sem a seção "Informações de Cadastro" e sem os campos "Data Cadastro" e "Última Atualização"

#### Scenario: Abertura em modo de edição
- **WHEN** o usuário clica no lápis de uma linha
- **THEN** o modal abre preenchido com os dados daquele usuário — incluindo o bloco "Informações de Cadastro" com Data Cadastro e Última Atualização formatadas (dd/mm/aaaa HH:mm) — e com os campos de Senha vazios

#### Scenario: Máscara de CEP, telefone e porta
- **WHEN** o usuário digita em CEP, Telefone ou Porta
- **THEN** o valor é exibido com máscara (99999-999 no CEP) e o valor gravado corresponde ao conteúdo digitado

#### Scenario: Ícone de busca de CEP preenche o endereço
- **WHEN** o usuário clica no ícone ao lado direito do campo CEP com um CEP válido e a ViaCEP responde
- **THEN** os campos de endereço são preenchidos conforme a `busca-cep` (sem toast de sucesso), Número e Complemento digitados são preservados e nenhum toast de "próxima etapa" é exibido

#### Scenario: Falha da busca não altera o modal
- **WHEN** a busca falha (CEP incompleto, não encontrado ou falha de rede)
- **THEN** o toast da `busca-cep` é exibido com o título "Gestão de Usuários", nenhum campo de endereço muda e o modal permanece aberto

#### Scenario: Avatar com câmera
- **WHEN** o usuário aciona a câmera no bloco de Dados do Usuário e confirma a captura
- **THEN** a pré-visualização circular do avatar é atualizada, o modal de usuário permanece aberto com os demais campos intactos e o modal de câmera é encerrado

### Requirement: Usuário criado sem endereço nasce com número vazio
O campo **Número** do endereço SHALL nascer vazio (`''`) quando nenhum campo de endereço é informado — na criação manual pelo modal, na importação por planilha e em qualquer outra rota de criação de usuário —, e não com o valor legado `S/N`. A migration correspondente SHALL alterar o default da coluna `usuarios.numero` para `''` e limpar o `S/N` dos registros existentes cujo endereço esteja inteiramente vazio (sem CEP, logradouro, bairro e cidade); registros com endereço parcialmente preenchido mantêm o `S/N`, que ali é o "sem número" legítimo.

#### Scenario: Importação grava número vazio
- **WHEN** uma linha selecionada é importada pela planilha sem dados de endereço
- **THEN** o registro criado tem `numero` vazio (e os demais campos de endereço vazios), não `S/N`

#### Scenario: Cadastro manual com endereço vazio mantém número vazio
- **WHEN** o usuário cria um usuário pelo modal sem preencher nenhum campo de endereço e salva
- **THEN** o registro gravado tem `numero` vazio

#### Scenario: Registro legado com endereço vazio é limpo na migration
- **WHEN** o servidor inicializa com a nova migration e existe um registro com `numero = 'S/N'` e endereço inteiramente vazio
- **THEN** o `numero` do registro passa a vazio e o campo exibe vazio no modal de edição

#### Scenario: S/N legítimo junto a endereço preenchido é preservado
- **WHEN** existe um registro com `numero = 'S/N'` e logradouro/CEP/bairro/cidade preenchidos
- **THEN** a migration não altera o `numero` desse registro

### Requirement: A importação exibe os registros em andamento
Enquanto o envio das linhas selecionadas à API estiver em voo, o modal de importação SHALL exibir um painel de progresso no lugar da pré-visualização, listando cada registro selecionado (nome e e-mail) com indicador de carregamento e a contagem "Importando N registro(s)", e o botão "Importar" SHALL exibir estado de carregamento. Nenhum registro SHALL ser marcado como concluído antes da resposta da API (sem simulação de progresso). Em sucesso, o comportamento já existente permanece (recálculo dos KPIs, toast com a contagem e fechamento); em falha, o painel desaparece e a pré-visualização volta exibindo o erro.

#### Scenario: Painel lista os registros em voo
- **WHEN** o usuário aciona "Importar (N)" e a requisição ainda está em andamento
- **THEN** a pré-visualização é substituída por um painel com contagem "Importando N registro(s)" e a lista dos nomes/e-mails selecionados com indicador de carregamento, e o botão "Importar" exibe loading

#### Scenario: Falha devolve a pré-visualização com erro
- **WHEN** o envio falha (linhas inválidas, e-mails já cadastrados ou erro de rede)
- **THEN** o painel de progresso some, a tabela de pré-visualização volta a ser exibida com o erro e nenhuma linha é marcada como importada

#### Scenario: Sucesso fecha com toast
- **WHEN** a API responde com a contagem de importados
- **THEN** o painel é encerrado, o modal fecha, os KPIs e a tabela refletem os registros gravados e um toast de sucesso exibe a contagem

## REMOVED Requirements

### Requirement: O modal de usuário reúne os blocos de cadastro
**Reason**: O requirement da fase 1 exigia o stub de ViaCEP no ícone de busca de CEP; ele é substituído pelo requirement ADDED "O modal de usuário reúne os blocos de cadastro com busca de CEP", idêntico em blocos e modos, com o cenário de stub trocado pelo comportamento real de busca.
**Migration**: Ler o requirement ADDED "O modal de usuário reúne os blocos de cadastro com busca de CEP" desta mesma delta — a estrutura do modal não muda; o cenário "Ícone de busca de CEP não preenche nada nesta etapa" é substituído pelos cenários "Ícone de busca de CEP preenche o endereço" e "Falha da busca não altera o modal".

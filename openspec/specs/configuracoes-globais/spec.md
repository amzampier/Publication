# Configurações Globais Specification

## Purpose

Definir o comportamento observável da tela de Configurações Globais do sistema — rota na Área Administrativa, estrutura de abas, painéis de logomarcas, sidebar, retenção de auditoria e segurança e feedback de gravação — para que código, QA e conferência visual validem a mesma tela.

## Requirements

### Requirement: A tela existe em /admin/configuracoes-globais dentro do shell administrativo
O sistema SHALL servir a Configurações Globais em `/admin/configuracoes-globais`, renderizada com o shell da Área Administrativa (header + sidebar) por herdarem de `/admin/**`, sem configuração visual própria de layout.

#### Scenario: Rota renderiza com o shell
- **WHEN** o visitante abre `/admin/configuracoes-globais`
- **THEN** a página exibe o header e a sidebar da Área Administrativa e, na área de conteúdo, o título "Configurações Globais do Sistema"

#### Scenario: Item da sidebar leva à tela
- **WHEN** o usuário clica em "Configurações Globais" na sidebar ou no menu do Account
- **THEN** o navegador navega para `/admin/configuracoes-globais` e aquele item aparece como ativo

### Requirement: A página oferece quatro abas com a de logomarcas ativa por padrão
O sistema SHALL exibir a página como um conjunto de quatro abas — "Logomarcas & Identidade", "Sidebar & Sessões do Menu", "Retenção de Auditoria" e "Segurança & Rate Limits (15 Min)" — com "Logomarcas & Identidade" selecionada ao carregar a página.

#### Scenario: Aba padrão
- **WHEN** a página carrega
- **THEN** "Logomarcas & Identidade" está marcada como aba ativa e seu painel é exibido

#### Scenario: Troca de aba
- **WHEN** o usuário seleciona outra aba
- **THEN** o painel correspondente é exibido e a aba selecionada fica com a pill ativa

#### Scenario: Cada aba exibe seu painel
- **WHEN** o usuário seleciona "Logomarcas & Identidade", "Sidebar & Sessões do Menu" ou "Segurança & Rate Limits (15 Min)"
- **THEN** o painel correspondente é exibido com seus próprios controles (áreas de upload de logo com campo de caminho, opções de comportamento da sidebar/sessões, controles de retenção ou indicadores, estado real e eventos de segurança), sem placeholder

### Requirement: O painel de logomarcas busca a imagem e armazena o caminho
O sistema SHALL exibir no painel "Identidade Visual & Logomarcas do Sistema" dois blocos — logo do header e logo da tela de login — cada um com área de upload de imagem (componente `UiUploadFiles` do kit) que, ao receber um arquivo, grava o caminho da imagem (`/uploads/logomarcas/<nome>`) no campo de caminho **desabilitado sempre que o valor vier do servidor** (seleção de arquivo ou configuração hidratada no carregamento da página); o campo permanece editável apenas quando vazio, para o caminho informado manualmente — e um badge de status que distingue logo personalizada de marca padrão.

#### Scenario: Upload armazena o caminho
- **WHEN** o usuário envia uma imagem na área de upload do bloco
- **THEN** o campo "Caminho da imagem" recebe o caminho do arquivo enviado e fica desabilitado (não editável à mão), a caixa de upload exibe a prévia e o badge do card passa a "Personalizada"

#### Scenario: Logo salva recarrega com o campo desabilitado
- **WHEN** a página carrega com uma logo já salva no banco
- **THEN** o campo "Caminho da imagem" exibe o caminho salvo desabilitado e o badge do card aparece como "Personalizada"

#### Scenario: Limpar volta ao padrão
- **WHEN** o usuário remove o arquivo na área de upload (campo preenchido pelo upload) ou apaga manualmente o valor de um campo editável (preenchido à mão)
- **THEN** o caminho do bloco fica vazio, o badge do card volta a "Marca padrão" e o campo volta a ficar habilitado

#### Scenario: Campo vazio permanece editável
- **WHEN** nenhum arquivo foi selecionado no bloco (campo de caminho vazio)
- **THEN** o campo "Caminho da imagem" está habilitado e o usuário pode digitá-lo manualmente

#### Scenario: Logo do header escolhida reflete no shell
- **WHEN** o usuário envia uma imagem (ou informa um caminho) no bloco "Logo do Header / Barra Superior"
- **THEN** o `AppHeader` do shell passa a exibir aquela imagem no lugar do ícone com o nome "Publications"

#### Scenario: Limpar a logo do header restaura a marca padrão no shell
- **WHEN** o usuário remove o arquivo (ou limpa o campo enquanto editável) no bloco do header
- **THEN** o `AppHeader` volta a exibir o ícone com o nome "Publications"

#### Scenario: A logo do header escolhida sobrevive à troca de aba
- **WHEN** o usuário seleciona uma logo do header, troca de aba e retorna a "Logomarcas & Identidade"
- **THEN** o card do header continua com a prévia da imagem, o campo desabilitado com o caminho e o badge "Personalizada"

### Requirement: O painel de sidebar controla a barra lateral por seleção única e as sessões por presets com escolha múltipla
O sistema SHALL exibir no painel "Preferências Iniciais da Barra Lateral (Sidebar) & Sessões do Menu" dois containers empilhados em coluna única, cada um com seu conteúdo em duas colunas: (a) comportamento da barra lateral em seleção única (expandida/recolhida, iniciando expandida) e (b) comportamento das sessões do menu com os presets globais "Todas as Sessões Abertas" e "Todas as Sessões Recolhidas" mais um cartão por sessão (Publicações, Movimentos, Cadastros, Administração) em seleção múltipla — valendo as duas preferências também para a sidebar real do shell, em tempo real.

#### Scenario: Barra lateral em seleção única com opção não escolhida atenuada
- **WHEN** o usuário seleciona "Recolhida / Compacta por padrão"
- **THEN** "Expandida por padrão" fica desmarcada, "Recolhida" permanece marcada e a opção não escolhida é exibida atenuada (`opacity-60`), voltando à opacidade normal quando selecionada

#### Scenario: Comportamento da barra lateral vale para o shell
- **WHEN** o usuário marca "Recolhida / Compacta por padrão" (ou "Expandida por padrão")
- **THEN** a sidebar real do shell recolhe (ou expande) imediatamente e o toggle do header reflete o mesmo estado no cartão

#### Scenario: Preset aplica em todas as sessões
- **WHEN** o usuário marca o preset "Todas as Sessões Recolhidas / Acordeão"
- **THEN** todos os cartões de sessão da coluna individual ficam desmarcados e nenhuma sessão permanece aberta (e o preset "Todas as Sessões Abertas" faz o efeito inverso)

#### Scenario: Escolha por sessão é múltipla e desmarca presets em estado misto
- **WHEN** o usuário desmarcar "Cadastros" com todas as sessões abertas
- **THEN** "Cadastros" fica desmarcada, "Publicações", "Movimentos" e "Administração" permanecem marcadas e nenhum preset global fica marcado

#### Scenario: As sessões escolhidas refletem na sidebar real
- **WHEN** o usuário marca ou desmarca uma sessão individual, ou aplica um preset
- **THEN** a sidebar do shell (`AppSidebar`) expande ou recolhe aquelas sessões imediatamente

#### Scenario: Grupos independentes
- **WHEN** o usuário altera o comportamento da barra lateral
- **THEN** a configuração das sessões do menu permanece inalterada (e vice-versa)

### Requirement: Os cartões marcados da aba Sidebar exibem o estado visual do design system
O sistema SHALL exibir os cartões `UiCheckCard` do painel "Preferências Iniciais da Barra Lateral (Sidebar) & Sessões do Menu" com o estado marcado definido no design system (`docs/01 - design_system.md` §5.9: borda e fundo verdes do variant lime — `border-brand-accent` sobre `bg-lime-50/30` com anel da mesma cor), e não com o visual do variant slate, preservando seleção única/múltipla, badges e atenuação da opção não escolhida.

#### Scenario: Cartão marcado com borda e fundo do design system
- **WHEN** um cartão do painel de sidebar está marcado (ex.: "Expandida por padrão", um preset ou uma sessão aberta)
- **THEN** ele exibe borda e fundo verdes do estado ativo definido em `docs/01` §5.9, coerentes com o mesmo cartão selecionado na vitrine §11

#### Scenario: Cartão não marcado permanece neutro
- **WHEN** um cartão do painel de sidebar está desmarcado
- **THEN** ele mantém o visual neutro de superfície branca com borda clara (e a atenuação `opacity-60` já prevista para a opção não escolhida)

#### Scenario: O checkbox interno acompanha a variante lime
- **WHEN** um cartão do painel de sidebar é marcado
- **THEN** o checkbox interno usa a cor do variant lime do kit, alinhado ao estado visual do cartão

### Requirement: O painel de segurança exibe o estado real, o log de eventos e o rate limit
O sistema SHALL exibir no painel "Segurança de Rate Limits & Bloqueio Temporário de 15 Minutos" quatro blocos: (a) **indicadores** com as constantes trazidas do servidor — tentativas consecutivas até o bloqueio, janela do bloqueio em minutos, limite vigente de requisições por minuto e seu status —, sem valores fixos no cliente, e card de chave descrevendo a realidade (bloqueio por conta/e-mail; rate limit por IP); (b) **contas e bloqueios em estado de segurança** — contas com falhas consecutivas em andamento ou bloqueio vigente **e bloqueios de e-mail inexistente vigentes** (5 tentativas na janela, sem conta correspondente) — em `UiDataTable` com E-mail, Tentativas, Status ("Bloqueado até HH:mm (restam X min)" ou "Monitorando") e coluna Ações com o ícone "Liberar" (sem chrome de botão, com tooltip), cujo acionamento SHALL ser imediato via API própria — para conta, zera falhas e bloqueio; para bloqueio por e-mail, registra a liberação no log —, com toast de sucesso e recarga do bloco; (c) **eventos de login** — registro em tabela append-only das tentativas (incluindo as liberações de bloqueio por e-mail), exibido em `UiDataTable` somente leitura com quando, e-mail, IP, tipo (senha inválida, e-mail inexistente, bloqueio aplicado, tentativa com conta bloqueada e bloqueio liberado) e tentativas acumuladas, sem nenhuma ação de edição ou exclusão na interface; (d) **rate limit editável** — limite de requisições por minuto e status ativo como rascunho da página (gravados pelo Salvar global). O botão "Atualizar" SHALL recarregar o estado e os eventos via API sem alterar nada.

#### Scenario: Indicadores vêm do servidor
- **WHEN** a aba Segurança é aberta com o estado carregado
- **THEN** os números de tentativas e de minutos do bloqueio e o limite de requisições por minuto são os valores vigentes no servidor (ex.: 5, 15, 120), não textos fixos do cliente

#### Scenario: Conta bloqueada aparece com o status real
- **WHEN** existe conta com bloqueio vigente e a aba é carregada (ou "Atualizar" é acionado)
- **THEN** a linha da conta exibe o e-mail, as tentativas que causaram o bloqueio (5) e o status "Bloqueado até HH:mm (restam X min)"; contas apenas monitoradas (falhas sem bloqueio) exibem "Monitorando"

#### Scenario: Liberar destrava a conta de verdade
- **WHEN** o usuário aciona "Liberar" na linha de uma conta bloqueada e a API confirma
- **THEN** a conta volta a ter zero falhas e sem bloqueio — um novo login com a senha correta é aceito imediatamente — e a linha desaparece do bloco após a recarga, com toast de sucesso

#### Scenario: Bloqueio de e-mail inexistente aparece no bloco e é liberável
- **WHEN** um e-mail inexistente atinge 5 tentativas na janela (bloqueado) e a aba é carregada
- **THEN** uma linha daquele e-mail aparece no bloco de contas com o status "Bloqueado até HH:mm (restam X min)" e a ação "Liberar"; ao liberar, a liberação é registrada no log, a linha some da recarga e o e-mail precisa de 5 novas tentativas para bloquear novamente

#### Scenario: Cada falha de login gera um evento
- **WHEN** alguém tenta login com senha incorreta, com e-mail inexistente, consegue um bloqueio na 5ª falha ou tenta entrar numa conta já bloqueada (ou num e-mail inexistente já bloqueado)
- **THEN** um evento é registrado com data/hora, e-mail digitado, IP de origem, o tipo correspondente e as tentativas acumuladas (inclusive o contador da janela para e-mail inexistente) — o e-mail inexistente alimenta apenas o bloqueio próprio daquele e-mail (5 tentativas em 15 minutos, mesma recusa das contas), nunca o bloqueio de uma conta real

#### Scenario: O log é somente leitura
- **WHEN** o usuário observa o bloco de eventos
- **THEN** as linhas não oferecem edição, remoção ou qualquer ação — apenas a leitura — e os eventos permanecem mesmo após a conta ser liberada ou excluída

#### Scenario: Atualizar recarrega estado e eventos
- **WHEN** o usuário clica em "Atualizar"
- **THEN** o estado das contas e a lista de eventos são rebuscados da API e reexibidos, sem toast de demonstração

#### Scenario: Rate limit editável persiste pelo Salvar
- **WHEN** o usuário altera o limite por minuto (ou o status ativo), aciona "Salvar Alterações Globais" e recarrega a página
- **THEN** os novos valores aparecem gravados e passam a valer para o limitador de requisições (sem esperar o cache expirar)

### Requirement: O painel de retenção controla os dias por slider e atalhos com seleção única
O sistema SHALL exibir no painel "Política de Retenção & Expurgo de Logs de Auditoria" um controle de janela de retenção em dias (30 a 730) operado por slider e por atalhos de compliance (30, 60, 90, 180, 365, 730 dias), onde selecionar um valor por qualquer via mantém exatamente um valor vigente e sincroniza as duas vias.

#### Scenario: Valor padrão
- **WHEN** a aba de retenção é exibida pela primeira vez
- **THEN** o valor vigente é 180 dias, exibido como número grande no topo do card interno

#### Scenario: Mover o slider atualiza o valor e os atalhos
- **WHEN** o usuário move o slider para um valor que coincide com um atalho
- **THEN** o número grande passa a exibir o novo valor e aquele atalho aparece como selecionado

#### Scenario: Clicar em atalho move o slider
- **WHEN** o usuário clica no atalho "365 dias"
- **THEN** o slider passa a 365, o número grande exibe 365 e apenas "365 dias" está selecionado entre os atalhos

#### Scenario: Seleção única preservada
- **WHEN** o usuário clica no atalho já selecionado
- **THEN** ele permanece selecionado (nenhum atalho fica desmarcado)

### Requirement: Os textos derivados do valor de retenção atualizam-se com ele

O sistema SHALL derivar do valor vigente de retenção o subtítulo “Registros com mais de N dias são
removidos pela rotina de expurgo”, um resumo em linguagem natural da rotina e a query técnica
correspondente. O resumo SHALL explicar que os registros são removidos (não apenas marcados) e a
query SHALL ficar disponível em um detalhe técnico expansível/recolhido, sem expor SQL bruto como
texto principal do banner.

#### Scenario: Subtítulo dinâmico

- **WHEN** o valor vigente é 365
- **THEN** o subtítulo lê “Registros com mais de 365 dias são removidos pela rotina de expurgo”

#### Scenario: Resumo natural

- **WHEN** o painel de retenção é exibido
- **THEN** o banner apresenta a rotina em linguagem natural, sem exigir leitura de SQL para entendê-la

#### Scenario: Query dinâmica

- **WHEN** o valor vigente é 180 e o detalhe técnico é expandido
- **THEN** a query exibida contém `INTERVAL 180 DAY` e permanece recolhida por padrão

### Requirement: Salvar persiste as configurações via API
O sistema SHALL manter o botão "Salvar Alterações Globais" no cabeçalho da página (alinhado à direita, sem container), iniciando **desabilitado** e só habilitando quando qualquer painel altera seu estado; ao acioná-lo, SHALL enviar as configurações da tela (retenção, logomarcas, estado expandida/recolhida da sidebar, sessões do menu e o bloco de rate limit — limite de requisições por minuto e status ativo) a um `PUT /api/configuracoes`, exibir toast de sucesso e voltar a desabilitá-lo quando a gravação for confirmada; em caso de falha da API, SHALL exibir toast de erro e manter o botão habilitado, sem perder as alterações feitas. Após a confirmação da gravação, o estado/cache de configurações compartilhado com o shell SHALL ser **atualizado** para refletir os valores salvos, de modo que navegar para outra rota e reentrar na tela (sem recarregar o navegador) exiba os valores vigentes, não os anteriores. A ação **Liberar** do painel de segurança é ação imediata via API própria e NÃO participa deste rascunho nem habilita o botão.

#### Scenario: Botão inicia desabilitado
- **WHEN** a página é carregada sem nenhuma alteração
- **THEN** o botão "Salvar Alterações Globais" está desabilitado

#### Scenario: Qualquer alteração habilita o botão
- **WHEN** o usuário altera o valor de retenção, carrega ou edita uma logo, muda uma seleção da sidebar ou edita o limite de requisições por minuto/status do rate limit
- **THEN** o botão "Salvar Alterações Globais" fica habilitado

#### Scenario: Liberar não habilita o salvamento
- **WHEN** o usuário aciona "Liberar" em uma conta do painel de segurança e a API confirma
- **THEN** a conta é liberada na hora, um toast de sucesso é exibido e o botão "Salvar Alterações Globais" permanece no estado que estava (sem ser habilitado pela ação)

#### Scenario: Salvar confirma e volta a desabilitar
- **WHEN** o usuário clica em "Salvar Alterações Globais" após uma alteração e o servidor confirma a gravação
- **THEN** um toast de sucesso é exibido e o botão volta ao estado desabilitado

#### Scenario: Falha de gravação preserva as alterações
- **WHEN** o usuário clica em "Salvar Alterações Globais" e o `PUT /api/configuracoes` falha (ex.: banco indisponível)
- **THEN** um toast de erro é exibido, o botão permanece habilitado e os valores alterados continuam na tela

#### Scenario: Estado persiste entre recarregamentos
- **WHEN** a página é recarregada após alterar e salvar com sucesso
- **THEN** a retenção, as logomarcas, o estado expandida/recolhida da sidebar, as sessões do menu e os valores de rate limit exibem os valores gravados, não os padrões

#### Scenario: Reentrar na tela sem F5 mostra os valores salvos
- **WHEN** o usuário salva as configurações, navega para outro módulo e volta à tela de Configurações Globais sem recarregar o navegador
- **THEN** os painéis exibem os valores recém-salvos (o cache foi atualizado) e o shell reflete as preferências salvas

### Requirement: A página hidrata as configurações salvas via API
No carregamento da página, o sistema SHALL buscar a configuração vigente em `GET /api/configuracoes` e hidratar os painéis de logomarcas, sidebar (sessões **e** estado expandida/recolhida), retenção e rate limit com os valores retornados; enquanto o GET estiver em voo, a página SHALL exibir um estado de carregamento no lugar do card de abas (mesmo padrão da tela de Meu Perfil), sem renderizar os defaults por um instante. Quando não houver customização gravada (primeira execução) ou a chamada falhar, os painéis SHALL iniciar com os padrões do seed (retenção 180 dias, logomarcas vazias com marca padrão, sidebar expandida com todas as sessões abertas, rate limit com os valores da linha padrão), mantendo a tela utilizável.

#### Scenario: Carregamento exibe o estado de espera
- **WHEN** o usuário abre ou recarrega (F5) a página com o `GET /api/configuracoes` ainda em resposta
- **THEN** um componente de carregamento é exibido no lugar do card de abas e, quando a resposta chega, os painéis aparecem já hidratados — sem exibir os defaults do seed antes dos valores do servidor

#### Scenario: Hidratação a partir de valores salvos
- **WHEN** a página carrega com configuração já gravada (retenção 365, logo do header presente, sessão "Cadastros" recolhida)
- **THEN** o slider de retenção exibe 365, o bloco do header exibe a logo salva e a sessão "Cadastros" aparece desmarcada

#### Scenario: Sidebar salva como recolhida volta recolhida
- **WHEN** a página carrega com o estado expandida/recolhida salvo como recolhida
- **THEN** a sidebar do shell inicia recolhida e o cartão "Recolhida / Compacta por padrão" aparece marcado, sem que a largura da viewport sobrescreva o valor salvo

#### Scenario: Primeira execução usa os padrões do seed
- **WHEN** a página carrega sem customizações gravadas
- **THEN** a retenção inicia em 180 dias, os blocos de logo exibem "Marca padrão" com campo vazio, a sidebar inicia expandida com todas as sessões abertas e o rate limit exibe os valores da linha padrão

#### Scenario: Falha no carregamento não quebra a tela
- **WHEN** o `GET /api/configuracoes` falha (ex.: banco indisponível)
- **THEN** a página renderiza com os padrões do seed e o usuário pode continuar tentando salvar

### Requirement: Preferências salvas valem para todo o shell administrativo
O sistema SHALL aplicar as configurações globais salvas (logomarcas do header e do login, estado
expandida/recolhida da sidebar e sessões do menu) ao shell da Área Administrativa em qualquer rota,
não apenas na página de Configurações Globais — inclusive após recarregar o navegador em outra rota
— sem que a hidratação habilite o botão "Salvar" da página de configurações. A leitura das
preferências do shell SHALL estar disponível a **qualquer perfil administrativo**, exigindo apenas
sessão válida e **não** a permissão de módulo `configuracoes-globais/visualizar` — a identidade e a
navegação configuradas SHALL valer para todos os usuários da Área Administrativa, não apenas para o
Administrador.

#### Scenario: Recarregar em outra rota mantém as preferências
- **WHEN** o usuário recarrega o navegador em qualquer rota `/admin` com preferências salvas (sidebar recolhida, logo do header presente)
- **THEN** o header exibe a logo salva e a sidebar inicia recolhida, sem precisar visitar a página de Configurações Globais

#### Scenario: Preferências valem para perfis não-Administrador
- **WHEN** um usuário sem a permissão `configuracoes-globais/visualizar` (ex.: Editor) abre qualquer rota `/admin`
- **THEN** o shell aplica a logomarca e a navegação (sidebar/sessões) conforme as preferências salvas, sem cair nos defaults por falta de permissão de módulo

#### Scenario: Hidratação não conta como alteração
- **WHEN** a página de Configurações Globais carrega e aplica os valores do servidor
- **THEN** o botão "Salvar Alterações Globais" permanece desabilitado até que o usuário altere algo

### Requirement: A gravação das configurações é atômica
O sistema SHALL gravar a atualização das configurações de forma atômica entre as tabelas envolvidas
(`configuracoes_globais` e `configuracoes_limite_requisicao`): se qualquer escrita falhar, nenhuma
alteração SHALL persistir e o cliente SHALL receber erro, sem estado parcial gravado.

#### Scenario: Falha parcial não deixa estado inconsistente
- **WHEN** um `PUT /api/configuracoes` altera as duas superfícies e a gravação de uma delas falha
- **THEN** nenhuma configuração muda (rollback) e a API responde com erro, mantendo os valores anteriores

### Requirement: A política de retenção de auditoria é aplicada automaticamente
O sistema SHALL aplicar a política de retenção de forma automática: registros de auditoria mais
antigos que `dias_retencao_auditoria` SHALL ser expurgados por uma rotina agendada no banco de
dados (um evento do MariaDB executado diariamente às 03:00), de modo que a trilha não cresça
além da janela configurada — sem exigir ação do operador.

#### Scenario: Registros fora da janela são expurgados
- **WHEN** existem registros de auditoria mais antigos que o número de dias configurado e o evento agendado executa
- **THEN** esses registros são removidos e a trilha mantém apenas os dentro da janela

#### Scenario: A janela acompanha a configuração
- **WHEN** o valor de `dias_retencao_auditoria` é alterado nas Configurações Globais
- **THEN** o expurgo seguinte passa a usar o novo valor

### Requirement: A liberação de bloqueio é idempotente
A ação de liberar o bloqueio de uma conta (`POST /api/seguranca/liberar` com `usuarioId`) SHALL
responder sucesso (`200`) quando a conta existe, independentemente de a conta estar com falhas ou
bloqueio vigente — inclusive quando a conta já está limpa (zero falhas e sem bloqueio) —, e SHALL
responder `404` somente quando a conta não existe. Liberações repetidas ou concorrentes da mesma
conta não SHALL gerar erro nem mensagem de "não encontrado".

#### Scenario: Liberar conta já limpa responde sucesso
- **WHEN** a conta existe e já está sem falhas e sem bloqueio (ex.: dupla liberação ou liberação concorrente)
- **THEN** a API responde `200` (`{ ok: true }`), não `404`

#### Scenario: Liberar conta inexistente responde 404
- **WHEN** o `usuarioId` não corresponde a nenhuma conta cadastrada
- **THEN** a API responde `404` com mensagem de usuário não encontrado

### Requirement: As mensagens de erro não expõem detalhe de infraestrutura
As mensagens de falha exibidas ao usuário em Configurações Globais SHALL ser genéricas, sem revelar detalhe de infraestrutura (ex.: "Verifique a conexão com o banco").

#### Scenario: Falha de gravação sem detalhe interno
- **WHEN** salvar as configurações falha
- **THEN** o toast informa apenas que não foi possível salvar, sem citar banco

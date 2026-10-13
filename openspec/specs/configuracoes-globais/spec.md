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
O sistema SHALL exibir a página como um conjunto de quatro abas — "Logomarcas & Identidade", "Sidebar & Sessões do Menu", "Retenção de Auditoria" e "Segurança & Rate Limits (30 Min)" — com "Logomarcas & Identidade" selecionada ao carregar a página.

#### Scenario: Aba padrão
- **WHEN** a página carrega
- **THEN** "Logomarcas & Identidade" está marcada como aba ativa e seu painel é exibido

#### Scenario: Troca de aba
- **WHEN** o usuário seleciona outra aba
- **THEN** o painel correspondente é exibido e a aba selecionada fica com a pill ativa

#### Scenario: Cada aba exibe seu painel
- **WHEN** o usuário seleciona "Logomarcas & Identidade", "Sidebar & Sessões do Menu" ou "Segurança & Rate Limits (30 Min)"
- **THEN** o painel correspondente é exibido com seus próprios controles (áreas de upload de logo com campo de caminho, opções de comportamento da sidebar/sessões ou indicadores e registros de rate limits), sem placeholder

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

### Requirement: O painel de segurança exibe indicadores e gere registros de rate limit em memória
O sistema SHALL exibir no painel "Segurança de Rate Limits & Bloqueio Temporário de 30 Minutos" os indicadores fixos (5 tentativas consecutivas, 30 minutos de bloqueio, chave de rastreio), a contagem de registros ativos da tabela `seguranca_rate_limits` e as ações "Liberar" por linha (remove) e "Atualizar" (feedback), operando sobre lista em memória exibida no componente padrão `UiDataTable` do kit, com coluna "Ações" contendo apenas o ícone "Liberar" com tooltip (sem chrome de botão).

#### Scenario: Liberar remove a linha
- **WHEN** o usuário clica no ícone "Liberar" (sem moldura de botão, com tooltip) na coluna Ações da linha de um registro
- **THEN** aquela linha é removida e a contagem é atualizada

#### Scenario: Atualizar confirma sem alterar a lista
- **WHEN** o usuário clica em "Atualizar"
- **THEN** um toast de confirmação é exibido e os registros permanecem os mesmos

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
O sistema SHALL derivar do valor vigente de retenção o subtítulo "Registros com mais de N dias são marcados para expurgo" e a query de expurgo exibida no banner informativo, sem valores fixos.

#### Scenario: Subtítulo dinâmico
- **WHEN** o valor vigente é 365
- **THEN** o subtítulo lê "Registros com mais de 365 dias são marcados para expurgo"

#### Scenario: Query dinâmica
- **WHEN** o valor vigente é 180
- **THEN** o banner "Rotina de Expurgo Automático" exibe `INTERVAL 180 DAY` na query

### Requirement: Salvar persiste as configurações via API
O sistema SHALL manter o botão "Salvar Alterações Globais" no cabeçalho da página (alinhado à direita, sem container), iniciando **desabilitado** e só habilitando quando qualquer painel altera seu estado; ao acioná-lo, SHALL enviar as configurações da tela (retenção, logomarcas, estado expandida/recolhida da sidebar e sessões do menu) a um `PUT /api/configuracoes`, exibir toast de sucesso e voltar a desabilitá-lo quando a gravação for confirmada; em caso de falha da API, SHALL exibir toast de erro e manter o botão habilitado, sem perder as alterações feitas.

#### Scenario: Botão inicia desabilitado
- **WHEN** a página é carregada sem nenhuma alteração
- **THEN** o botão "Salvar Alterações Globais" está desabilitado

#### Scenario: Qualquer alteração habilita o botão
- **WHEN** o usuário altera o valor de retenção, carrega ou edita uma logo, muda uma seleção da sidebar ou remove um registro de rate limit
- **THEN** o botão "Salvar Alterações Globais" fica habilitado

#### Scenario: Salvar confirma e volta a desabilitar
- **WHEN** o usuário clica em "Salvar Alterações Globais" após uma alteração e o servidor confirma a gravação
- **THEN** um toast de sucesso é exibido e o botão volta ao estado desabilitado

#### Scenario: Falha de gravação preserva as alterações
- **WHEN** o usuário clica em "Salvar Alterações Globais" e o `PUT /api/configuracoes` falha (ex.: banco indisponível)
- **THEN** um toast de erro é exibido, o botão permanece habilitado e os valores alterados continuam na tela

#### Scenario: Estado persiste entre recarregamentos
- **WHEN** a página é recarregada após alterar e salvar com sucesso
- **THEN** a retenção, as logomarcas, o estado expandida/recolhida da sidebar e as sessões do menu exibem os valores gravados, não os padrões

### Requirement: A página hidrata as configurações salvas via API
No carregamento da página, o sistema SHALL buscar a configuração vigente em `GET /api/configuracoes` e hidratar os painéis de logomarcas, sidebar (sessões **e** estado expandida/recolhida) e retenção com os valores retornados; quando não houver customização gravada (primeira execução) ou a chamada falhar, os painéis SHALL iniciar com os padrões do seed (retenção 180 dias, logomarcas vazias com marca padrão, sidebar expandida com todas as sessões abertas), mantendo a tela utilizável.

#### Scenario: Hidratação a partir de valores salvos
- **WHEN** a página carrega com configuração já gravada (retenção 365, logo do header presente, sessão "Cadastros" recolhida)
- **THEN** o slider de retenção exibe 365, o bloco do header exibe a logo salva e a sessão "Cadastros" aparece desmarcada

#### Scenario: Sidebar salva como recolhida volta recolhida
- **WHEN** a página carrega com o estado expandida/recolhida salvo como recolhida
- **THEN** a sidebar do shell inicia recolhida e o cartão "Recolhida / Compacta por padrão" aparece marcado, sem que a largura da viewport sobrescreva o valor salvo

#### Scenario: Primeira execução usa os padrões do seed
- **WHEN** a página carrega sem customizações gravadas
- **THEN** a retenção inicia em 180 dias, os blocos de logo exibem "Marca padrão" com campo vazio e a sidebar inicia expandida com todas as sessões abertas

#### Scenario: Falha no carregamento não quebra a tela
- **WHEN** o `GET /api/configuracoes` falha (ex.: banco indisponível)
- **THEN** a página renderiza com os padrões do seed e o usuário pode continuar tentando salvar

### Requirement: Preferências salvas valem para todo o shell administrativo
O sistema SHALL aplicar as configurações globais salvas (logomarcas do header e do login, estado expandida/recolhida da sidebar e sessões do menu) ao shell da Área Administrativa em qualquer rota, não apenas na página de Configurações Globais — inclusive após recarregar o navegador em outra rota — sem que a hidratação habilite o botão "Salvar" da página de configurações.

#### Scenario: Recarregar em outra rota mantém as preferências
- **WHEN** o usuário recarrega o navegador em qualquer rota `/admin` com preferências salvas (sidebar recolhida, logo do header presente)
- **THEN** o header exibe a logo salva e a sidebar inicia recolhida, sem precisar visitar a página de Configurações Globais

#### Scenario: Hidratação não conta como alteração
- **WHEN** a página de Configurações Globais carrega e aplica os valores do servidor
- **THEN** o botão "Salvar Alterações Globais" permanece desabilitado até que o usuário altere algo

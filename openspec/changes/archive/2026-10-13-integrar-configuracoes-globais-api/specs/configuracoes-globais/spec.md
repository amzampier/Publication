# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Preferências salvas valem para todo o shell administrativo
O sistema SHALL aplicar as configurações globais salvas (logomarcas do header e do login, estado expandida/recolhida da sidebar e sessões do menu) ao shell da Área Administrativa em qualquer rota, não apenas na página de Configurações Globais — inclusive após recarregar o navegador em outra rota — sem que a hidratação habilite o botão "Salvar" da página de configurações.

#### Scenario: Recarregar em outra rota mantém as preferências
- **WHEN** o usuário recarrega o navegador em qualquer rota `/admin` com preferências salvas (sidebar recolhida, logo do header presente)
- **THEN** o header exibe a logo salva e a sidebar inicia recolhida, sem precisar visitar a página de Configurações Globais

#### Scenario: Hidratação não conta como alteração
- **WHEN** a página de Configurações Globais carrega e aplica os valores do servidor
- **THEN** o botão "Salvar Alterações Globais" permanece desabilitado até que o usuário altere algo

## REMOVED Requirements

### Requirement: Salvar oferece feedback sem persistir nesta fase
**Reason**: A persistência apenas em memória é substituída por persistência real via API — o contrato "sem chamada de rede e sem persistência entre recargas" contradiz o novo comportamento desta fase.
**Migration**: Substituído pelo requirement "Salvar persiste as configurações via API" nesta mesma change; o botão, os painéis e os toasts permanecem, mas a gravação passa a durar entre recarregamentos.

## ADDED Requirements

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

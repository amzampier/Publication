# Spec Delta

## MODIFIED Requirements

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

### Requirement: Salvar persiste as configurações via API
O sistema SHALL manter o botão "Salvar Alterações Globais" no cabeçalho da página (alinhado à direita, sem container), iniciando **desabilitado** e só habilitando quando qualquer painel altera seu estado; ao acioná-lo, SHALL enviar as configurações da tela (retenção, logomarcas, estado expandida/recolhida da sidebar, sessões do menu e o bloco de rate limit — limite de requisições por minuto e status ativo) a um `PUT /api/configuracoes`, exibir toast de sucesso e voltar a desabilitá-lo quando a gravação for confirmada; em caso de falha da API, SHALL exibir toast de erro e manter o botão habilitado, sem perder as alterações feitas. A ação **Liberar** do painel de segurança é ação imediata via API própria e NÃO participa deste rascunho nem habilita o botão.

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

## ADDED Requirements

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

## REMOVED Requirements

### Requirement: O painel de segurança exibe indicadores e gere registros de rate limit em memória
**Reason**: O requirement descrevia a fase 1 (lista em memória sobre uma tabela `seguranca_rate_limits` inexistente, constantes fixas de "30 Minutos" e ações de demonstração); ele é substituído pelo requirement ADDED "O painel de segurança exibe o estado real, o log de eventos e o rate limit", ancorado no lockout real (`usuarios`), no rate limit real (`configuracoes_limite_requisicao`) e no novo log de eventos de login.
**Migration**: Ler o requirement ADDED "O painel de segurança exibe o estado real, o log de eventos e o rate limit" desta mesma delta — os blocos da aba passam a ser indicadores do servidor, contas em estado de segurança com Liberar imediato, log de eventos somente leitura e rate limit editável; os cenários de "Liberar remove a linha" e "Atualizar confirma sem alterar a lista" são substituídos pelos cenários de liberação real e de recarga por Atualizar.

# Spec Delta

## MODIFIED Requirements

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
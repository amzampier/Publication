# Spec Delta

## MODIFIED Requirements

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

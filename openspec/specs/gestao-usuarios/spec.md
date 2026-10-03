# Gestão de Usuários Specification

## Purpose

Definir o comportamento da página principal de Gestão de Usuários — listagem em memória (fase 1) com KPIs, tabela paginada com badges, exportação CSV/PDF e ações de cadastro/edição/filtros sinalizadas como pendentes para a fase dos modais — para que a Área Administrativa administre usuários conforme o modelo `usuarios`/`perfis` descrito no `docs/02`.

## Requirements

### Requirement: A página de gestão de usuários existe em /admin/gestao-usuarios dentro do shell administrativo
O sistema SHALL servir a Gestão de Usuários em `/admin/gestao-usuarios`, renderizada com o shell da Área Administrativa (header + sidebar), exibindo o título "Gestão de Usuários" com a identidade do módulo (tile do ícone `Users` na cor `#b070ef`).

#### Scenario: Rota renderiza com shell
- **WHEN** o visitante abre `/admin/gestao-usuarios`
- **THEN** a página exibe o header e a sidebar da Área Administrativa e, na área de conteúdo, o título "Gestão de Usuários" com o tile do ícone na cor do módulo

#### Scenario: Acesso direto por URL
- **WHEN** a rota é carregada diretamente pela URL (recarga)
- **THEN** a página renderiza com os usuários de demonstração e sem erro

### Requirement: Os atalhos de navegação apontam para a página
O sistema SHALL declarar a rota `/admin/gestao-usuarios` no item "Gestão de Usuários" da sidebar e no mesmo item do menu da conta, de modo que ambos naveguem para a página e o item da sidebar correspondente apareça como ativo.

#### Scenario: Item da sidebar navega e fica ativo
- **WHEN** o usuário clica em "Administração > Gestão de Usuários" na sidebar
- **THEN** o navegador navega para `/admin/gestao-usuarios` e aquele item aparece como ativo

#### Scenario: Item do menu da conta navega
- **WHEN** o usuário clica em "Gestão de Usuários" no menu da conta
- **THEN** o navegador navega para `/admin/gestao-usuarios`

### Requirement: Os KPIs derivam do conjunto de usuários vigente
O sistema SHALL exibir no topo da página os KPIs "Total de usuários" (contagem do conjunto vigente), "Ativos", "Inativos" e "Perfis distintos" (quantidade de perfis diferentes presentes no conjunto), recalculados sempre que o conjunto de usuários muda.

#### Scenario: Base completa
- **WHEN** a página é aberta sem nenhum filtro aplicado
- **THEN** os quatro KPIs refletem a base de demonstração (ex.: contagem total, quantidades de ativos e inativos e os perfis distintos presentes)

#### Scenario: Conjunto alterado recalcula os KPIs
- **WHEN** o conjunto de usuários exibido muda (por filtro do módulo)
- **THEN** "Total de usuários", "Ativos", "Inativos" e "Perfis distintos" passam a considerar apenas esse conjunto

### Requirement: A tabela lista os usuários com paginação, ordenação, busca e badges
O sistema SHALL exibir os usuários em `UiDataTable` com colunas Nome, E-mail, Perfil (badge), Status (badge) e Último acesso, com paginação, ordenação e busca textual do componente, badge de Status distinguível entre "Ativo" e "Inativo" e badge de Perfil distinguível por perfil — cabendo as seis colunas (cinco de dados + Ações) **sem rolagem horizontal** na área da tabela nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida), inclusive após trocar a quantidade de registros exibidos por página.

#### Scenario: Colunas e ordenação
- **WHEN** a página é aberta
- **THEN** a tabela mostra as colunas Nome, E-mail, Perfil, Status e Último acesso, com paginação funcionando

#### Scenario: Badges de perfil e status
- **WHEN** usuários com perfis e status diferentes são exibidos
- **THEN** cada perfil e cada status aparecem com badge própria, visualmente distinguíveis (Ativo em destaque positivo, Inativo em tom neutro)

#### Scenario: Busca textual
- **WHEN** o usuário digita texto na busca da tabela
- **THEN** apenas os usuários que contêm o texto permanecem listados

#### Scenario: Usuário sem acesso registrado
- **WHEN** um usuário de demonstração nunca acessou o sistema
- **THEN** a coluna "Último acesso" exibe "-" (hífen) naquela linha

#### Scenario: Trocar a quantidade de linhas não abre rolagem horizontal
- **WHEN** o usuário altera "Linhas por página" (ex.: de 5 para 20 ou 50) numa janela ≥ ~1280px com sidebar expandida
- **THEN** a área da tabela ganha linhas sem exibir barra de rolagem horizontal, com as seis colunas visíveis

### Requirement: As ações da fase 1 que dependem de modal avisam que vêm na próxima etapa
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando o usuário aciona, nesta fase sem modais, o controle "Importar" da toolbar (ícone à esquerda do "Filtros", com tooltip "Importar Novos Usuários"), o botão "Novo Usuário" do cabeçalho, o botão "Filtros" e as ações de linha (enviar o convite, bloquear, editar, excluir) — nenhum `UiModal` é aberto por esses controles nesta fase.

#### Scenario: Novo Usuário
- **WHEN** o usuário clica em "Novo Usuário"
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Importar na toolbar
- **WHEN** o usuário passa o mouse sobre o ícone de importar à esquerda do botão "Filtros"
- **THEN** um tooltip exibe "Importar Novos Usuários" e, ao clicar, um toast informa que a funcionalidade estará disponível na próxima etapa sem abrir modal

#### Scenario: Filtros na toolbar
- **WHEN** o usuário clica no botão "Filtros" da tabela
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um usuário os controles de enviar o convite (ícone de e-mail confirmado), bloquear (cadeado), editar ou excluir (ícones reduzidos com cores semânticas, cada um com tooltip e `aria-label` próprios)
- **THEN** um toast informa que a funcionalidade estará disponível na próxima etapa e nenhum modal abre

### Requirement: A exportação gera arquivos sobre o conjunto de usuários vigente
O sistema SHALL oferecer no cabeçalho o menu "Relatórios" (posicionado à esquerda do botão "Novo Usuário") com as opções "Ficha Cadastral" (gera um PDF em folha retrato com uma ficha por página para cada usuário do conjunto vigente), "Relação Completa" (gera e baixa o relatório `usuarios.pdf` em folha paisagem sobre os mesmos usuários) e "Exportar em CSV" (download do conjunto vigente com cabeçalhos), com um divisor separando as opções em PDF do CSV, sem abrir o diálogo de impressão do navegador.

#### Scenario: Exportar em CSV
- **WHEN** o usuário escolhe "Exportar em CSV"
- **THEN** um arquivo CSV é baixado contendo o conjunto vigente de usuários, com linha de cabeçalho (Nome, E-mail, Perfil, Status, Último acesso)

#### Scenario: Relação Completa gera o relatório estruturado
- **WHEN** o usuário escolhe "Relação Completa"
- **THEN** o arquivo `usuarios.pdf` é baixado em folha paisagem com cabeçalho contendo a logo de login configurada (quando houver) à esquerda e o título "Relatório de Gestão de Usuários" à direita, as colunas Nome, E-mail, Perfil, Status e Último acesso com os usuários do conjunto, e paginação com a indicação da página

#### Scenario: Ficha Cadastral gera uma ficha por usuário
- **WHEN** o usuário escolhe "Ficha Cadastral"
- **THEN** o arquivo `ficha-cadastral.pdf` é baixado em folha retrato com uma página por usuário do conjunto, contendo identificador, nome, e-mail, perfil, status e último acesso, com a mesma identidade visual (logo, faixas navy e rodapé) dos demais relatórios

#### Scenario: Os relatórios são baixados sem diálogo de impressão
- **WHEN** qualquer das opções em PDF do menu "Relatórios" é acionada
- **THEN** `window.print()` não é chamado e o arquivo é salvo diretamente no dispositivo

### Requirement: A fase 1 opera sem persistência e sem chamadas de rede
O sistema SHALL manter os usuários, perfis e exportações inteiramente em memória, restaurando os dados de demonstração a cada recarga da página, sem requisições HTTP.

#### Scenario: Recarga restaura o estado inicial
- **WHEN** a página é recarregada
- **THEN** a base de usuários de demonstração aparece novamente, sem alterações preservadas

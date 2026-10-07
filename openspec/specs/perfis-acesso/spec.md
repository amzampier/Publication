# Perfis de Acesso (RBAC) Specification

## Purpose

Definir o comportamento da página principal de Perfis de Acesso (RBAC) — listagem em memória
(fase 1) com KPIs, tabela com a contagem de permissões e de usuários vinculados e ações
sinalizadas como pendentes para a fase dos modais —, declarando o `docs/07` como fonte normativa
da matriz de permissões, para que a Área Administrativa visualize e administre os perfis de
acesso conforme o modelo `perfis`/`perfil_permissoes` descrito no `docs/02` §3.5.

## Requirements

### Requirement: A página é servida em /admin/perfis-acesso com a identidade do módulo
O sistema SHALL servir a Perfis de Acesso (RBAC) em `/admin/perfis-acesso`, renderizada com o
shell da Área Administrativa (header + sidebar), exibindo o título "Perfis de Acesso (RBAC)" com
a identidade do módulo (tile do ícone `ShieldCheck` na cor `#f5b302`) e um subtítulo que descreve
a finalidade da tela (administração dos perfis e suas permissões).

#### Scenario: Renderização com o shell
- **WHEN** o navegador abre `/admin/perfis-acesso`
- **THEN** a página renderiza dentro do shell da Área Administrativa (header com as zonas
  canônicas e sidebar com a sessão Administração), com título "Perfis de Acesso (RBAC)" e tile
  `ShieldCheck` `#f5b302`

#### Scenario: Página fora do shell não se aplica
- **WHEN** qualquer rota sob `/admin/**` é renderizada
- **THEN** nenhuma marcação própria de shell é necessária — a página usa apenas o layout
  declarado (`admin`), como as demais telas administrativas

### Requirement: Os itens de navegação de perfis ganham rota e rótulo unificado
O sistema SHALL declarar a rota `/admin/perfis-acesso` no item "Perfis de Acesso (RBAC)" da
sidebar e no item homônimo do menu da conta (rótulo do conta unificado: era "Configuração de
Perfis (RBAC)"), de modo que ambos naveguem para a página, o menu da conta feche após a
navegação e o item da sidebar correspondente apareça como ativo na rota.

#### Scenario: Navegação pela sidebar
- **WHEN** o usuário clica em "Perfis de Acesso (RBAC)" na sessão Administração da sidebar
- **THEN** o navegador vai para `/admin/perfis-acesso` e aquele item aparece como ativo
  (`aria-current="page"`)

#### Scenario: Navegação pelo menu da conta
- **WHEN** o usuário abre o menu da conta e clica em "Perfis de Acesso (RBAC)"
- **THEN** o navegador vai para `/admin/perfis-acesso` e o menu é fechado, exibindo o mesmo
  rótulo do item homônimo da sidebar

#### Scenario: URL direta marca o item
- **WHEN** o usuário abre `/admin/perfis-acesso` diretamente pelo endereço
- **THEN** o item "Perfis de Acesso (RBAC)" da sidebar aparece como ativo

### Requirement: Os KPIs refletem o conjunto vigente de perfis
O sistema SHALL exibir no topo da página os KPIs "Total de perfis" (contagem do conjunto
vigente), "Ativos", "Inativos" e "Permissões concedidas" (`<soma das permissões verdadeiras>/<perfis × 99>`),
recalculados sempre que o conjunto de perfis muda.

#### Scenario: Base de demonstração
- **WHEN** a página é aberta com a base de demonstração (4 perfis, todos Ativos, matriz semeada)
- **THEN** os KPIs exibem Total de perfis 4, Ativos 4, Inativos 0 e Permissões concedidas
  171/396

#### Scenario: Recalculo após mudança do conjunto
- **WHEN** o conjunto vigente de perfis muda (criação, edição ou exclusão numa etapa futura)
- **THEN** os quatro KPIs são recalculados a partir do conjunto vigente

### Requirement: A listagem exibe perfis em UiDataTable com seis colunas
O sistema SHALL exibir os perfis em `UiDataTable` com colunas **Nome**, **Descrição**,
**Usuários** (contagem), **Permissões** (`n/99`), **Status** (badge) e **Ações**, com paginação,
ordenação e busca textual do componente, badge de Status distinguível entre "Ativo" e "Inativo"
— cabendo as seis colunas (cinco de dados + Ações) **sem rolagem horizontal** na área da tabela
nas larguras usuais de desktop (janela ≥ ~1280px com a sidebar expandida), inclusive após trocar
a quantidade de registros exibidos por página.

#### Scenario: Colunas e badges
- **WHEN** a tabela é renderizada com a base de demonstração
- **THEN** as seis colunas aparecem na ordem Nome, Descrição, Usuários, Permissões, Status,
  Ações, com badge de Status distinguível entre Ativo e Inativo

#### Scenario: Sem rolagem horizontal
- **WHEN** a janela está em ~1280px ou mais com a sidebar expandida, inclusive após mudar a
  página da tabela
- **THEN** a área da tabela não apresenta rolagem horizontal

#### Scenario: Busca textual
- **WHEN** o usuário digita no campo de busca da tabela
- **THEN** apenas os perfis correspondentes são exibidos na tabela, sem alterar o conjunto
  vigente nem os KPIs (a busca é visual, recurso do componente)

### Requirement: As contagens de permissões e de usuários são derivadas, nunca digitadas
O sistema SHALL derivar a coluna **Permissões** de uma matriz de permissões semeada em memória
(4 perfis × 11 módulos × 9 ações — as 4 ações fixas `visualizar`, `criar`, `alterar`, `excluir`
mais os 5 `permissoes_extras` `publicar`, `arquivar`, `download`, `exportar`, `importar`
descritos no `docs/02` §3.5), exibindo `99/99` para Administrador, `45/99` para Editor,
`21/99` para Revisor e `6/99` para Leitor; e SHALL derivar a coluna **Usuários** da base de
usuários vigente (`useUsuariosDemo`), exibindo 2, 5, 4 e 5 respectivamente. Nenhuma das duas
contagens pode ser um valor digitado ou fixado no template.

#### Scenario: Contagens derivadas da matriz e da base de usuários
- **WHEN** a tabela é renderizada com a base de demonstração
- **THEN** a coluna Permissões exibe 99/99, 45/99, 21/99 e 6/99 e a coluna Usuários exibe
  2, 5, 4 e 5 para Administrador, Editor, Revisor e Leitor

#### Scenario: Acompanha a base de usuários
- **WHEN** a base de usuários muda por navegação interna (ex.: usuário excluído em
  `/admin/gestao-usuarios`)
- **THEN** a contagem da coluna Usuários e os KPIs derivados passam a refletir a base atual,
  sem recarregar a página

### Requirement: As ações da fase 1 avisam por toast e não abrem modal
O sistema SHALL exibir toast informativo ("funcionalidade disponível na próxima etapa") quando
o usuário aciona o botão "Novo Perfil" do cabeçalho ou as ações de linha **Editar**, **Excluir**
e **Permissões** (ícone `KeyRound`), permanecendo **nenhum `UiModal` aberto** por esses
controles — os modais de cadastro/edição, de exclusão, de filtros e de permissões pertencem à
fase 2.

#### Scenario: Novo Perfil
- **WHEN** o usuário clica em "Novo Perfil"
- **THEN** um toast informativo de "próxima etapa" é exibido e nenhum modal é aberto

#### Scenario: Ações de linha
- **WHEN** o usuário aciona na linha de um perfil os controles de Editar (`Pencil`), Excluir
  (`Trash2`) ou Permissões (`KeyRound`), cada um com tooltip e `aria-label` próprios
- **THEN** um toast informativo de "próxima etapa" é exibido e nenhum modal é aberto

### Requirement: A base de perfis vive em memória e se restaura na recarga
O sistema SHALL manter os perfis e suas permissões inteiramente em memória (`useState`),
restaurando os 4 perfis de demonstração com a matriz semeada a cada recarga da página, sem
nenhuma requisição de dados (API).

#### Scenario: Recarga restaura a base
- **WHEN** a página é recarregada
- **THEN** os 4 perfis de demonstração e as contagens 99/99, 45/99, 21/99 e 6/99 voltam a ser
  exibidos, sem nenhuma chamada de dados (API)

### Requirement: O docs/07 é a fonte normativa da matriz de permissões
O sistema SHALL manter o documento `docs/07 - Perfis de Acesso (RBAC).md` documentando a
página (rota, componentes e comportamento) e a **matriz de permissões normativa** — 4 perfis ×
11 módulos da sidebar × 9 ações — com exatamente as mesmas contagens exibidas na tela, e
declarando-se a fonte que o modal de permissões da fase 2 SHALL implementar.

#### Scenario: Consistência documento ↔ tela
- **WHEN** o `docs/07` e a página são comparados
- **THEN** as regras por perfil do documento produzem as mesmas contagens da tabela
  (99/99, 45/99, 21/99, 6/99) e do KPI de Permissões concedidas (171/396)

#### Scenario: Escopo do modal futuro declarado
- **WHEN** o `docs/07` é lido
- **THEN** ele identifica a matriz como fonte normativa para o modal de permissões por perfil
  da fase 2 e documenta os gatilhos da fase 1 como pendência de modal

# Spec Delta

## Purpose

Definir o contrato do sistema de feedback por toast do design system (`UiToastContainer` + `useToast()`): disponibilidade do container em qualquer rota, região viva de acessibilidade, variantes, auto-dismiss e persistência — para que código, documentação (`docs/01` §4.5/§4.6) e validação de QA observem o mesmo comportamento de confirmação.

## ADDED Requirements

### Requirement: O container de toasts fica montado globalmente e está disponível em qualquer rota
O sistema SHALL renderizar o container de toasts globalmente, de modo que um toast disparado por `useToast()` seja exibido em **todas** as rotas — Área Pública (`/`), Área Administrativa (`/admin/**`) e a vitrine `/design` (que usa `layout: false`) — sem qualquer configuração própria da página, aparecendo no canto superior direito da tela.

#### Scenario: Confirmar em Configurações Globais sem navegar
- **WHEN** o usuário clica em "Salvar Alterações Globais" em `/admin/configuracoes-globais`
- **THEN** um toast de sucesso é exibido no canto superior direito, sem mudança de rota

#### Scenario: Feedback na aba Segurança
- **WHEN** o usuário clica em "Atualizar" no painel "Segurança & Rate Limits"
- **THEN** um toast de confirmação é exibido no canto superior direito

#### Scenario: Demonstração da vitrine funciona
- **WHEN** o usuário aciona um dos botões "Disparar Success/Warning/Danger/Info" na seção 8 do `/design`
- **THEN** o toast correspondente é exibido no canto superior direito da mesma tela

#### Scenario: Rota pública também exibe toasts
- **WHEN** um toast é disparado em uma rota da Área Pública (`/`)
- **THEN** o container existe na página e o toast é exibido, ainda que a rota não tenha header nem sidebar administrativos

#### Scenario: Múltiplos toasts empilham sem sobrepor
- **WHEN** há mais de um toast ativo ao mesmo tempo
- **THEN** eles são empilhados verticalmente no canto superior direito, sem se sobrepor

### Requirement: A notificação é anunciada por leitores de tela
O sistema SHALL expor o container de toasts como região viva com `role="status"` e `aria-live="polite"`, presente no HTML de qualquer rota renderizada, de modo que o conteúdo anunciado seja perceptível sem depender da visão do balão.

#### Scenario: Região viva presente no HTML
- **WHEN** qualquer rota da aplicação é renderizada
- **THEN** o HTML da página contém o elemento de notificação com `aria-live` (região viva montada)

#### Scenario: Conteúdo anunciado sem mover o foco
- **WHEN** um toast é adicionado à lista
- **THEN** seu título e mensagem são anunciados pelo leitor de tela com polidez (`polite`), sem roubar o foco do controle acionado

### Requirement: O sistema oferece as quatro variantes de toast
O sistema SHALL suportar exatamente as variantes `success`, `warning`, `danger` e `info` em `useToast()`, cada uma com a identidade visual semântica própria (fundo, borda, ícone e barra de progresso na cor correspondente) definida no kit.

#### Scenario: Disparo por variante
- **WHEN** o consumidor chama `toast.success`, `toast.warning`, `toast.danger` ou `toast.info`
- **THEN** o toast exibido usa a identidade visual da variante correspondente, com título e mensagem informados

#### Scenario: API inalterada
- **WHEN** qualquer módulo chama `useToast()`
- **THEN** o retorno oferece `toast.success | warning | danger | info(title, message?, duration?)` e `remove(id)`, sem mudança em relação ao comportamento atual

### Requirement: O toast se auto-remove após a duração padrão com barra de progresso
O sistema SHALL remover automaticamente um toast cuja `duration` não seja informada (padrão **5000 ms**), exibindo durante a permanência uma barra de progresso de 2,5 px que decrementa do início ao fim da janela.

#### Scenario: Auto-dismiss no padrão
- **WHEN** `toast.success('Título', 'Mensagem')` é chamado sem `duration`
- **THEN** o toast permanece visível por cerca de 5000 ms, com barra de progresso, e depois é removido

#### Scenario: Fechamento manual antecipado
- **WHEN** o usuário clica no botão de fechar de um toast antes do fim da duração
- **THEN** o toast é removido imediatamente e o respectivo timer é cancelado (sem reprocessamento posterior)

### Requirement: Duração menor ou igual a zero produz toast persistente
O sistema SHALL tratar `duration <= 0` como toast **persistente**: permanece na tela sem remoção automática e sem barra de progresso, até ser fechado pelo usuário.

#### Scenario: Toast persistente
- **WHEN** `toast.danger('Falha no Upload', 'Arquivo muito grande.', 0)` é chamado
- **THEN** o toast permanece visível indefinidamente, sem barra de progresso, até o clique em fechar

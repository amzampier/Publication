# Spec Delta

## MODIFIED Requirements

### Requirement: O painel de logomarcas busca a imagem e armazena o caminho
O sistema SHALL exibir no painel "Identidade Visual & Logomarcas do Sistema" dois blocos — logo do header e logo da tela de login — cada um com área de upload de imagem (componente `UiUploadFiles` do kit) que, ao receber um arquivo, grava o caminho da imagem (`/uploads/logomarcas/<nome>`) no campo de caminho **desabilitado enquanto o valor vier da seleção do arquivo** (o campo permanece editável apenas quando vazio, para o caminho informado manualmente) e um badge de status que distingue logo personalizada de marca padrão.

#### Scenario: Upload armazena o caminho
- **WHEN** o usuário envia uma imagem na área de upload do bloco
- **THEN** o campo "Caminho da imagem" recebe o caminho do arquivo enviado e fica desabilitado (não editável à mão), a caixa de upload exibe a prévia e o badge do card passa a "Personalizada"

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

# Spec Delta

## MODIFIED Requirements

### Requirement: Toda rota sob /admin/** é renderizada com o shell da Área Administrativa

O sistema SHALL renderizar qualquer rota futura criada sob a Área Administrativa com o mesmo shell,
**com exceção das telas de autenticação** (`/admin/login` e `/admin/esqueci-senha`, que renderizam
sem o shell com layout próprio — spec `login`), de modo que a adição de telas administrativas não
dependa de marcação ou estilos próprios por página.

#### Scenario: Tela inicial em /admin

- **WHEN** a tela inicial da Área Administrativa é servida em `/admin`
- **THEN** ela renderiza dentro do shell, exibindo o **Painel Executivo** na área de conteúdo

#### Scenario: Novas telas administrativas herdam o shell

- **WHEN** uma nova página é adicionada sob `/admin/`
- **THEN** ela renderiza com o mesmo header e sidebar, sem configuração visual adicional na página

#### Scenario: Páginas públicas não herdam o shell

- **WHEN** uma página fora de `/admin/**` é renderizada sem o layout administrativo declarado
- **THEN** ela não exibe header nem sidebar da Área Administrativa

#### Scenario: A tela de login fica fora do shell

- **WHEN** o visitante abre `/admin/login`
- **THEN** a página renderiza sem header nem sidebar da Área Administrativa, mantendo o layout
  próprio da tela de login

#### Scenario: A tela de esqueci a senha fica fora do shell

- **WHEN** o visitante abre `/admin/esqueci-senha`
- **THEN** a página renderiza sem header nem sidebar da Área Administrativa, mantendo o layout
  próprio das telas de autenticação

### Requirement: Itens de navegação podem declarar rota e os sem rota avisam que estão em construção

Os itens da sidebar e do menu do Account SHALL poder declarar uma rota opcional (`to`);
quando declarada, o clique do usuário navega para essa rota, e o item da sidebar correspondente
à rota corrente é exibido como ativo. O item raiz **Painel Executivo** SHALL declarar
`to: '/admin'` e navegar ao clique, deixando de emitir o aviso de módulo em construção. Itens da
sidebar **sem** rota declarada SHALL exibir, ao serem acionados, um `toast.info` com o rótulo do item
e a mensagem "Módulo em construção.", sem navegação — no menu do Account, **Meu Perfil** declara rota
(`/admin/meu-perfil`) e navega ao clique como os demais itens com rota, e "Encerrar Sessão" mantém seu
comportamento próprio (fecho de sessão) e fica fora deste aviso.

#### Scenario: Item com rota navega

- **WHEN** o usuário clica em "Configurações Globais" na sidebar ou no menu do Account
- **THEN** o navegador vai para `/admin/configuracoes-globais` e o menu do Account é fechado

#### Scenario: Item raiz navega para o Painel Executivo

- **WHEN** o usuário clica em "Painel Executivo" na sidebar
- **THEN** o navegador vai para `/admin`, o painel é exibido e nenhum toast de "Módulo em construção" é emitido

#### Scenario: Meu Perfil com rota navega

- **WHEN** o usuário clica em "Meu Perfil" no menu do Account
- **THEN** o navegador vai para `/admin/meu-perfil` e o menu do Account é fechado

#### Scenario: Item ativo acompanha a rota

- **WHEN** a rota corrente corresponde à rota declarada de um item da sidebar
- **THEN** aquele item é exibido como ativo (mesmo estilo do item selecionado hoje), com `aria-current="page"`

#### Scenario: Item sem rota da sidebar exibe aviso de construção

- **WHEN** o usuário clica em um item da sidebar sem rota declarada
- **THEN** um `toast.info` exibe o rótulo do item com a mensagem "Módulo em construção." e
  nenhuma navegação ocorre; o menu do Account não participa deste aviso

#### Scenario: Chegar por URL direta também marca o item

- **WHEN** o usuário abre `/admin` ou `/admin/configuracoes-globais` diretamente pelo endereço
- **THEN** o item correspondente da sidebar aparece como ativo

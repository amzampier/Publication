# Spec Delta

## MODIFIED Requirements

### Requirement: Toda rota sob /admin/** é renderizada com o shell da Área Administrativa
O sistema SHALL renderizar qualquer rota futura criada sob a Área Administrativa com o mesmo shell,
**com a única exceção de `/admin/login`** (a tela de autenticação, que renderiza sem o shell com
layout próprio — spec `login`), de modo que a adição de telas administrativas não dependa de
marcação ou estilos próprios por página.

#### Scenario: Tela inicial em /admin
- **WHEN** a tela inicial da Área Administrativa é servida em `/admin`
- **THEN** ela renderiza dentro do shell, exibindo o placeholder "Painel Executivo" na área de conteúdo

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

# Spec Delta: auditoria

## MODIFIED Requirements

### Requirement: A página carrega os registros pela API com carregamento no F5 e toast de erro
O sistema SHALL carregar os registros da trilha a partir de `GET /api/auditoria` na montagem da página `/admin/auditoria`, exibindo um overlay `UiLoading` (mensagem "Carregando auditoria…") enquanto a requisição estiver em voo — no mesmo padrão de Meu Perfil e Configurações Globais, sem renderizar conteúdo parcial — e um toast de erro caso a carga falhe, mantendo a tabela em estado vazio, **zerando também os KPIs, o total e as opções de filtro** (nenhum dado da carga anterior permanece) e **nunca** exibindo a base de demonstração antiga como se fosse persistida. A listagem SHALL ser **paginada no servidor**: a tabela opera em modo servidor, cada mudança de página/tamanho/ordenação/busca (com debounce) SHALL consultar a API, e a recarga da página SHALL rebuscar pela API. Os filtros estruturais SHALL permanecer em estado de sessão (preservados na navegação interna, descartados no F5).

#### Scenario: Carga inicial mostra os registros do banco
- **WHEN** o navegador abre `/admin/auditoria` com sessão válida
- **THEN** o overlay de carregamento é exibido enquanto `GET /api/auditoria` responde e, em seguida, a tabela exibe a primeira página dos registros **reais** persistidos (operações de escrita e eventos de autenticação registrados), ordenados do mais recente para o mais antigo; sem operações registradas, a tabela exibe o estado vazio

#### Scenario: Loading no F5 sem conteúdo parcial
- **WHEN** o usuário recarrega a página (F5) com o `GET /api/auditoria` em voo
- **THEN** apenas o overlay `UiLoading` com a mensagem "Carregando auditoria…" aparece na área de conteúdo — a tabela, os KPIs e os modais não são renderizados até a resposta

#### Scenario: Falha na carga exibe erro sem simular dados
- **WHEN** a requisição `GET /api/auditoria` falha (rede ou banco indisponível)
- **THEN** um toast de erro informa a falha de carregamento, a tabela fica vazia e os KPIs, o total e as opções de filtro são zerados, sem exibir dados da carga anterior nem a base de demonstração como se fosse persistida

#### Scenario: Paginar consulta o servidor
- **WHEN** o usuário muda de página, tamanho, ordenação ou digita na busca (com debounce)
- **THEN** a página corrente é rebuscada pela API (nenhum slicing local sobre uma página única)

#### Scenario: Recarga rebusca pela API e descarta os filtros
- **WHEN** a página é recarregada após aplicar filtros ou após operações de escrita em outros módulos
- **THEN** os filtros voltam ao estado vazio e o `GET /api/auditoria` devolve o conjunto atualizado do banco (o que foi gravado persiste; a demo antiga não retorna)

## ADDED Requirements

### Requirement: A trilha de auditoria nasce vazia em um banco recém-provisionado
O provisionamento do banco SHALL NOT inserir qualquer registro de demonstração na tabela `auditoria`: um banco recém-criado SHALL conter zero registros na trilha até que operações reais as gravem. Registros com identificadores de seed (`log-seed-%`) SHALL NOT existir, e uma migração de provisionamento SHALL remover esses resquícios de bancos já existentes sem excluir nenhum registro real (operações de escrita ou eventos de autenticação).

#### Scenario: Banco novo nasce sem registros de seed
- **WHEN** o servidor sobe contra um banco sem tabelas e todas as migrations são aplicadas
- **THEN** `SELECT COUNT(*) FROM auditoria` retorna `0` e nenhum registro `log-seed-%` existe; a primeira operação autenticada (o login, gravado como `Acesso`) é o único conteúdo da trilha

#### Scenario: Bancos existentes com seed são reconciliados
- **WHEN** um banco já provisionado contém registros `log-seed-%` e recebe as migrations pendentes
- **THEN** apenas esses registros de seed são removidos, e todos os registros reais da trilha permanecem intactos

#### Scenario: Operações reais continuam registrando
- **WHEN** uma rota administrativa de escrita ou um evento de autenticação é concluído com sucesso após a limpeza
- **THEN** a trilha recebe o registro correspondente, agora o único conteúdo da tabela

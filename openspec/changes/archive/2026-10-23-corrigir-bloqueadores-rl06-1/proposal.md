# Proposal

## Why

A auditoria RL06 reprovou a Área Administrativa com risco crítico: mídias de chamadas não publicadas são servidas anonimamente em `/uploads/chamadas/**` (C-01), e um perfil com `alterar` publica Release/Manual/Escopo enviando `status=Publicado` no `PUT` genérico, sem a permissão `publicar` (C-02). Antes de iniciar a Área Pública, é preciso fechar também as Altas da Etapa RL06-1: a recuperação de senha não revoga sessões (A-01), o Painel Executivo expõe dados de módulos sem RBAC (A-02), a criação de escopo não é atômica (A-03), o pool devolve `500 Queue limit reached` em concorrência moderada (A-04) e o arquivamento de um pai deixa filhas `Publicado` sem um gate de visibilidade explícito (A-05).

## What Changes

- **Mídias de chamadas deixam de ser estáticas públicas.** `uploads/chamadas/**` passa a ser servido por rota autenticada/autorizada, que libera a mídia para perfis com `lancar-chamadas/visualizar` e, para anônimos, somente quando a chamada está `Publicado` e ao menos um vínculo ativo aponta para conteúdo pai `Publicado` e não arquivado. Logomarcas, avatares e logos de parceiros continuam públicos.
- **Publicação passa a exigir `publicar` em qualquer caminho.** `POST`/`PUT` de Release Week, Manuais e Escopo de Projetos recusam a transição para `Publicado` sem a permissão `publicar`; o endpoint dedicado `/publicar` permanece o caminho canônico. Ao entrar em `Publicado`, o servidor grava `data_aprovacao`/`data_publicacao` e audita como “Homologação”; ao sair, limpa o carimbo de aprovação.
- **Recuperação de senha revoga sessões.** `POST /api/auth/esqueci-senha`, após o envio bem-sucedido do e-mail, grava a senha provisória e revoga todas as sessões (access e refresh) na mesma transação, como já ocorre na troca de senha e no convite.
- **Painel Executivo passa a respeitar o RBAC dos módulos que agrega.** KPIs, séries e dimensões de chamadas exigem `lancar-chamadas/visualizar`; cada aba de publicação exige `visualizar` do módulo correspondente; sem nenhum módulo permitido, a API responde `403`. Conteúdo não publicado não é exposto a quem não tem permissão editorial.
- **Criação de escopo fica atômica.** O `INSERT` de `projetos_escopo` e a reconciliação das filhas passam a ocorrer na mesma transação.
- **Painel Executivo deixa de derrubar o pool.** As consultas são consolidadas/reduzidas, o paralelismo por requisição é limitado, os limites do pool são configuráveis e a saturação da fila é traduzida em `503` com `Retry-After` em vez de `500`.
- **Visibilidade pública ganha um gate único e testável.** Um helper compartilhado de visibilidade (chamada `Publicado` + pai `Publicado` e `arquivada = 0` + `publicado_em`/data quando aplicável) é usado pelo servimento de mídias e preparado para as futuras APIs públicas; arquivar o pai não altera o status das filhas, mas passa a torná-las invisíveis de forma comprovada.

## Capabilities

### New Capabilities

_Nenhuma capability nova. A correção endurece contratos existentes._

### Modified Capabilities

- `uploads`: o servimento de `/uploads/**` deixa de ser integralmente público; `chamadas` passa a exigir autorização e visibilidade do conteúdo, mantendo públicos os destinos de identidade (logomarcas, avatares e logos).
- `lancar-chamadas`: as mídias da chamada só são acessíveis anonimamente quando a chamada e um vínculo pai estão publicados e não arquivados; a leitura administrativa continua disponível sob `visualizar`.
- `release-week`: a transição para `Publicado` via criação/edição exige `publicar`; `data_aprovacao` é gravada/limpa de forma coerente e a auditoria distingue homologação de alteração.
- `manuais-mensais`: a transição para `Publicado` via criação/edição exige `publicar`, preservando a data histórica e a auditoria correta.
- `escopo-projetos`: a transição para `Publicado` via criação/edição exige `publicar`, e a criação do escopo com cascata passa a ser atômica.
- `revogacao-sessao`: a recuperação de senha (`esqueci-senha`) passa a revogar todas as sessões vigentes.
- `painel-executivo`: o acesso e os blocos passam a respeitar o RBAC dos módulos agregados; a API responde `403` sem módulo permitido e `503` sob saturação de pool, sem `500` de fila.
- `autorizacao-rbac`: o catálogo passa a cobrir o servimento autorizado de mídias de chamadas e a autorização granular do Painel Executivo.

## Impact

- **APIs:** `GET /uploads/chamadas/**` (nova rota autorizada), `POST /api/auth/esqueci-senha`, `POST/PUT /api/release-week`, `POST/PUT /api/manuais`, `POST/PUT /api/escopo-projetos`, `GET /api/painel-executivo`.
- **Código:** `nuxt.config.ts` (publicAssets), `server/api/uploads`, `server/routes/uploads/chamadas/**` (nova), `server/utils/uploads.ts`, `server/utils/visibilidade-publica.ts` (novo), `server/utils/auth.ts`, `server/api/auth/esqueci-senha`, `server/utils/{release-week,manuais,escopo-projetos,publicacao-pais,painel-executivo}.ts`, rotas de `painel-executivo` e das escritas dos três módulos, formulários de edição (ocultar `Publicado` sem `publicar`).
- **Banco:** sem migration obrigatória; usa `entregas_itens.status`, `anexos_midias`, `release_week.arquivada`, `manuais_mensal.arquivada`, `projetos_escopo.arquivada` e `data_aprovacao`. Se o gate público exigir `publicado_em`, a coluna será adicionada em migration própria.
- **Testes:** novos testes de autorização de mídia, bypass de `publicar`, revogação no reset, RBAC do Painel, atomicidade do escopo, visibilidade de pai arquivado e saturação do pool.
- **Breaking change:** clientes que hoje consomem URLs de mídias de chamadas não publicadas diretamente deixam de receber `200`; mídias de chamadas publicadas e os destinos públicos de identidade permanecem acessíveis.
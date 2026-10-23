# Design

## Context

Ver `proposal.md — Why`. O estado atual relevante:

- `nuxt.config.ts` publica a pasta `uploads/` inteira em `/uploads/**` via `nitro.publicAssets`; não há middleware de sessão para rotas fora de `/api/**`.
- `POST /api/uploads` grava `chamadas/<ano>/<mes>/` e devolve URL pública; `anexos_midias` guarda a URL por `entrega_item_id`; a chamada tem `status` e vínculos `release_id`/`manual_id`/`projeto_id`.
- Os `PUT` genéricos de Release/Manual/Escopo exigem apenas `alterar` e aceitam `status` no corpo; `data_aprovacao` só é gravada pelo endpoint `/publicar` da Release.
- `POST /api/auth/esqueci-senha` grava a senha provisória fora do caminho da resposta, mas não revoga `sessoes` nem incrementa `token_version`.
- `GET /api/painel-executivo` exige apenas sessão e executa 12 consultas em `Promise.all`; a Esteira executa 12–14. O pool é 10/50 por padrão e o erro de fila vira `500`.
- `arquivarReleaseWeek/Manual/Escopo` só grava `arquivada = 1`; as filhas permanecem `Publicado`. A regra de visibilidade já existe em `publicacao-pais.ts` (`pai Publicado` e `arquivada = 0`), mas não há um gate reutilizável para leitura pública.

## Goals / Non-Goals

**Goals:**

- Fechar C-01, C-02 e A-01…A-05 com comportamento observável e testável.
- Manter o fluxo oficial de publicação (`/publicar`) e o histórico da esteira intactos.
- Preservar o contrato do Painel Executivo para quem tem todas as permissões, apenas mascarando blocos não autorizados.
- Não exigir migration de schema para as correções.
- Reduzir a chance de `500 Queue limit reached` sem mascarar erros reais de banco.

**Non-Goals:**

- Implementar a Área Pública ou suas APIs de listagem/detalhe.
- Corrigir os achados de RL06-2 (M-01…M-30, incluindo segunda-feira, filtro da Esteira, paginação de Chamadas e `publicado_em`).
- Alterar a matriz RBAC ou o catálogo de módulos; apenas cobrir as rotas novas/afetadas.
- Redesenhar o Painel Executivo, a Esteira ou os formulários.
- Mudar o contrato de upload de identidade (logomarcas/avatares/logos).

## Decisions

### D1 — Servir mídias de chamadas por rota própria, com dois níveis de acesso

**Decisão:** remover `uploads/chamadas` do `publicAssets` e criar `server/routes/uploads/chamadas/[...arquivo].get.ts`. O `publicAssets` passa a declarar apenas `logomarcas`, `avatares` e `logos`. A rota:

1. valida o caminho `AAAA/MM/arquivo` e resolve o arquivo dentro de `uploads/chamadas/` (sem traversal);
2. resolve a sessão; se houver sessão com `lancar-chamadas/visualizar`, serve o arquivo (pré-visualização administrativa);
3. sem sessão (ou sem a permissão), consulta `anexos_midias` + `entregas_itens` + os três pais e só serve se `e.status='Publicado'` e existir ao menos um pai `status='Publicado' AND arquivada=0`;
4. responde `404` quando o arquivo não existe ou não está visível, com `nosniff` e CSP de não execução; usa `Cache-Control: private` para o caminho administrativo e `public, max-age=3600` para o publicado.

**Por que não “mover o arquivo no publish”:** a publicação pode ser revertida, há múltiplos vínculos e o arquivo pode ser compartilhado; mover/copiar criaria inconsistência. **Por que não URL assinada:** exigiria mudar o modelo de persistência e o fluxo de exibição; a rota autorizada entrega o mesmo resultado sem migração.

### D2 — Um gate único de visibilidade pública

**Decisão:** criar `server/utils/visibilidade-publica.ts` com uma expressão SQL reutilizável (`EXISTS` de pai publicado e não arquivado) e uma função pura equivalente para testes. A rota de mídia usa a expressão; as futuras APIs públicas deverão usá-la. Arquivar o pai continua **não** alterando o status das filhas (como manda a spec), mas o gate garante que elas não sejam servidas/retornadas.

**Alternativa considerada:** reverter as filhas para `Publicar` no arquivamento. Rejeitada porque contradiz o cenário “Arquivar não altera as filhas” e cria escrita em cascata desnecessária; o gate é a fonte de verdade da visibilidade.

### D3 — `publicar` é exigido na rota, não só no endpoint dedicado

**Decisão:** nos `POST`/`PUT` dos três módulos, comparar o status atual (ou ausência, na criação) com o status solicitado. Se a transição for para `Publicado`, chamar `requirePermission(event, modulo, 'publicar')` antes de gravar. O endpoint `/publicar` continua existindo e é o caminho canônico. Na gravação:

- Release: `data_aprovacao` recebe `CURRENT_TIMESTAMP(6)` ao entrar em `Publicado` e `NULL` ao sair; a auditoria vira “Homologação” na transição e “Alteração” nos demais casos.
- Manual: `data_publicacao` é preenchida se vazia ao entrar em `Publicado` (preservando a histórica); auditoria “Homologação” na transição.
- Escopo: `data_publicacao` é preenchida ao entrar em `Publicado`; auditoria “Homologação” na transição.
- A interface esconde a opção `Publicado` para quem não tem `publicar`, exceto quando o registro já está `Publicado` (exibido como somente leitura).

**Alternativa considerada:** remover `status` do `PUT` genérico e forçar toda publicação pelo endpoint dedicado. Rejeitada porque a spec prevê reabertura por edição e o formulário já usa o status; a guarda por permissão preserva a UX e fecha o bypass.

### D4 — Atomicidade da criação de escopo

**Decisão:** abrir a transação antes do `INSERT` de `projetos_escopo`; executar insert, geração/colisão de código e reconciliação das filhas na mesma transação; `commit` só no fim. Em `1062` de `(ano, versao)`, rollback e `409`; em colisão de código, rollback e nova tentativa com o próximo sequencial (repetindo o insert dentro da nova transação). O `buscarEscopo` final ocorre após o commit.

### D5 — Revogação no reset de senha sem quebrar a ordem “entrega antes da troca”

**Decisão:** no `trabalho()` de `esqueci-senha`, após `enviarEmail` bem-sucedido, abrir `getTransaction()`, gravar `hash_senha`/`senha_provisoria` e chamar `revogarSessoesDoUsuario(usuario.id, tx.query)` na mesma transação. Falha no envio não abre a transação (mantém a senha e as sessões anteriores). Falha na gravação faz rollback e registra a falha na trilha, sem afetar a resposta genérica já emitida. **Não** se revoga a sessão do solicitante porque a recuperação é anônima; o novo login com a provisória cria uma sessão nova e o middleware já bloqueia rotas administrativas até a troca.

### D6 — Painel Executivo com RBAC por bloco e contrato preservado

**Decisão:** no handler, resolver a matriz uma vez (`pode` é memoizado) para `release-week`, `manuais`, `escopo-projetos`, `lancar-chamadas`, `softwares` e `parceiros`. Sem nenhum `visualizar`, responder `403`. Passar os flags para `obterPainelExecutivo`, que:

- consulta e devolve `porPublicacao` apenas das abas permitidas;
- consulta KPIs/séries/dimensões de chamadas apenas com `lancar-chamadas/visualizar`; sem ela, devolve zeros/listas vazias;
- devolve `porSoftware` apenas com `softwares/visualizar`; sem ela, lista vazia;
- mantém o mesmo shape de resposta (`periodo`, `anosDisponiveis`, `kpis`, `serieMensal`, `serieAnual`, `porPublicacao`, `porSoftware`, `porTipo`, `porImpacto`), com os blocos não permitidos zerados/vazios.

`anosDisponiveis` continua derivado de `entregas_itens.data_lancamento` (apenas anos, sem títulos/status) para preservar o seletor; se o perfil não tiver `lancar-chamadas`, o seletor usa os anos das publicações permitidas, caindo para o ano corrente quando não houver.

**Alternativa considerada:** exigir `lancar-chamadas/visualizar` para o painel inteiro. Rejeitada porque a spec permite leitura de publicações por outros perfis e a tela é executiva; o mascaramento por bloco atende ao mínimo privilégio sem quebrar o acesso.

### D7 — Reduzir o fanout antes de aumentar o pool

**Decisão:** reduzir as consultas do Painel de 12 para ~7–8 e as da Esteira com cache curto de opções:

- uma consulta `UNION ALL` para as séries mensais de lançadas/liberadas;
- uma consulta `UNION ALL` para `porPublicacao` (normalizando `tipo`, `id`, `codigo`, `nome`, `data`, `status`, `arquivada` e contadores);
- uma consulta por dimensão agrupada (`tipo`/`impacto`) em vez de duas;
- `itensFluxo` com projeção mínima (status + status/arquivada dos pais), sem colunas de conteúdo;
- execução em 3 grupos sequenciais (publicações, chamadas, dimensões), limitando o paralelismo por request;
- `listarOpcoesChamadas` cacheado (TTL curto, invalidação nas escritas) para a Esteira.

Depois disso, elevar os defaults do pool (`DB_POOL_LIMIT` 20, `DB_POOL_QUEUE_LIMIT` 100) mantendo as envs. Criar `server/utils/pool-error.ts` com `ehSaturacaoDePool(erro)` (detecta `Queue limit reached`/`ER_CON_COUNT_ERROR`) e um helper de resposta `503` com `Retry-After`; usar no handler do Painel e da Esteira. Erros que não sejam de saturação continuam `500`.

**Alternativa considerada:** só aumentar o pool. Rejeitada porque o fanout cresce com novas telas e o limite de conexões do MariaDB é finito; a redução é a correção estrutural.

### D8 — Testes como contrato

- **Mídia:** teste de integração da rota (anônimo em revisão → 404; anônimo publicado → 200; administrador em revisão → 200; pai arquivado → 404; traversal → 404).
- **Publicação:** testes por perfil nos três módulos (`alterar` sem `publicar` → 403; `publicar` → 200 + `data_aprovacao` + auditoria “Homologação”; reabertura limpa).
- **Reset:** teste de revogação (access/refresh antigos → 401; falha de envio mantém sessão/senha).
- **Painel:** teste de RBAC por perfil (Leitor sem chamadas → 403 ou blocos vazios; Admin → todos), shape e `503` de saturação.
- **Escopo:** teste de falha induzida na reconciliação → nenhum registro parcial.
- **Visibilidade:** teste do gate com pai ativo, pai arquivado e múltiplos vínculos.

## Risks / Trade-offs

- **Hotlink de mídias não publicadas deixa de funcionar** → é o objetivo de segurança; mídias publicadas e identidade continuam públicas. Comunicar no changelog e cobrir com teste.
- **A rota de mídia adiciona uma consulta por acesso** → cache público curto para publicadas; para o admin, `private` e sem cache agressivo. A consulta usa `idx_midias_url` (URL) + PK do item.
- **Perfis sem `publicar` podem ter a UX de edição alterada** → a opção `Publicado` é ocultada, mas o status atual continua visível; sem impacto nos demais campos.
- **Consolidação de queries do Painel pode alterar a ordem/forma dos dados** → manter o shape e adicionar testes de contrato com fixtures; comparar os números atuais antes/depois.
- **Aumentar o pool pode pressionar o MariaDB** → defaults moderados (20/100) e configuráveis; monitorar `Threads_connected`; o 503 evita falha silenciosa.
- **A revogação no reset pode derrubar sessões legítimas do próprio usuário** → é o comportamento desejado após recuperação; o novo login é explícito e a senha provisória força a troca.
- **Sem migration:** a mudança depende dos dados de `anexos_midias` já backfilled (migration 30). Se houver arquivo legado apenas no JSON, o gate de mídia pode negar; o fallback para `entregas_itens.imagens` pode ser adicionado como defesa, mas não é necessário para os registros atuais.

## Migration Plan

1. Não há migration de schema. A migration 30 (backfill de `anexos_midias`) já está aplicada; a rota de mídia assume essa fonte.
2. Ordem de deploy: publicar o código da rota e ajustar `publicAssets` no mesmo deploy; antes do deploy, as URLs de chamadas continuam públicas (janela de risco). Após o deploy, validar anônimo/publicado e admin/revisão.
3. Rollback: reverter o commit restaura o `publicAssets` anterior e reabre C-01 — usar apenas em emergência e com a ciência de que a exposição volta. Não há dados a reverter.
4. Configuração: definir `DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT` no ambiente se os defaults não forem adequados; nenhuma variável nova é obrigatória.

## Open Questions

Nenhuma pendência que altere specs, abordagem ou tarefas. A decisão sobre `publicado_em`/data futura (RL06-B-05) e a segunda-feira (RL06-M-01) permanece na Etapa RL06-2.
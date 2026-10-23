# Proposal

## Why

A Etapa RL06-1 fechou os bloqueadores críticos e altos e liberou a Área Administrativa para evoluir, mas a auditoria RL06 deixou 30 Médios, 3 Altos documentais (A-06/A-07/A-08) e 5 Baixos (B-01…B-05) na Etapa RL06-2. Esses itens afetam contratos de API, consistência de banco, desempenho, acessibilidade, UX e a fonte da verdade — precisam ser resolvidos antes de construir a Área Pública sobre eles.

## What Changes

### Funcional e contratos
- **Lançar as Chamadas:** validar segunda-feira em Data de lançamento/liberação; preencher a Data de liberação com a `dataPublicacao` da Release ao selecionar (editável); expor a listagem com paginação/projeção server-side e galeria com miniaturas/cache/lazy; aplicar o gate de data na visibilidade pública.
- **Esteira de Revisão:** o filtro `status=Publicado` passa a exibir publicados; histórico de id inexistente responde `404`; a listagem do board usa projeção enxuta e cache de opções.
- **Painel Executivo:** o KPI “% do fluxo concluído” passa a contar `Publicado` no numerador (spec vigente), com testes; agregações com índices, SQL agregado e consultas limitadas.
- **Softwares:** corrigir a spec para `PUT/DELETE /api/softwares/:codigo`, incluir a coluna Código, `409` de vínculo e a guarda `?exportar=1`.
- **Usuários:** atribuição de perfil passa a respeitar hierarquia (ator não cria/atribui perfil superior ao seu); listagem devolve datas de cadastro/atualização; cenário de demonstração da spec é corrigido.
- **Auditoria:** `entidade_id` passa a gravar sempre o UUID do registro (com o código em detalhes) e a documentação reflete a cobertura real.
- **RBAC:** catálogo normativo cobre os 11 módulos e as rotas de Escopo, Esteira, Painel, `desaprovar` e mídias de chamadas.

### Dados e migrations
- Migration reconciliatória cria/recria as views válidas (`v_release_itens`, `v_projeto_itens`, `v_manual_itens` e `manuais` com `arquivada`), limpa `data_aprovacao` residual fora de `Publicado`, adiciona índices de data para o Painel e substitui a unicidade de Release/Manual/Escopo por uma chave que permite recriar ciclos arquivados (um ativo + arquivados).
- Spec de migrations e `docs/bd` passam a refletir os totais reais de seed (92/67/41/14) e o rollback das novas mudanças.

### Segurança e desempenho
- Uploads verificam destino/permissão antes de consumir o corpo e impõem limite efetivo também em `chunked`; spec cobre `logos` e o `413` do envelope.
- `TRUSTED_PROXIES` passa a validar o peer contra IPs/CIDRs antes de confiar no `X-Forwarded-For`.
- Banco de aplicação documentado/operado com menor privilégio (sem `ALL PRIVILEGES`/`GRANT OPTION`), com script de provisionamento.
- Painel e Esteira sem `500` de fila: consultas consolidadas, paralelismo limitado, cache com invalidação e `503 + Retry-After`.
- Imagens da galeria com variante ~320 px WebP, `srcset`, `loading="lazy"` e cache longo (nova dependência `sharp`).

### UX e acessibilidade
- Estado de erro com retry nas listagens (não confundir falha com base vazia).
- Botões de salvar com loading/disabled e proteção contra duplo envio.
- Mapa único de variantes de status entre Painel e módulos.
- Paginação responsiva em 320–375 px.
- `Escape` devolve foco ao gatilho e o drawer mobile vira diálogo com trap de foco.
- Busca da `UiDataTable` e editor de texto rico com nome acessível.

### Documentação (fonte da verdade)
- Atualizar `docs/01`, `02`, `03`, `05`, `07`, `08`, `10`–`17`, `AGENTS.md`, `docs/bd/01`, `docs/bd/02` e `.env.example` para: cascata nos módulos, schema completo, permissão do convite, status `Publicar/Publicado`, totais RBAC/seed, guarda de exportação, cobertura de auditoria, texto rico/status, contagens de componentes/seções e `DB_TIMEZONE`/pool.

## Capabilities

### New Capabilities

_Nenhuma capability nova. Todos os contratos já existem._

### Modified Capabilities

- `lancar-chamadas`: paginação/projeção da listagem, galeria com miniaturas e gate de data da visibilidade pública.
- `esteira-revisao`: filtro de publicados, `404` no histórico e projeção/cache da listagem.
- `painel-executivo`: KPI de fluxo com `Publicado`, agregações indexadas e limites de consulta.
- `migracoes-banco`: reconciliação de views, índices, limpeza de `data_aprovacao`, unicidade com arquivadas e totais de seed.
- `uploads`: autorização antes do parse, limite em `chunked`, `logos` e `413` na spec.
- `login`: validação efetiva de `TRUSTED_PROXIES` (IPs/CIDRs) no rate limit.
- `gestao-usuarios`: hierarquia de atribuição de perfil, datas na listagem e cenário de demonstração corrigido.
- `autorizacao-rbac`: catálogo completo com 11 módulos e rotas novas.
- `auditoria`: `entidade_id` sempre UUID e cobertura documentada.
- `release-week`: unicidade de `(ano, semana)` considerando arquivadas.
- `manuais-mensais`: unicidade de `(ano, mês)` considerando arquivadas.
- `escopo-projetos`: unicidade de `(ano, versão)` considerando arquivadas.
- `softwares`: contrato de `:codigo`, coluna Código, `409` e exportação.
- `design-system/data-table`: estado de erro com retry, busca com nome acessível e paginação responsiva.
- `design-system/form-control-states`: submissão com loading/disabled e anti-duplo-envio.
- `design-system/layout-navigation`: `Escape` devolve foco e drawer com semântica de diálogo.
- `design-system/rich-text`: label associado ao editor.
- `design-system/brand-tokens`: mapa canônico de variantes de status entre telas.

## Impact

- **APIs:** `GET /api/lancar-chamadas` (paginação/projeção — **BREAKING** para consumidores que esperam o array completo); `GET /uploads/**` (mídias/thumbnails); `PUT/DELETE /api/softwares/:codigo` (spec); `POST /api/usuarios` e `PUT /api/usuarios/:id` (hierarquia); `POST /api/uploads` (limite/permissão); `GET /api/painel-executivo` e `GET /api/esteira-revisao` (limites/503).
- **Banco:** migration `31_rl06_2_reconciliacao.sql` (views, índices, `data_aprovacao`, unicidade com arquivadas) e rollback documentado; `docs/bd/01` e `docs/bd/02` atualizados.
- **Dependências:** `sharp` para as miniaturas WebP (com fallback para o original quando indisponível).
- **Frontend:** telas de Lançar as Chamadas, Esteira, Painel, Softwares, Usuários, Perfis, Auditoria, Segurança, Configurações, Meu Perfil e formulários de escrita; `UiDataTable`, `UiInput`, `UiRichText`, `AppHeader`/drawer.
- **Operação:** script de usuário de banco de menor privilégio e configuração de `TRUSTED_PROXIES`; nenhum segredo novo.
- **Breaking:** a paginação de `GET /api/lancar-chamadas` exige atualização do consumidor; a recriação de ciclos arquivados passa a ser permitida (antes bloqueada pela unicidade).
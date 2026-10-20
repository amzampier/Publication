# Design: escopo-projetos-backend-e-importacao

## Context

Ver `proposal.md - Why`. Estado relevante verificado no código:

- `projetos_escopo` existe em `server/migration/01_create_tables.sql` com `codigo`, `nome`,
  `versao`, `ano`, quatro datas, `status` de quatro valores, `softwares_contemplados` JSON
  `NOT NULL`, `descricao_geral`, `total_visualizacoes` e timestamps. **Não há** coluna `arquivada`.
- `entregas_itens.projeto_id` referencia `projetos_escopo(id)` com `ON DELETE SET NULL`; os itens
  são a única origem real de softwares contemplados e da contagem que bloqueia a exclusão.
- O module RBAC `escopo-projetos` já existe no seed (`visualizar`, `criar`, `alterar`, `excluir`,
  `publicar`, `arquivar`, `exportar`, `importar`, `filtrar`, `buscar`), sem `visualizar_itens`.
- O backend de Manuais/Release Week já fixou o padrão de rota fina + `server/utils` +
  `requirePermission` + auditoria + importação transacional + parser `.xlsx` no cliente.
- O frontend atual usa `useState` com 9 escopos e 11 itens de demonstração; o ícone Import é inerte.
- A spec atual ainda declara “dataset em memória” e “importação como affordance”, que serão
  substituídos pela delta deste change.

## Goals / Non-Goals

**Goals:**

- Persistir escopos no banco, sem seed, com API administrativa completa.
- Manter a tela atual (cards, KPIs, filtros, modal de itens, PDF/CSV) funcionando sobre a API.
- Tornar a importação `.xlsx` de escopos funcional e transacional.
- Derivar softwares/itens de `entregas_itens`, nunca de seleção manual.

**Non-Goals:**

- CRUD ou importação de itens/chamadas (`entregas_itens` pertence a "Lançar as Chamadas").
- Área Pública, visualizações, anexos, workflow de revisão ou novas permissões RBAC.
- Alterar o kit visual ou criar componente novo.
- Importar softwares na planilha; a planilha é exclusivamente de escopos.

## Decisions

### D1 — API no molde de Manuais/Release Week
Criar `server/api/escopo-projetos/**` com rotas finas, `requirePermission` e `registrarAuditoria`,
delegando a `server/utils/escopo-projetos.ts`. A listagem retorna um array (como Manuais), e a tela
continua com busca/filtros/paginação no cliente.

- **Por que:** o projeto já tem esse padrão testado, inclusive para itens e importação.
- **Alternativa descartada:** paginação server-side — o volume de escopos é pequeno e a tela atual
  depende do conjunto completo para KPIs/opções de filtros.

### D2 — Migration 23: arquivamento e identidade `(ano, versao)`
Adicionar `arquivada TINYINT(1) NOT NULL DEFAULT 0` e o índice correspondente. Adicionar também
`UNIQUE KEY uk_projetos_ano_versao (ano, versao)` para materializar a identidade escolhida para a
importação. Nenhum `INSERT`/seed.

- **Por que:** o arquivamento deixa de ser mock e a unicidade não pode depender apenas de um
  `SELECT` concorrente.
- **Risco:** a migration falha se a tabela já tiver `(ano, versao)` duplicado. O módulo nasce vazio;
  se houver dados legados, eles precisam ser conciliados antes.
- **Alternativa descartada:** validar `(ano, versao)` apenas no servidor — duas requisições
  simultâneas ainda poderiam criar duplicatas.

### D3 — Código gerado no servidor com retry de conflito
O código `PE-<ano>.<sequencial>` é gerado no create e na importação, a partir do maior sequencial
existente do mesmo ano; o campo é imutável na edição. O índice único de `codigo` (já existente) é a
última barreira; em `1062`, o servidor tenta novamente uma vez ou responde `409` quando o conflito é
de `(ano, versao)`.

- **Por que:** o código é identidade e o cliente não deve escolhê-lo.
- **Alternativa descartada:** código vindo da planilha — o usuário confirmou geração automática.
- **Trade-off:** a geração não é uma sequência sem buracos; exclusões podem deixar lacunas, o que é
  aceitável para um código de negócio.

### D4 — Softwares contemplados derivados, não persistidos como verdade
O JSON `softwares_contemplados` é gravado como `[]` no create/import. A API deriva a lista dos
itens (`entregas_itens.software_id` + `softwares.descricao`, com fallback para
`entregas_itens.software`) e devolve **nomes distintos**. O frontend deixa de usar
`SOFTWARES_MOCK`; o card não exibe softwares, o formulário exibe badges somente leitura e o
filtro/PDF/CSV usam esses nomes.

- **Por que:** a regra do produto é “softwares vêm das chamadas”; manter uma cópia editável no
  escopo criaria divergência.
- **Alternativa descartada:** manter o JSON como cache — exigiria sincronização em toda escrita de
  itens, que pertence a outro módulo.
- **Consulta:** a listagem usa uma subquery de `itensCount` e uma segunda consulta agrupada por
  `projeto_id` para montar os nomes distintos; isso evita depender de `GROUP_CONCAT` e mantém a
  ordenação estável.

### D5 — Importação somente de escopos, com preview e commit transacional
Criar `lerPlanilhaEscopoProjetos.ts` no cliente, com uma função pura de classificação
(`pronto`/`já cadastrado`/`repetido`/`inválido`) e leitura via `exceljs`. O modal envia as linhas
selecionadas para `POST /api/escopo-projetos/importar`; o servidor revalida tudo e grava em uma
transação. A chave de duplicidade é `(ano, versao)`, inclusive contra arquivados. Limite de 500
linhas; linhas vazias são ignoradas.

Colunas do modelo: Nome, Versão, Ano, Data de Início, Data Final, Data de Previsão, Data de
Publicação, Status e Descrição Geral. Código não entra na planilha.

- **Por que:** é o menor recorte coerente com o módulo atual e com “Lançar as Chamadas” sendo o dono
  dos itens.
- **Alternativa descartada:** importar itens junto — exigiria colunas de chamada, regras de
  agrupamento e criação em `entregas_itens`, ampliando o escopo e a chance de conflito.
- **Trade-off:** escopos importados nascem com `itensCount = 0` e sem softwares; isso é esperado até
  as chamadas serem lançadas.

### D6 — Frontend deixa de ter seed e passa a ter estados reais
`useEscopoProjetosModelo` passa a ter `carregando`, `carregado`, `itensPorProjeto`,
`itensCarregando`, `itensErro` e ações assíncronas. A página usa `UiLoading` no F5; falha de API
mostra toast e lista vazia. Itens são carregados sob demanda (`GET /:id/itens`), como em Manuais.
O formulário mapeia `400/409` para os campos e o código é somente leitura na edição.

- **Por que:** manter o seed em paralelo à API produziria dados fictícios e mascararia falhas.
- **Alternativa descartada:** seed inicial no banco — o usuário pediu explicitamente módulo vazio.

### D7 — Exportações com guarda de permissão
O menu de relatórios chama `GET /api/escopo-projetos?exportar=1` antes de gerar PDF/CSV. A geração
continua no cliente, como em Parceiros/Manuais, mas sem a guarda apenas visual.

- **Por que:** a permissão `exportar` precisa ser aplicada no servidor, não só escondida na UI.
- **Alternativa descartada:** gerar PDF/CSV no servidor — fora do recorte e sem necessidade para o
  volume atual.

### D8 — Itens e RBAC sem nova funcionalidade
A rota de itens usa `escopo-projetos`/`visualizar`, pois o catálogo não tem `visualizar_itens`. Não
há migration de RBAC. A auditoria usa o recurso **"Escopo de Projetos"**.

- **Por que:** evita expandir a matriz e mantém o comportamento atual do ícone.
- **Alternativa descartada:** criar `visualizar_itens` — mudaria o catálogo e os quatro perfis sem
  necessidade de produto.

## Risks / Trade-offs

- [Migration falha por duplicidade legada] → validar a tabela antes; o módulo nasce vazio e não há
  seed. Se houver dados, conciliar `(ano, versao)` manualmente antes de aplicar.
- [Concorrência na geração de código] → índice único de `codigo` + retry/409; a importação inteira
  roda em transação.
- [Softwares divergentes entre `entregas_itens.software` e `software_id`] → preferir
  `software_id`/`softwares.descricao` e usar o texto apenas como fallback.
- [Itens ainda não existem na base] → a tela nasce sem softwares/contagem; a leitura já fica pronta
  para quando "Lançar as Chamadas" gravar.
- [Data de publicação obrigatória no schema] → create/import exigem as quatro datas; a planilha
  histórica deve trazer a data mesmo para status não publicado.
- [Publicar sobrescreve data histórica] → a ação publicar usa a data atual, como o comportamento
  atual; escopos já `Publicado` não têm a ação habilitada. Escopos importados como `Publicado`
  preservam a data da planilha.
- [Frontend sem seed pode parecer “quebrado” no primeiro acesso] → estado vazio explícito
  "Nenhum escopo de projeto cadastrado." e importação em destaque.

## Migration Plan

1. Criar `server/migration/23_add_escopo_arquivada_e_ano_versao.sql`:
   `arquivada`, `idx_projetos_arquivada` e `uk_projetos_ano_versao`; sem seed.
2. Implementar `shared/utils/escopo-projetos.ts` e `server/utils/escopo-projetos.ts`.
3. Criar as rotas `/api/escopo-projetos/**`.
4. Migrar o frontend para a API, criar parser/importação e remover o seed.
5. Atualizar docs/spec/testes e rodar os gates.

Rollback: reverter a migration 23 (dropar índice único, índice e coluna), remover as rotas/utilitário
e restaurar o modelo mock do frontend. O rollback não apaga escopos já importados sem decisão
explícita.

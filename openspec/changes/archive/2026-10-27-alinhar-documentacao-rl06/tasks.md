# Tasks

## 1. Specs afetadas

- [x] 1.1 Revisar o delta de `lancar-chamadas` (Data de liberação somente leitura e importação com segunda-feira/dia útil) e confirmar que o bloco MODIFIED preserva todos os cenários da spec principal; verificar com `openspec validate "alinhar-documentacao-rl06" --type change --strict`
- [x] 1.2 Revisar o delta de `painel-executivo` (mesmo universo da Esteira, fórmula própria do Painel) e confirmar que o bloco MODIFIED preserva os KPIs e cenários; verificar por leitura e `openspec validate --specs`
- [x] 1.3 Revisar o delta de `autorizacao-rbac` (paginação isolada = `visualizar`, filtros = `filtrar`, e-mails = `visualizar` + `buscar`) e confirmar que o bloco MODIFIED preserva as demais rotas e cenários; verificar por leitura e `openspec validate --specs`

## 2. Lançar Chamadas e Painel

- [x] 2.1 Atualizar `docs/15` (`:23`, `:122-123`, `:229`, `:304-305`, `:338-341`): Data de liberação herdada da Release e somente leitura; verificar que não restou “editável” nem “vazia/desabilitada” contraditório
- [x] 2.2 Atualizar `docs/15:270`: a importação XLSX segue a validação de segunda-feira/próximo dia útil da criação; verificar a passagem e a coerência com `server/utils/lancar-chamadas.ts:1294`
- [x] 2.3 Atualizar `docs/17` (`:89`, `:104-106`, `:276`): “mesmo universo da Esteira, fórmula própria do Painel (inclui Publicado)”; verificar que não restou “mesma regra da Esteira”

## 3. Contagens, auditoria e referências

- [x] 3.1 Atualizar `docs/02`: 36 → 39 componentes (`:36`), completar plugins/utils (`:51-52`), trocar a migration fictícia (`:510,521`) e ajustar a descrição da Esteira (`:361`); verificar por busca que não restou `02_add_status_to_publicacoes.sql` nem “36 componentes”
- [x] 3.2 Adicionar nota em `docs/bd/02_seed.sql` (e referência em `docs/02`) de que o cabeçalho da migration `02_seed.sql` é histórico (99/90/65/39/14) e a matriz efetiva é 92/67/41/14; verificar que a migration em `server/migration/02_seed.sql` não foi alterada
- [x] 3.3 Atualizar `docs/03` (`:271` `SidebarItem` com `to`/`modulo`, `:406` Escopo integrado à API, `:408` remover “Parceiros/Softwares não construídos”); verificar contra `app/config/navigation.ts` e as rotas reais
- [x] 3.4 Completar a tabela de auditoria em `docs/05` para 59 pontos (42 detalhadas + 15 de Parceiros/Release/Esteira, reconciliando os 2 caminhos duplos) e ajustar a nota `:429`; verificar a contagem de linhas e o total contra `registrarAuditoria`; se a enumeração não for inequívoca, usar título/nota “42 detalhadas + 15 sumariadas” e registrar a justificativa
- [x] 3.5 Atualizar `docs/06:44` para busca de e-mails sob demanda (`q` 2+, máx. 20, `visualizar` + `buscar`), coerente com `:68`; verificar a passagem e a rota `server/api/usuarios/emails.get.ts`
- [x] 3.6 Adicionar nota no início da §12 de `docs/07` de que 88/460 são snapshot histórico e a matriz atual é 92/67/41/14 (214/368); verificar que o changelog histórico não foi reescrito
- [x] 3.7 Atualizar `docs/01:21` de “5.1-5.20” para “5.1-5.28” e conferir o índice dos componentes; verificar que os 39 componentes estão cobertos

## 4. Snapshot do RL06

- [x] 4.1 Adicionar nota no RL06 (após a tabela de metadados): snapshot de 23/10 no commit `85c79c8`; contagens históricas 42/30/84/18/36/15; estado atual 46/40/86/18/39/16; `docs/18` removido; verificar a nota e não reescrever os achados históricos

## 5. Verificação final

- [x] 5.1 Rodar `openspec validate "alinhar-documentacao-rl06" --type change --strict` e `openspec validate --specs`; verificar que ambos passam (46/46 nas specs)
- [x] 5.2 Reexecutar a matriz documental do RL06 (A-06, A-07, A-08, M-22, M-24, M-25, B-20 + resíduos) e confirmar todos como resolvidos
- [x] 5.3 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; verificar que não houve alteração de código
- [x] 5.4 Revisar o diff/lista final e confirmar que apenas specs/documentos foram alterados; verificar ausência de mudanças em `server/`, `app/`, `shared/` e `tests/`

# Tasks

## 1. Identidade & metadados da vitrine

- [x] 1.1 Trocar `useSeoMeta`/título "FinancePro" (L57-59) e cabeçalho "FinancePro Design System" (L590) para "Publications (Dicas Teorema)" — verificar com grep: zero `FinancePro` em `app/pages/design.vue`
- [x] 1.2 Ajustar subtítulo da capa (L653: "Clareza contábil...") para vocabulário do domínio de publicações (doc 01 §1.1) — verificar: zero `contábil` no arquivo

## 2. Dados de demonstração do `<script setup>`

- [x] 2.1 Substituir o dataset da seção 13 (`lancamentosFiscais`, 33 NF-e, L288-352) por registros do domínio (códigos `REL-2026-W39`…, título, tipo, data de publicação, status, responsável) mantendo todos os `status` (`done`/`reconciled`/`pending`/`inReview`/`blocked`) e ≥2 colunas `isNumeric` — verificar: zero `NF-e`/`fornecedor`/`filial`/valores R$ no arquivo
- [x] 2.2 Adaptar `colunas` da seção 13 (L356-410): cabeçalhos "Documento / NF-e", "Fornecedor / Favorecido", "Centro de Custo", "Filial", "Vencimento", valores → colunas do domínio (Código, Título, Tipo, Publicação em, Status, Responsável), preservando `groupable`/`sortable`/`isNumeric`/`width` — verificar: grep `accessorKey` sem termos fiscais
- [x] 2.3 Substituir opções dos selects da seção 9 (plano de contas L219-241, filiais Matriz/Filial CNPJ L256-259) por tipos/publicações do domínio — verificar: zero `CNPJ`/`Matriz`/`1.01.01` no arquivo
- [x] 2.4 Renomear refs e mensagens de erro de filial (`filialSelecionada`, `erroFilial`, L270-272) para o domínio (ex.: `tipoSelecionado`, `erroTipo`) e atualizar todos os bindings — verificar: grep `filial|Filial` = 0 no arquivo
- [x] 2.5 Renomear `cardFilialSp/Rj/Mg` (L81-83) e `chipReconciliados` (L79) para cards/chips do domínio, atualizando bindings — verificar: grep `cardFilial` = 0
- [x] 2.6 Trocar textos financeiros do `<script>` restantes: `toastCustomMessage` (L117), seções do demo-shell (`empresaAtiva`/seletor "São Paulo (Matriz)" L459-486, item "Trocar Filial"), notificações/menus demo (L429-438) para domínio de publicações / escopo único (doc 01 §3.1 — sem seletor de empresa) — verificar: grep `concilia|Matriz|Filial|contábil` = 0

## 3. Textos do `<template>`

- [x] 3.1 Seções 1-2 (L620-726): título "Conciliação Bancária & Fiscal" (L669), "Lançamentos em Aberto" (L674), metadados "CNPJ ... Filial SP" (L680), "Clareza contábil" (L653) → exemplos do domínio (doc 01 §1.1-1.2, códigos `REL-2026-W39`) — verificar: grep da seção sem termos fiscais
- [x] 3.2 Seções 5 e 9 (inputs L888-1050, select L1398+): labels "Teto Orçamentário da Filial", "Razão Social da Empresa Matriz", "Documento Fiscal (CNPJ)", "Pesquisar Filial ou Lançamento", "Filial de Faturamento (Com Erro)" (L1488-1494) → campos do domínio (Slug, Título, Responsável, Tipo de Publicação) — verificar: grep `CNPJ|Filial|faturamento` = 0
- [x] 3.3 Seção 8 (toasts L1153-1312): mensagens de conciliação/SEFAZ/fechamento contábil (L1197, L1222, L1247, L1294, L1303, L1312) → `Release Publicada` / `Revisão Pendente` / `Falha no Upload` (doc 01 §4.6) — verificar: grep `SEFAZ|concilia|contábil|filial` = 0
- [x] 3.4 Seções 4, 11 (badges/checkboxes L844-877, L1565-1796): "Reconciliado"/"Índigo (Conciliado)", SPED EFD ICMS, Reconciliação Bancária, cards "São Paulo (Matriz)" com CNPJ → rótulos do domínio via slot `default` onde couber, mantendo `variant="reconciled"` demonstrado como legada (doc 01 §5.2) — verificar: grep `SPED|CNPJ|Matriz|Filial SP` = 0
- [x] 3.5 Seções 12-14 (KPIs L1857-1872, DataTable L1883-1894, shell L1928+): KPIs "Conciliações Pendentes"/"Índice de Conciliação" → indicadores de publicações (mesmas `cor`/`tendencia`); texto de agrupamento "Fornecedor, Filial, Categoria" → colunas novas; demo do shell sem contexto Matriz/Filial — verificar: grep `Concilia|Filial` = 0
- [x] 3.6 Renomear identidade restante no template (ex.: sidebar demo "Lançamentos Fiscais" L430, "Governança & Multi-Filiais" se existir na demo) para sessões do domínio — verificar: grep `Lançamento|Multi-Filiais|Fiscal` = 0

## 4. Verificação

- [x] 4.1 Rodar grep de regressão completo em `app/pages/design.vue` com o padrão de domínio (`FinancePro|concilia|filial|Filial|Matriz|CNPJ|SEFAZ|SPED|estornar|contábil|razão|Lançament|NF-e|fornecedor|tenant|lote`) — esperado: 0 matches (baseline atual: 142)
- [x] 4.2 Conferir que nenhum componente `app/components/ui/**` teve comportamento/lógica alterada (a única exceção posterior foi a troca de import de ícone na task 5.2, sem mudança de API)
- [x] 4.3 `npm run build` conclui sem erro (única verificação real do repo)
- [x] 4.4 Conferência visual opcional com `npm run dev`: `/design` renderiza as 15 seções, interações (select com busca, toasts, DataTable group-by/totalizadores, modal) funcionam com os novos dados

## 5. Correções de infraestrutura descobertas na verificação

- [x] 5.1 Trocar `<NuxtWelcome />` por `<NuxtPage />` em `app/app.vue` — sem isso a rota `/design` não renderizava (mostrava o welcome do Nuxt), tornando a task 4.4 impossível (aprovado pelo usuário)
- [x] 5.2 Migrar `lucide-vue-next` (pacote deprecado, ausente do `package.json` — o build já falhava antes desta change) para `@lucide/vue` nos 17 arquivos que o importam; confirmar que os 69 ícones usados existem no pacote novo e remover `lucide-vue-next` (aprovado pelo usuário)
- [x] 5.3 Revalidar após a migração: `npm run build` exit 0 e `/design` renderizando (159 SVGs no HTML), sem erros no log do dev

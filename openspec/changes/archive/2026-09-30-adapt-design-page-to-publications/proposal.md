# Proposal — adapt-design-page-to-publications

## Why

A página `/design` (vitrine do design system) ainda é um resquício integral do FinancePro: título/meta "FinancePro", ~142 ocorrências de dados de domínio financeiro (NF-e, fornecedores, centros de custo, filiais com CNPJ, conciliação bancária, SPED/SEFAZ, lançamentos contábeis) e textos multi-filial. Isso contradiz `docs/01 - design_system.md` (identidade "Publications (Dicas Teorema)", exemplos `REL-2026-W39`, Releases Week Semanal, escopo único sem seletor de empresa) e confunde qualquer pessoa que use o `/design` como referência de exemplos do sistema.

## What Changes

- Renomear título, meta description e cabeçalho da vitrine de "FinancePro" para "Publications (Dicas Teorema)".
- Substituir **todos os dados e textos de demonstração** de domínio financeiro pelos do domínio de publicações (Releases Week Semanal, Manuais, Escopo de Projetos, códigos `REL-2026-W39`, status Publicado/Agendado/Em Revisão/Rascunho/Bloqueado), conforme vocabulário e exemplos de `docs/01`:
  - Tabela da seção 13 (DataTable): "Lançamentos Fiscais" → "Releases Week Semanal"; colunas documento/fornecedor/centro de custo/filial/valores → colunas do domínio (código, título, tipo, data de publicação, status).
  - Seção 5 (Inputs): campos "Filial de Faturamento", "Teto Orçamentário da Filial", "Razão Social da Empresa Matriz", "Documento Fiscal (CNPJ)" → campos do domínio (ex.: Slug da Publicação, Título, Responsável).
  - Seção 8 (Toasts): mensagens de conciliação/SEFAZ/fechamento contábil → mensagens de publicação (ex.: "Release Publicada", "Revisão Pendente", falha de upload).
  - Seção 9 (Select): opções de plano de contas/SPED/filiais → tipos de publicação; seção 11 (CheckCards): "São Paulo (Matriz)" com CNPJ → itens do domínio (ex.: Releases Week, Manual, Escopo de Projetos).
  - Seção 12 (KPIs): "Conciliações Pendentes"/"Índice de Conciliação" → indicadores de publicações.
  - Seção 14 (Shell demo): seletor/rótulos "Matriz/Filial", "Trocar Filial" → sem seletor de empresa (escopo único, conforme doc 01 §3.1).
  - Navegação interna da demo (menu lateral da seção 14): "Lançamentos Fiscais" etc. → sessões do Publications.
  - Variável e mensagens de erro relacionadas a filial/NF-e → domínio equivalente.
- Apenas os **exemplos que consomem os componentes mudam**; os 19 componentes em `app/components/ui/` permanecem intactos, assim como a estrutura, a numeração (15 seções) e o comportamento da vitrine.
- Fora de escopo (fases seguintes): `app/config/navigation.ts`, `AppHeader.vue`, `AppSidebar.vue`, `app/app.vue` (resíduos do shell) — mantidos como estão nesta fase.

## Capabilities

### New Capabilities

_(nenhuma)_

### Modified Capabilities

_(nenhuma — mudança apenas de conteúdo de demonstração em página de vitrine; sem requisito de comportamento novo)_

## Impact

- **Código:** `app/pages/design.vue` (único arquivo alterado).
- **Documentação:** `docs/01 - design_system.md` não precisa de alteração — a vitrine passa a convergir com ele; conferir seções 1, 5 e exemplos citados.
- **Sem mudança de comportamento:** componentes, rotas, props, emits e estrutura da página inalterados; validação por grep (zero resíduos) + `npm run build`.

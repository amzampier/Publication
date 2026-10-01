# Proposal

## Why

Os documentos de base do projeto (`docs/01 - design_system.md` e `docs/02 - Guia de Arquitetura e Migrations.md`) foram escritos para o FinancePro e ainda descrevem um ERP multi-tenant financeiro (Matriz/Filial, conciliação, lançamentos, CNPJ, `USE financepro;`). O Publications (Dicas Teorema) é um sistema sem multi-tenant, com **Área Pública** (leitura anônima) e **Área Administrativa** (cadastros e publicação de Releases Week Semanal, Manuais e Escopo de Projetos) — os docs precisam refletir essa identidade antes de virarem a referência do desenvolvimento.

## What Changes

- **`docs/01 - design_system.md`** (Design System — Publications (Dicas Teorema)):
  - Título e cabeçalho renomeados; link para a spec `design-system` (inexistente neste repo) removido e substituído por nota de que a spec será criada depois.
  - Princípio 1 reescrito de "Clareza Contábil e Financeira" para "Clareza e Precisão da Informação" (títulos, datas, versões, códigos de publicação).
  - Princípio 3 reescrito de "Contexto Multi-Tenant" para "Dualidade de Áreas Inconfundível" (Área Pública × Área Administrativa).
  - §3.2 (seletor Matriz/Filial) removido; header descrito com zona esquerda = toggle + logo + nome institucional; menu Account sem "Trocar Filial".
  - §3.4: sessões da sidebar passam a ser **Publicações** (Releases Week Semanal, Manuais, Escopo de Projetos) e **Administração** (Usuários, Perfis de Acesso, Auditoria, Configurações).
  - §3.5 renomeada de "Impressão contábil" para "Impressão de documentos".
  - Exemplos de código e uso (Input, Toast, BadgeCheckbox, CheckCard, Kpi, DataTable, Modal) trocados por domínio de publicações; tipografia e cores reaplicadas a códigos/datas/status de publicação (tokens e variantes dos componentes permanecem intactos).
  - Nova tabela de mapeamento de status de publicação → variantes do `Badge` (existentes no componente): Publicado→`done`, Agendado→`pending`, Em Revisão→`inReview`, Bloqueado→`blocked`, Rascunho→`neutral`; `reconciled` marcada como reservada.
- **`docs/02 - Guia de Arquitetura e Migrations.md`** (mantém a natureza de guia de arquitetura):
  - Introdução e exemplos reescritos para o Publications; convenção `USE publications;` no lugar de `USE financepro;`.
  - Novo subitem "Áreas do Sistema" em §2 (rotas públicas anônimas × `/admin/**` com auth + RBAC; módulos de exemplo `releases`, `manuais`, `escopos`, `publicacoes`).
  - Endpoint de exemplo → `server/api/publicacoes/index.post.ts`; extras de RBAC → `publicar`, `arquivar`, `download`, `exportar`, `importar`; exemplo `can('publicacoes','criar')`; redirect de login → `/admin/login`; migration 01 inclui tabelas de negócio de exemplo.
- **Sem mudança de comportamento em código**: componentes `app/components/ui/`, layout, `navigation.ts`, `design.vue` e `app.vue` não são alterados nesta change (resíduos FinancePro no código ficam como follow-up).
- `docs/qa/*` permanecem fora do escopo (próxima rodada de adaptação).

## Capabilities

### New Capabilities

<!-- nenhum -->

### Modified Capabilities

<!-- nenhuma — mudança pura de documentação, sem alteração de comportamento -->

> **`skip_specs: true`**: esta change é documental (docs de design system e guia de arquitetura). Nenhum requisito de spec é criado ou alterado — specs descrevem comportamento, e o comportamento do sistema não muda aqui.

## Impact

- **Arquivos alterados:** apenas `docs/01 - design_system.md` e `docs/02 - Guia de Arquitetura e Migrations.md`.
- **Código:** nenhum (componentes e shells permanecem como estão; divergências conscientes entre o doc §3 e o código atual — ex.: texto "FinancePro" no `AppHeader`, sessões em `navigation.ts` — ficam registradas como follow-up).
- **Dependências/sistemas:** nenhuma.
- **OpenSpec:** change `adapt-docs-to-publications` com `skip_specs: true`; spec `design-system` continua pendente de criação (fora desta change).

# Tasks

## 1. Doc 01 — Design System: identidade e fundamentos

- [x] 1.1 Reescrever título (L1) para "Design System — Publications (Dicas Teorema)" e substituir a linha de autoridade (L5, link da spec inexistente) por nota de que a spec será criada depois — verificar por grep que "FinancePro" não aparece mais no doc 01 e que a nota está presente
- [x] 1.2 Reescrever princípios 1 e 3 do §1.1 (Clareza e Precisão da Informação; Dualidade de Áreas Inconfundível) mantendo os princípios 2, 4, 5 intactos — verificar que "Contábil", "CNPJ", "Multi-Tenant" e "Matriz/Filial" saíram do §1
- [x] 1.3 Ajustar §1.2 (aplicações tipográficas sem "monetário/CNPJ", exemplo `TRX-SP-001` → `REL-2026-W39`, "numérico contábil" → "numérico") — verificar grep por "monetári|CNPJ|TRX-SP" zero no §1
- [x] 1.4 Reescrever coluna *Aplicação* das cores Esmeralda/Rose/Índigo no §2.1 para semântica de publicação, preservando tokens/HEX/Tailwind — verificar que os 8 hex da tabela permanecem inalterados

## 2. Doc 01 — Layout e navegação (§3)

- [x] 2.1 Remover §3.2 (Seletor Matriz/Filial) e reescrever §3.1 com zona esquerda = toggle + logo + nome institucional — verificar que a seção 3 não contém "Filial" e que nenhum link/âncora interna do doc aponta para a seção removida
- [x] 2.2 Atualizar §3.3 (Account sem "Trocar Filial") e §3.4 (sessões "Publicações" e "Administração" com seus itens) — verificar grep "Trocar Filial|Operação & Finanças|Multi-Filiais" zero no doc 01
- [x] 2.3 Renomear §3.5 "Impressão contábil" → "Impressão de documentos" (utilitários `.print-*` mantidos) — verificar o novo título e ausência de "contábil" na seção

## 3. Doc 01 — Convenções e componentes (§4–§5)

- [x] 3.1 Trocar exemplos de toast do §4.6 e §5.6 por domínio (Release Publicada etc., sem SEFAZ/conciliação/orçamento de filial) — verificar grep "SEFAZ|Conciliação|Filial SP" zero nessas seções
- [x] 3.2 Reescrever exemplos de código do §5 (Input: slug/Código `REL-2026-W39`; BadgeCheckbox: módulo Releases Week; CheckCard: item de conteúdo; Kpi: "Publicações na Semana"; DataTable: "Releases Week Semanal"; Modal: "Nova Publicação") — verificar grep "CNPJ|SPED|Fornecedor|Lançamentos Fiscais|Conciliação|Filial Curitiba" zero no doc 01
- [x] 3.3 Adicionar ao §5.2 a tabela de mapeamento status de publicação → variantes do Badge (Publicado→done, Agendado→pending, Em Revisão→inReview, Bloqueado→blocked, Rascunho→neutral, reconciled reservada) sem alterar a tabela de variantes do componente — verificar que os 6 `BadgeVariant` originais seguem na tabela e que a nova tabela existe

## 4. Doc 02 — Guia de Arquitetura

- [x] 4.1 Reescrever introdução (guia do Publications) e §2: novo subitem "Áreas do Sistema" (Pública anônima × Admin `/admin/**` com auth+RBAC) e exemplos de módulo → `releases, manuais, escopos, publicacoes` — verificar grep "lancamentos, conciliacao, contas|multi-tenant" zero no doc 02 e que "Áreas do Sistema" existe
- [x] 4.2 Reescrever §3.2 (endpoint → `server/api/publicacoes/index.post.ts` com `publicacaoSchema`/`requirePermission('publicacoes','criar')`), §3.4 (`PUBLIC_ROUTES` = Área Pública) e §3.5 (extras `publicar, arquivar, download, exportar, importar`) — verificar grep "lancamento|conciliar|estornar" zero no doc 02
- [x] 4.3 Substituir convenções de migration do §4 (`USE publications;`, exemplos `02_add_status_to_publicacoes.sql`, rollback sobre `publicacoes`) — verificar grep "financepro" zero no doc 02
- [x] 4.4 Atualizar §5.3 (`can('publicacoes','criar')` / "Nova Publicação", redirect `/admin/login`) e §6 (`DB_NAME=publications`, migration 01 com tabelas de negócio de exemplo) — verificar grep "meu_novo_sistema|admin/login|publicacoes" coerentes e "lancamentos" zero

## 5. Verificação final (integração)

- [x] 5.1 Grep de aceitação nos 2 documentos por `FinancePro|filial|Filial|CNPJ|concilia|Concilia|lancament|Lançament|SEFAZ|SPED|multi-tenant|Multi-Tenant|contábil` — aceito apenas identificadores `.fp-*`/`fp-toast` legítimos e ocorrências explicitamente reservadas; reportar qualquer falso positivo restante
- [x] 5.2 Verificar integridade do doc 01: sumário e âncoras internas resolvem (nenhum link quebrado após remoção do §3.2), tabelas de props dos componentes inalteradas, e `openspec status --change adapt-docs-to-publications` mostra progresso completo

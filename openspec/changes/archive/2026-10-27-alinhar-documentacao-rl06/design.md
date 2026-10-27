# Design

## Context

Ver `proposal.md - Why`. O código atual é a fonte do comportamento: a Data de liberação é herdada da Release e exibida como somente leitura (`app/components/lancar-chamadas/Formulario.vue:253-259,546`); a importação reutiliza `validarChamada` (`server/utils/lancar-chamadas.ts:1294`); o KPI do Painel inclui `Publicado` (`shared/painel-executivo.ts:287-299`), enquanto a Esteira usa outra fórmula; `GET /api/usuarios` só exige `filtrar` quando há filtros reais e `GET /api/usuarios/emails` exige `visualizar` + `buscar`. A documentação viva ainda descreve parte disso de forma antiga.

## Goals / Non-Goals

**Goals:**

- Alinhar as três specs afetadas ao comportamento atual, sem mudar comportamento.
- Corrigir docs vivos para que não contradigam código/specs.
- Preservar registros históricos (changelogs, relatório RL06, migration 02) com notas de snapshot em vez de reescrevê-los.

**Non-Goals:**

- Alterar código, migrations, banco, testes de comportamento ou contratos de API.
- Editar `server/migration/02_seed.sql` (migration já aplicada).
- Reescrever os achados históricos do RL06.
- Introduzir nova capability ou novo requisito funcional.

## Decisions

1. **Data de liberação somente leitura.** O código e o commit `f9ea30e` já definem o campo como somente leitura; a spec e `docs/15` passam a refletir isso. Alternativa descartada: tornar editável, o que exigiria mudança de código e de testes, fora do escopo documental.
2. **Importação com a mesma validação da criação.** `docs/15` deixa de dizer que a planilha não exige segunda-feira; a spec de importação explicita a regra e o preview inválido. Nenhuma alteração no importador.
3. **KPI do Painel: mesmo universo, fórmula própria.** Mantém-se o código atual (inclui `Publicado` no numerador e denominador) e corrige-se a redação de `painel-executivo/spec.md` e `docs/17`, que diziam “mesma regra da Esteira”. Alternativa descartada: mudar a fórmula para igualar à Esteira, pois alteraria indicador de produto.
4. **Catálogo RBAC fiel ao código.** A spec passa a distinguir paginação isolada (`visualizar`) de filtros reais (`filtrar`) e a exigir `visualizar` + `buscar` em `/api/usuarios/emails`. Alternativa descartada: relaxar a rota de e-mails, o que reduziria a checagem de segurança.
5. **Completar a tabela de auditoria.** As 15 rotas sumariadas de Parceiros/Release/Esteira entram na tabela e os dois caminhos duplos (`esqueci-senha`, `seguranca/liberar`) são representados de forma que a soma feche 59. A conferência é feita contra as chamadas reais de `registrarAuditoria`; se algum ponto não for enumerável sem ambiguidade, a alternativa é um título/nota explicitando “42 detalhadas + 15 sumariadas”, mas a preferência é a tabela completa.
6. **Histórico não se reescreve.** `docs/07 §12` recebe nota de que os números 88/460 são de um snapshot antigo e a matriz atual é 92/67/41/14 (214/368); o RL06 recebe nota de snapshot com as contagens atuais; `docs/bd/02_seed.sql` recebe nota sobre o cabeçalho histórico da migration 02. Os changelogs e o texto original do RL06 permanecem intactos.

## Risks / Trade-offs

- [Tabela de auditoria divergir da contagem real] → conferir linha a linha contra `registrarAuditoria` e validar a soma 59; em caso de ambiguidade, usar a nota transparente.
- [Specs MODIFIED perderem detalhe no archive] → copiar o bloco inteiro da spec principal, alterando apenas as passagens indicadas, e validar com `openspec validate --strict`.
- [Números históricos de `docs/07` serem confundidos com atuais] → nota explícita no início da §12, sem apagar o registro da época.
- [Edição de documento com encoding legado] → revisar o diff e manter o encoding existente; não tocar no conteúdo histórico além da nota.

## Migration Plan

1. Criar os deltas das três specs e as correções dos docs vivos.
2. Rodar `openspec validate "alinhar-documentacao-rl06" --type change --strict` e `openspec validate --specs`.
3. Aplicar via `/opsx-apply`, revisar o diff documental e arquivar com `/opsx-archive` (sincroniza as specs principais).
4. Rollback: reverter o commit documental; nenhum dado/schema é alterado.

## Open Questions

Nenhuma. A decisão de produto do A-08 (somente leitura) está confirmada e não altera o comportamento atual.

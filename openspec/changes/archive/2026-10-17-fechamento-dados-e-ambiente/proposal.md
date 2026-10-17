# Proposal

## Why

Última etapa do plano de correção do RL03 (`docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`,
Etapa 7 — Dados e ambiente): resta alinhar um **dado vivo** no ambiente de desenvolvimento (a matriz do
perfil **Editor** está em 42/99 em vez dos 45/99 do seed, provavelmente resíduo de testes destrutivos de
QA), **validar o comportamento de produção** (IP real na trilha e ausência de `stack` nas respostas) e
**registrar o planejamento** da interação `CASCADE` × `RESTRICT` para quando o conteúdo público for
implementado. Nenhuma dessas ações altera o comportamento especificado do sistema.

## What Changes

- **Dados (`RL03-DAD-01`):** restaurar a matriz do perfil **Editor** para o seed (**45/99** — o módulo
  `release-week` perdeu as ações fixas `visualizar`/`criar`/`alterar`) e confirmar que Administrador
  (99), Revisor (21) e Leitor (6) permanecem corretos. **Não** usar migration: a matriz é editável e
  uma migration sobrescreveria ajustes legítimos; a correção é operacional (re-gravar via API/SQL
  pontual).
- **Ambiente (`RL03-B-21/22`):** verificar no build de produção que a trilha registra o **IP real** da
  conexão (não `0.0.0.0`) e que as respostas de erro **não expõem `stack`**; se a verificação falhar,
  registrar o achado (follow-up) em vez de alterar código sem causa reproduzível.
- **Planejamento (`RL03-M-14`):** documentar a interação de FKs `entregas_itens.release_id →
  release_week` (`ON DELETE CASCADE`) × `historico_esteira_revisao.entrega_item_id → entregas_itens`
  (`ON DELETE RESTRICT`) e a abordagem recomendada para exclusão de releases quando o conteúdo público
  for construído.
- **Sem mudança de código de aplicação** e **sem migration**.
- **`skip_specs`:** a change não altera requisitos de nenhuma capability (é manutenção/verificação/
  documentação), por isso opta por `skip_specs: true`.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

(nenhuma) — a change opta por `skip_specs: true`: o alinhamento do dado do Editor já é o estado
previsto pela spec `migracoes-banco` (seeds 99/45/21/6), a verificação de produção não muda contrato e
a nota `CASCADE`×`RESTRICT` é documentação de apoio para um módulo ainda roadmap.

## Impact

- **Dados:** matriz de `permissoes_perfil` do perfil Editor (restauração operacional; sem DDL).
- **Ambiente:** verificação do build de produção (`.output`/`node .output/server/index.mjs`) — sem
  alteração de código prevista.
- **Documentação:** nota de arquitetura (interação de FKs do conteúdo público) em `docs/02` (ou
  documento de apoio equivalente).
- **Fora de escopo:** implementar o conteúdo público (Releases/Manuais/Escopos) — roadmap.

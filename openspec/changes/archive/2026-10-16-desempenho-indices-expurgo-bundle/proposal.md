# Proposal

## Why

A auditoria RL03 (`docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, Etapa 4 — achados
`RL03-M-07` a `RL03-M-13` e `RL03-B-12/14/16`) encontrou gargalos estruturais e falta de
manutenção automática: as listagens de auditoria e do log de segurança ordenam a tabela inteira
(`filesort`) por usarem desempate `id DESC` sem índice composto; a listagem de usuários ordena por
`nome_completo` sem índice e a busca usa `LIKE '%…%'` inindexável; as tabelas `sessoes`,
`token_blacklist` e `seguranca_eventos_login` crescem **sem expurgo**; o `jspdf` (~136 KB gzip) é
carregado no bundle inicial de três telas; o pool não define `connectTimeout`/`acquireTimeout`; a
trilha aceita `detalhes` de até 16 MB; e há desperdícios de escrita (INSERT em loop, N+1, contagem
de vínculos a cada leitura). Nenhum desses itens quebra a operação hoje (volumetria pequena), mas
todos escalam mal com o uso real.

## What Changes

- **Índices aditivos (migration 11):** `auditoria (data_hora DESC, id DESC)`,
  `seguranca_eventos_login (ocorrido_em DESC, id DESC)` e `usuarios (nome_completo)` — eliminando o
  `filesort` das paginas/ordenações e reduzindo a busca.
- **Expurgo automático (migration 11):** eventos diários do MariaDB removem sessões expiradas e
  revogadas (`sessoes`), tokens vencidos (`token_blacklist`) e eventos de login antigos
  (`seguranca_eventos_login`, janela fixa de 90 dias).
- **Bundle:** `jspdf`/`jspdf-autotable` passam a ser carregados por `await import(...)` no clique,
  nos 4 geradores de PDF, removendo-os do bundle inicial das telas de usuários/auditoria/perfis.
- **Pool:** adicionar `connectTimeout` e `acquireTimeout` (configuráveis, com defaults).
- **Trilha:** limitar `detalhes` a um teto realista (ex.: 8 KB).
- **Escritas menores:** INSERT multi-row da matriz de permissões, contagem de vínculos sob demanda
  e `migrarSenhasSmtp` em lote (uma consulta/UPDATE único) — itens de melhoria sem mudança de
  comportamento.
- **Sem `BREAKING`:** resultados e contratos de API permanecem idênticos.

## Capabilities

### New Capabilities

(nenhuma)

### Modified Capabilities

- `migracoes-banco`: novo requisito — sessões expiradas/revogadas, tokens vencidos e log de
  segurança antigo SHALL ser expurgados automaticamente por rotina agendada no banco, para que essas
  tabelas não cresçam indefinidamente.

## Impact

- **Banco:** nova migration `server/migration/11_indices_e_expurgo.sql` (índices + 3 eventos de
  expurgo); usa as colunas/tabelas existentes (`sessoes`, `token_blacklist`,
  `seguranca_eventos_login`, `auditoria`, `usuarios`).
- **Backend:** `server/utils/db.ts` (timeouts do pool), `server/utils/audit.ts` (teto de `detalhes`),
  `server/utils/perfis.ts` (INSERT multi-row + vínculos sob demanda), `server/utils/usuarios.ts`
  (`migrarSenhasSmtp` em lote).
- **Frontend:** `app/components/{usuarios,auditoria,perfis}/gerarPdf*.ts` (4 arquivos) — import
  dinâmico do `jspdf`/`jspdf-autotable`.
- **Fora de escopo:** os demais achados do RL03 (documentação e UX) pertencem às Etapas 5/6.

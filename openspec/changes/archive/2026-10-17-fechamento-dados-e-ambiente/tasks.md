# Tasks

## 1. Dados: restaurar a matriz do Editor (RL03-DAD-01)

- [x] 1.1 Restaurar a linha do Editor em `release-week` ao seed (`pode_visualizar=1, pode_incluir=1, pode_editar=1, pode_excluir=0, extras=["publicar","arquivar","download","exportar"]`) — via `PUT /api/perfis/:editorId/permissoes` com a matriz do seed ou `UPDATE` pontual. Verificação: `GET /api/perfis` mostra Editor **45/99**.
- [x] 1.2 Confirmar que os demais perfis permanecem intactos. Verificação: `GET /api/perfis` → Administrador 99, Revisor 21, Leitor 6; nenhum perfil adicional alterado.
- [x] 1.3 Se a divergência do Editor reaparecer sem edição manual, registrar como bug de código (follow-up). Verificação: nota/registro do achado no relatório, se aplicável.

## 2. Ambiente: validação no build de produção (RL03-B-21/22)

- [x] 2.1 Gerar o build de produção (`npm run build`) e subir `.output` (`node .output/server/index.mjs`) apontando para o banco local. Verificação: servidor de produção responde.
- [x] 2.2 Confirmar que as respostas de erro de produção **não** trazem `stack`. Verificação: uma rota sem sessão (`GET /api/usuarios`) → `401` sem array `stack` no corpo.
- [x] 2.3 Conferir o IP registrado na trilha/log de segurança em produção. Verificação: `GET /api/auditoria` (ou `seguranca/estado`) exibe IP da conexão (não `0.0.0.0`); se permanecer `0.0.0.0`, registrar como follow-up (sem alterar código sem causa reproduzível).

## 3. Planejamento: interação CASCADE × RESTRICT (RL03-M-14)

- [x] 3.1 Registrar em `docs/02` a interação de FKs do conteúdo público: `entregas_itens.release_id → release_week` (`ON DELETE CASCADE`) × `historico_esteira_revisao.entrega_item_id → entregas_itens` (`ON DELETE RESTRICT`) e a abordagem recomendada (apagar o histórico antes, em transação, ou trocar a FK para `CASCADE`/`SET NULL`) quando a exclusão de releases for implementada. Verificação: o trecho existe e cita as duas FKs.

## 4. Verificação integrada e documentação

- [x] 4.1 Rodar `npm run build`. Verificação: conclui sem erro.
- [x] 4.2 Rodar `openspec validate --specs` e revisar os dados/docs. Verificação: 30/30 specs válidas; Editor 45/99; nota `CASCADE`×`RESTRICT` presente.
- [x] 4.3 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, marcando `RL03-DAD-01`, `RL03-B-21/22` e `RL03-M-14` como corrigidos (com a data e a change) na Etapa 7. Verificação: as linhas da Etapa 7 constam como corrigidas.

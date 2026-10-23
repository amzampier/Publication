# Tasks

## 1. Migration e backfill

- [x] 1.1 Criar `server/migration/30_anexos_midias_chamadas.sql` com backfill de `entregas_itens.imagens` via `JSON_TABLE`, deduplicando por `(entrega_item_id, url)`, preenchendo `ordem_exibicao`/`destaque_capa`/`nome_arquivo`/`tipo_mime` e usando `NOT EXISTS`; verificar em MariaDB local que o SQL executa e que cada URL vira uma linha.
- [x] 1.2 Adicionar `UNIQUE KEY uk_midias_item_url (entrega_item_id, url_arquivo)` e `KEY idx_midias_url (url_arquivo(191))` depois do backfill e documentar o rollback manual no rodapé; verificar com `SHOW INDEX FROM anexos_midias` e reexecutando a migration em cópia limpa.
- [x] 1.3 Verificar a idempotência do backfill (não duplicar linhas ao aplicar de novo) e que chamadas com JSON nulo/vazio continuam sem linhas; registrar as consultas de conferência na migration.

## 2. Modelo compartilhado

- [x] 2.1 Adicionar `ImagemChamada` (`id`, `url`, `alt`, `ordem`, `capa`, `mime`, `bytes`) e `midias` em `ChamadaModelo` em `shared/lancar-chamadas.ts`, mantendo `imagens: string[]`; verificar com `npm run typecheck`.
- [x] 2.2 Subir `MAX_IMAGENS_CHAMADA` para 100 e atualizar a mensagem de validação; verificar com `npm run test -- lancar-chamadas` e um teste de limite 100/101.
- [x] 2.3 Adicionar helpers puros para derivar nome/MIME/ordem/capa a partir da URL e testá-los em `tests/` (PNG, JPG, JPEG, WebP, GIF, extensão desconhecida); verificar com `npm run test`.

## 3. Utilitário de mídias no servidor

- [x] 3.1 Criar `server/utils/midias.ts` com `carregarMidiasPorItem(ids)` (consulta em lote ordenada por `ordem_exibicao`), `sincronizarMidias(executor, itemId, urls)` e `urlReferenciadaPorOutraChamada(url, itemId)`; verificar com testes puros de normalização e com consultas em banco local.
- [x] 3.2 Implementar o upsert por URL (`INSERT ... ON DUPLICATE KEY UPDATE`) preservando `legenda_alt`, removendo URLs ausentes e atualizando ordem/capa; verificar criando/alterando uma chamada com 3 imagens e reordenando/removendo uma.
- [x] 3.3 Integrar `sincronizarMidias` na criação/edição de `server/utils/lancar-chamadas.ts` dentro da transação, mantendo a escrita do snapshot JSON; verificar via API que `anexos_midias` e `entregas_itens.imagens` ficam coerentes.
- [x] 3.4 Atualizar a leitura (`listarChamadas`/`buscarChamada`) para carregar `midias` em lote, derivar `imagens` e cair para o JSON legado quando não houver linhas; verificar listagem/detalhe pela API antes e depois do backfill.
- [x] 3.5 Trocar a checagem de compartilhamento em `removerImagensChamadas` para `anexos_midias` com `idx_midias_url`; verificar que excluir uma chamada remove as linhas por CASCADE e preserva arquivo referenciado por outra chamada.

## 4. Frontend e documentação da feature

- [x] 4.1 Atualizar `app/components/lancar-chamadas/Midias.vue` (e mensagens do formulário) para o teto de 100 e para o texto de formatos/tamanho; verificar adicionando mais de 100 imagens e tentando salvar.
- [x] 4.2 Manter `Detalhes.vue`, `EsteiraDetalhe.vue` e cards consumindo `imagens`; verificar que a galeria continua funcionando após o save e o F5, sem regressão visual.
- [x] 4.3 Atualizar `docs/15 - Módulo Lançar Chamadas.md` (status de imagens, teto 100, persistência relacional, limpeza) e `docs/16 - Módulo Esteira de Revisão.md` (galeria lê a lista derivada); conferir que os textos batem com o comportamento.
- [x] 4.4 Atualizar `docs/bd/01 - banco_dados_mariadb.sql` com a unique key e o índice de URL em `anexos_midias`; verificar por inspeção e com `openspec validate --specs` após o sync.

## 5. Verificação integrada

- [x] 5.1 Executar `npm run lint`, `npm run test`, `npm run typecheck`, `npm run build` e `openspec validate midias-chamadas-relacionais --strict`; corrigir qualquer falha.
- [x] 5.2 Executar E2E local: criar chamada com imagens, conferir `anexos_midias`/`midias`/`imagens`, editar removendo uma imagem, excluir a chamada, testar imagem compartilhada entre duas chamadas, conferir o limite 100 e o backfill de um registro antigo; limpar os dados de teste.

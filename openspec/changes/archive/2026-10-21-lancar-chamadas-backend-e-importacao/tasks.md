# Tasks

## 1. Banco, RBAC e migração

- [x] 1.1 Criar `server/migration/24_lancar-chamadas_backend.sql` com `status` incluindo `Recusado`, `manual_titulo`, troca de `idx_entregas_chamada` por `uk_entregas_chamada` e `importar` nos extras de Administrador/Editor; verificar subindo `npm run dev` e conferindo `SHOW COLUMNS`/`SHOW INDEX` em `entregas_itens`
- [x] 1.2 Adicionar ao boot a pré-checagem de `chamada` duplicada e a verificação pós-migração de `uk_entregas_chamada` em `server/plugins/migration.ts`; verificar que uma duplicata simulada aborta o boot com exemplos e que, removida, o boot conclui
- [x] 1.3 Adicionar `importar` ao módulo `lancar-chamadas` em `app/config/perfis.ts` e `server/utils/perfis.ts`; verificar `npm run test -- tests/perfis-funcionalidades.test.ts`
- [x] 1.4 Atualizar o total esperado do catálogo para 91 no teste de perfis e conferir que Administrador/Editor recebem `importar`; verificar `npm run test -- tests/perfis-funcionalidades.test.ts`
- [x] 1.5 Atualizar `docs/07 - Perfis de Acesso (RBAC).md` com `importar`, totais 91/91, 66/91, 39/91 e 14/91; verificar comparando a matriz do documento com as contagens da tela `/admin/perfis-acesso`
- [x] 1.6 Atualizar `docs/bd/01 - banco_dados_mariadb.sql` e `docs/bd/02_seed.sql` com `manual_titulo`, `Recusado`, índice único e `importar`; verificar que o DDL/seed documentados refletem a migration 24

## 2. Backend de chamadas

- [x] 2.1 Definir no `shared/lancar-chamadas.ts` o contrato de importação/limite (se necessário) e manter os tipos da API alinhados a `ChamadaModelo`; verificar `npm run typecheck`
- [x] 2.2 Implementar `server/utils/lancar-chamadas.ts` com listagem/opções, resolução de vínculos, derivação de origem, herança de liberação, snapshots, validação e checagem de duplicidade; verificar `npm run typecheck` e testes puros do shared
- [x] 2.3 Criar `GET /api/lancar-chamadas` (com `?download=1` sob `download`) e `GET /api/lancar-chamadas/opcoes`; verificar com sessão real que a lista volta no shape da tela e que perfil sem `visualizar` recebe `403`
- [x] 2.4 Criar `POST /api/lancar-chamadas` e `PUT /api/lancar-chamadas/:id`, com `manual_titulo`, origem derivada, status `Revisar` e `409` para duplicidade; verificar criando e editando uma chamada e recarregando a lista
- [x] 2.5 Criar `PUT /api/lancar-chamadas/:id/aprovar` e `PUT /api/lancar-chamadas/:id/recusar`, com transições válidas e `publicar`/`alterar`; verificar aprovação, recusa e tentativa em status inválido
- [x] 2.6 Criar `DELETE /api/lancar-chamadas/:id` com guarda de status e remoção de imagens somente após o commit; verificar exclusão permitida e bloqueio de chamada aprovada
- [x] 2.7 Registrar auditoria em todas as escritas (`Lançar as Chamadas`, ações `Inclusão`/`Alteração`/`Exclusão`/`Homologação`) e documentar o recurso em `docs/05 - Módulo Auditoria.md`; verificar a linha gerada em `/admin/auditoria`
- [x] 2.8 Ampliar `tests/lancar-chamadas-validadores.test.ts` com casos de origem, duplicidade, datas e normalização usados pelo servidor; verificar `npm run test -- tests/lancar-chamadas-validadores.test.ts`

## 3. Importação XLSX

- [x] 3.1 Criar `app/components/lancar-chamadas/lerPlanilhaLancarChamadas.ts` com cabeçalho exato, datas do Excel/BR/ISO, tags por `;`, códigos de vínculo e classificação `pronto`/`já cadastrado`/`repetido`/`inválido`; verificar com testes unitários do classificador
- [x] 3.2 Criar `docs/modelos/modelo-importacao-lancar-chamadas.xlsx` com as 18 colunas confirmadas e uma aba de instruções; verificar abrindo o arquivo e importando-o na tela
- [x] 3.3 Implementar a importação transacional no backend (máximo 500 linhas, revalidação de todas as linhas, `Revisar`/`Desenvolvimento`, rollback total e `importar`); verificar importação válida, linha inválida e duplicata sem gravação parcial
- [x] 3.4 Criar `app/components/lancar-chamadas/Importar.vue` com upload `.xlsx`, preview, contagens, erros por linha e confirmação; verificar o fluxo completo na tela com o arquivo modelo
- [x] 3.5 Integrar a ação “Importar” ao cabeçalho/modelo com `.can('lancar-chamadas', 'importar')` e atualizar a lista após sucesso; verificar que o botão some sem a permissão
- [x] 3.6 Documentar colunas, códigos, regras e limites da importação em `docs/15 - Módulo Lançar Chamadas.md`; verificar que o documento e o modelo `.xlsx` têm as mesmas 18 colunas

## 4. Upload e ciclo de vida das imagens

- [x] 4.1 Estender `server/utils/uploads.ts` com `chamadas` e subpastas `ano/mes`, mantendo extensão canônica e nome seguro; verificar `npm run test -- tests/uploads.test.ts`
- [x] 4.2 Atualizar `POST /api/uploads` para aceitar `pasta=chamadas`, validar `ano`/`mes`, exigir `criar` ou `alterar` e auditar o destino; verificar upload válido, ano/mês inválido e `403`
- [x] 4.3 Implementar a remoção de imagens após commit, restrita a `/uploads/chamadas/`, com checagem de referência compartilhada e `unlink` best-effort; verificar exclusão de chamada, retirada na edição e preservação de imagem compartilhada
- [x] 4.4 Ajustar `Midias.vue`/formulário para enviar data URLs ao salvar e substituí-las pelas URLs retornadas antes do `POST`/`PUT`; verificar que as imagens aparecem após F5 em `uploads/chamadas/<ano>/<mes>/`
- [x] 4.5 Documentar upload, pasta, formatos, limite e limpeza de imagens em `docs/15 - Módulo Lançar Chamadas.md`; verificar que o caminho documentado bate com a URL gravada no JSON
- [x] 4.6 Atualizar `docs/02` com a migration 24, a pré-checagem de unicidade e o caminho `uploads/chamadas/<ano>/<mes>/`; verificar que o documento não cita mais `status` sem `Recusado` nem upload plano de chamadas

## 5. Integração da tela com a API

- [x] 5.1 Trocar o seed de `useLancarChamadasModelo.ts` por carga real de `GET /api/lancar-chamadas` e `GET /api/lancar-chamadas/opcoes`, com loading e erro; verificar F5, falha de rede e empty state
- [x] 5.2 Tornar `adicionar`, `atualizar`, `aprovar`, `recusar` e `excluir` assíncronos e atualizar o estado só com a resposta da API; verificar criação, edição, aprovação, recusa e exclusão pela tela
- [x] 5.3 Ajustar `Tabela.vue`, `Aprovar.vue`, `Recusar.vue`, `Exclusao.vue` e `Formulario.vue` para os retornos assíncronos, erros `400/403/404/409` e estado de salvamento; verificar que o modal permanece aberto em erro
- [x] 5.4 Exigir `download` antes de gerar PDF/CSV em `Cabecalho.vue`/`gerarPdfLancarChamadas.ts`, chamando a API com `?download=1`; verificar relatório com permissão e `403` sem ela
- [x] 5.5 Remover o dataset de demonstração e imports mortos do módulo; verificar com busca por `criarSeed`/`CATALOGOS_CHAMADAS` que não restou seed em uso
- [x] 5.6 Atualizar a seção da tela/relatórios em `docs/15 - Módulo Lançar Chamadas.md` para persistência, loading, erros e permissões; verificar o texto contra os fluxos implementados

## 6. Verificação final

- [x] 6.1 Rodar `npm run lint`, `npm run test`, `npm run typecheck` e `npm run build`; verificar que todos passam
- [x] 6.2 Executar o smoke test completo (CRUD, aprovar/recusar, upload, exclusão com arquivo, importação válida/inválida, 403 sem `importar`) e registrar o resultado na change; verificar que os arquivos de `uploads/chamadas/` e o banco ficam consistentes

> **Smoke test (2026-10-21):** lista/opções/download 200; perfil Leitor 403; criar 201 e duplicata 409;
> upload em `uploads/chamadas/2026/10/` e persistência após GET; exclusão removeu o arquivo; aprovação
> 200/Aprovado e recusa 200/Recusado (transição inválida 409); importação 200 com `Revisar`/
> `Desenvolvimento` e herança de liberação; importação inválida 400 sem gravação parcial; upload e
> importação do Leitor 403; imagem compartilhada preservada na edição e removida com o último vínculo.
> Dados temporários e arquivos de teste foram removidos do banco/uploads ao final.

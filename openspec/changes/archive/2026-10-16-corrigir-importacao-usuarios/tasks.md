# Tasks

## 1. Backend: base completa de e-mails e conflitos estruturados

- [x] 1.1 Em `server/utils/usuarios.ts`, adicionar `listarEmailsUsuarios(): Promise<string[]>` que seleciona `email_corporativo` de `usuarios` e devolve a lista de e-mails. Verificação: `npm run build` conclui sem erro.
- [x] 1.2 Criar a rota `server/api/usuarios/emails/index.get.ts` (`GET /api/usuarios/emails`) que exige `requirePermission(event, 'gestao-usuarios', 'visualizar')` e responde `{ emails }`. Verificação (E2E): com sessão de Administrador, `GET /api/usuarios/emails` → `200 { emails: [...] }` com **todos** os e-mails da base; sem sessão → `401`; com perfil sem `visualizar` → `403`.
- [x] 1.3 Em `importarUsuarios` (`server/utils/usuarios.ts:648-655`), incluir os e-mails já existentes em `data.conflictos: string[]` do `createError(400)`, mantendo `motivos` como está. Verificação (E2E): importar um lote com um e-mail já existente → `400` com `data.conflictos` contendo aquele e-mail.

## 2. Frontend: classificar contra a base completa e refletir a correção

- [x] 2.1 Em `app/components/usuarios/useUsuarios.ts`, adicionar `buscarEmailsBase()` que chama `GET /api/usuarios/emails` e devolve `string[]` (lança em falha). Verificação: `npm run build` OK e a função é o único ponto de leitura da base completa de e-mails.
- [x] 2.2 Em `app/components/usuarios/Importar.vue`, ao selecionar o arquivo, buscar a base completa de e-mails (2.1) e passá-la a `lerPlanilhaUsuarios` (em vez de `usuarios.value`); em falha da busca, exibir erro no modal e não montar a pré-visualização. Verificação (E2E): com a tabela na 1ª página, um arquivo com e-mail existente em outra página exibe "E-mail já cadastrado" e o checkbox desabilitado (não pré-selecionado).
- [x] 2.3 Em `app/components/usuarios/Importar.vue`, no tratamento do erro da API de importação, marcar como `ja-cadastrado` e desmarcar as linhas cujo e-mail esteja em `data.conflictos`, mantendo o arquivo carregado e limpando o erro quando restarem linhas importáveis. Verificação (E2E): forçar um conflito no commit → as linhas conflitantes viram "E-mail já cadastrado" (desmarcadas) e o modal permanece aberto com as demais linhas disponíveis.

## 3. Verificação integrada e documentação

- [x] 3.1 Rodar o build de produção. Verificação: `npm run build` conclui sem erro.
- [x] 3.2 Executar o roteiro E2E consolidado da importação. Verificação: (a) e-mail existente fora da página carregada → "E-mail já cadastrado"; (b) o lote de linhas válidas é importado com sucesso (não é rejeitado por linha já existente); (c) conflito reportado pela API é refletido na pré-visualização; (d) os demais estados (Repetido no arquivo, Linha inválida) e a seleção permanecem corretos.
- [x] 3.3 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, marcando `RL03-A-02` como corrigido (com a data e a change) na Etapa 2, no mesmo estilo dos encerramentos do RL02. Verificação: a linha de status da Etapa 2 consta como corrigida.

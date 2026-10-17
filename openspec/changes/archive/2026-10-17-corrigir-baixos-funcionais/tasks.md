# Tasks

> Não há runner de testes no repositório; verificação por `npm run build` + E2E no dev server
> (`localhost:3000`) e inspeção.

## 1. Exportações com feedback (M-21)

- [x] 1.1 Em `app/components/usuarios/Cabecalho.vue`, `auditoria/Cabecalho.vue` e `perfis/Cabecalho.vue`, envolver cada exportação em `try/catch` com `toast.danger` na falha e um estado de carregamento por ação. Verificar por inspeção e, se possível, simulando falha de busca/geração.

## 2. Mensagens de erro genéricas (B-09)

- [x] 2.1 Trocar os textos "Verifique a conexão com o banco…" por mensagens genéricas em `gestao-usuarios.vue:29`, `auditoria.vue:33`, `perfis-acesso.vue:31,115`, `configuracoes-globais.vue:88`, `perfis/Formulario.vue:140` e `perfis/Permissoes.vue:128,181`. Verificar por grep que não resta a frase.

## 3. Auditoria: entidade_id e data inválida (B-15/B-22)

- [x] 3.1 Em `server/utils/audit.ts`, incluir `entidade_id` no `SELECT` e no `AuditoriaRow`/mapping (`entidadeId`) da resposta. Verificar E2E: `GET /api/auditoria` devolve `entidadeId` nos registros.
- [x] 3.2 Propagar `entidadeId` no tipo de `app/components/auditoria/useAuditoriaModelo.ts` e exibi-lo no `Detalhe.vue` (linha "Entidade" quando presente). Verificar por inspeção.
- [x] 3.3 Em `server/utils/audit.ts`, validar data real (mês/dia válidos) e responder `400` para data presente porém inválida (ex.: `2026-13-99`). Verificar E2E: `GET /api/auditoria?dataInicial=2026-13-99` → `400`.

## 4. Recuperação: trilha correta (B-17)

- [x] 4.1 Em `server/api/auth/esqueci-senha/index.post.ts`, capturar o desfecho do envio e registrar o `detalhes` conforme o resultado (enviada × falha). Verificar por inspeção + E2E (e-mail não cadastrado e falha de envio).

## 5. Convite só para usuário Ativo (B-18)

- [x] 5.1 Em `server/api/convite/index.post.ts`, recusar (`400`) quando a situação não for Ativo. Verificar E2E: convite com `situacao=Inativo` → `400`; com Ativo → fluxo normal.

## 6. Busca e recarga (B-19/B-20)

- [x] 6.1 Em `app/components/ui/DataTable.vue`, adicionar prop `initialSearch` e inicializar o campo com ela; em `usuarios/Tabela.vue`/`auditoria/Tabela.vue`, passar o `busca` vigente. Verificar que o campo reflete o termo.
- [x] 6.2 Em `useUsuarios.ts` e `useAuditoriaModelo.ts`, substituir `if (carregando) return false` por uma recarga pendente executada ao concluir a carga em voo. Verificar por inspeção/E2E.

## 7. E-mail duplicado concorrente → 409 (B-21)

- [x] 7.1 Em `server/utils/usuarios.ts`, mapear `errno 1062` do `INSERT` de criação (e da importação) para `409`. Verificar E2E/inspeção.

## 8. Integração, regressão e documentação

- [x] 8.1 Rodar `npm run build` e confirmar sucesso.
- [x] 8.2 Regressão: exportações normais seguem gerando arquivos; validação de data válida segue filtrando; convite com Ativo segue gravando/enviando; busca/recarga seguem funcionando.
- [x] 8.3 Atualizar `docs/RL04 - Relatório de Qualidade Completo.md` marcando M-21, B-09, B-15, B-17, B-18, B-19, B-20, B-21 e B-22 como **CORRIGIDO** e registrando o encerramento da cauda da Etapa 3.
- [x] 8.4 Confirmar que os deltas refletem o comportamento implementado e que `openspec validate corrigir-baixos-funcionais` passa.
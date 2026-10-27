# Tasks

## 1. Baixas de UI e contrato

- [x] 1.1 Trocar `placeholder:text-slate-400` por `placeholder:text-slate-500` no `UiInput` e revisar os demais campos; verificar visualmente `/design` e o contraste AA
- [x] 1.2 Atualizar a spec de login para incluir `/admin/primeiro-acesso` na identidade das telas de autenticação; verificar `docs/08` e `layout-navigation`

## 2. Documentação de fechamento

- [x] 2.1 Atualizar `docs/qa/05-qa-ux.md` para 39 componentes e completar a lista do UI kit
- [x] 2.2 Atualizar o RL06 com contagens atuais (46 specs, 42 migrations, 39 componentes), achados fechados, M-07/I-01 aceitos e veredito “Aprovado com ressalvas (M-07)”
- [x] 2.3 Verificar que o snapshot histórico de 23/10 permanece preservado e que a Área Pública não é declarada como concluída

## 3. Testes de regressão

- [x] 3.1 Adicionar teste de filtro de status da Esteira antes de `LIMIT/OFFSET` e cobrir `Publicado` em página > 1 quando houver base de teste
- [x] 3.2 Adicionar testes de mídia por URL exata/colisão de radical e de hierarquia com perfil atual; documentar a limitação de browser real
- [x] 3.3 Adicionar teste de data herdada inválida em `M-03` e de opções remotas do formulário por API
- [x] 3.4 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; registrar os gates

## 4. Verificação final

- [x] 4.1 Rodar `openspec validate "fechar-relatorio-e-baixas-rl06" --type change --strict` e `openspec validate --specs`; revisar o diff final
- [x] 4.2 Confirmar que B-03 permanece fechado e que nenhuma alteração de schema/migration foi introduzida

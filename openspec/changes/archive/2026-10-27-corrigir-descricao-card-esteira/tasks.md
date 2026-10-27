# Tasks

## 1. Projeção do board

- [x] 1.1 Criar `COLUNAS_ESTEIRA` com `COLUNAS_LISTA` + `e.descricao_completa` e usar somente em `listarChamadasParaEsteira`; verificar que `listarChamadasPaginadas`/PDF não recebem o campo
- [x] 1.2 Verificar no board que `descricaoCompleta` chega preenchido e que `descricaoHtml` continua ausente

## 2. Verificação

- [x] 2.1 Abrir o card de uma chamada com descrição e confirmar que o texto aparece em vez de “Sem descrição.”; confirmar o fallback apenas em chamada sem descrição
- [x] 2.2 Testar a busca do board por um termo presente na descrição e medir o payload com 200 itens
- [x] 2.3 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`
- [x] 2.4 Rodar `openspec validate "corrigir-descricao-card-esteira" --type change --strict` e `openspec validate --specs`; revisar o diff final

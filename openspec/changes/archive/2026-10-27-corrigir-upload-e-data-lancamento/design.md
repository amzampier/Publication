# Design

## Contexto

O `POST /api/uploads` usa `pasta` da query para autorizar o destino **antes** de consumir o multipart (`server/api/uploads/index.post.ts`). O formulário de Chamadas monta o `FormData` com `pasta`, `ano`, `mes` e `file`, mas chamava a rota sem `?pasta=chamadas`; por isso a rota retornava `400` sem chegar ao arquivo. Os demais consumidores (logomarcas, logos, avatares) já mandam o destino na query.

A validação compartilhada de Chamadas aplica `dataPublicacaoValida` tanto à Data de lançamento quanto à Data de liberação. A regra de segunda-feira/feriado é correta para a publicação da Release; para o lançamento da chamada, o produto aceita qualquer data civil válida (o formulário já inicia com a data do dia).

## Decisão

1. **Upload:** manter o contrato do endpoint (destino na query, por segurança) e corrigir o cliente para `'/api/uploads?pasta=chamadas'`. Não mover a autorização para depois do parse nem confiar apenas no campo do corpo.
2. **Data de lançamento:** remover somente a checagem `dataPublicacaoValida(dataLancamento)` em `validarChamada`; manter `ehDataIso` e a obrigatoriedade. A Data de liberação continua validada como data de publicação, pois é herdada da Release e exibida somente leitura.
3. **Importação:** o parser já aceita qualquer data ISO de lançamento; o servidor revalida por `validarChamada`, então a mudança também libera a importação de chamadas com lançamento em qualquer dia. A Data de liberação informada continua sujeita à regra de publicação.
4. **UI/docs:** trocar o texto "Sempre segunda-feira." por uma descrição neutra e alinhar `docs/15` e os testes.

## Alternativas descartadas

- Aceitar `pasta` no corpo como fallback: a autorização precisa ocorrer antes do parse para evitar consumir multipart sem permissão; além disso, todos os outros fluxos já usam query.
- Remover a regra de segunda-feira também da Data de liberação: a liberação acompanha a publicação da Release, cuja regra é definida no módulo Release Week.
- Relaxar a validação no cliente e manter no servidor: criaria divergência entre o preview e o `400` do servidor.

## Verificação

- Teste unitário do validador: lançamento em terça/sexta válido; lançamento vazio ou ISO inválido recusado; liberação em dia não permitido continua recusada.
- Teste de importação: linha com lançamento em terça continua `pronto`.
- E2E: upload multipart com `?pasta=chamadas` responde `200`; sem `pasta` responde `400`; salvar chamada com imagem colada conclui sem o erro de destino.
- Gates: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`.

# Design

## Contexto

`anexos_midias` é a fonte de verdade das imagens da chamada. `buscarChamada` já carrega as mídias relacionais, mas `listarChamadasParaEsteira` passa `undefined` para `montarChamada`, e `COLUNAS_LISTA` não inclui a coluna legada `e.imagens`. Resultado: todo item do board fica com `imagens: []`, o card não mostra a contagem e o modal de detalhe não tem galeria.

No upload de chamadas, `gravarUpload` grava o arquivo original e, quando o `sharp` consegue processar, uma variante `-320.webp`. A miniatura é intencional e já é usada na tela de Lançar as Chamadas por `urlMiniatura`; a Esteira ainda aponta a grade para o original.

## Decisão

1. Em `listarChamadasParaEsteira`, carregar `carregarMidiasPorItem(ids)` em paralelo com os softwares e passar o mapa para `montarChamada`. Isso mantém `anexos_midias` como fonte de verdade e corrige card e detalhe sem uma segunda chamada ao abrir o modal.
2. Em `Detalhe.vue` da Esteira, usar `urlMiniatura(imagem)` na grade e na faixa de miniaturas, com o mesmo fallback `@error` usado em `LancarChamadas/Detalhes.vue`; a imagem grande continua usando o original.
3. Não alterar a geração da variante WebP nem apagar arquivos: original + miniatura é o contrato de `docs/15` e da spec de miniaturas.

## Alternativas descartadas

- Incluir `e.imagens` no `COLUNAS_LISTA`: funcionaria pelo snapshot legado, mas ignora a fonte relacional e pode divergir após edições.
- Buscar o detalhe apenas ao abrir o modal: corrigiria a galeria, mas o card continuaria sem a contagem de imagens e o board faria uma chamada extra por abertura.
- Remover a geração da miniatura: contraria a spec de miniaturas e piora o carregamento da galeria.

## Verificação

- API: `GET /api/esteira-revisao` deve devolver `itens[].imagens` preenchido para chamada com mídia; `GET /api/esteira-revisao/:id` idem.
- UI: card mostra a contagem; detalhe exibe a grade, a galeria e as miniaturas `-320.webp` com fallback ao original.
- Gates: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`.

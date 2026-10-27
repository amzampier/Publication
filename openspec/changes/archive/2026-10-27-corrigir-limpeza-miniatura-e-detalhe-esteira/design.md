# Design

## Limpeza da miniatura

`removerImagensChamadas` já calcula a variante nova via `urlMiniatura(url)`. Para os arquivos gerados antes da mudança de nomenclatura, calcular também a variante legada:

```text
/uploads/chamadas/2026/10/foto.png
  nova:    foto.png-320.webp
  legada:  foto-320.webp
```

Os dois caminhos são resolvidos dentro de `uploads/chamadas`, e ambos só são apagados se o original não estiver referenciado por outra chamada. A remoção da variante legada é best-effort e não afeta o original. Se outro arquivo compartilhava o nome legado por colisão, ele perde apenas a miniatura e usa o original como fallback.

## Detalhe da Esteira

A listagem continua enxuta. Ao abrir a inspeção, a página busca `GET /api/esteira-revisao/:id`, que usa `buscarChamada` e inclui `descricaoCompleta`, HTML sanitizado, solução e links. O modal abre com o item completo; em falha, mantém o item resumido e mostra toast.

Após aprovar/recusar/reabrir/publicar/suspender, se o modal estiver aberto para o mesmo item, o detalhe é refeito para refletir status e histórico sem perder a descrição.

## UI

Trocar o rótulo `Descrição completa` por `Descrição do Resumo` na seção Conteúdo do `Detalhe.vue` da Esteira. O campo de origem continua `descricaoCompleta`.

## Verificação

- E2E: excluir uma imagem com miniatura legada e confirmar que os dois arquivos somem.
- E2E: abrir a inspeção de uma chamada com descrição/solução e confirmar o texto e os rótulos.
- Gates: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`.

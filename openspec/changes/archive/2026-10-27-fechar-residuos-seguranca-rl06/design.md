# Design

## C-01 — miniatura e sessão

### Nome único

`gravarUpload` grava o original e a variante com o nome completo do original:

```text
original:  imagem.png
miniatura: imagem.png-320.webp
```

`urlMiniatura` passa a devolver `${url}-320.webp`. A rota, ao receber um caminho terminado em `-320.webp`, remove apenas esse sufixo e consulta `anexos_midias` por `url_arquivo = ?` exato. Não há mais `LIKE base.%`.

Consequências:

- `imagem.png-320.webp` autoriza apenas `imagem.png`.
- `imagem.jpg-320.webp` autoriza apenas `imagem.jpg`.
- Miniaturas antigas no formato `imagem-320.webp` deixam de ser autorizadas; o `<img @error>` do cliente carrega o original. Não há migration nem backfill.

### Sessão

A rota troca `getSessionUser` por `obterSessaoValida` e só autoriza a pré-visualização administrativa quando `!sessao.provisoria`. O gate anônimo permanece: item `Publicado`, `publicado_em <= NOW(6)` e vínculo pai publicado/não arquivado.

## C-02 — importação nunca publica

Os três parsers de planilha marcam `Publicado` como linha inválida. Os três utilitários de importação rejeitam a linha antes da gravação e devolvem `400` com os motivos; nenhuma linha é gravada. Assim, a importação não publica, não dispara cascata e não precisa de `data_aprovacao`.

A publicação continua restrita aos fluxos explícitos (`POST`/`PUT` com `publicar` ou endpoint `/publicar`).

## M-09 — hierarquia do perfil atual

`validarHierarquiaPerfil` passa a aceitar o perfil atual do alvo além do perfil novo:

- `PUT /api/usuarios/:id`: busca o alvo; valida o perfil atual sempre; se `perfil` vier no body, valida também o novo.
- `POST /api/convite`: para conta existente, consulta o perfil real do alvo e valida esse perfil antes de resetar a senha; para conta nova, valida o perfil do payload.
- Quem tem `perfis-acesso/permissoes` ou `perfis-acesso/alterar` mantém o bypass administrativo.

## Alternativas descartadas

- Coluna `url_miniatura`: exigiria migration; descartada por decisão do produto.
- Rejeitar importação inteira por `Publicado` no cliente apenas: inseguro; o servidor também rejeita.
- Exigir `publicar` para importar `Publicado`: o produto decidiu que importação nunca publica.
- Reset livre de senha para qualquer alvo: mantém account takeover; descartado.

## Verificação

- Unitários: `urlMiniatura`, nome da miniatura, parsers de importação e hierarquia com perfil atual.
- E2E: importação `Publicado` nas três rotas → `400` e nada gravado; reset/convite de alvo superior → `403`.
- Gates: `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`, `openspec validate`.

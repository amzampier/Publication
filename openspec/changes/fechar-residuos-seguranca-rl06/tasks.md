# Tasks

## 1. C-01 — mídia

- [x] 1.1 Alterar `urlMiniatura` para `<url>-320.webp` e `gravarUpload` para gravar a variante com o nome completo do original
- [x] 1.2 Autorizar miniatura pela URL exata do original na rota de mídia; trocar a sessão por `obterSessaoValida` e bloquear `provisoria`
- [x] 1.3 Testar nomes de miniatura, colisão de radicais e fallback ao original; E2E de acesso anônimo e sessão revogada

## 2. C-02 — importação

- [x] 2.1 Marcar `Publicado` como inválido nos parsers de Release/Manual/Escopo
- [x] 2.2 Rejeitar `Publicado` nos três utilitários de importação antes de qualquer gravação; manter `400` com motivos
- [x] 2.3 Atualizar testes de parser e E2E das três rotas: `Publicado` → `400`, zero gravações

## 3. M-09 — hierarquia

- [x] 3.1 Estender `validarHierarquiaPerfil` para validar o perfil atual do alvo
- [x] 3.2 Aplicar no `PUT /api/usuarios/:id` e no convite de conta existente; preservar o bypass de `perfis-acesso`
- [x] 3.3 Adicionar testes de perfil atual e E2E de reset/convite de alvo superior → `403`

## 4. Verificação final

- [x] 4.1 Atualizar `docs/12`, `docs/13`, `docs/14` sobre importação sem `Publicado`
- [x] 4.2 Rodar `npm run test`, `npm run lint`, `npm run typecheck`, `npm run build`
- [x] 4.3 Rodar `openspec validate "fechar-residuos-seguranca-rl06" --type change --strict` e `openspec validate --specs`; revisar o diff (sem schema/migrations/segredos)

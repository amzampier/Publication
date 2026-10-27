# Tasks

## 1. Upload da imagem colada

- [x] 1.1 Corrigir `enviarImagem` em `Formulario.vue` para chamar `POST /api/uploads?pasta=chamadas`; manter `ano`, `mes` e `file` no multipart e verificar upload com e sem `pasta` na query
- [x] 1.2 Revisar o texto do endpoint de upload para não sugerir que o destino do corpo é suficiente; verificar que a autorização continua antes do parse

## 2. Data de lançamento

- [x] 2.1 Remover a checagem de segunda-feira/próximo dia útil de `dataLancamento` em `validarChamada`, mantendo obrigatoriedade e ISO válido; manter a mesma regra para `dataLiberacao`
- [x] 2.2 Atualizar o texto de ajuda do formulário e `docs/15` para refletir a Data de lançamento livre e a Data de liberação herdada da Release
- [x] 2.3 Atualizar os testes do validador e do parser de importação para aceitar lançamento em qualquer dia e continuar recusando liberação fora da regra

## 3. Verificação final

- [x] 3.1 Rodar `npm run test`, `npm run lint`, `npm run typecheck` e `npm run build`; corrigir regressões
- [x] 3.2 Rodar `openspec validate "corrigir-upload-e-data-lancamento" --type change --strict` e `openspec validate --specs`; revisar o diff final (sem schema/migrations nem segredos)

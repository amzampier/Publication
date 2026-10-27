# Proposal

## Why

Dois bloqueios no cadastro de Chamadas: (1) uma imagem colada com `Ctrl` + `V` é enviada no salvar para `POST /api/uploads` sem o destino na query, e o endpoint responde `400` antes de ler o multipart; (2) a Data de lançamento é recusada quando não cai em segunda-feira ou no próximo dia útil, mas essa restrição pertence à publicação da Release, não ao lançamento da chamada.

## What Changes

- Corrigir o envio das imagens da chamada para `POST /api/uploads?pasta=chamadas`, mantendo `ano`/`mes` no multipart.
- Remover a exigência de segunda-feira/próximo dia útil da **Data de lançamento**; ela continua obrigatória e precisa ser uma data ISO válida. A **Data de liberação** permanece herdada da Release e sujeita à regra da Release Week.
- Atualizar o texto de ajuda do formulário, a documentação do módulo e os testes do validador/importação.
- Nenhuma alteração de schema, migrations ou dados.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `lancar-chamadas`: a validação do formulário e da importação passa a aceitar qualquer data civil válida na Data de lançamento, sem a regra de segunda-feira.

## Impact

- Cliente: `app/components/lancar-chamadas/Formulario.vue` (URL do upload e texto de ajuda).
- Regras compartilhadas: `shared/lancar-chamadas.ts` (`validarChamada`).
- Documentação: `docs/15 - Módulo Lançar Chamadas.md`.
- Testes: `tests/lancar-chamadas-validadores.test.ts` e `tests/lancar-chamadas-import-parser.test.ts` (quando aplicável).
- Servidor/banco: sem mudança de rota, schema ou migration; o endpoint de upload continua exigindo `pasta` na query antes do parse.

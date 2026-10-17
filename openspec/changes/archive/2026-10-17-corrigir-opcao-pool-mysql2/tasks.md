# Tasks

## 1. Correção do pool mysql2

- [x] 1.1 Em `server/utils/db.ts`, remover a opção `acquireTimeout` (e a leitura de `DB_ACQUIRE_TIMEOUT`) do `createPool`, mantendo `connectTimeout`. Verificação: `npm run build` OK; grep sem `acquireTimeout` no `db.ts`.
- [x] 1.2 Em `.env.example`, documentar `DB_CONNECT_TIMEOUT` (ms) com o default `10000`. Verificação: `.env.example` cita `DB_CONNECT_TIMEOUT`.

## 2. Verificação e documentação

- [x] 2.1 Rodar `npm run build` e subir o build de produção (`node .output/server/index.mjs`) com as env do `.env` e `NODE_ENV=production`. Verificação: o boot **não** emite `Ignoring invalid configuration option ... acquireTimeout`.
- [x] 2.2 Rodar `openspec validate --specs` e confirmar que o app responde. Verificação: 30/30 specs válidas; servidor de produção responde `401` em rota sem sessão.
- [x] 2.3 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, ajustando a ressalva da Etapa 7 (sobre `acquireTimeout`) para corrigida, citando a change. Verificação: a ressalva consta como corrigida.

# Design

## Context

Ver `proposal.md` para a motivação.

- `server/utils/db.ts:26-27` — `connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000` e
  `acquireTimeout: Number(process.env.DB_ACQUIRE_TIMEOUT) || 10000`.
- `node_modules/mysql2` **3.24.6**: `Connection.d.ts:159` declara `connectTimeout?: number;` e
  **não** declara `acquireTimeout` — daí o aviso `Ignoring invalid configuration option ...`.
- `.env.example` documenta `DB_POOL_LIMIT`/`DB_POOL_QUEUE_LIMIT`, mas não `DB_CONNECT_TIMEOUT`.

## Goals / Non-Goals

**Goals:**
- Eliminar o aviso de configuração inválida e a opção sem efeito.
- Manter o `connectTimeout` (válido) e documentá-lo.

**Non-Goals:**
- Não implementar um timeout customizado de aquisição de conexão (o `queueLimit` já limita a fila;
  uma espera com timeout exigiria um wrapper e está fora deste ajuste).
- Não alterar limites do pool (`connectionLimit`/`queueLimit`).

## Decisions

### D1 — Remover `acquireTimeout`
Retirar a linha `acquireTimeout: ...` do `createPool`. O mysql2 v3 não reconhece a opção; a espera por
uma conexão livre é regida pelo `queueLimit` (rejeita quando a fila enche) e não por um `acquireTimeout`.

- **Por que não** manter e silenciar o aviso: seria manter uma opção que não faz nada e que pode virar
  erro em versões futuras — pior que removê-la.

### D2 — Manter `connectTimeout` e documentar
`connectTimeout` é válido e útil (limita o tempo de estabelecer a conexão TCP). Adicionar
`DB_CONNECT_TIMEOUT` ao `.env.example` com o default (10000 ms).

### D3 — Sem migration
Ajuste de código/config apenas.

## Risks / Trade-offs

- **[Perda do "acquire timeout"]** → não havia efeito real (opção ignorada); o `queueLimit` continua
  limitando a fila. Sem regressão.
- **[Documentação]** → `.env.example` passa a citar `DB_CONNECT_TIMEOUT`.

## Migration Plan

- Sem migration. Deploy de código/config.
- Verificação: `npm run build` + boot de produção sem o aviso `invalid configuration option`.

## Open Questions

(nenhuma)

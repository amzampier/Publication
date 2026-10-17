# Design

## Context

Ver `proposal.md` para a motivação (`RL03-A-02`).

Estado atual relevante (leitura somente):

- `app/components/usuarios/Importar.vue:58-61` chama `lerPlanilhaUsuarios(arquivo, usuarios.value.map((u) => u.email))` — `usuarios.value` é apenas a **página corrente** (20 por padrão).
- `app/components/usuarios/useUsuarios.ts:196` guarda só a página retornada por `GET /api/usuarios`; já existe `buscarParaExportacao()` (linhas 233-245) que busca o **conjunto completo** via `exportar=1`.
- `app/components/usuarios/lerPlanilhaUsuarios.ts:42-107` já recebe `emailsNaBase: Iterable<string>` e classifica `ja-cadastrado` por comparação case-insensitive — a assinatura não precisa mudar.
- `server/utils/usuarios.ts:641-656` (`importarUsuarios`) revalida a unicidade contra o banco e, em conflito, lança `400` com `data.motivos` contendo `E-mail já cadastrado: <email>.` (a lista `duplicados` é calculada internamente, mas não exposta de forma estruturada).
- `server/api/usuarios/index.get.ts` já expõe `exportar=1` (até `TETO_EXPORTACAO = 10_000`), sob `gestao-usuarios`/`visualizar`.

## Goals / Non-Goals

**Goals:**
- Classificar "E-mail já cadastrado" contra a **base completa**, independentemente da página/filtro vigentes.
- Refletir na pré-visualização um conflito surgido entre a pré-visualização e o commit, permitindo reenviar as demais linhas sem recarregar o arquivo.
- Manter intactos os demais comportamentos da importação.

**Non-Goals:**
- Não alterar a gravação atômica nem a revalidação server-side (o servidor continua recusando lotes com conflito).
- Não introduzir importação incremental/parcial no servidor (a atomicidade permanece; a correção é de pré-visualização).
- Não tratar os demais achados do RL03.

## Decisions

### D1 — Obter a base completa por um endpoint leve dedicado de e-mails
Adicionar `listarEmailsUsuarios()` em `server/utils/usuarios.ts`
(`SELECT email_corporativo FROM usuarios`) e uma rota `GET /api/usuarios/emails`
(`server/api/usuarios/emails/index.get.ts`) que responde `{ emails: string[] }`, protegida por
`requirePermission(event, 'gestao-usuarios', 'visualizar')`. O cliente busca essa lista ao
selecionar o arquivo e a repassa a `lerPlanilhaUsuarios` no lugar de `usuarios.value`.

- **Por que não** reusar `exportar=1` (conjunto completo de usuários): funciona, mas devolve os
  registros completos (todos os campos) apenas para extrair e-mails — over-fetch desnecessário.
  Um endpoint dedicado devolve só as strings, com payload muito menor e intenção explícita.
- **Alternativa considerada:** reaproveitar `buscarParaExportacao()` no cliente — menos código,
  porém trafega linhas inteiras em vez de e-mails; descartada por eficiência.
- **Resiliência:** se a busca dos e-mails falhar, o modal SHALL exibir erro e não classificar o
  arquivo (evita falso "Pronto" por base incompleta). A tela já trata falhas de API sem simular
  dados.

### D2 — Expor os e-mails em conflito no erro da API e refletir na pré-visualização
Em `importarUsuarios` (`server/utils/usuarios.ts`), incluir os e-mails já existentes no
`data.conflictos: string[]` do `createError(400)` (além de `motivos`, mantidos para o texto).
No cliente (`Importar.vue`), ao capturar o erro, marcar as linhas cujo e-mail esteja em
`data.conflictos` como `ja-cadastrado` e desmarcá-las, limpando o estado de erro quando houver
linhas ainda importáveis e mantendo o arquivo carregado.

- **Por que:** hoje o erro é apenas textual e o usuário precisa recarregar o arquivo; com a
  classificação contra a base completa (D1) o conflito é raro (corrida), mas quando ocorre a
  pré-visualização deve refletir a correção automaticamente.
- **Alternativa considerada:** o cliente fazer parsing das strings de `motivos` — frágil;
  preferimos um campo estruturado.

### D3 — Sem migration
Usa a coluna `usuarios.email_corporativo` (única, migration 01). Nenhuma DDL nova.

## Risks / Trade-offs

- **[Endpoint devolve todos os e-mails]** → base grande implica lista maior; e-mails são strings
  curtas e a operação é restrita a administradores com `visualizar`. Aceitável.
- **[Corrida entre pré-visualização e commit]** → mitigada por D2 (a correção é refletida), sem
  mudar a atomicidade do servidor.
- **[Dependência de um novo endpoint]** → coberto por `requirePermission` e por teste E2E;
  o cliente trata falha sem classificar.
- **[Regressão nos estados da pré-visualização]** → os quatro estados e a seleção permanecem; as
  mudanças só alteram a fonte da lista de e-mails e a reação ao erro.

## Migration Plan

- Deploy apenas de código (sem migration). Ordem: `server/utils/usuarios.ts` (função +
  `data.conflictos`) → rota `GET /api/usuarios/emails` → cliente (`useUsuarios`/`Importar.vue`).
- Rollback: reverter os commits; nenhum dado é migrado.
- Verificação: E2E conforme `tasks.md` (e-mail fora da página → "já cadastrado"; lote não
  rejeitado por linha já existente; conflito refletido) + `npm run build`.

## Open Questions

(nenhuma)

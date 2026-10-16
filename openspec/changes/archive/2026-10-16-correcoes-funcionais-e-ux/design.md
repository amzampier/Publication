# Design

## Context

Ver `proposal.md` — Why. Pontos de código já mapeados: `server/utils/usuarios.ts` (`criarUsuario`/`atualizarUsuario` leem `dados.avatar`, mas as rotas não repassam `avatar`); `server/utils/rateLimit.ts` (`limitePorMinuto` ignora `ativo`); `server/utils/audit.ts` (`data_hora <= '<data> 23:59:59'`); `server/utils/perfis.ts` (`'descricao' in dados` trata `undefined` como `''`); `server/api/auth/login` valida só `usuarios.situacao`; `app/components/usuarios/Convite.vue` (`senhaExistente = false`); `server/api/uploads/index.post.ts` grava recurso fixo "Logomarcas"; `app/config/navigation.ts` (`conta.perfil = 'Super Admin'`; `notificacoesIniciais` fictícias); `app/composables/useAuth.ts` (429 como `toast.warning`); `app/components/ui/{Checkbox,DataTable,DatePicker,ToastContainer}.vue` (tokens/aria).

## Goals / Non-Goals

**Goals:** corrigir as divergências M-01…M-21 e B-01…B-09 da Etapa 4; manter contratos e RBAC.

**Non-Goals:** performance (Etapa 5) e documentação (Etapa 6); revogação/segredos (concluídos na Etapa 3); conteúdo dos módulos ainda não construídos.

## Decisions

### D1 — Avatar no POST/PUT de usuários (M-01)
Incluir `avatar` nos corpos repassados por `server/api/usuarios/index.post.ts` e `[id]/index.put.ts` e nos tipos de `criarUsuario`/`atualizarUsuario`. `normalizarAvatar` já existe e `PATCH /eu` já persiste.

### D2 — Rate limit honra `ativo` (M-02)
`limitePorMinuto` passa a ler `ativo` junto de `limite_requisicoes_minuto`; com `ativo = false`, `exigirRateLimit` não conta nem rejeita (o cache de 60s já é invalidado no save).

### D3 — Expurgo de auditoria por evento agendado (M-03)
MariaDB não tem triggers agendados (trigger é por DML); o mecanismo correto é o **Event Scheduler**. A migration `10_*.sql` cria:

```sql
CREATE EVENT IF NOT EXISTS ev_expurgo_auditoria
  ON SCHEDULE EVERY 1 DAY
  STARTS (TIMESTAMP(CURRENT_DATE) + INTERVAL 1 DAY + INTERVAL 3 HOUR)
  DO
    DELETE a FROM auditoria a
    JOIN configuracoes_globais c ON c.id = 'config_default'
    WHERE a.data_hora < DATE_SUB(NOW(6), INTERVAL c.dias_retencao_auditoria DAY);
```

No boot, um passo verifica `@@event_scheduler`; se `OFF`, tenta `SET GLOBAL event_scheduler = ON` (best-effort) e registra aviso quando não puder. **Trade-off:** exige privilégio `EVENT` e o scheduler habilitado — documentado no rollback da migration e no `docs/02`.

### D4 — Convite sempre com nova provisória (M-04)
A spec deixa de exigir a exibição da senha vigente (o modelo guarda só hash). `Convite.vue` remove o ramo morto `senhaExistente`/redefinir; o campo de senha parte vazio e **Gerar** produz a provisória. O servidor já substitui o hash no find-or-create.

### D5 — Situação do perfil (M-05)
`buscarUsuarioPorEmail`/`buscarUsuarioPorId` passam a trazer `p.situacao` (perfil). O login recusa (`403`) quando o perfil não é `Ativo`, além da checagem do usuário. `resolverPerfilId` (usuarios) e a resolução de perfil no convite passam a exigir perfil `Ativo` (`400` caso contrário).

### D6 — Janela de data inclusiva (M-06)
Trocar o limite superior de `data_hora <= '<data> 23:59:59'` por `data_hora < DATE_ADD('<data>', INTERVAL 1 DAY)` (exclui o início do dia seguinte), capturando microssegundos.

### D7 — Atualização parcial de perfil (M-21)
A rota `PUT /api/perfis/:id` monta o patch apenas com os campos **presentes** no corpo; `atualizarPerfil` trata campo ausente como "manter" (hoje `'descricao' in dados` é verdadeiro com `undefined`).

### D8 — Design system: acessibilidade, tokens e responsividade (B-01…B-08)
- `ToastContainer`: `aria-label="Fechar"` no botão; contêiner com margem/largura que não corta em <404px.
- `DatePicker`: `aria-label` no botão de limpar.
- `AppHeader`: `aria-label` no gatilho do Account.
- `DataTable`: o seletor "Linhas por página" ganha rótulo associado e indicador de foco (ou passa a usar o kit).
- `Checkbox`: erro em `rose-700`; anel de foco `brand-focus` em todas as variantes.
- `brand-tokens`: remover hex `#2161ef`/`#070d22` (usar tokens) e resíduos `lime-500`/`lime-400` (usar `brand-accent`).

### D9 — Textos e comportamentos (B-09)
- `useAuth`: 429 → `toast.danger` (erro), conforme a spec `login`.
- `navigation.ts`: `conta` sem valores fixos fictícios ("Super Admin"); `notificacoesIniciais` esvaziado (estado vazio real).
- `uploads`: recurso da trilha por destino (`Logomarcas`/`Avatares`).
- `convite`: reenvio (conta existente) registra **Alteração** (não Inclusão).
- `usuarios/Kpis`: "Inativos" passa a contar os **não-ativos** (Inativo + Bloqueado), fechando com o Total.
- Importação: grava `departamento_setor` vazio (não o default `'Geral'`).

## Risks / Trade-offs

- **Event Scheduler desabilitado:** o expurgo não roda → aviso no boot e documentação; alternativa futura (job em Node) fica registrada.
- **Bloquear login por perfil não-Ativo:** pode surpreender se um administrador inativar o próprio perfil → comportamento pretendido (a guarda anti-lockout da Etapa 2 evita ficar sem administração por permissões, não por situação).
- **Mudança de tokens/a11y:** risco de regressão visual → mitigação: `npm run build` + conferência em `/design`.
- **KPIs "Inativos" = não-ativos:** muda o significado do card → registrar na spec/doc; teste E2E.

## Migration Plan

- **Schema:** migration `10_auditoria_expurgo_event.sql` (cria o `EVENT`); idempotente (`CREATE EVENT IF NOT EXISTS`).
- **Rollback:** `DROP EVENT IF EXISTS ev_expurgo_auditoria;` (comentado na migration) — a retenção deixa de ser aplicada.
- **Verificação:** `npm run build` + E2E (avatar persiste; `rate_limit.ativo=false` desliga; login de perfil Inativo → `403`; `PUT` sem descrição preserva; filtro de data final inclui `23:59:59.9`; evento existe em `information_schema.EVENTS`).

## Open Questions

Nenhuma pendente — as cinco decisões de escopo foram resolvidas com o usuário.

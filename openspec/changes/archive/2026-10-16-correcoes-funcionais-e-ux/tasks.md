# Tasks

## 1. Gestão de usuários

- [x] 1.1 Repassar `avatar` em `POST`/`PUT /api/usuarios` e nos tipos de `criarUsuario`/`atualizarUsuario` (M-01). Verificado no E2E: avatar persistiu (`/uploads/avatares/qa.png`).
- [x] 1.2 KPIs: "Inativos" conta os não-ativos (Inativo + Bloqueado) (FUN-13). Verificado por build/leitura.
- [x] 1.3 Importação grava `departamento_setor` vazio (FUN-14). Verificado por build.
- [x] 1.4 Convite: removido o ramo morto `senhaExistente`/redefinir; campo sempre vazio com **Gerar** (M-04, cliente). Verificado por build.

## 2. Rate limit

- [x] 2.1 `limitePorMinuto` lê `ativo`; com `false`, `exigirRateLimit` não conta/rejeita (M-02). Verificado no E2E: 6 tentativas com `ativo=false` → sem `429`.

## 3. Auditoria

- [x] 3.1 `10_auditoria_expurgo_event.sql` com o `EVENT` diário às 03:00 (M-03). Verificado: `information_schema.EVENTS` mostra `ev_expurgo_auditoria` ENABLED (EVERY 1 DAY).
- [x] 3.2 Boot verifica/habilita o Event Scheduler (best-effort) com aviso (M-03). Verificado: `@@event_scheduler = ON`.
- [x] 3.3 Filtro de data final inclusivo (`data_hora < DATE_ADD(?, INTERVAL 1 DAY)`) (M-06). Verificado por build/leitura (o caso de microssegundo não foi reproduzido diretamente).
- [x] 3.4 Classificação da trilha: upload por destino (`Logomarcas`/`Avatares`); reenvio de convite como **Alteração** (DIV-14). Verificado por build.

## 4. Perfis e login

- [x] 4.1 Login recusa perfil não-Ativo (`p.situacao`) (M-05). Verificado no E2E: perfil Leitor Inativo → login `403`.
- [x] 4.2 `resolverPerfilId` (usuários) e a resolução no convite exigem perfil Ativo (M-05). Verificado por build.
- [x] 4.3 `PUT /api/perfis/:id` só com campos presentes (M-21). Verificado no E2E: `PUT` só com `nome` preservou a descrição.

## 5. Design system

- [x] 5.1 `ToastContainer`: `aria-label` no fechar + correção de estouro < ~404px (B-01, B-03).
- [x] 5.2 `DatePicker`: `aria-label` no limpar (B-02).
- [x] 5.3 `AppHeader`: `aria-label` no gatilho do Account (B-05).
- [x] 5.4 `DataTable`: rótulo associado + foco visível no seletor "Linhas por página" (B-04).
- [x] 5.5 `Checkbox`: erro `rose-700` e anel de foco `brand-focus` (B-06).
- [x] 5.6 Hex fora da paleta (`#2161ef`) e resíduos `lime-500` substituídos por tokens (`brand-structure`/`brand-accent`) no Kpi, auth e componentes do kit (B-07, B-08). Verificado por busca + build.

## 6. Textos e estado

- [x] 6.1 `useAuth`: 429 como `toast.danger` (DIV-11).
- [x] 6.2 `navigation.ts`: `conta` sem valores fictícios; notificações esvaziadas (DIV-12, DIV-13).

## 7. Verificação integrada

- [x] 7.1 `npm run build` — sucesso ("Build complete!").
- [x] 7.2 E2E integrado: avatar persistiu; PUT parcial preservou a descrição; `rate_limit.ativo=false` sem 429; perfil Inativo → login `403`; migration 10 + evento ENABLED + scheduler ON.
- [x] 7.3 Etapa 4 registrada no `docs/RL02`; `docs/01` atualizado (UploadFiles usa `brand-accent`).

# Tasks

## 1. Origem fixa dos links de e-mail (M-03)

- [x] 1.1 Em `server/api/auth/esqueci-senha/index.post.ts`, remover o fallback `getRequestURL(event).origin` e lançar `createError` explícito quando `appUrl` estiver vazio/ausente (sem montar link a partir do `Host`). Verificação: `npm run build` OK.
- [x] 1.2 Aplicar o mesmo em `server/api/convite/index.post.ts`. Verificação: build OK.
- [x] 1.3 Confirmar/documentar `APP_URL` como obrigatória em `.env.example` (se ainda não estiver). Verificação: `.env.example` cita `APP_URL`.

## 2. Rótulo da sidebar "Gestão de Auditoria" (M-06)

- [x] 2.1 Em `openspec/specs/design-system/layout-navigation/spec.md`, trocar o item da sessão Administração de "Auditoria" para "Gestão de Auditoria". Verificação: `openspec validate --specs` OK.
- [x] 2.2 Em `docs/01 - design_system.md`, alinhar a sessão Administração da sidebar para "Gestão de Auditoria" (linha ~141). Verificação: o texto bate com `navigation.ts`.

## 3. Correções de documentação (M-04/M-05/DOC-01…08)

- [x] 3.1 Em `docs/02`, corrigir os Passos 2/3 (config de boot real: `AUTH_JWT_SECRET`, `SMTP_ENC_KEY`, `APP_URL`) e o bloco `.env` correspondente. Verificação: o guia reflete `nuxt.config.ts`/`.env.example`.
- [x] 3.2 Em `docs/02`, marcar `permission.ts` como `[existe]` no §Passo 4 (remover `[roadmap]`). Verificação: coerente com §3.2/§3.5.
- [x] 3.3 Em `docs/02`, incluir `bootstrap-admin.ts` na árvore de utilitários (§2). Verificação: a árvore cita o arquivo.
- [x] 3.4 Em `docs/qa/00`, atualizar a descrição de autorização (RBAC `requirePermission` implementado) e o pacote de ícones para `@lucide/vue`. Verificação: o texto deixa de citar "roadmap"/`lucide-vue-next` para esses pontos.
- [x] 3.5 Em `docs/01`, corrigir o default do `UiKpi` para `#0364f7` (§5.10), o Sumário para "5.1–5.20" e a referência de ícones para `@lucide/vue` (§4.1). Verificação: os trechos batem com o código.
- [x] 3.6 Substituir os nomes `usePerfisDemo`/`useAuditoriaDemo` por `usePerfisModelo`/`useAuditoriaModelo` em `docs/05`, `docs/07`, `docs/bd/02_seed.sql`, `server/migration/02_seed.sql` e comentários de `server/utils/perfis.ts`. Verificação: grep sem ocorrências `*Demo` restantes nesses arquivos.
- [x] 3.7 Em `server/api/auditoria/index.get.ts`, atualizar o comentário de contrato para o shape real `{ registros, total, kpis, opcoes, pagina, porPagina }`. Verificação: o comentário bate com `server/utils/audit.ts`.

## 4. Verificação integrada e documentação

- [x] 4.1 Rodar `npm run build`. Verificação: conclui sem erro.
- [x] 4.2 Executar `openspec validate --specs` e revisar os docs alterados. Verificação: 30/30 specs válidas; nenhum resquício de `*Demo`/`lucide-vue-next`/`#2161ef`/rótulo "Auditoria" nos locais corrigidos.
- [x] 4.3 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, marcando `RL03-M-03`, `RL03-M-04`, `RL03-M-05`, `RL03-M-06` e `RL03-DOC-01…08` como corrigidos (com a data e a change) na Etapa 5. Verificação: as linhas da Etapa 5 constam como corrigidas.

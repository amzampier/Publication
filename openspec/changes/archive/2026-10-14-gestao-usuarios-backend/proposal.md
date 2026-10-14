# Proposal

## Why

A Gestão de Usuários é a última grande tela ainda 100% fase 1: listagem, KPIs, CRUD,
importação e exclusão operam sobre `useUsuariosDemo` em memória, enquanto o banco já é a
fonte real do sistema — o login valida em `usuarios`, o convite já materializa contas no
banco (find-or-create) e a página de perfis conta vínculos do banco (2/0/0/0) diante de uma
tabela que ainda mostra 16 usuários demo. Pior: as APIs administrativas (`/api/perfis`,
`/api/configuracoes`) respondem **sem sessão** (achado crítico do QA da change de auth) e
trazer `/api/usuarios` (PII) sem proteção dobraria o risco. É preciso criar o backend do
módulo, integrar a frontend e fechar a fronteira de sessão das APIs.

## What Changes

- **Middleware global de sessão** em `server/middleware/`: toda rota `/api/**` exige sessão
  válida (`getSessionUser`), com allowlist explícita para `/api/auth/*` — resolve o achado
  crítico do QA cobrindo também perfis, configurações e uploads. `requirePermission` (RBAC
  por matriz) fica para a futura change de `usePermissions`/`.can()`.
- **Backend de usuários:** `server/utils/usuarios.ts` + rotas `GET/POST /api/usuarios`,
  `PUT/DELETE /api/usuarios/:id`, `PUT /api/usuarios/:id/situacao` (ação **Bloquear** real:
  alterna Ativo ↔ Inativo), `POST /api/usuarios/importar` (linhas parseadas no cliente,
  revalidadas e gravadas em transação **sem senha** — sentinel de hash nunca autentica;
  convite atribui a provisória) e `PATCH /api/usuarios/eu` (Meu Perfil). Validações
  espelham o formulário (e-mail único no banco → `409`, perfil existente, senha ≥8).
- **Frontend sobre a API:** listagem/KPIs/tabela vêm do `GET` (filtros, busca, exportações
  CSV/PDF continuam client-side sobre o conjunto carregado — padrão perfis); modal de
  usuário grava via API com **upload real de avatar** (`POST /api/uploads` destino
  `avatares` → `avatar_url`; a coluna VARCHAR(500) não cabe dataURL — destino já existe no
  `server/utils/uploads.ts`); exclusão e importação via API; **Bloquear** com modal de
  confirmação; teste SMTP permanece simulado (spec).
- **Meu Perfil no banco:** a página deixa de espelhar a base demo por e-mail — resumo,
  dados pessoais, endereço, SMTP e foto leem/escrevem o registro real via
  `PATCH /api/usuarios/eu` (a aba Segurança já é real desde a change de auth).
- **BREAKING (comportamento):** a lista nasce com o admin provisionado + contas convidadas
  (**sem seed** dos 16 demo — decisão registrada; os e-mails demo deixam de autenticar e de
  aparecer); requisições anônimas a qualquer `/api/**` passam a receber `401`; a ação
  Bloquear deixa de ser toast e alterna a situação de verdade (o login já bloqueia Inativos);
  importados persistem na recarga.
- **Escopo deliberado (fora):** seed de usuários, `requirePermission`/`.can()`, auditoria de
  CRUD (`server/utils/audit.ts`), rate limit fora das rotas de auth, ViaCEP real, criptografar
  `senha_smtp`.

## Capabilities

### New Capabilities

<!-- nenhuma: as rotas servem o comportamento já especificado das telas -->

### Modified Capabilities

- `gestao-usuarios`: KPIs/tabela/validação passam a derivar do banco via API; "só o convite
  usa a rede" vira "a tela opera sobre a API" (filtros/exportações seguem locais); modal de
  usuário grava via API com avatar como arquivo; importação grava via API com revalidação e
  persiste na recarga; exclusão via API; ação Bloquear real com modal de confirmação (substitui
  o toast de "próxima etapa" mantido pela fase 1); convite deixa de citar listagem demo;
  **ADDED** "As rotas da API administrativa exigem sessão ativa".
- `meu-perfil`: resumo/avanços de dados (dados pessoais, endereço, SMTP, foto) passam a ler e
  gravar o registro real via API (`PATCH /api/usuarios/eu`; foto via upload em `avatares`);
  o rascunho deixa de ser clonado da base demo; docs/09 reflete o backend (pendências
  remanescentes: ViaCEP, RBAC).

## Impact

- **Backend (novo):** `server/middleware/auth-api.ts`, `server/utils/usuarios.ts`,
  `server/api/usuarios/{index.get,index.post,[id]/{index.put,index.delete,situacao/index.put},importar/index.post,eu/index.patch}.ts`
  — sob o padrão de `server/api/auth` + `getSessionUser`/`hash` (bcrypt) já entregues.
- **Frontend:** `app/components/usuarios/` (novo composable de API no lugar das escritas de
  `useUsuariosDemo`; `Tabela`/`Kpis`/`Formulario`/`Filtros`/`Importar`/`Exclusao`/`Convite`
  adaptados; novo modal de confirmação de bloqueio), `app/pages/admin/gestao-usuarios.vue`,
  `app/components/perfil/*` + `app/pages/admin/meu-perfil.vue` (registro real).
- **Banco:** nenhuma migration (colunas prontas; sentinel de hash para importados).
- **Docs:** `docs/09` (registro real + foto por upload), `docs/08` §11 (item "proteção das
  demais APIs" entregue), e specs sincronizadas via `/opsx-sync`.
- **QA afetado:** APIs anônimas passam a `401` (dependentes devem logar); lista de gestão
  começa com 1 linha; contagens de perfis-acesso passam a acompanhar convites reais.

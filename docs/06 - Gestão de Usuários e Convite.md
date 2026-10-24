# Gestão de Usuários e Convite — Publications (Dicas Teorema)

Documento da tela **Gestão de Usuários** (`/admin/gestao-usuarios`): rota, componentes, fluxos
(CRUD, importação, convite, bloqueio/desbloqueio e exclusão) e o backend que os sustenta.

> **Fonte da verdade do comportamento:** `openspec/specs/gestao-usuarios` (e `login`, `uploads`).
> Em caso de divergência, a spec prevalece.

---

## 1. Rota e shell

- Rota `/admin/gestao-usuarios`, renderizada dentro do shell da Área Administrativa
  (`app/layouts/admin.vue`: header + sidebar). O guard global (`app/middleware/auth.global.ts`)
  exige sessão; sem sessão → `/admin/login?redirect=`.
- Estado de carregamento no F5: `UiLoading` na área de conteúdo enquanto `GET /api/usuarios`
  responde (sem flash de KPIs/tabela vazios).

## 2. Componentes (`app/components/usuarios/`)

| Arquivo | Papel |
|---|---|
| `Cabecalho.vue` | Título + ações "Relatórios" (Ficha Cadastral, Relação Completa, CSV) e "Novo Usuário". |
| `Kpis.vue` | Quatro KPIs derivados do conjunto filtrado (Total, Ativos, Inativos, Perfis distintos). |
| `Tabela.vue` | `UiDataTable` em **modo servidor** (Nome, E-mail, Perfil, Status, Último acesso + Ações). |
| `Filtros.vue` | Modal de filtros (Usuário, Perfil, Status) aplicado no **servidor**. |
| `Formulario.vue` | Modal de criação/edição (Dados, Endereço com CEP, Configurações de E-mail). |
| `Importar.vue` | Modal de importação de `.xlsx` com pré-visualização e seleção. |
| `Convite.vue` | Modal de convite (E-mail via Resend ou WhatsApp). |
| `Exclusao.vue` / `Bloqueio.vue` | Confirmações de exclusão e de bloqueio/desbloqueio. |
| `useUsuarios.ts` / `useUsuariosModelo.ts` | Estado, escritas e contratos/tipos da tela. |
| `lerPlanilhaUsuarios.ts` | Parser do modelo oficial (`docs/modelos/`). |
| `gerarPdfUsuarios.ts` / `gerarPdfFichaCadastral.ts` | Geração de PDF no cliente. |

## 3. Fluxos

- **Listagem (servidor):** `GET /api/usuarios` pagina, ordena e filtra no servidor (busca com
  debounce, `ordenar`/`direcao` por whitelist); a tabela opera em modo servidor e rebusca a página
  a cada interação. Falha de carga zera tabela, KPIs, total e opções.
- **Criação/edição:** `POST /api/usuarios` (201) e `PUT /api/usuarios/:id` (200); a senha nova vira
  `senha_provisoria`; e-mail duplicado → `409` (inclusive em corrida de unicidade). O modal de edição
  busca o registro completo por `GET /api/usuarios/:id` (a listagem traz só as colunas exibidas).
- **Importação:** `POST /api/usuarios/importar` revalida contra a base e grava em transação;
  `GET /api/usuarios/emails` entrega todos os e-mails (pré-classificação "já cadastrado").
- **Convite:** `POST /api/convite` (find-or-create por e-mail); canal `email` envia pelo Resend
  (falha → `502` com a conta já gravada), `whatsapp` só grava. Só usuário **Ativo** pode ser convidado.
- **Bloqueio/Desbloqueio:** `PUT /api/usuarios/:id/situacao` (inativar revoga o acesso vigente).
- **Exclusão:** `DELETE /api/usuarios/:id` (com guarda anti-lockout do administrador essencial).
- **Exportação:** CSV/PDF do conjunto filtrado completo, com feedback de erro em falha.

## 4. Backend (`server/api/usuarios/**` e `server/utils/usuarios.ts`)

- Rotas sob a permissão `gestao-usuarios` (visualizar/criar/alterar/excluir/importar) e as ações
  extras; `/api/usuarios/eu*` é autoatendimento (só sessão).
- SQL parametrizado; UUIDs via `UUID()`; transações nos pontos compostos; auditoria centralizada
  (`registrarAuditoria`) nas escritas.

## 5. Modelo de importação

- Modelo oficial em `docs/modelos/modelo-importacao-usuarios.xlsx` (cabeçalho Nome, E-mail, Perfil,
  Status); o parser normaliza acentos/caixa e classifica cada linha (pronto, já cadastrado, repetido,
  inválida).

## 6. Documentação relacionada

- Design system: `docs/01`; arquitetura/migrations: `docs/02`; Perfis/RBAC: `docs/07`;
  Login/convite por e-mail: `docs/08`.
> **Busca de e-mails (segurança/infra):** `GET /api/usuarios/emails?q=...` exige 2+ caracteres e permissões `gestao-usuarios`/`visualizar` + `buscar`, retorna no máximo 20 itens com apenas `id`/`email`/`nome`. A importação não baixa mais a base inteira de e-mails; duplicatas são validadas no servidor.

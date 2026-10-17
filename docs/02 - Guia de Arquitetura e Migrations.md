# Guia de Arquitetura do Sistema e Sistema de Migrations — Publications (Dicas Teorema)

Este documento detalha a arquitetura do **Publications (Dicas Teorema)**, incluindo a organização do frontend, a estrutura do backend no Nuxt 4 / Nitro, os mecanismos de segurança e autenticação, e o funcionamento detalhado do **sistema automático de migrations de banco de dados**.

O objetivo deste guia é servir de referência técnica para o desenvolvimento do Publications e um passo a passo para replicar com precisão essa mesma arquitetura em novos sistemas e projetos.

---

## 1. Visão Geral da Stack Tecnológica

| Camada | Tecnologia | Detalhes & Motivação |
|---|---|---|
| **Framework Fullstack** | **Nuxt 4** (`^4.5.2`) | Separação física de pastas (`app/` para frontend e `server/` para backend). Engine de servidor **Nitro**. |
| **Frontend Core** | **Vue 3** (`^3.5.43`) | Composition API com `<script setup lang="ts">`, reatividade nativa e tipagem rigorosa. |
| **Linguagem** | **TypeScript** | Compartilhamento de tipos e interfaces entre cliente e servidor. |
| **Estilização** | **Tailwind CSS** (`@nuxtjs/tailwindcss`) | Design System próprio em `app/components/ui/` sem sobrecarga de bibliotecas externas pesadas (sem dependência de Shadcn, Vuetify ou Element). |
| **Ícones** | **@lucide/vue** | Ícones SVG limpos e padronizados, importados como componentes nomeados e consumidos via tree-shaking. |
| **Banco de Dados** | **MariaDB 11.8** via **mysql2/promise** (`^3.22.3`) | Conexão direta via Connection Pool, transações nativas e queries SQL parametrizadas (raw SQL). Alta performance sem complexidade e gargalos de ORMs pesados. |
| **Validação** | *Roadmap:* **Zod** | Ainda **não instalado** — a validação atual é feita ad hoc com `createError(400)` nas rotas e utilitários (`server/utils/validation.ts` é roadmap). |
| **Autenticação & Criptografia** | **JWT** (`jose`) + **bcrypt** (`^6.0.0`) | Tokens de acesso curtos (HS256 via `jose`), Refresh Tokens com rotação no banco, senhas em bcrypt (custo 12), proteção contra brute force e cifra de segredos em repouso (AES-256-GCM). |
| **Utilitários Frontend** | *(composables próprios)* | Não há `@vueuse/core` instalado; os composables reativos são próprios em `app/composables/`. |
| **Geração de Arquivos** | **exceljs** + **jspdf** + **jspdf-autotable** | Leitura de planilhas de importação (`exceljs`, carregado dinamicamente) e geração de PDF **no cliente** (`jspdf`/`jspdf-autotable`). |

---

## 2. Estrutura de Diretórios e Filosofia de Organização

A arquitetura adota o padrão moderno do Nuxt 4, separando a aplicação em dois grandes domínios:

```
raiz-do-projeto/
├── app/                           # CAMADA CLIENTE / FRONTEND (Vue 3 + Tailwind)
│   ├── app.vue                    # Ponto de entrada (NuxtRouteAnnouncer + NuxtLayout + NuxtPage + UiToastContainer)
│   ├── components/
│   │   ├── layout/                # Shell (AppHeader, AppSidebar)
│   │   ├── ui/                    # Design System interno (26 componentes atômicos)
│   │   └── [modulo]/              # Componentes de domínio (usuarios, perfis, auditoria, configuracoes, perfil, auth)
│   ├── composables/               # Regras de negócio e hooks reativos reutilizáveis
│   ├── config/
│   │   └── navigation.ts          # Definição centralizada do menu lateral e rotas
│   ├── layouts/                   # Layouts de tela (default.vue, admin.vue, auth.vue)
│   ├── middleware/
│   │   └── auth.global.ts         # Route guard global no cliente
│   └── pages/                     # Roteamento por arquivos (admin/**, index, design, error)
│
├── server/                        # CAMADA SERVIDORA / BACKEND (Nitro Engine)
│   ├── api/                       # Endpoints REST (auth, usuarios, perfis, auditoria, configuracoes, seguranca, convite, uploads)
│   ├── middleware/                # auth-api.ts (sessão global nas /api/**)
│   ├── migration/                 # Scripts SQL versionados (01_..., 02_..., etc.)
│   ├── plugins/                   # migration.ts, auth-config.ts
│   └── utils/                     # db, auth, permission, audit, perfis, usuarios, configuracoes, seguranca, uploads, crypto, rateLimit, mailer, expurgo, migration-runner, bootstrap-admin
│
├── shared/                        # Tipos/utilitários compartilhados (ex.: shared/utils/emails.ts)
├── docs/                          # Documentação de arquitetura e especificações de negócio
├── public/                        # Arquivos estáticos (favicon, robots.txt)
├── uploads/                       # Armazenamento de uploads em disco (organizado por subpastas)
├── nuxt.config.ts                 # Configuração do Nuxt e Nitro
├── package.json                   # Dependências e scripts de execução
├── tailwind.config.js             # Configuração do Tailwind CSS
└── tsconfig.json                  # Configuração TypeScript
```

### 2.1. Áreas do Sistema

O Publications possui **duas áreas** com natureza e proteção distintas (escopo único — não há empresas nem filiais):

| Área | Roteamento | Acesso | Conteúdo |
|---|---|---|---|
| **Área Pública** | rotas raiz de `app/pages/` (hoje apenas `/`) | anônimo, sem autenticação | **Roadmap:** leitura das publicações (Releases Week Semanal, Manuais e Escopo de Projetos). Hoje só existe o placeholder `app/pages/index.vue` — não há páginas `/releases`, `/manuais` nem `/escopos` na Área Pública (a sidebar exibe "Módulo em construção"). |
| **Área Administrativa** | `app/pages/admin/**` (ex.: `/admin/login`, `/admin/gestao-usuarios`) | autenticação (JWT + cookie) e permissões RBAC | cadastros, edição e publicação dos conteúdos acima, usuários, perfis, auditoria e configurações |

- No servidor, toda requisição sob `/api/` exige sessão válida (middleware `server/middleware/auth-api.ts`,
  com isenções para `/api/auth/*` e `/api/configuracoes/identidade`) e responde `401` sem sessão;
  no cliente, o route guard `app/middleware/auth.global.ts` redireciona rotas `/admin/**`
  sem sessão para `/admin/login`. As rotas da Área Pública não têm API própria declarada
  hoje (a leitura das publicações ainda não é servida por endpoints).
- Não há escopo por empresa — os dados são globais ao sistema, com controle de acesso feito apenas por perfil/permissão.

### 2.2. Componentização obrigatória (sem exceção)

Toda tela nova ou alterada é construída por componentes reutilizáveis; **nunca** concentre a interface inteira em um único arquivo de página. A separação por camada é:

- `app/components/ui/` — átomos visuais reutilizáveis (design system interno).
- `app/components/<modulo>/` — componentes de domínio (ex.: `usuarios/`, `perfis/`, `auditoria/`, `configuracoes/`, `perfil/`).
- `app/components/layout/` — estrutura base (header, sidebar, menu de conta).

A **página é apenas orquestração** (estado de tela, handlers e composição dos componentes). Estado de servidor e chamadas de API ficam em `app/composables/use<Modulo>.ts`; contratos e tipos em `app/types/<modulo>.ts`. Antes de concluir uma tela, confirme que ela está quebrada em componentes, que a página está enxuta e que a API está no composable.

---

## 3. Arquitetura do Backend (Nitro Server)

O backend roda em cima do **Nitro**, o servidor do Nuxt, operando com endpoints desacoplados, leves e tipados.

### 3.1. Conexão com o Banco de Dados (`server/utils/db.ts`)
A comunicação com o banco não utiliza ORMs pesados como Prisma ou TypeORM. Em vez disso, adota-se um **Connection Pool** gerenciado via `mysql2/promise`:

```typescript
// server/utils/db.ts
import mysql from 'mysql2/promise'

let pool: mysql.Pool | null = null

export function getDbPool() {
  if (!pool) {
    const config = useRuntimeConfig()
    pool = mysql.createPool({
      host: config.dbHost,
      port: Number(config.dbPort) || 3306,
      user: config.dbUser as string,
      password: config.dbPassword as string,
      database: config.dbName as string,
      charset: 'utf8mb4',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 50,
      ...(process.env.DB_SSL === 'true' ? {
        ssl: {
          rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false',
          ca: process.env.DB_SSL_CA || undefined,
        }
      } : {}),
    })
  }
  return pool
}

// Execução rápida de queries
export async function query<T = any>(sql: string, values?: any[]) {
  const p = getDbPool()
  const [rows] = await p.query(sql, values)
  return rows as T
}

// Gerenciamento seguro de Transações ACID
export async function getTransaction(): Promise<Transaction> {
  const p = getDbPool()
  const conn = await p.getConnection()
  await conn.beginTransaction()

  const txQuery = async <T = any>(sql: string, values?: any[]): Promise<T> => {
    const [rows] = await conn.query(sql, values)
    return rows as T
  }

  const commit = async () => {
    await conn.commit()
    conn.release()
  }

  const rollback = async () => {
    await conn.rollback()
    conn.release()
  }

  return { query: txQuery, commit, rollback, release: () => conn.release() }
}
```

#### Vantagens dessa abordagem:
1. **Zero sobrecarga de abstração**: controle total sobre o SQL gerado, joins, índices e performance.
2. **Suporte completo a transações**: operações compostas são atômicas com `commit` e `rollback`.
3. **Resiliência de conexão**: pool automático de conexões com fila de espera e suporte nativo a SSL para produção.

---

### 3.2. Estrutura Padrão de um Endpoint de API

Cada rota de API administrativa segue hoje o fluxo real do código
(change `auditoria-backend-integracao` — docs espelham o código; os itens
marcados como *roadmap* ainda não existem como helper):

1. **Sessão**: o middleware global `server/middleware/auth-api.ts` exige sessão válida em
   toda rota `/api/` (exceto `/api/auth/*` e `/api/configuracoes/identidade`) — sem sessão → `401`.
2. **Validação de Payload**: feita na própria rota/utilitário com `createError({ statusCode: 400 })`
   (validação ad hoc; `server/utils/validation.ts` com **Zod** é *roadmap*).
3. **Execução no Banco**: SQL parametrizado com UUIDs gerados no MariaDB (`UUID()`), via
   `query()`/`getTransaction()` de `server/utils/db.ts`.
4. **Auditoria**: após o sucesso da gravação, `registrarAuditoria(event, …)`
   (`server/utils/audit.ts` — ver §3.6) registra a ação na tabela `auditoria`.
5. **Erros**: lançados com `createError({ statusCode, statusMessage })` direto na rota ou no
   utilitário (400 validação, 404 inexistente, 409 conflito, 403 permissão — *roadmap*);
   o próprio Nitro serializa a resposta (`server/utils/safeError.ts`/`handleApiError` é *roadmap*).

**Exemplo real de endpoint POST (`server/api/usuarios/index.post.ts`):**

```typescript
import { criarUsuario } from '../../utils/usuarios'
import { registrarAuditoria } from '../../utils/audit'

export default defineEventHandler(async (event) => {
  const body = await readBody<Record<string, unknown>>(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, statusMessage: 'Corpo JSON ausente ou inválido.' })
  }

  // 2/3. Validação + execução no banco (erros 400/409 saem dos utilitários)
  const usuario = await criarUsuario({ /* … */ })

  // 4. Registro de Auditoria (nunca derruba a resposta — §3.6)
  await registrarAuditoria(event, {
    acao: 'Inclusão',
    recurso: 'Usuários',
    entidadeId: usuario.id,
    detalhes: `Criou o usuário '${usuario.nome}' (${usuario.email}) com perfil ${usuario.perfil}`
  })

  setResponseStatus(event, 201)
  return usuario
})
```

> **Roadmap (não implementado):** `validateBody`/Zod (`server/utils/validation.ts`) e
> `handleApiError` (`server/utils/safeError.ts`) permanecem o alvo arquitetural; hoje a validação
> é ad hoc (`createError(400)`). A **autorização por módulo já é aplicada**:
> `requirePermission(event, modulo, acao)` (`server/utils/permission.ts`) é chamado nas rotas
> administrativas e responde `403` quando a permissão falta (ver §3.5).

---

### 3.3. Tratamento Seguro de Erros (no código real: `createError` nos utilitários)

Para não vazar detalhes internos do banco de dados (tabelas, colunas, queries) em ambientes de produção — comportamento atual do código:
- Os conflitos são checados **antes** da gravação nos próprios utilitários e traduzidos em
  `createError({ statusCode: 409 })` com mensagem amigável (ex.: `emailJaCadastrado()` em
  `server/utils/usuarios.ts` → *"Este e-mail já está cadastrado no sistema."*; exclusão de
  perfil com vínculos → 409).
- As validações lançam `400` com a mensagem do campo (`erro400`/`createError`), sem atingir o banco.
- Erros de runtime não tratados chegam ao Nitro, que responde **HTTP 500** com mensagem
  neutra ao cliente, preservando a segurança da infraestrutura.
- `server/utils/safeError.ts` (`handleApiError`) com mapeamento centralizado de códigos é
  *roadmap* (ver §3.2) — ainda não existe como arquivo.

---

### 3.4. Camada de Segurança e Autenticação

> As regras de segurança obrigatórias do projeto (incluindo a vedação de acesso ao banco pelo frontend) estão consolidadas na seção **"Segurança"** do `AGENTS.md`. Este guia descreve os mecanismos que as implementam.

1. **Tokens JWT com HttpOnly Cookies**:
   - O token de acesso fica em cookie `HttpOnly`, `SameSite=Lax`, com `Secure` e prefixo `__Host-` **somente em produção** (`__Host-auth-token`); em desenvolvimento os nomes são `auth-token`/`auth-refresh` (sem `Secure`/`__Host-`, que o navegador não persiste sem HTTPS).
   - O middleware global `server/middleware/auth-api.ts` valida a sessão de toda requisição
     sob `/api/` via `getSessionUser()` (`server/utils/auth.ts`), exceto as portas sem sessão:
     `/api/auth/*` (autenticação) e `/api/configuracoes/identidade` (só logo do login) —
     sem sessão válida → `401`. (O nome `server/middleware/auth.ts` de versões anteriores da
     documentação não existe; o arquivo real é `auth-api.ts`.)
   - As rotas de página sob `/admin/**` são protegidas pela guarda global do cliente
     (redirect ao login com `?redirect=`); a Área Pública (leitura anônima) não tem rotas de
     API próprias implementadas hoje.
2. **Refresh Tokens com Rotação de Sessão (`sessoes`)**:
   - Cada login gera um token de atualização registrado na tabela `sessoes`. Ao renovar, o token antigo é invalidado e substituído por um novo.
3. **Revogação de sessão (`usuarios.token_version`)**:
   - O access JWT carrega a versão da sessão; o middleware valida (conta ativa + versão) a cada requisição. Logout e desativação incrementam a versão (revogando os tokens vigentes) e a exclusão remove a conta. A tabela `token_blacklist` existe no schema, mas a revogação é feita por versão (não pela blacklist).
4. **Proteção contra Brute-Force (Lockout)**:
   - Contador de tentativas falhas (`tentativas_falhas`) e bloqueio temporário (`bloqueado_ate`) na tabela `usuarios`.
5. **Rate limiting em memória + configuração persistida**:
   - Limite por IP em memória (janela de 1 minuto), com o valor lido de `configuracoes_limite_requisicao` (cache de 60s) e o status `ativo` respeitado; o IP considerado é o da conexão (X-Forwarded-For só com `TRUSTED_PROXIES`).

---

### 3.5. Controle de Acesso Baseado em Papéis (RBAC Dinâmico)

O sistema implementa controle de acesso granular na tabela `permissoes_perfil`:
- Cada perfil possui permissões booleanas para as ações fixas: `visualizar`, `criar`, `alterar`, `excluir`.
- Ações especiais são tratadas no campo `extras` (JSON), tais como: `publicar`, `arquivar`, `download`, `exportar`, `importar`.
- O helper `requirePermission(event, modulo, acao)` (`server/utils/permission.ts`) é o ponto
  único de autorização por módulo: carrega a matriz do perfil da sessão e nega com **HTTP 403
  Forbidden** quando a ação falta. **Já aplicado** nas rotas administrativas (change
  `rbac-require-permission`); a autenticação por sessão continua em `auth-api.ts` (§3.4). O
  cliente dispõe de `.can(modulo, acao)` em `app/composables/usePermissions.ts`.
- A **guarda anti-lockout** impede que a gravação da matriz deixe o sistema sem administração essencial.

A tabela de perfis (`perfis_acesso`) existe na migration `01_create_tables.sql`
(a página `/admin/perfis-acesso` já lê/grava via API — `docs/07`; DDL completo em `docs/bd/01`):

```sql
CREATE TABLE IF NOT EXISTS perfis_acesso (
  id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do perfil',
  nome_perfil VARCHAR(100) NOT NULL COMMENT 'Nome amigável exibido nas telas de governança',
  descricao TEXT NULL COMMENT 'Detalhamento das responsabilidades do perfil',
  situacao ENUM('Ativo', 'Inativo', 'Bloqueado') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação cadastral do perfil de acesso',
  criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
```

- O **UUID `id` é o identificador único** do perfil (não há `codigo_perfil` — decisão
  registrada na change `perfis-acesso-modal-cadastro-edicao`).
- **Colunas futuras fora do UI atual:** `padrao_sistema` (perfil nativo bloqueado para
  exclusão — flag de integridade do banco, não editável no modal) e `cor_identificacao`
  (badge colorido no painel — componente de cor ainda não existe no kit). O modal de
  cadastro/edição (demo) cobre `nome_perfil`, `descricao`, `situacao` e
  os timestamps (`docs/07` §3.6).

---

### 3.6. Sistema de Auditoria Centralizada (`server/utils/audit.ts`)

Implementado pela change `auditoria-backend-integracao`. As operações de escrita das rotas
administrativas (Inclusão, Alteração, Exclusão — Homologação reservada para a esteira) e os
eventos de autenticação bem-sucedidos (tipo `Acesso`) disparam `registrarAuditoria`
**após o sucesso da operação**:

```typescript
import { registrarAuditoria } from '../../utils/audit'

await registrarAuditoria(event, {
  acao: 'Inclusão',              // um dos 4 tipos — é o que alimenta o badge da tela
  recurso: 'Usuários',           // coluna `entidade` da tabela
  entidadeId: usuario.id,        // coluna `entidade_id` ('' quando não aplicável)
  detalhes: `Criou o usuário '${usuario.nome}'…`  // texto humano da operação
})
```

- **Sessão:** ID, nome e perfil do usuário logado vêm de `getSessionUser(event)`.
- **IP real do cliente:** `ipDoCliente(event)` (`getRequestIP(event, { xForwardedFor: true })`).
- **Gravação:** INSERT com `UUID()` e `data_hora` pelo DEFAULT da coluna na tabela `auditoria`
  (migration 01 §18 — mapeamento: `recurso` da tela ↔ coluna `entidade`).
- **Resiliência:** o helper envolve tudo em `try/catch` e só loga no console — a falha na
  auditoria **nunca** interrompe nem altera a resposta da requisição principal.
- **Escopo:** 19 rotas auditadas (15 de escrita: usuários, perfis, configurações, uploads,
  convite, liberação de bloqueio + 4 de autenticação: login, logout, troca e recuperação de
  senha, com o 5º tipo **`Acesso`** e recurso "Autenticação"). Nos casos em que o request
  ainda não carrega a sessão (login — os cookies são da resposta — e `esqueci-senha`,
  público), o chamador informa `sessao: { id, nome, perfil }` explicitamente. Tentativas
  de credencial inválida não geram evento na trilha: seguem exclusivamente no log
  `seguranca_eventos_login` (fonte da aba Segurança de Configurações Globais).
  A leitura é servida por `GET /api/auditoria` (`server/api/auditoria/index.get.ts`,
  filtros por query param) para a tela `/admin/auditoria` (`docs/05` §6).

---

### 3.7. Endpoints auxiliares (contratos nomeados)

Além das rotas de CRUD por módulo, a aplicação expõe endpoints de apoio — com contrato observável (método, sessão exigida, payload e respostas):

- `GET /api/usuarios/eu` e `PATCH /api/usuarios/eu` — registro do próprio usuário (sessão apenas; PATCH grava dados/endereço/SMTP/avatar, **não** e-mail/perfil/situação/senha).
- `GET /api/usuarios/eu/permissoes` — matriz de permissões do próprio usuário (sessão apenas), que alimenta `usePermissions().can()`.
- `POST /api/convite` — find-or-create por e-mail + envio (requer `gestao-usuarios`/`criar`).
- `GET /api/seguranca/estado` (visualizar) e `POST /api/seguranca/liberar` (alterar) — aba Segurança (rate limit/lockout).
- `GET /api/configuracoes/identidade` — **público**; devolve apenas `logo_login_url` para as telas de autenticação.
- `POST /api/uploads` — multipart `file` + `pasta` (`logomarcas`|`avatares`); `logomarcas` exige `configuracoes-globais`/`alterar`, `avatares` é session-only.

---

## 4. O Sistema de Migrations Automáticas do Banco de Dados

O Sistema utiliza uma estratégia de migração **100% automatizada e declarativa**, executada diretamente na inicialização do servidor.

### 4.1. Filosofia e Arquitetura do Mecanismo

```
              ┌─────────────────────────────────────────┐
              │           Inicialização Nuxt            │
              │  (npm run dev / node .output/server...) │
              └────────────────────┬────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────────┐
              │      server/plugins/migration.ts        │
              │         defineNitroPlugin()             │
              └────────────────────┬────────────────────┘
                                   │
                                   ▼
              ┌─────────────────────────────────────────┐
              │     server/utils/migration-runner.ts    │
              │            runMigrations()              │
              └────────────────────┬────────────────────┘
                                   │
       ┌───────────────────────────┴───────────────────────────┐
       ▼                                                       ▼
1. Cria a tabela de controle                            2. Descobre diretório
   `_migrations` se não existir                            de migrations
   (id, nome, executado_em)                                (dev vs produção)
       │                                                       │
       └───────────────────────────┬───────────────────────────┘
                                   ▼
                        3. Lê arquivos .sql
                           (ordenados alfabeticamente: 01_, 02_...)
                                   │
                                   ▼
                        4. Filtra apenas as
                           migrations pendentes
                                   │
                                   ▼
                        5. Para cada migration pendente:
                           - Divide statements por ';'
                           - Executa comando por comando
                           - Ignora erros idempotentes (1060, 1061, 1062, etc.)
                           - Se sucesso: grava em `_migrations`
                           - Se erro fatal: aborta e avisa no log
```

---

### 4.2. O Plugin Nitro (`server/plugins/migration.ts`)

O Nitro permite rodar rotinas assíncronas no momento em que o servidor sobe, antes de atender a primeira requisição HTTP:

```typescript
// server/plugins/migration.ts
export default defineNitroPlugin(async () => {
  try {
    await runMigrations()       // aplica as migrations pendentes
    await ensureAdminUser()     // bootstrap do admin (só fora de produção; senha provisória)
    await migrarSenhasSmtp()    // cifra senhas SMTP legadas em repouso
    await garantirEventScheduler() // habilita o Event Scheduler (expurgo de auditoria)
  } catch (erro) {
    // fail-fast: loga e encerra o processo (exit != 0) quando o banco está indisponível
    process.exitCode = 1
    // ...
  }
})
```

> Diferenças em relação a versões antigas deste guia: o plugin real é **assíncrono**, tem
> `try/catch` com **fail-fast** (exit != 0) e chama também o bootstrap/backfill; não há mais
> o `return runMigrations()` simples mostrado antes.

---

### 4.3. O Runner de Migrations (`server/utils/migration-runner.ts`)

O runner contém as seguintes responsabilidades:

1. **Criação da Tabela de Controle** (colunas reais: `nome` PK e `aplicado_em`):
   ```sql
   CREATE TABLE IF NOT EXISTS _migrations (
     nome VARCHAR(255) NOT NULL PRIMARY KEY,
     aplicado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
   ```

2. **Resolução Dinâmica do Caminho (Dev vs Build)**:
   Em tempo de desenvolvimento, os arquivos estão em `server/migration/`. Após o build do Nitro (`npm run build`), os arquivos compilados ficam em `.output/server/`. O runner possui uma função `resolveMigrationDir()` que testa múltiplos caminhos candidatos relativos e absolutos, garantindo que o diretório seja encontrado em qualquer ambiente (Windows, Linux, Docker, VPS).

3. **Parser de SQL Inteligente (`splitStatements`)**:
   O runner remove comentários em bloco `/* ... */`, remove linhas comentadas `--` e quebra o arquivo por ponto e vírgula (`;`), executando cada statement individualmente.

4. **Tolerância a Erros e Idempotência**:
   Se uma coluna, índice ou chave primária já existir (por exemplo, ao reexecutar scripts em um banco existente), o runner identifica os códigos de erro do MariaDB e **continua a execução** em vez de quebrar:
   - `ER_DUP_FIELDNAME` (errno 1060): coluna já existe.
   - `ER_DUP_KEYNAME` (errno 1061): índice ou chave já existe.
   - `ER_DUP_ENTRY` (errno 1062): registro único ou chave já cadastrada.
   - Códigos de Foreign Key duplicada ou tabela já existente (`150`, `1215`, `1005`).

5. **Registro Transacional de Execução**:
   Assim que todas as instruções do arquivo SQL terminam com êxito, o nome do arquivo é inserido na tabela `_migrations`. Em reinicializações subsequentes, ele é ignorado automaticamente.

---

### 4.4. Cópia das Migrations no Build do Nitro (`nuxt.config.ts`)

Como o Nitro compila o servidor em um bundle fechado dentro de `.output/`, os arquivos `.sql` brutos precisam ser copiados para a pasta de distribuição. Isso é feito automaticamente via hook do Nitro:

```typescript
// nuxt.config.ts
import { cp } from 'node:fs/promises'
import { join } from 'node:path'

export default defineNuxtConfig({
  srcDir: 'app/',
  serverDir: 'server/',
  nitro: {
    hooks: {
      'compiled': async (nitro) => {
        const src = join(nitro.options.rootDir, 'server', 'migration')
        const dest = join(nitro.options.output.serverDir, 'migration')
        await cp(src, dest, { recursive: true })
      }
    }
  },
  // ...
})
```

---

### 4.5. Convenções para Escrever Novas Migrations

Para manter a consistência e a rastreabilidade em futuros sistemas, siga rigorosamente as seguintes regras:

1. **Nomenclatura Sequencial de Dois ou Três Dígitos**:
   - Exemplo: `01_create_tables.sql`, `02_add_status_to_publicacoes.sql`, `03_permissoes_perfil.sql`.
   - A ordenação alfabética do runner garante a ordem exata de execução.
2. **Sem `USE` nas migrations executáveis**:
   - Os arquivos de `server/migration/` **não** contêm `USE` — o pool conecta já no banco definido por `DB_NAME` (a referência humana `docs/bd/01` mantém o `USE` para execução manual via cliente SQL).
3. **Uso de Delimitador Padrão**:
   - Utilize ponto e vírgula (`;`) ao final de cada comando.
4. **Bloco de Rollback Documentado**:
   - Toda migration deve incluir, ao final do arquivo, o script de reversão manual:
   ```sql
   -- REVERTER (ROLLBACK):
-- ALTER TABLE publicacoes DROP COLUMN status;
-- DELETE FROM _migrations WHERE nome = '02_add_status_to_publicacoes.sql';
   ```
5. **Seeds e Dados Iniciais**:
   - Insira os dados necessários para o funcionamento inicial do sistema (Perfis padrão, usuário Administrador inicial, configurações globais) em arquivos de migration específicos ou na migration `01`.

### 4.6. Integridade referencial do conteúdo público (roadmap)

O schema já declara as tabelas do conteúdo público (`release_week`, `projetos_escopo`,
`manuais_mensal`, `entregas_itens`, `historico_esteira_revisao`), ainda **sem UI/API**. Ao implementar a
**exclusão de releases**, atenção à interação de chaves estrangeiras:

- `entregas_itens.release_id → release_week(id)` é `ON DELETE CASCADE`: excluir a release apaga os itens.
- `historico_esteira_revisao.entrega_item_id → entregas_itens(id)` é `ON DELETE RESTRICT`: enquanto
  houver histórico daquele item, o `CASCADE` dos itens é **bloqueado** (erro `1451`).

Ou seja, excluir uma release cujos itens tenham histórico na esteira **falha**. Ao construir o módulo,
decidir explicitamente entre: (a) apagar o histórico do item antes da exclusão (dentro da mesma
transação) ou (b) trocar a FK do histórico para `ON DELETE CASCADE`/`SET NULL` (conforme a regra de
retenção da trilha de revisão).

---

## 5. Arquitetura do Frontend (Vue 3 + Tailwind)

O frontend adota uma abordagem limpa, modular e altamente responsiva, com foco em facilidade de manutenção.

### 5.1. Design System Próprio (`app/components/ui/`)

Em vez de acoplar a aplicação a bibliotecas com dependências instáveis ou designs engessados, o sistema possui seu próprio kit de componentes em `app/components/ui/`:

- **Formulários & Seleção**: `UiInput`, `UiSelect`, `UiDatePicker`, `UiCalendar`, `UiCheckbox`, `UiBadgeCheckbox`, `UiCheckChip`, `UiCheckCard`, `UiCheckboxGroup`.
- **Ações & Feedback**: `UiButton`, `UiBadge`, `UiTooltip`, `UiToastContainer`.
- **Dados & Upload**: `UiDataTable`, `UiKpi`, `UiUploadFiles`, `UiCameraWeb`.

---

### 5.2. Camada de Comunicação com a API (`useApiFetch.ts`)

O composable `useApiFetch` encapsula o `$fetch` nativo do Nuxt, trazendo:
1. **Injeção de Credenciais**: `credentials: 'include'` para envio transparente de cookies de autenticação.
2. **Headers de Contexto**: `x-usuario-id` e `x-usuario-nome` para auditoria rápida (derivados de `useState('auth-usuario')`).
3. **Auto-Refresh com single-flight**: num **HTTP 401**, TODAS as chamadas em voo compartilham a MESMA promessa de `/api/auth/refresh` (cada rotação invalida o token anterior — N refreshes simultâneos derrubariam a sessão) e refazem a requisição original uma vez; refresh definitivamente falho → o estado local cai (sessão inválida) e o middleware leva ao login.
4. **SSR**: no servidor usa `useRequestFetch()` para encaminhar os cookies da requisição entrante (essencial para rotas protegidas chamadas no setup do layout, como `GET /api/configuracoes`).

> O código real está em `app/composables/useApiFetch.ts` (single-flight via `refreshEmVoz` + `useRequestFetch` no SSR).

---

### 5.3. Gerenciamento de Autenticação e Permissões no Cliente

1. **`useAuth.ts`**:
   - Controla os estados reativos `usuario` e `sessaoVerificada` (via `useState`) e as ações `entrar`, `sair`, `ensureSessao` e `sessaoInvalidada`. A sessão é real (cookies HttpOnly) e hidratada por `GET /api/auth/seguro` no primeiro acesso; **não** usa `sessionStorage` nem cookie de sessão fino.
2. **`app/middleware/auth.global.ts`**:
   - Middleware global de rota: intercepta todas as navegações.
   - Área Pública e as telas de autenticação (`/admin/login`, `/admin/esqueci-senha`) são liberadas; as demais rotas `/admin/**` exigem sessão (`ensureSessao`) e, sem ela, vão para `/admin/login?redirect=`. Sessões com senha provisória são conduzidas a `/admin/primeiro-acesso`.
3. **`usePermissions.ts`**:
   - Fornece o helper reativo `.can(modulo, acao)` (busca a matriz do próprio usuário em `GET /api/usuarios/eu/permissoes`). Nesta etapa está **disponível** para uso incremental da UI.
   - Permite controlar a renderização de botões e links no frontend:
   ```vue
<UiButton v-if="can('publicacoes', 'criar')" @click="abrirModal">
  Nova Publicação
   </UiButton>
   ```

---

## 6. Guia Passo a Passo: Como Criar um Novo Sistema com Esta Arquitetura

Siga este roteiro prático para inicializar qualquer novo sistema replicando 100% desta base sólida:

### Passo 1: Inicializar o Projeto Nuxt 4

Crie o projeto e instale as dependências essenciais:

```bash
# Inicializar Nuxt
npx nuxi@latest init publications
cd publications

# Dependências reais do projeto (banco, sessão, e-mails, estilos, arquivos)
npm install @nuxtjs/tailwindcss @lucide/vue mysql2 bcrypt jose exceljs jspdf jspdf-autotable
```

---

### Passo 2: Configurar o `nuxt.config.ts`

Configure a separação de pastas `app/` e `server/`, e o hook do Nitro para copiar as migrations:

```typescript
// nuxt.config.ts
import { cp } from 'node:fs/promises'
import { join } from 'node:path'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  modules: ['@nuxtjs/tailwindcss'],
  srcDir: 'app/',
  serverDir: 'server/',
  runtimeConfig: {
    dbHost: process.env.DB_HOST || 'localhost',
    dbPort: Number(process.env.DB_PORT || 3306),
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'publications',
    authJwtSecret: process.env.AUTH_JWT_SECRET || '',
    smtpEncKey: process.env.SMTP_ENC_KEY || '',
    appUrl: process.env.APP_URL || '',
    trustedProxies: process.env.TRUSTED_PROXIES || '',
    resendApiKey: process.env.RESEND_API_KEY || '',
    mailFrom: process.env.MAIL_FROM || '',
    public: {}
  },
  nitro: {
    hooks: {
      'compiled': async (nitro) => {
        const src = join(nitro.options.rootDir, 'server', 'migration')
        const dest = join(nitro.options.output.serverDir, 'migration')
        await cp(src, dest, { recursive: true })
      }
    }
  }
})
```

---

### Passo 3: Configurar o `.env`

Crie o arquivo `.env` na raiz com as variáveis de conexão:

```env
NODE_ENV=development
APP_URL=http://localhost:3000

# Conexão MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=sua_senha_forte
DB_NAME=publications

# Autenticação (segredo HS256 do access JWT — obrigatório no boot)
AUTH_JWT_SECRET=defina_um_segredo_longo_e_aleatorio

# Cifra de segredos em repouso (senha SMTP — mínimo 32 caracteres)
SMTP_ENC_KEY=defina_um_segredo_longo_e_aleatorio_de_32_caracteres

# E-mail (Resend)
RESEND_API_KEY=
MAIL_FROM=Publications <no-reply@exemplo.com>
```

---

### Passo 4: Copiar os Utilitários de Infraestrutura do Backend

Arquivos de `server/utils/` — **existente** vs **roadmap** (marcado; o código real do projeto
é o que está implementado):

1. `server/utils/db.ts` — Connection pool MariaDB e suporte a transações. **[existe]**
2. `server/utils/migration-runner.ts` — Executor das migrations SQL. **[existe]**
3. `server/utils/safeError.ts` — Tratamento de erros HTTP/SQL amigável e seguro. **[roadmap]**
4. `server/utils/auth.ts` — Sessão JWT, cookies, bcrypt e lockout (o `jwt.ts`/`password.ts`
   planejados vivem aqui hoje). **[existe]**
5. `server/utils/permission.ts` — Middleware RBAC (`requirePermission`). **[existe]**
6. `server/utils/audit.ts` — Gravação automática na tabela de auditoria. **[existe]**
7. `server/utils/validation.ts` — Helper `validateBody()` com Zod. **[roadmap]**

E registre o plugin Nitro em:
`server/plugins/migration.ts` **[existe]**

---

### Passo 5: Criar a Migration Inicial (`server/migration/01_create_tables.sql`)

Crie o arquivo `server/migration/01_create_tables.sql` com a estrutura base mínima:
- `perfis_acesso` e `permissoes_perfil` (com suporte a `extras JSON`).
- `usuarios` (com senha em hash bcrypt).
- `sessoes`, `token_blacklist` e `tokens_acesso` (para JWT, logout e convite/recuperação).
- `auditoria` (para rastreabilidade).
- `configuracoes_globais` (para configurações gerais do sistema).
- Tabelas de negócio do portal: `release_week`, `projetos_escopo`, `manuais_mensal` e
  `entregas_itens` (tabela unificada de itens).
- Insira os **seeds** dos perfis (ex: Administrador) e do usuário Admin inicial
  (`docs/bd/02_seed.sql` é a referência).

---

### Passo 6: Copiar os Componentes Base do Frontend

1. Copie a pasta `app/components/ui/` (Design System interno Tailwind).
2. Copie `app/composables/useApiFetch.ts`, `useAuth.ts`, `usePermissions.ts`, `useToast.ts`.
3. Configure `app/app.vue` com `<NuxtLayout>`, `<NuxtPage>` e `<UiToastContainer />`.
4. Configure `app/middleware/auth.global.ts` para proteger as páginas contra acessos não autenticados.

---

### Passo 7: Iniciar o Servidor

Basta rodar:

```bash
npm run dev
```

Na inicialização:
1. O plugin `server/plugins/migration.ts` será acionado.
2. O runner criará a tabela `_migrations`.
3. A migration `01_create_tables.sql` será executada, criando todo o schema e os seeds.
4. O sistema estará pronto para desenvolvimento imediato.

---

## 7. Resumo das Melhores Práticas Adotadas

| Área | Prática Recomendada |
|---|---|
| **SQL & Banco** | Sempre utilize queries parametrizadas com placeholders `?` para prevenir injeção SQL. |
| **Identificadores** | Utilize `UUID()` nativo do MariaDB como chave primária em tabelas de negócio para evitar previsibilidade de IDs sequenciais. |
| **Migrations** | Nunca altere uma migration já executada em produção. Sempre crie uma nova migration com o próximo número sequencial (ex: `02_nova_coluna.sql`). |
| **Erros** | Lance `createError({ statusCode, statusMessage })` com mensagem amigável para não expor a topologia do banco a usuários maliciosos (centralização em `handleApiError` é roadmap — §3.2). |
| **Auditoria** | Registre sempre a ação, o recurso e o identificador do item alterado nas operações de escrita. |
| **Permissões** | Mantenha as 4 ações CRUD padronizadas (`visualizar`, `criar`, `alterar`, `excluir`) e utilize a coluna `extras` JSON para comportamentos específicos do módulo. |
| **Tokens** | Mantenha o token de acesso em cookie `HttpOnly` com tempo de vida curto (ex: 15 a 60 minutos) e utilize refresh tokens rotativos no banco de dados. |

---

*Documento gerado como referência técnica e arquitetural definitiva para replicação em novos ecossistemas e sistemas corporativos.*

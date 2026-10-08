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
| **Ícones** | **lucide-vue-next** (`^1.0.0`) | Ícones SVG limpos e padronizados consumidos via tree-shaking. |
| **Banco de Dados** | **MariaDB 11.8** via **mysql2/promise** (`^3.22.3`) | Conexão direta via Connection Pool, transações nativas e queries SQL parametrizadas (raw SQL). Alta performance sem complexidade e gargalos de ORMs pesados. |
| **Validação** | **Zod** (`^4.4.3`) | Schemas de validação no backend para payloads HTTP (e no frontend para validações de sessão). |
| **Autenticação & Criptografia** | **JWT** (`jsonwebtoken`) + **bcrypt** (`^6.0.0`) | Tokens de acesso curtos, Refresh Tokens com rotação no banco, senhas em bcrypt (custo 12), proteção contra brute force. |
| **Utilitários Frontend** | **@vueuse/core** (`^14.3.0`) | Composables essenciais para ciclo de vida, clipboard, storage e eventos de janela. |
| **Manipulação de Arquivos** | **easy-template-x**, **pdf-lib**, **exceljs**, **qrcode** | Geração e manipulação de DOCX/PDF, exportação de planilhas e emissão de QR Codes. |

---

## 2. Estrutura de Diretórios e Filosofia de Organização

A arquitetura adota o padrão moderno do Nuxt 4, separando a aplicação em dois grandes domínios:

```
raiz-do-projeto/
├── app/                           # CAMADA CLIENTE / FRONTEND (Vue 3 + Tailwind)
│   ├── app.vue                    # Ponto de entrada (NuxtLayout + NuxtPage + UiToastContainer)
│   ├── components/
│   │   ├── layout/                # Layout base (AppLayout, AppSidebar, AppHeader)
│   │   ├── ui/                    # Design System interno (19 componentes atômicos)
│   │   └── [modulo]/              # Componentes de domínio (ex: releases, manuais, escopos, publicacoes)
│   ├── composables/               # Regras de negócio e hooks reativos reutilizáveis
│   ├── config/
│   │   └── navigation.ts          # Definição centralizada do menu lateral e rotas
│   ├── layouts/                   # Layouts de tela (default.vue, presenca.vue, etc.)
│   ├── middleware/
│   │   └── auth.global.ts         # Route guard global no cliente
│   ├── pages/                     # Roteamento baseado em arquivos (File-based routing)
│   └── types/                     # Definições TypeScript do domínio frontend
│
├── server/                        # CAMADA SERVIDORA / BACKEND (Nitro Engine)
│   ├── api/                       # Endpoints HTTP RESTful
│   ├── middleware/                # Middlewares HTTP do Nitro (ex: auth.ts)
│   ├── migration/                 # Scripts SQL versionados (01_..., 02_..., etc.)
│   ├── plugins/                   # Plugins de inicialização do Nitro (ex: migration.ts)
│   ├── services/                  # Regras de negócio complexas do servidor
│   └── utils/                     # Utilitários de infraestrutura (db, jwt, permission, validation)
│
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
| **Área Pública** | rotas raiz de `app/pages/` (ex.: `/`, `/releases`, `/manuais`, `/escopos`) | anônimo, sem autenticação | leitura das publicações: Releases Week Semanal, Manuais e Escopo de Projetos |
| **Área Administrativa** | `app/pages/admin/**` (ex.: `/admin/login`, `/admin/releases`) | autenticação (JWT + cookie) e permissões RBAC | cadastros, edição e publicação dos conteúdos acima, usuários, perfis, auditoria e configurações |

- Rotas públicas são declaradas explicitamente em `PUBLIC_ROUTES`/`PUBLIC_PREFIXES` no middleware `server/middleware/auth.ts` e liberadas no route guard do cliente `app/middleware/auth.global.ts`.
- Toda rota `/admin/**` exige sessão válida; sem sessão, o cliente redireciona para `/admin/login` e o servidor responde `401/403`.
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

Cada rota de API segue um fluxo estrito e padronizado:
1. **Autorização (RBAC)**: validação de permissão granular com `requirePermission`.
2. **Validação de Payload**: parsing seguro com **Zod** (`validateBody`).
3. **Execução no Banco**: SQL parametrizado com UUIDs gerados no MariaDB (`UUID()`).
4. **Auditoria**: registro automático da ação em banco de dados (`registrarAuditoria`).
5. **Tratamento de Erros**: mapeamento seguro com `handleApiError`.

**Exemplo real de endpoint POST (`server/api/publicacoes/index.post.ts`):**

```typescript
import { query } from '../../utils/db'
import { registrarAuditoria } from '../../utils/audit'
import { validateBody, publicacaoSchema } from '../../utils/validation'
import { requirePermission } from '../../utils/permission'
import { handleApiError } from '../../utils/safeError'

export default defineEventHandler(async (event) => {
  // 1. RBAC
  await requirePermission(event, 'publicacoes', 'criar')
  
  // 2. Validação Zod
  const body = await validateBody(event, publicacaoSchema)

  try {
    // 3. Execução SQL
    await query(`
      INSERT INTO publicacoes (id, titulo, slug, tipo, status, ativo)
      VALUES (UUID(), ?, ?, ?, ?, ?)
    `, [body.titulo, body.slug, body.tipo, body.status, body.ativo ? 1 : 0])
    
    // 4. Registro de Auditoria
    await registrarAuditoria(event, {
      acao: 'Inclusão',
      recurso: 'Publicações',
      detalhes: `Criou a publicação ${body.titulo}`
    })

    return { success: true, message: 'Publicação criada com sucesso' }
  
  } catch (error: any) {
    // 5. Tratamento de Erro Amigável e Seguro
    return handleApiError(error, 'Erro ao criar publicação')
  }
})
```

---

### 3.3. Tratamento Seguro de Erros (`server/utils/safeError.ts`)
Para não vazar detalhes internos do banco de dados (tabelas, colunas, queries) em ambientes de produção:
- O código MariaDB `1062` (`ER_DUP_ENTRY`) é capturado e transformado em **HTTP 409 Conflict** com mensagem amigável: *"Registro duplicado. Este dado já existe no sistema."*
- Detalhes de validação Zod são formatados em JSON amigável no console.
- Erros genéricos de runtime lançam **HTTP 500** com mensagem neutra ao cliente, preservando a segurança da infraestrutura.

---

### 3.4. Camada de Segurança e Autenticação

> As regras de segurança obrigatórias do projeto (incluindo a vedação de acesso ao banco pelo frontend) estão consolidadas na seção **"Segurança"** do `AGENTS.md`. Este guia descreve os mecanismos que as implementam.

1. **Tokens JWT com HttpOnly Cookies**:
   - O token de acesso fica em cookie com flag `__Host-auth-token`, `HttpOnly`, `SameSite=Lax`, e `Secure` em produção.
   - O middleware `server/middleware/auth.ts` extrai o token do cookie (ou do header `Authorization: Bearer <token>`).
   - Rotas públicas da **Área Pública** (leitura anônima das publicações) são explicitamente declaradas (`PUBLIC_ROUTES` e `PUBLIC_PREFIXES`); tudo sob `/admin/**` passa pela validação do middleware.
2. **Refresh Tokens com Rotação de Sessão (`sessoes`)**:
   - Cada login gera um token de atualização registrado na tabela `sessoes`. Ao renovar, o token antigo é invalidado e substituído por um novo.
3. **Blacklist de Tokens (`token_blacklist`)**:
   - No logout, o identificador do token (`jti`) é gravado em banco para impedir reutilização até sua expiração.
4. **Proteção contra Brute-Force (Lockout)**:
   - Contador de tentativas falhas (`tentativas_falhas`) e bloqueio temporário (`bloqueado_ate`) na tabela `usuarios`.
5. **Rate Limiting Persistido no MariaDB (`rate_limits`)**:
   - Controle de taxa por IP ou chave na tabela `rate_limits` (evita dependência de Redis para arquiteturas simples).

---

### 3.5. Controle de Acesso Baseado em Papéis (RBAC Dinâmico)

O sistema implementa controle de acesso granular na tabela `perfil_permissoes`:
- Cada perfil possui permissões booleanas para as ações fixas: `visualizar`, `criar`, `alterar`, `excluir`.
- Ações especiais são tratadas no campo `permissoes_extras` (JSON), tais como: `publicar`, `arquivar`, `download`, `exportar`, `importar`.
- O helper `requirePermission(event, modulo, acao)` valida diretamente no banco ou cache de sessão, negando a requisição com **HTTP 403 Forbidden** se o perfil não tiver a permissão concedida.

A tabela de perfis (`perfis`) terá o schema alvo (migration futura — a página
`/admin/perfis-acesso` hoje é demo em memória, `docs/07`):

```sql
CREATE TABLE IF NOT EXISTS perfis (
  id UUID NOT NULL DEFAULT UUID() COMMENT 'Identificador único do perfil',
  nome_perfil VARCHAR(100) NOT NULL COMMENT 'Nome amigável exibido nas telas de governança',
  descricao TEXT NULL COMMENT 'Detalhamento das responsabilidades do perfil',
  padrao_sistema TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indica se é perfil nativo bloqueado para exclusão',
  situacao ENUM('Ativo', 'Inativo', 'Bloqueado') NOT NULL DEFAULT 'Ativo' COMMENT 'Situação cadastral do perfil de acesso',
  cor_identificacao VARCHAR(30) NOT NULL DEFAULT 'slate' COMMENT 'Cor do badge no painel visual',
  criado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  atualizado_em DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
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

Todas as operações de escrita (Inclusão, Alteração, Exclusão, Homologação, etc.) disparam o helper `registrarAuditoria`:
- Captura o IP real do cliente via `getRequestIP(event, { xForwardedFor: true })`.
- Obtém o ID e o Nome do usuário logado via contexto do token.
- Grava na tabela `auditoria` com data/hora e detalhes textuais da operação.
- A falha na auditoria nunca interrompe a requisição principal (resiliência operacional).

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
import { runMigrations } from '../utils/migration-runner'

export default defineNitroPlugin(() => {
  return runMigrations()
})
```

---

### 4.3. O Runner de Migrations (`server/utils/migration-runner.ts`)

O runner contém as seguintes responsabilidades:

1. **Criação da Tabela de Controle**:
   ```sql
   CREATE TABLE IF NOT EXISTS _migrations (
     id INT AUTO_INCREMENT PRIMARY KEY,
     nome VARCHAR(255) NOT NULL UNIQUE,
     executado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   ) COMMENT = 'Registro de migrations executadas automaticamente';
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
        const src = join(nitro.options.srcDir, 'migration')
        const dest = join(nitro.options.output.dir, 'server', 'migration')
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
   - Exemplo: `01_create_tables.sql`, `02_add_status_to_publicacoes.sql`, `03_perfil_permissoes.sql`.
   - A ordenação alfabética do runner garante a ordem exata de execução.
2. **Comando `USE seu_banco;` no Início**:
   - Toda migration inicia definindo o banco alvo: `USE publications;`.
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
2. **Headers de Contexto**: `x-usuario-id` e `x-usuario-nome` para auditoria rápida.
3. **Auto-Refresh Transparente de Token**: Se qualquer chamada receber **HTTP 401 Unauthorized**, o composable intercepta, dispara a rota `/api/auth/refresh` e, em caso de sucesso, refaz a requisição original sem interromper a experiência do usuário.

```typescript
// app/composables/useApiFetch.ts
export function useApiFetch<T = any>(
  request: Parameters<typeof $fetch>[0],
  opts?: Parameters<typeof $fetch>[1]
) {
  const authState = useState<{ id?: string, name?: string } | null>('auth-user')
  const headers: Record<string, string> = { ...opts?.headers } as Record<string, string>

  if (authState.value?.id) headers['x-usuario-id'] = authState.value.id
  if (authState.value?.name) headers['x-usuario-nome'] = encodeURIComponent(authState.value.name)

  const doFetch = () => $fetch<T>(request, {
    ...opts,
    headers,
    credentials: 'include',
  })

  return doFetch().catch(async (err: any) => {
    if (err.statusCode !== 401) throw err

    try {
      // Tenta refresh token automático
      await $fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' })
      return doFetch()
    } catch {
      throw err
    }
  }) as Promise<T>
}
```

---

### 5.3. Gerenciamento de Autenticação e Permissões no Cliente

1. **`useAuth.ts`**:
   - Controla os estados reativos `loggedIn`, `user` e a inicialização via cookie/sessão (`initFromCookie`).
   - Sincroniza dados básicos em `sessionStorage` para consistência em recarregamentos de página (F5).
2. **`app/middleware/auth.global.ts`**:
   - Middleware global de rota: intercepta todas as navegações.
   - Rotas da **Área Pública** (leituras anônimas) e `/admin/login` são liberadas. As demais rotas `/admin/**` exigem `loggedIn === true` ou redirecionam imediatamente para `/admin/login`.
3. **`usePermissions.ts`**:
   - Fornece o helper reativo `.can(modulo, acao)`.
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

# Instalar dependências de banco, validação, segurança e estilos
npm install @nuxtjs/tailwindcss @vueuse/core lucide-vue-next mysql2 zod bcrypt jsonwebtoken
npm install -D @types/jsonwebtoken
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
    dbPort: process.env.DB_PORT || '3306',
    dbUser: process.env.DB_USER || 'root',
    dbPassword: process.env.DB_PASSWORD || '',
    dbName: process.env.DB_NAME || 'publications',
    jwtSecret: process.env.JWT_SECRET || 'chave-secreta-jwt-super-segura',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'chave-secreta-refresh-jwt',
    public: {
      baseUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },
  nitro: {
    hooks: {
      'compiled': async (nitro) => {
        const src = join(nitro.options.srcDir, 'migration')
        const dest = join(nitro.options.output.dir, 'server', 'migration')
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

# Autenticação
JWT_SECRET=defina_uma_chave_longa_e_aleatoria_para_jwt
JWT_REFRESH_SECRET=defina_uma_chave_longa_para_refresh_token
```

---

### Passo 4: Copiar os Utilitários de Infraestrutura do Backend

Crie/adicione em `server/utils/` os seguintes arquivos:

1. `server/utils/db.ts` — Connection pool MariaDB e suporte a transações.
2. `server/utils/migration-runner.ts` — Executor das migrations SQL.
3. `server/utils/safeError.ts` — Tratamento de erros HTTP/SQL amigável e seguro.
4. `server/utils/jwt.ts` — Assinatura e validação de tokens JWT.
5. `server/utils/password.ts` — Hashing de senha com bcrypt.
6. `server/utils/permission.ts` — Middleware RBAC (`requirePermission`).
7. `server/utils/audit.ts` — Gravação automática na tabela de auditoria.
8. `server/utils/validation.ts` — Helper `validateBody()` com Zod.

E registre o plugin Nitro em:
`server/plugins/migration.ts`

---

### Passo 5: Criar a Migration Inicial (`server/migration/01_create_tables.sql`)

Crie o arquivo `server/migration/01_create_tables.sql` com a estrutura base mínima:
- `perfis` e `perfil_permissoes` (com suporte a `permissoes_extras JSON`).
- `usuarios` (com senha em hash bcrypt).
- `sessoes` e `token_blacklist` (para JWT e segurança).
- `auditoria` (para rastreabilidade).
- `sistema_config` (para configurações gerais do sistema).
- `publicacoes` — tabela de negócio de exemplo, com coluna `tipo` cobrindo os três domínios (`release_semanal`, `manual`, `escopo_projeto`) e `status` (`rascunho`, `agendado`, `em_revisao`, `publicado`, `bloqueado`).
- Insira os **seeds** dos perfis (ex: Administrador) e do usuário Admin inicial.

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
| **Erros** | Centralize erros no `handleApiError` para não expor a topologia do banco a usuários maliciosos. |
| **Auditoria** | Registre sempre a ação, o recurso e o identificador do item alterado nas operações de escrita. |
| **Permissões** | Mantenha as 4 ações CRUD padronizadas (`visualizar`, `criar`, `alterar`, `excluir`) e utilize a coluna `permissoes_extras` JSON para comportamentos específicos do módulo. |
| **Tokens** | Mantenha o token de acesso em cookie `HttpOnly` com tempo de vida curto (ex: 15 a 60 minutos) e utilize refresh tokens rotativos no banco de dados. |

---

*Documento gerado como referência técnica e arquitetural definitiva para replicação em novos ecossistemas e sistemas corporativos.*

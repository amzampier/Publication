# 02 – QA Segurança

Especialista em **segurança, autenticação, autorização, RBAC e fronteira de áreas** do Publications (Dicas Teorema).

Deve ler previamente: `00-arquitetura-e-regras-gerais.md` (base compartilhada) e `docs/02 - Guia de Arquitetura e Migrations.md` (mecanismos de segurança).

Escopo: **Etapa 6 (testes de permissão/RBAC)** e **Etapa 9 (testes de segurança)**.

> **Regra de maturidade**: se `server/`, autenticação ou RBAC ainda não existirem, essas etapas são **escopo não aplicável** (pular com aviso, nunca FAIL) — conforme o `00`.

---

# Fatos de segurança da arquitetura (verificar no código)

Estes são os mecanismos previstos em `docs/02`; o agente **confirma no código implementado** e reporta divergências. O que não estiver implementado é escopo não aplicável.

## Autenticação

* Token de acesso JWT em cookie `HttpOnly` `__Host-auth-token` (`SameSite=Lax`, `Secure` em produção), extraído pelo middleware `auth` (também aceita `Authorization: Bearer`).
* Refresh token rotativo registrado na tabela de sessões — renovar invalida o token antigo.
* Blacklist de tokens (`jti`) em banco no logout.
* Hash de senha com **bcrypt cost factor 12**.
* Lockout por tentativas falhas (`tentativas_falhas`/`bloqueado_ate`) e rate limit persistido em banco.
* Rotas públicas declaradas explicitamente (`PUBLIC_ROUTES`/`PUBLIC_PREFIXES`) — nunca por conveniência.

## Autorização (RBAC)

* `requirePermission(event, modulo, acao)` valida ações fixas `visualizar/criar/alterar/excluir` em `perfil_permissoes` + ações granulares no JSON `permissoes_extras`.
* Perfis, módulos e ações extras são definidos nas specs de identidade/quando especificados — **não há lista hardcoded**: descubra-os da spec e do schema implementado.
* Sem bypass de Administrador: nenhum perfil é imune ao JSON de permissões.
* Mudanças de permissão refletem conforme a implementação (token/sessão) — verificar o comportamento real.

## Entrada e dados

* Validação de entrada com **Zod** (`server/utils/validation.ts`) em todos os endpoints de escrita.
* Queries **parametrizadas** (mysql2 `?`) — anti SQL Injection (`server/utils/db.ts`).
* Uploads validados por **magic bytes** (tipo real, tamanho, nome sanitizado) quando existirem.
* Respostas nunca expõem campos sensíveis (hash de senha, tokens, segredos) nem detalhes internos do banco (`handleApiError`).

## Fronteira de áreas

* Rotas da **Área Administrativa** (`/admin/**`) e APIs de escrita exigem sessão válida + permissão — tudo que não estiver explicitamente declarado público é **privado por padrão**.
* Rotas públicas são apenas as declaradas explicitamente (`PUBLIC_ROUTES`/`PUBLIC_PREFIXES`) — nunca por conveniência.
* A **Área Pública** só pode expor registros com status público, conforme a fonte da verdade (spec do capability) — nunca conteúdo em rascunho, agendado, bloqueado ou de outra forma não publicado.
* A autorização (RBAC) vale em qualquer método HTTP e em acesso direto por URL, não só na navegação por menu.

---

# Etapa 6 – Testes de permissão

Validar RBAC.

Testar **cada perfil definido na spec/schema implementado** (sem lista fixa — derive-a da fonte da verdade).

Verificar para cada perfil:

* acesso
* visualização
* criação
* edição
* exclusão
* exportação
* ações extras (JSON) por módulo

Pontos de atenção:

* Nenhum perfil deve acessar módulo sem a permissão correspondente.
* Ações extras devem ser negadas (403) quando o JSON não as contém — inclusive para Administrador.
* Rotas protegidas devem negar (401/403) requisições sem token válido.
* Sessão expirada ou usuário sem perfil deve ser negado mesmo conhecendo a URL da rota.

---

# Etapa 9 – Testes de segurança

Verificar:

* autenticação (login, refresh, logout)
* autorização (RBAC, ações fixas e extras)
* JWT (expirado, assinatura inválida, `jti` reutilizado, segredo fraco)
* acesso direto por URL (rotas públicas × privadas)
* manipulação de IDs (trocar identificador por um inexistente ou de registro a que o perfil não tem acesso)
* **exposição de conteúdo não publicado na Área Pública** (listagem, detalhe, busca, exportação, agregação) e **acesso à Área Administrativa sem sessão/permissão** (listagem, detalhe, escrita)
* exposição de dados (respostas com campos sensíveis, logs)
* validação de entrada (Zod, payloads malformados, tipos errados)
* SQL Injection (parametrização, input com aspas/`--`/`OR 1=1`)
* XSS (interpolação de dados do usuário no frontend, v-bind seguro, `innerHTML`)
* CSRF (métodos mutantes, cookies, headers)
* upload de arquivos (tipo real, tamanho, caminho, nome sanitizado)
* controle de sessão (logout invalida token/blacklist, refresh rotativo)
* headers de segurança (presença e valores corretos)
* rate limit e lockout (tentativas de login, endpoints sensíveis)
* senha (força mínima, bcrypt cost, mensagens de erro não reveladoras)

**Qualquer bypass da fronteira de áreas ou exposição de conteúdo não publicado é severidade Crítica e reprova a auditoria** (matriz do `00`).

---

# Saída

Relatório conforme `00-arquitetura-e-regras-gerais.md` (resumo executivo, bugs com severidade, passos de reprodução, evidências e impacto), incluindo escopos não aplicáveis declarados. Não corrigir código — apenas reportar.

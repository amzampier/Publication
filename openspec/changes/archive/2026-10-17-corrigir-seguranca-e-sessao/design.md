# Design

## Context

Ver `proposal.md - Why` e os achados RL04-C-01, RL04-A-01 e RL04-A-02 em
`docs/RL04 - Relatório de Qualidade Completo.md`. Estado atual relevante:

- **Uploads:** `server/utils/uploads.ts` valida magic bytes (`ehImagemReal`) mas
  `sanitizarNomeArquivo` preserva qualquer extensão permitida no alfabeto
  `[a-zA-Z0-9._-]` (inclui `.html`); `gravarUpload` grava usando a extensão do nome;
  `nuxt.config.ts` serve `/uploads/**` como asset público (Nitro infere `Content-Type`
  pela extensão) com apenas `nosniff`.
- **Sessão:** `server/utils/auth.ts` calcula `expira = new Date(Date.now() + REFRESH_TTL_DIAS * 24 * 3600)`
  (`Date.now()` em ms + `604800` **segundos** ≈ 10 min), enquanto o cookie usa
  `REFRESH_TTL_DIAS * 24 * 3600` **segundos** (`Max-Age = 604800`, correto).
- **Logout:** `useAuth.sair()`/`sessaoInvalidada()` limpam apenas `auth-usuario`/`auth-verificada`;
  `useState` de módulos (`perfis-*`, `permissoes-usuario`, `config-globais-cache`,
  `usuarios-*`, `auditoria-*`) permanece na memória compartilhada do SPA.

## Goals / Non-Goals

**Goals:**
- Impedir que conteúdo enviado a `/api/uploads` seja gravado ou servido de forma
  executável na origem da aplicação (fechar o XSS armazenado).
- Fazer a sessão de refresh durar o período configurado (padrão 7 dias), coerente
  entre banco e cookie, restaurando a renovação silenciosa.
- Garantir que o logout descarte todo o estado derivado da sessão no cliente, de modo
  que um novo login na mesma aba não veja dados do usuário anterior.

**Non-Goals:**
- Itens de Etapa 2+ do RL04 (revogação na desativação via `PUT /api/usuarios/:id`,
  ordenação server-side, cache de configurações após salvar, a11y, exportação).
- Introduzir Zod/schema validation, headers de segurança globais/CSRF (roadmap).
- Reescrever o servimento de uploads para `Content-Disposition: attachment` (não é
  necessário se a extensão/tipo for neutro; fica como defesa adicional opcional).

## Decisions

### D1 — Upload: derivar a extensão do tipo real e nunca preservar a extensão do cliente
`ehImagemReal` passa a devolver o **tipo canônico** detectado (`png`/`jpeg`/`webp`/`gif`)
em vez de apenas `boolean`; `gravarUpload` monta o nome final com o `basename` sanitizado
(sem extensão) + a extensão canônica do tipo detectado. Assim nenhuma extensão executável
(`.html`, `.svg`, `.js`, `.xml`) sobrevive ao processo, e o Nitro serve o arquivo com o
`Content-Type` de imagem correspondente.

- **Alternativas consideradas:** (a) rejeitar apenas extensões executáveis, mantendo a
  original — frágil (lista de bloqueio, não de permissão); (b) decodificar a imagem
  completa para validar estrutura — mais caro e desnecessário para o vetor; (c) manter a
  extensão original e forçar `Content-Type` neutro no servimento — não cobre o nome
  servido por outras vias. A escolha (allowlist de extensão derivada do tipo real) é a
  mais simples e robusta.
- **Defesa em profundidade:** manter `X-Content-Type-Options: nosniff`. Opcionalmente,
  acrescentar `Content-Security-Policy: default-src 'none'` às respostas de `/uploads/**`
  (o `routeRules` já existe), sem alterar o comportamento visível de imagens.

### D2 — Sessão: um único TTL em segundos, convertido uma vez
Introduzir `const REFRESH_TTL_SEG = REFRESH_TTL_DIAS * 24 * 60 * 60` como fonte única.
O cookie usa `maxAge: REFRESH_TTL_SEG` (segundos) e o banco usa
`new Date(Date.now() + REFRESH_TTL_SEG * 1000)` (ms). `criarSessao` e `rotacionarSessao`
passam a usar o mesmo cálculo, eliminando a divergência de unidades.

- **Alternativas consideradas:** (a) corrigir só o `* 1000` pontual — sujeito a repetir o
  erro; (b) expressar o TTL como `Date` via `setDate()` — menos explícito. A constante
  única torna o TTL auditável (`grep REFRESH_TTL_SEG`).
- **Sem migration:** sessões já gravadas com ~10 min simplesmente expiram; usuários podem
  ser levados ao login uma vez após o deploy — comportamento aceitável.

### D3 — Logout: limpeza coordenada do estado de sessão no cliente
Criar `app/composables/sessaoEstado.ts` com `limparEstadoSessao()` que redefine ao valor
inicial todas as chaves `useState` derivadas da sessão (listas/KPIs/opções de perfis,
usuários e auditoria; matriz de permissões; cache de configurações globais; flags de
carregamento). `useAuth.sair()` e `sessaoInvalidada()` chamam `limparEstadoSessao()`.

- **Alternativas consideradas:** (a) limpar apenas nos composables de cada módulo —
  esparso e fácil de esquecer; (b) recarregar a página inteira no logout — contorna o
  problema mas piora a UX e não cobre `sessaoInvalidada`. A limpeza coordenada mantém o
  SPA fluido e é explícita quanto ao que é estado de sessão.
- **Enablers:** como as flags de "carregado" voltam a falso, as telas refazem o GET no
  servidor ao reabrir (não servem cache da sessão anterior). `useAuth` continua a limpar
  `auth-usuario`/`auth-verificada` como hoje.

## Risks / Trade-offs

- **Normalização de extensão pode divergir do nome exibido** → consumidores usam a URL
  retornada pelo upload; nenhum consumidor atual depende da extensão original.
- **Colisão de nomes após normalização** → a rotina de sufixo `-1, -2, …` de
  `gravarUpload` passa a operar sobre a extensão canônica; ajustar a montagem do nome
  para usar `basename` sem extensão + extensão canônica.
- **TTL maior amplia a janela de um refresh roubado** → mitigado pela rotação de refresh
  e pela revogação por `token_version` (já existentes); é o trade-off pretendido (7 dias
  é o requisito do sistema).
- **Limpeza agressiva demais no logout** → restringir às chaves de estado derivadas da
  sessão; não tocar em preferências puramente visuais não ligadas à sessão (ex.: tema).
- **Regressão de upload de logomarca/avatar** → validar manualmente os fluxos de upload
  de logomarcas e avatares após a mudança.

## Migration Plan

1. Alterar `server/utils/uploads.ts` (D1) e o cálculo de TTL (D2); ajustar
   `server/api/uploads/index.post.ts` e `nuxt.config.ts` conforme necessário.
2. Adicionar `app/composables/sessaoEstado.ts` e chamá-lo em `useAuth` (D3); garantir a
   lista de chaves completa (perfis, usuários, auditoria, permissões, configurações).
3. Verificar por `npm run build` e E2E: upload de `*.html` com magic PNG deixa de resultar
   em `Content-Type: text/html`; `sessoes.expira_em` ≈ `criado_em + 7 dias`; logout +
   login de outro perfil na mesma aba não exibe dados do anterior.
4. **Rollback:** reverter os commits; nenhum dado/estrutura é alterado (sessões expiram
   naturalmente), então o rollback é seguro.
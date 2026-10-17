# Design

## Context

Ver `proposal.md - Why` e os achados RL04-DOC-01…17/M-22 em
`docs/RL04 - Relatório de Qualidade Completo.md`. Estado atual: a documentação de tela
(`docs/03/04/05/07/09`) e o `docs/02` ficaram atrás do código (RBAC, paginação server-side, expurgo,
dropdown dinâmico de perfis, situação do perfil); há um conflito interno na spec `gestao-usuarios`
(filtros "em memória" × "no servidor"); o catálogo de `autorizacao-rbac` não lista
`GET /api/usuarios/emails`; `docs/06` é referenciado mas não existe; e o projeto não tem
`lint`/`typecheck`/`test` (gate = `npm run build`).

## Goals / Non-Goals

**Goals:** alinhar a documentação ao código; resolver o conflito da spec `gestao-usuarios`;
completar o catálogo RBAC; criar o `docs/06`; adicionar `lint`/`typecheck`/`test` com uma suíte mínima.

**Non-Goals:** mudar comportamento de produção; reescrever documentos do zero; cobertura de testes
ampla (a suíte é mínima e cobre funções puras); CI remoto.

## Decisions

### D1 — Alinhamento da documentação
Corrigir, por documento: `docs/01` (sumário 5.1–5.20, `lucide-vue-next`→`@lucide/vue`, default do
`Kpi`; §5.20 já corrigido), `docs/02` (`_migrations` `(nome, aplicado_em)`, `ipDoCliente` só com
`TRUSTED_PROXIES`, árvore/guia de boot, resíduos "demo"), `docs/03` (RBAC/middleware presentes, "10
tintas D9"), `docs/04` ("mockups"→backend), `docs/05` (RBAC, contrato de `GET /api/auditoria`,
paginação server-side, expurgo), `docs/07` (dropdown dinâmico, situação do perfil controla acesso,
matriz 99/45/21/**6**, tipos `*Modelo`), `docs/09` (tipos `*Modelo`), `docs/bd/01` (migration 11),
`docs/qa/00` (`@lucide/vue`). Objetivo: nenhum item DOC-01…17 restante.

### D2 — Conflito da spec `gestao-usuarios`
Fonte da verdade: o código aplica filtros **no servidor** (`GET /api/usuarios`). A cláusula "os
filtros operam inteiramente em memória, sem nenhuma requisição HTTP" é removida (MODIFIED) e o
título da requirement da tela é renomeado (RENAMED) de "filtros e exportações permanecem locais"
para "filtros e exportações via API". O texto do estado vazio passa ao vigente ("Nenhum resultado
encontrado para o filtro.").

### D3 — Catálogo `autorizacao-rbac`
Adicionar `GET /api/usuarios/emails` → `gestao-usuarios`/`visualizar` (rota implementada) e um
cenário de `403` para perfil sem `visualizar`.

### D4 — `docs/06`
O padrão de documentos de tela (`03`, `04`, `05`, `07`, `08`, `09`) indica que `06` seria o doc de
**Gestão de Usuários (e Convite)**. Criar `docs/06 - Gestão de Usuários e Convite.md` (rota,
componentes, fluxos CRUD/importação/convite/bloqueio, backend) em vez de apenas remover as
referências — preserva os links de `docs/01`/`docs/07`.

### D5 — Ferramentaria de processo
Adicionar scripts `lint`, `typecheck` e `test` e as devDependencies: **ESLint** (flat config, com
`eslint-plugin-vue` + `typescript-eslint`), **`typescript` + `vue-tsc`** (typecheck) e **Vitest**
(ambiente node para utilitários de servidor e de composables puros). Suíte **mínima** de testes de
funções puras já exportadas: `detectarTipoImagem`/`sanitizarNomeArquivo` (`server/utils/uploads.ts`),
`sanitizarRedirectAdmin` (`app/composables/useAuth.ts`) e a validação/ordenação da auditoria se
exportada. Documentar os comandos no `AGENTS.md`.

- **Alternativas consideradas:** adotar `@nuxt/eslint` — mais integrado, porém impõe convenções do
  módulo; preferiu-se ESLint flat config + Vitest, mais previsível. Não cobrir UI E2E (fora do
  escopo mínimo).

## Risks / Trade-offs

- **Novas devDependencies** → instalação baixa pacotes (rede) e altera `package-lock.json`;
  configurar `lint`/`typecheck` sem quebrar a build (o `typecheck` do `vue-tsc` pode acusar erros
  pré-existentes — escopar o `include` para `app/`/`server/` conforme viável).
- **Docs por documento** → risco de divergência residual; validar por grep dos itens DOC.
- **Suíte mínima** → cobertura pequena por design; documentar como ponto de partida.

## Migration Plan

1. Specs: aplicar os deltas de `gestao-usuarios` e `autorizacao-rbac`.
2. Docs: corrigir `docs/01…09`, `docs/bd/01`, `docs/qa/00` e criar `docs/06`.
3. Tooling: adicionar devDependencies + `eslint.config.mjs` + `vitest.config.ts` + testes +
   scripts no `package.json`; atualizar `AGENTS.md`.
4. Verificar por `npm run lint`, `npm run typecheck`, `npm run test` e `npm run build`; grep dos
   resíduos DOC; `openspec validate --specs`.
5. **Rollback:** reverter os commits (docs/spec/tooling); remover as devDependencies se necessário.

## Open Questions

Nenhuma pendente que altere specs, abordagem ou tarefas.
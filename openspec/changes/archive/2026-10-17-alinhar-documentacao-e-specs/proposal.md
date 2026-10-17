# Proposal

## Why

A última etapa do RL04 (Documentação e specs) fecha as pendências de **alinhamento entre a documentação e o sistema já implementado** (os itens RL04-DOC-01…17 e RL04-M-22), resolve um **conflito interno da spec `gestao-usuarios`** (filtros "em memória" × "no servidor") e completa o **catálogo de rotas do RBAC** com a rota `GET /api/usuarios/emails`. Além disso, adiciona a **ferramentaria de processo** que faltava (`lint`, `typecheck` e uma suíte mínima de testes), hoje inexistente — o gate do projeto é apenas `npm run build`.

## What Changes

- **Documentação alinhada ao código** (`docs/01`, `docs/02`, `docs/03`, `docs/04`, `docs/05`, `docs/07`, `docs/09`, `docs/bd/01`, `docs/qa/00`): remover pendências já entregues (RBAC `requirePermission`, paginação server-side, expurgo, dropdown dinâmico de perfis, situação do perfil), corrigir contratos (resposta de `GET /api/auditoria`, `_migrations`, `ipDoCliente`), tokens/tipografia e resíduos (`lucide-vue-next`, `#2161ef`, `*Demo`, "8 tintas", "demo"/"mockup").
- **`docs/06`**: criar o documento referenciado (Gestão de Usuários/Convite) **ou** remover as referências — resolver a referência quebrada.
- **Spec `gestao-usuarios`**: resolver o **conflito interno** — os filtros SHALL ser aplicados **no servidor** (remover a cláusula "inteiramente em memória, sem nenhuma requisição HTTP" do modal de filtros e alinhar o título da requirement da tela).
- **Spec `autorizacao-rbac`**: incluir `GET /api/usuarios/emails` → `gestao-usuarios`/`visualizar` no catálogo de rotas.
- **Ferramentaria de processo:** adicionar scripts `lint` (ESLint), `typecheck` (`vue-tsc`) e `test` (Vitest) com as devDependencies correspondentes, e uma **suíte mínima** de testes unitários de funções puras (ex.: validação de data da auditoria, ordenação por whitelist, sanitização de upload), documentando os comandos no `AGENTS.md`.
- Sem mudança de comportamento do sistema em produção (ajustes de documentação, spec e ferramental).

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `gestao-usuarios`: resolve o conflito dos filtros (aplicados no servidor) e ajusta o título da requirement da tela.
- `autorizacao-rbac`: o catálogo passa a incluir `GET /api/usuarios/emails`.

## Impact

- **Documentação:** `docs/01`, `docs/02`, `docs/03`, `docs/04`, `docs/05`, `docs/07`, `docs/09`, `docs/bd/01`, `docs/qa/00` e a decisão sobre `docs/06`; `docs/RL04` (status da Etapa 5).
- **Specs:** `openspec/specs/gestao-usuarios/spec.md` e `openspec/specs/autorizacao-rbac/spec.md` (via deltas).
- **Tooling:** `package.json` (scripts + devDependencies), arquivos de configuração (`eslint.config.*`, `vitest.config.*`), testes em `tests/` (ou colocalizados) e `AGENTS.md`.
- **Código de produção:** nenhuma alteração de comportamento; os testes exercitam funções/utilitários existentes.
- **Dependências:** novas **devDependencies** (ESLint + parser Vue/TS, `typescript`/`vue-tsc`, Vitest).
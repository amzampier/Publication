# Proposal

## Why

A auditoria RL02 (Etapa 6) identificou **documentação obsoleta/divergente** da implementação real (`DOC-01…DOC-12`), uma referência de banco que não reproduz o schema aplicado (`docs/bd/01`/`docs/bd/02`) e **nomes `*Demo`** em código de produção (`NOM-02`) que confundem QA e desenvolvedores. Ajustar isso alinha a fonte de apoio (docs) ao comportamento real e reduz risco de decisões erradas baseadas em texto desatualizado — sem alterar comportamento do sistema.

## What Changes

- **DOC-01…DOC-12:** atualizar a documentação para refletir o código atual:
  - `docs/02` — stack (libs reais), árvore de diretórios, `_migrations`, snippet de `useApiFetch`, cookies dev/prod, flags de roadmap (`requirePermission`/Zod/`safeError`/`usePermissions`), contagens.
  - `docs/01` — contagem de seções/componentes e identidade da Área Pública (roadmap).
  - `docs/04`, `docs/07`, `docs/08` — remover pendências já resolvidas (persistência, RBAC de sessão, auditoria de login).
  - `docs/bd/01` — incluir `seguranca_eventos_login`/`sidebar_expandida` e alinhar ao schema real; `docs/bd/02` — remover o `INSERT` do admin com hash placeholder (bootstrap é em TS).
- **MEL-01:** documentar as colunas de `configuracoes_globais` sem UI (`nome_empresa`, `banner_*`, `notificar_por_email`, `exigir_revisao_para_publicar`) como **reservadas/roadmap** (sem remover do banco).
- **MEL-02:** nomear nas specs/docs os endpoints sem contrato explícito (`/api/convite`, `/api/seguranca/*`, `/api/usuarios/eu`, `/api/configuracoes/identidade`).
- **MEL-03:** registrar na doc o risco aceito do lockout por conta (negação de acesso por terceiro).
- **NOM-02:** renomear `useUsuariosDemo.ts`/`usePerfisDemo.ts`/`useAuditoriaDemo.ts` e os tipos `*Demo` para nomes sem "Demo", ajustando os imports (refatoração sem mudança de comportamento).

## Capabilities

### New Capabilities
Nenhuma.

### Modified Capabilities
Nenhuma — change **sem mudança de comportamento** (documentação + refatoração de nomes). Declara `skip_specs: true` em `.openspec.yaml`; não há deltas de spec.

## Impact

- **Documentos:** `docs/01`, `docs/02`, `docs/04`, `docs/07`, `docs/08`, `docs/bd/01`, `docs/bd/02` (+ `docs/RL02` para o status da Etapa 6).
- **Código (rename):** `app/components/usuarios/useUsuariosDemo.ts`, `app/components/perfis/usePerfisDemo.ts`, `app/components/auditoria/useAuditoriaDemo.ts` e todos os imports/tipos `*Demo` (ex.: `UsuarioDemo`, `PerfilDemo`).
- **Sem mudança** de schema, migrations, rotas ou comportamento observável.
- **Dependências:** nenhuma nova.

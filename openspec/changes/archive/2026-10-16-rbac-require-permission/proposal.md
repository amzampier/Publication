# Proposal

## Why

A matriz de RBAC (`permissoes_perfil`) é persistida, editada e exibida pela tela de Perfis de Acesso, mas **não tem nenhum efeito** sobre as APIs: o middleware `server/middleware/auth-api.ts` exige apenas sessão válida. Na auditoria RL02 (achado **C-01**, Crítico), uma conta com perfil **Leitor** (6/99) executou `DELETE /api/usuarios/:id` com sucesso (200) e conseguiu redefinir a senha do Administrador via `/api/convite`. Isso invalida todo o modelo de autorização e expõe a Área Administrativa a escalada de privilégio. É o desbloqueio crítico antes de qualquer continuidade de desenvolvimento.

## What Changes

- Criar o helper de autorização `requirePermission(event, modulo, acao)` em `server/utils/permission.ts`, que resolve o perfil do usuário da sessão, carrega a matriz de `permissoes_perfil` (+ `extras`) e responde **`403`** quando a ação não está concedida.
- Aplicar `requirePermission` **rota a rota** em todas as rotas administrativas por módulo, conforme o catálogo de mapeamento rota → (módulo, ação) definido na nova capability.
- Manter **somente sessão** (sem permissão de módulo) nas rotas de autoatendimento e portas públicas: `/api/auth/*`, `/api/configuracoes/identidade`, `GET/PATCH /api/usuarios/eu` e o upload do próprio avatar — não há módulo de matriz para "Meu Perfil".
- Adicionar **guarda anti-lockout**: a gravação/cópia da matriz SHALL impedir que o sistema fique sem nenhum usuário ativo com as permissões essenciais (`gestao-usuarios`, `perfis-acesso`, `configuracoes-globais` com `alterar`), retornando `409`.
- Disponibilizar o composable `app/composables/usePermissions.ts` com `.can(modulo, acao)` (para uso incremental da UI). O *gating* visual (ocultar sidebar/menu/botões) **não** faz parte desta etapa.
- **BREAKING**: rotas administrativas passam a responder `403` para sessões cujo perfil não tenha a permissão exigida (hoje respondem 200/201/204 apenas com sessão).

## Capabilities

### New Capabilities
- `autorizacao-rbac`: autorização por módulo/ação no servidor (`requirePermission`), o catálogo rota → (módulo, ação), a semântica do `403` e as exceções de autoatendimento/portas públicas, além da disponibilização do `.can()` no cliente.

### Modified Capabilities
- `perfis-acesso`: a matriz de permissões passa a ser **aplicada** pelas APIs (deixa de ser apenas normativa/roadmap) e a gravação/cópia da matriz ganha a **guarda anti-lockout** (novo cenário de recusa `409`), preservada a editabilidade da matriz de qualquer perfil na abertura do modal.

## Impact

- **Novos arquivos:** `server/utils/permission.ts`, `app/composables/usePermissions.ts`.
- **Rotas alteradas:** todas as `server/api/**` de módulo — `usuarios` (list/create/update/delete/situacao/importar/convite), `perfis` (list/create/update/delete/permissoes/copiar), `auditoria` (get), `configuracoes` (get/put), `uploads` (post por destino), `seguranca` (estado/liberar).
- **Utilitários tocados:** `server/utils/perfis.ts` (guarda anti-lockout), possivelmente `server/utils/auth.ts` (expor a resolução de perfil do usuário, se necessário).
- **Contratos HTTP:** novo código `403` nas rotas de módulo; novo `409` na gravação/cópia de matriz em cenário de lockout.
- **Sem mudança** em schema, migrations ou seeds (a matriz e as colunas já existem).
- **Dependências:** nenhuma nova.
- **Risco de regressão:** sessões de perfis não-Administrador perdem ações hoje permitidas — comportamento pretendido; coberto por cenários de spec e verificação E2E.

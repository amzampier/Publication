# Tasks

## 1. Perfis dinâmicos no cliente (tipos e opções)

- [x] 1.1 Em `app/components/usuarios/useUsuariosModelo.ts`, trocar `PerfilUsuario` para `string` e substituir `VARIANTE_POR_PERFIL` por um helper `variantePerfil(perfil: string)` com fallback `'neutral'`, mantendo os 4 perfis mapeados. Verificação: `npm run build` conclui sem erro e os consumidores do tipo/constante compilam.
- [x] 1.2 Em `app/components/usuarios/Filtros.vue`, montar `opcoesPerfil` a partir de `opcoes.perfis` do `useUsuarios()` (em vez de `PERFIS`). Verificação: build OK; com um perfil customizado Ativo, o select de perfil o lista.
- [x] 1.3 Em `app/components/usuarios/Formulario.vue`, montar `opcoesPerfil` a partir de `opcoes.perfis` (em vez de `PERFIS`) e usar `variantePerfil` onde o badge de perfil é exibido. Verificação: build OK; o select Perfil do modal lista o perfil customizado.

## 2. Importação com perfis dinâmicos

- [x] 2.1 Em `app/components/usuarios/lerPlanilhaUsuarios.ts`, adicionar o parâmetro `perfisValidos: Iterable<string>` e validar `perfisValidos.has(perfil)` em vez de `PERFIS.includes(...)`. Verificação: build OK.
- [x] 2.2 Em `app/components/usuarios/Importar.vue`, repassar os perfis válidos (a partir de `opcoes.perfis`) a `lerPlanilhaUsuarios`. Verificação: build OK; uma linha com perfil customizado Ativo não é marcada como "Linha inválida" por esse motivo.

## 3. Liberação de bloqueio idempotente

- [x] 3.1 Em `server/utils/auth.ts` (`limparFalhasLogin`), devolver `true` quando a conta existe (mesmo com `affectedRows === 0`), fazendo `SELECT id` de confirmação nesse caso; manter `false` para conta inexistente. Verificação: `npm run build` OK.
- [x] 3.2 Verificar (E2E) que `POST /api/seguranca/liberar` com `usuarioId` de uma conta existente já limpa responde `200 { ok: true }` (não `404`) e, para conta inexistente, `404`. Verificação: com sessão de Administrador, liberar uma conta existente já sem bloqueio → `200`; liberar um `usuarioId` aleatório → `404`.

## 4. Verificação integrada e documentação

- [x] 4.1 Rodar o build de produção. Verificação: `npm run build` conclui sem erro.
- [x] 4.2 Executar o roteiro E2E consolidado. Verificação: (a) criar um perfil customizado Ativo em Perfis de Acesso → ele aparece no select de Perfil do modal de usuário e no filtro; (b) importar planilha com esse perfil → linha válida; (c) liberar bloqueio de conta já limpa → `200`; conta inexistente → `404`.
- [x] 4.3 Atualizar o `docs/RL03 - Relatório de Auditoria Completo - Parte 02.md`, marcando `RL03-M-01` e `RL03-M-02` como corrigidos (com a data e a change) na Etapa 3. Verificação: as duas linhas constam como corrigidas.

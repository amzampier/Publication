# Proposal

## Why

A varredura RL04 identificou na Etapa 2 buracos de **revogação de sessão e autorização** que sobrevivem à correção da Etapa 1: desativar um usuário pelo modal de edição (`PUT /api/usuarios/:id`) não revoga o acesso (e reativar reaviva o token antigo); inativar um **perfil** não derruba as sessões abertas dos seus usuários; perfis **Inativos** ainda são oferecidos na UI e podem ser escolhidos antes de o servidor rejeitar; a mensagem real do **anti-lockout** (`409`) é engolida pela UI e a guarda não protege desativação/exclusão do último administrador; e o `POST /api/auth/refresh` não confirma a revogação da sessão. São os itens RL04-M-01, RL04-M-09, RL04-M-05, RL04-M-06, RL04-B-10 e RL04-B-14.

## What Changes

- **Revogação por qualquer caminho de escrita da situação:** passar um usuário a **Inativo** revoga o acesso vigente — hoje só a rota dedicada `/situacao` incrementa a versão; a edição geral (`PUT /api/usuarios/:id`) passa a revogar também. Reativar **não** revalida tokens emitidos antes da desativação.
- **Revogação centralizada e refresh robusto:** a revogação do usuário passa a invalidar tanto o access (versão da sessão) quanto os **refresh tokens** abertos, de modo que `POST /api/auth/refresh` não consiga renovar uma sessão revogada.
- **Situação do perfil derruba sessões:** tornar um perfil **não-Ativo** passa a fazer as sessões vigentes dos usuários daquele perfil deixarem de autenticar (validação de sessão **e** renovação), e não apenas bloquear novos logins/atribuições.
- **Somente perfis Ativos na UI e na importação:** as opções de Perfil (modal, filtros, importação) passam a listar apenas perfis Ativos, alinhando a UI à regra que o servidor já aplica.
- **Anti-lockout completo e visível:** a guarda passa a recusar (`409`) também a **desativação/exclusão** do último usuário ativo com permissões essenciais, e o modal de permissões passa a exibir a **mensagem real** do servidor (não um erro genérico de conexão).
- Sem mudança **BREAKING** para consumidores legítimos.

## Capabilities

### New Capabilities
<!-- Nenhuma: o change fortalece capabilities existentes. -->

### Modified Capabilities
- `revogacao-sessao`: qualquer caminho de escrita da situação revoga o acesso vigente; reativar não reaviva tokens antigos; o refresh também deixa de renovar sessão revogada.
- `perfis-acesso`: a situação do perfil passa a derrubar sessões vigentes (validação e renovação); a guarda anti-lockout cobre desativar/excluir o último administrador e a UI exibe a mensagem do `409`.
- `gestao-usuarios`: apenas perfis Ativos são oferecidos, atribuíveis, filtráveis e importáveis.

## Impact

- **Backend:** `server/utils/auth.ts` (revogação centralizada; validação de sessão/refresh considera situação do perfil), `server/utils/usuarios.ts` (revogação na edição geral; guarda de lockout em desativar/excluir; opções de perfil só Ativos; importação), `server/utils/perfis.ts` (revogar sessões dos usuários ao inativar o perfil; guarda de lockout reutilizável), `server/api/auth/refresh/index.post.ts`, `server/api/usuarios/[id]/**`.
- **Frontend:** `app/components/perfis/Permissoes.vue` (exibir mensagem do `409`), `app/components/usuarios/**` (opções de Perfil só Ativos no formulário/filtros/importação), `app/components/perfis/Filtros.vue`.
- **Banco:** sem migration (a revogação usa `token_version` e a coluna `sessoes.revogado_em` já existente).
- **Documentação:** `docs/RL04 - Relatório de Qualidade Completo.md` (Status da Etapa 2).
- **Dependências:** nenhuma nova.
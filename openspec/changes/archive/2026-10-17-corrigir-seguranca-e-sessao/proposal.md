# Proposal

## Why

A varredura RL04 reprovou o sistema por três defeitos de segurança e sessão: (1) um upload aceita um arquivo com extensão `.html` cujo conteúdo começa com magic bytes de PNG e o serve como `text/html` na mesma origem — XSS armazenado com potencial de elevação Leitor→Admin; (2) o TTL do refresh é gravado em milissegundos somados a segundos, fazendo a sessão expirar em ~10 min (não 7 dias) e derrubando o usuário a cada ~15 min; e (3) o logout não limpa o estado de módulos no cliente, exibindo dados da sessão anterior a outro perfil na mesma aba. São os bloqueadores da Etapa 1 do `docs/RL04` e precisam ser corrigidos para a aprovação.

## What Changes

- **Uploads (XSS armazenado):** o endpoint passa a validar a **extensão/nome** contra o tipo real de imagem detectado, grava sempre com extensão segura da whitelist (PNG/JPEG/WebP/GIF) e o servimento de `/uploads/**` nunca devolve `text/html` para conteúdo gravado (tipo neutro/derivado da imagem). Arquivos executáveis (`.html`, `.htm`, `.svg`, `.js`, `.xml`) são rejeitados no upload.
- **Sessão (TTL do refresh):** o prazo da sessão de refresh passa a ser calculado corretamente no tempo configurado (padrão 7 dias) e o registro em `sessoes.expira_em` passa a coincidir com o `Max-Age` do cookie de refresh, de modo que a sessão sobreviva além da janela do access (~15 min) e seja renovada silenciosamente.
- **Logout (estado do cliente):** o encerramento de sessão passa a descartar **todo** o estado derivado da sessão (perfis, matriz de permissões, cache de configurações, KPIs/opções de listagens), e a reentrada em um módulo refaz a carga quando necessário — um novo login na mesma aba nunca vê dados do usuário anterior.
- Nenhuma mudança **BREAKING** para consumidores legítimos: as URLs de upload continuam `/uploads/<pasta>/<nome>` e a sessão continua com os mesmos cookies.

## Capabilities

### New Capabilities
<!-- None: this change strengthens existing capabilities. -->

### Modified Capabilities
- `uploads`: a validação de arquivo passa a considerar a extensão/tipo real (recusando conteúdo executável disfarçado de imagem) e o servimento garante que o arquivo gravado nunca seja interpretado como documento executável.
- `login`: o prazo da sessão de refresh passa a corresponder ao período configurado (padrão 7 dias) e a coincidir com o cookie; o logout passa a limpar todo o estado de sessão mantido no cliente.

## Impact

- **Backend:** `server/utils/uploads.ts`, `server/api/uploads/index.post.ts`, `nuxt.config.ts` (servimento de `/uploads/**`); `server/utils/auth.ts` (cálculo do TTL em `criarSessao`/`rotacionarSessao`).
- **Frontend:** `app/composables/useAuth.ts` (logout), `app/composables/usePermissions.ts`, `app/composables/useConfiguracoesGlobais.ts`, `app/components/perfis/usePerfisModelo.ts`, `app/components/usuarios/useUsuarios.ts`, `app/components/auditoria/useAuditoriaModelo.ts`.
- **Banco:** nenhuma migration; o efeito aparece nas novas linhas de `sessoes` (`expira_em` correto). Sessões antigas expiram naturalmente.
- **Documentação:** `docs/RL04 - Relatório de Qualidade Completo.md` (rastreio dos achados RL04-C-01, RL04-A-01, RL04-A-02).
- **Dependências:** nenhuma nova.
# Proposal

## Why

A varredura RL04 identificou cinco defeitos funcionais médios (Etapa 3, núcleo): a **ordenação** das tabelas sinaliza estado mas não reordena nada no modo servidor (Usuários e Auditoria); as **preferências do shell** (logomarca, sidebar, sessões) só valem para o Administrador, porque o `GET /api/configuracoes` exige a permissão de módulo; o **cache de configurações** não é invalidado após salvar (reentrar na tela mostra valores antigos); a **recuperação de senha** revela a existência da conta pelo tempo de resposta (o envio do e-mail fica no caminho da resposta); e a **falha de carga** preserva KPIs/total/opções da carga anterior em Usuários e Auditoria. São os itens RL04-M-02, RL04-M-03, RL04-M-04, RL04-M-07 e RL04-M-08.

## What Changes

- **Ordenação no servidor:** a `UiDataTable` passa a ter a ordenação aplicada pelo servidor nos modos servidor de Usuários e Auditoria — o evento `sort-change` vira parâmetros de consulta (`ordenar`/`direcao`) e a API ordena por uma **whitelist** de colunas (ordenação inválida é ignorada, caindo no padrão).
- **Preferências do shell para todos os perfis administrativos:** as preferências salvas (logomarca do header/login, sidebar expandida/recolhida e sessões do menu) passam a ser lidas por uma porta **somente-sessão**, sem exigir a permissão `configuracoes-globais/visualizar` — qualquer perfil administrativo vê a identidade e a navegação configuradas.
- **Cache de configurações invalidado após salvar:** gravar as configurações atualiza o estado/cache do shell, de modo que reentrar na tela (sem F5) e navegar mostrem os valores salvos.
- **Recuperação de senha fora do caminho da resposta:** o envio do e-mail e a gravação da senha provisória passam a ocorrer **após** a resposta, tornando a latência da recuperação constante entre conta existente e inexistente (a resposta já era genérica); a senha continua só sendo trocada **após** a entrega.
- **Falha de carga zera o resumo:** quando `GET /api/usuarios` ou `GET /api/auditoria` falha, além da tabela vazia, os **KPIs, o total e as opções de filtro** voltam ao estado vazio — nunca ficam os da carga anterior.
- Sem mudança **BREAKING** para consumidores legítimos.

## Capabilities

### New Capabilities
<!-- Nenhuma: o change ajusta capabilities existentes. -->

### Modified Capabilities
- `gestao-usuarios`: a ordenação da tabela é aplicada pelo servidor; a falha de carga zera KPIs/total/opções.
- `auditoria`: a ordenação da tabela é aplicada pelo servidor; a falha de carga zera KPIs/total/opções.
- `configuracoes-globais`: as preferências do shell são lidas por qualquer perfil administrativo (porta somente-sessão); o cache é atualizado após salvar.
- `login`: a recuperação de senha entrega a resposta sem aguardar o e-mail (latência constante), mantendo a troca de senha condicionada à entrega.

## Impact

- **Backend:** `server/utils/usuarios.ts` e `server/utils/audit.ts` (ORDER BY por whitelist), `server/api/usuarios/index.get.ts` e `server/api/auditoria/index.get.ts` (params `ordenar`/`direcao`), novo `server/api/configuracoes/shell/index.get.ts` (somente-sessão), `server/api/auth/esqueci-senha/index.post.ts` (envio fora do caminho da resposta).
- **Frontend:** `app/components/ui/DataTable.vue` (repasse do `sort-change` já existe), `app/components/usuarios/useUsuarios.ts` e `app/components/auditoria/useAuditoriaModelo.ts` (estado de ordenação + reset no `catch`), `usuarios/Tabela.vue` e `auditoria/Tabela.vue` (ouvir `sort-change`), `app/composables/useConfiguracoesGlobais.ts`, `app/layouts/admin.vue` e `app/pages/admin/configuracoes-globais.vue`.
- **Banco:** sem migration (ordenação usa colunas/índices existentes).
- **Documentação:** `docs/RL04 - Relatório de Qualidade Completo.md` (Status da Etapa 3 — núcleo funcional).
- **Dependências:** nenhuma nova.
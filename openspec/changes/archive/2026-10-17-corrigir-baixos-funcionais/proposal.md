# Proposal

## Why

A varredura RL04 deixou pendente a Parte B da cauda da Etapa 3 — baixos funcionais que afetam confiança e acabamento: as **exportações (PDF/CSV) falham em silêncio** (só `console.error`, sem feedback); várias **mensagens de erro expõem detalhe de infraestrutura** ("Verifique a conexão com o banco"); o **identificador da entidade** não aparece no detalhe da auditoria; o **evento de recuperação** diz "senha provisória enviada" mesmo quando o envio falha; o **convite a um usuário Inativo** grava credenciais que não autenticam; o **termo de busca** persiste no estado mas o campo da tabela volta vazio; uma **recarga durante uma carga em voo** é ignorada; a **criação concorrente de e-mail duplicado** vira `500` em vez de `409`; e uma **data inválida** no filtro da auditoria é coibida pelo banco em vez de recusada com `400`. São os itens RL04-M-21, B-09, B-15, B-17, B-18, B-19, B-20, B-21 e B-22.

## What Changes

- **Exportações com feedback:** falha ao gerar CSV/PDF exibe toast de erro (e estado de carregamento na ação), em vez de falhar em silêncio.
- **Mensagens de erro sem vazar infraestrutura:** os toasts de falha passam a textos genéricos e acionáveis, sem "conexão com o banco".
- **Auditoria — identificador da entidade:** o detalhe do registro passa a exibir o `entidade_id` (exposto pela API).
- **Auditoria — data inválida:** um filtro de data com formato inválido passa a responder `400` (em vez de chegar ao banco).
- **Recuperação de senha — trilha correta:** o evento de auditoria reflete o resultado real do envio (enviada × falha), não um texto fixo de sucesso.
- **Convite só para usuário Ativo:** convidar um usuário **não-Ativo** é recusado (`400`), evitando entregar credenciais que o login bloqueia.
- **Busca e recarga consistentes:** o termo de busca vigente aparece no campo da tabela; uma recarga solicitada durante uma carga em voo é aplicada após a conclusão.
- **E-mail duplicado concorrente:** a criação que colidir no banco (`errno 1062`) responde `409` em vez de `500`.
- Sem mudança **BREAKING** para consumidores legítimos.

## Capabilities

### New Capabilities
<!-- Nenhuma. -->

### Modified Capabilities
- `gestao-usuarios`: exportação com feedback; mensagens de erro genéricas; busca/recarga consistentes; e-mail duplicado concorrente → `409`; convite só para usuário Ativo.
- `auditoria`: exportação com feedback; mensagens de erro genéricas; filtro de data inválida → `400`; detalhe exibe o identificador da entidade.
- `perfis-acesso`: exportação com feedback; mensagens de erro genéricas.
- `configuracoes-globais`: mensagens de erro genéricas.
- `login`: o evento de recuperação reflete o resultado do envio.

## Impact

- **Frontend:** `app/components/{usuarios,auditoria,perfis}/Cabecalho.vue` (toast de exportação), `app/pages/admin/{gestao-usuarios,auditoria,perfis-acesso,configuracoes-globais}.vue` e `app/components/perfis/{Formulario,Permissoes}.vue` (mensagens), `app/components/auditoria/Detalhe.vue` + `useAuditoriaModelo.ts` (entidade_id), `app/components/usuarios/useUsuarios.ts` e `app/components/auditoria/useAuditoriaModelo.ts` (busca/recarga), `app/components/ui/DataTable.vue` (busca inicial).
- **Backend:** `server/utils/audit.ts` (validação de data + `entidade_id` no select/mapping), `server/utils/usuarios.ts` (`1062` → `409`), `server/api/convite/index.post.ts` (recusa de não-Ativo), `server/api/auth/esqueci-senha/index.post.ts` (detalhe da trilha).
- **Banco / dependências:** nenhuma.
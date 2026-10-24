# Spec Delta

## ADDED Requirements

### Requirement: A busca de e-mails de usuários é dedicada e paginada

O sistema SHALL oferecer `GET /api/usuarios/emails` para autocomplete, retornando apenas `id`,
`email` e `nome`, com `q` de no mínimo 2 caracteres, paginação (`pagina`/`porPagina`) limitada a 20
itens e ordenação estável por e-mail. A rota SHALL exigir sessão e a permissão de
`gestao-usuarios`/`visualizar` (e `buscar` quando houver termo), NÃO SHALL devolver a lista completa
sem termo e NÃO SHALL expor hash, perfil, situação ou dados de contato além de nome/e-mail.

#### Scenario: Busca com termo
- **WHEN** um perfil autorizado consulta `q=ana`
- **THEN** a resposta traz até 20 usuários cujo e-mail/nome começa ou contém o termo, com apenas id, e-mail e nome

#### Scenario: Termo curto é recusado
- **WHEN** `q` tem menos de 2 caracteres
- **THEN** a API responde `400` e não varre a tabela

#### Scenario: Sem permissão
- **WHEN** um perfil sem `gestao-usuarios`/`visualizar` chama a rota
- **THEN** a API responde `403` sem retornar e-mails

#### Scenario: Paginação limitada
- **WHEN** o cliente pede `porPagina=500`
- **THEN** a API limita o tamanho da página e informa o total do conjunto filtrado

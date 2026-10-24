# Spec Delta

## ADDED Requirements

### Requirement: As ações de submissão usam loading e disabled

Todo botão que dispara uma operação de escrita (`Salvar`, `Enviar`, `Publicar`, `Recusar`,
`Aprovar`, `Importar`) SHALL entrar em estado de carregamento e ficar desabilitado enquanto a
requisição estiver em voo, impedindo duplo envio. O estado SHALL ser restaurado em sucesso, erro ou
cancelamento, e o botão SHALL expor `aria-busy`/`disabled` de forma acessível. O formulário NÃO SHALL
disparar duas requisições concorrentes para a mesma ação.

#### Scenario: Clique duplo gera uma requisição
- **WHEN** o usuário aciona “Salvar” duas vezes rapidamente
- **THEN** apenas uma requisição é enviada e o botão permanece em loading até a resposta

#### Scenario: Erro restaura o botão
- **WHEN** a requisição falha
- **THEN** o botão sai do loading e volta a permitir nova tentativa, com o erro exibido

#### Scenario: Ação destrutiva também protege
- **WHEN** o usuário confirma “Excluir” ou “Recusar” e a requisição está em voo
- **THEN** o botão de confirmação fica desabilitado até a resposta
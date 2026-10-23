# Spec Delta

## MODIFIED Requirements

### Requirement: O detalhe exibe a chamada, os vínculos e o histórico em modo somente leitura

A tela SHALL oferecer a ação **Inspecionar**, que abre um modal `xl` somente leitura com identificação
(chamada, título, status, origem), conteúdo (descrição completa com formatação, solução, links,
imagens e tags), classificação (tipo, impacto, módulo, software e parceiro), vínculos
(código, nome/título e status do conteúdo pai), autor e timestamps, além do **histórico da esteira**
do mais recente para o mais antigo, com o atual primeiro. O histórico SHALL exibir, para cada transição, o status anterior, o novo
status, o responsável, o perfil, o parecer, os critérios de aceite, a data/hora e o tempo no estágio.
O modal SHALL fechar por `Escape`, pelo `X` ou por "Fechar", devolvendo o foco ao acionador.

#### Scenario: Abrir detalhe

- **WHEN** o usuário aciona "Inspecionar" em uma chamada
- **THEN** o modal exibe todos os dados da chamada e os vínculos sem campos editáveis

#### Scenario: Conteúdo formatado

- **WHEN** a chamada possui descrição ou solução com formatação rica
- **THEN** o modal exibe o HTML sanitizado com a formatação preservada

#### Scenario: Histórico com transições

- **WHEN** a chamada já passou por aprovação, recusa, publicação ou reabertura
- **THEN** o histórico exibe cada transição do mais recente para o mais antigo (atual primeiro), com responsável, parecer e data

#### Scenario: Chamada sem histórico

- **WHEN** a chamada está em `Revisar` e nunca passou por uma transição
- **THEN** o modal exibe o estado vazio do histórico, sem erro

#### Scenario: Fechar detalhe

- **WHEN** o usuário pressiona `Escape`, aciona o `X` ou "Fechar"
- **THEN** o modal fecha e o foco retorna ao acionador

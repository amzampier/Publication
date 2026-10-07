# Spec Delta - design-system/layout-navigation

## MODIFIED Requirements

### Requirement: O menu do Account apresenta os itens na ordem definida
O sistema SHALL exibir o menu do Account com exatamente esta ordem: **Meu Perfil**, divisor,
**Configurações Globais**, **Gestão de Usuários**, **Perfis de Acesso (RBAC)**, **Gestão de
Auditoria**, divisor, **Encerrar Sessão** — com o rótulo de perfis unificado ao do item homônimo
da sidebar e ao da página (`/admin/perfis-acesso`).

#### Scenario: Ordem e divisores
- **WHEN** o menu do Account é aberto
- **THEN** os itens aparecem na ordem acima, com um divisor entre "Meu Perfil" e "Configurações
  Globais" e outro entre "Gestão de Auditoria" e "Encerrar Sessão"

#### Scenario: Rótulo de perfis unificado
- **WHEN** o menu do Account é aberto
- **THEN** o item de perfis exibe "Perfis de Acesso (RBAC)" — o mesmo rótulo do item da sessão
  Administração da sidebar e do título da página —, sem a antiga grafia "Configuração de Perfis
  (RBAC)"

#### Scenario: Item removido não aparece
- **WHEN** o menu do Account é aberto
- **THEN** não há entrada de troca de filial/empresa nem qualquer outro item fora da ordem definida

#### Scenario: Fechamento por teclado e clique fora
- **WHEN** o menu está aberto e o usuário pressiona `Escape` ou clica fora do bloco
- **THEN** o menu fecha

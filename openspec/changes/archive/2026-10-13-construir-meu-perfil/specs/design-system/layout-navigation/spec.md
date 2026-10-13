# Spec Delta

## MODIFIED Requirements

### Requirement: Itens de navegação podem declarar rota e os sem rota avisam que estão em construção
Os itens da sidebar e do menu do Account SHALL poder declarar uma rota opcional (`to`);
quando declarada, o clique do usuário navega para essa rota, e o item da sidebar correspondente
à rota corrente é exibido como ativo. Itens da sidebar **sem** rota declarada SHALL exibir, ao
serem acionados, um `toast.info` com o rótulo do item e a mensagem "Módulo em construção.",
sem navegação — no menu do Account, **Meu Perfil** declara rota (`/admin/meu-perfil`) e navega
ao clique como os demais itens com rota, e "Encerrar Sessão" mantém seu comportamento próprio
(fecho de sessão) e fica fora deste aviso.

#### Scenario: Item com rota navega
- **WHEN** o usuário clica em "Configurações Globais" na sidebar ou no menu do Account
- **THEN** o navegador vai para `/admin/configuracoes-globais` e o menu do Account é fechado

#### Scenario: Meu Perfil com rota navega
- **WHEN** o usuário clica em "Meu Perfil" no menu do Account
- **THEN** o navegador vai para `/admin/meu-perfil` e o menu do Account é fechado

#### Scenario: Item ativo acompanha a rota
- **WHEN** a rota corrente corresponde à rota declarada de um item da sidebar
- **THEN** aquele item é exibido como ativo (mesmo estilo do item selecionado hoje), com `aria-current="page"`

#### Scenario: Item sem rota da sidebar exibe aviso de construção
- **WHEN** o usuário clica em um item da sidebar sem rota declarada (ex.: Manuais)
- **THEN** um `toast.info` exibe o rótulo do item com a mensagem "Módulo em construção." e
  nenhuma navegação ocorre; o menu do Account não participa deste aviso

#### Scenario: Chegar por URL direta também marca o item
- **WHEN** o usuário abre `/admin/configuracoes-globais` diretamente pelo endereço
- **THEN** o item "Configurações Globais" da sidebar aparece como ativo

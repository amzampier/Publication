# Spec Delta — design-system/choice-card

## Purpose

Definir o comportamento do cartão de escolha única do design system (`UiChoiceCard`) — seleção
por valor único com semântica ARIA de radiogroup, tom de cor por cartão, estados
selecionado/desabilitado com dica e foco canônico — para que escolhas de canal ou categoria em
modais (ex.: E-mail × WhatsApp no convite) exibam o mesmo comportamento acessível e visual,
espelhado na vitrine `/design` e na documentação do kit.

## ADDED Requirements

### Requirement: O cartão seleciona um valor único com semântica de radiogroup
O sistema SHALL exibir um grupo de cartões de escolha única com `v-model` por valor único (não
matriz), cujo contêiner expõe `role="radiogroup"` e cada cartão `role="radio"` com
`aria-checked="true"` somente no cartão selecionado; acionar um cartão (clique, `Enter` ou
`Space`) SHALL marcá-lo, desmarcar os demais e emitir o valor escolhido.

#### Scenario: Selecionar um cartão
- **WHEN** com o grupo sem seleção o usuário aciona um cartão
- **THEN** aquele cartão fica marcado com o estado visual do tom escolhido, nenhum outro permanece marcado e o valor emitido corresponde ao cartão

#### Scenario: Trocar a seleção
- **WHEN** com um cartão selecionado o usuário aciona outro cartão do mesmo grupo
- **THEN** a seleção migra para o novo cartão, o anterior volta ao estado neutro e o valor emitido é o do novo cartão

### Requirement: A navegação por teclado usa um único ponto de parada
O sistema SHALL manter no grupo um único ponto de parada de `Tab` (o cartão selecionado, ou o
primeiro quando não há seleção); as teclas `←`/`→`/`↑`/`↓` SHALL mover o foco e a seleção em
conjunto entre os cartões navegáveis, `Home`/`End` SHALL levar ao primeiro e ao último, e
`Enter`/`Space` SHALL selecionar o cartão focado — cartões desabilitados ficam fora da
navegação.

#### Scenario: Tab entra em um único ponto de parada
- **WHEN** o usuário navega por `Tab` até o grupo de cartões
- **THEN** o foco cai no cartão selecionado (ou no primeiro, quando vazio) e o `Tab` seguinte segue direto para o próximo controle, sem parar nos demais cartões

#### Scenario: Setas trocam a seleção
- **WHEN** com o foco em um cartão o usuário pressiona a seta para a direita
- **THEN** o foco e a seleção avançam para o próximo cartão navegável e o valor emitido acompanha a seleção

### Requirement: O estado selecionado usa o tom declarado do cartão e o foco canônico
O sistema SHALL aplicar ao cartão selecionado borda, anel e fundo tingido na cor do tom declarado
(por exemplo `sky` para e-mail e `emerald` para WhatsApp), mantendo os cartões não selecionados
em superfície branca com borda clara, e aplicar o recorte de foco `brand-focus` quando o cartão
está focado pelo teclado. O ícone do cartão SHALL renderizar em tile que acompanha o tom quando
selecionado e em tom neutro quando não.

#### Scenario: Cartão selecionado com o tom do canal
- **WHEN** o cartão de canal "E-mail" (tom `sky`) está selecionado
- **THEN** ele exibe borda, anel e fundo tingidos em sky e o tile do ícone acompanha o tom, enquanto os demais cartões permanecem neutros

#### Scenario: Foco visível no teclado
- **WHEN** o usuário navega até um cartão pelo teclado
- **THEN** o recorte de foco canônico verde `brand-focus` aparece no cartão focado

### Requirement: O estado desabilitado atenua o cartão e exibe a dica
O sistema SHALL aceitar a propriedade de desabilitado acompanhada de uma dica: o cartão
desabilitado SHALL exibir `aria-disabled`, visual atenuado, a dica legível no próprio cartão e
ser ignorado por clique e por navegação de teclado, sem alterar a seleção vigente do grupo.

#### Scenario: Cartão desabilitado com dica
- **WHEN** o grupo é renderizado com um cartão desabilitado e uma dica
- **THEN** o cartão exibe a dica, aparece atenuado, não responde a clique nem a teclas e a seleção permanece nos cartões disponíveis

#### Scenario: Desabilitado não rouba a seleção
- **WHEN** o usuário tenta acionar um cartão desabilitado
- **THEN** nenhum valor é emitido e a seleção vigente permanece intacta

### Requirement: Os cartões aceitam ícone, título, descrição e badge
O sistema SHALL aceitar nos cartões título obrigatório e descrição, ícone, badge e variante de
badge opcionais, renderizando-os com a hierarquia do kit (título em destaque, descrição em tom
suave, badge como pílula) e expondo título e descrição às tecnologias de assistência via
`aria-labelledby`/`aria-describedby`.

#### Scenario: Cartão completo renderiza todos os elementos
- **WHEN** um cartão é renderizado com ícone, título, descrição e badge
- **THEN** todos aparecem no cartão e a descrição é associada ao cartão como texto acessível

### Requirement: A vitrine e a documentação espelham o componente
O sistema SHALL documentar `UiChoiceCard` em `docs/01 - design_system.md` (§5.16) e demonstrá-lo
na seção 17 da vitrine `/design`, exibindo os mesmos estados do componente real: selecionado com
tom, não selecionado, desabilitado com dica e navegação por teclado.

#### Scenario: Seção 17 existe
- **WHEN** a vitrine `/design` é renderizada
- **THEN** a seção 17 demonstra o `UiChoiceCard` com grupo funcional de cartões nos estados neutro, selecionado e desabilitado

#### Scenario: Documentação acompanha
- **WHEN** `docs/01 - design_system.md` §5.16 é lido
- **THEN** as props, eventos e comportamento descritos coincidem com o componente

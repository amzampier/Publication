# Spec Delta

## ADDED Requirements

### Requirement: O mesmo status usa a mesma variante em todas as telas

O sistema SHALL manter um mapa canônico de status editorial para variante de `UiBadge` e SHALL usá-lo
em todas as telas que exibem o mesmo status — Painel Executivo, Release Week, Manuais, Escopo,
Lançar as Chamadas e Esteira. Um mesmo status NÃO SHALL aparecer com variantes diferentes entre
listagem, detalhe, modal e painel.

#### Scenario: Status igual em Painel e módulo
- **WHEN** uma Release Week com status `Em Revisão` aparece no Painel e na tela de Release Week
- **THEN** as duas exibições usam a mesma variante de badge

#### Scenario: Status de Escopo consistente
- **WHEN** um Escopo `Concluído` aparece no Painel e na grade de Escopo
- **THEN** ambos usam a variante de “concluído” definida no mapa canônico

#### Scenario: Status de Chamada consistente
- **WHEN** uma chamada `Publicado` aparece na listagem, no detalhe e na Esteira
- **THEN** as três exibições usam a mesma variante
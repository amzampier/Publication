# Spec Delta

## ADDED Requirements

### Requirement: O composable de toast tem fonte única no projeto
O sistema SHALL manter `useToast` em um único local canônico (`app/composables/useToast.ts`), sem cópias duplicadas em outros diretórios, de modo que toda alteração do comportamento de toast tenha um só ponto de verdade e nenhum consumidor resolva para uma versão divergente.

#### Scenario: Cópia duplicada ausente
- **WHEN** o repositório é inspecionado buscando definições de `useToast`
- **THEN** existe exatamente uma definição de implementação, em `app/composables/`; a antiga cópia em `app/components/composables/` não existe mais

#### Scenario: Consumidores resolvem para a fonte única
- **WHEN** qualquer módulo da aplicação consome `useToast()`
- **THEN** ele resolve para o mesmo módulo canônico, compartilhando o mesmo estado de fila de toasts

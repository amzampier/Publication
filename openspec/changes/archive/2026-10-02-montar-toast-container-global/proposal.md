# Proposal

## Why

O sistema de feedback por toast do Publications está construído (`app/components/ui/ToastContainer.vue` + `app/composables/useToast.ts`) e documentado como global (`docs/01 - design_system.md` §4.5/§4.6: "container de toasts com `role="status"` `aria-live="polite"`" e "`ToastContainer` fica montado globalmente em `app/app.vue` — os toasts funcionam em qualquer rota"), mas **nenhum componente o monta**: a busca por `ToastContainer` no código não encontra um único uso fora do próprio arquivo. Consequência, confirmada por SSR nas quatro rotas (`aria-live` = 0): nenhuma ação da aplicação mostra confirmação — inclusive os cenários já especificados em `configuracoes-globais` ("Salvar confirma e volta a desabilitar", "Atualizar confirma sem alterar a lista") e a demonstração da vitrine `/design` §8. A correção é a etapa 1 (bloqueadora, severidade Alta) do relatório `docs/RL01 - Relatório de Responsividade.md`.

## What Changes

- Montar o `UiToastContainer` globalmente em `app/app.vue`, fora do `NuxtLayout`, para valer em **todas** as rotas — incluindo as que usam `layout: false` (ex. `/design`).
- Consolidar, em spec, o contrato do sistema de feedback por toast (capacidade hoje documentada apenas em `docs/01`, sem spec em `openspec/specs/`): disponibilidade em qualquer rota, região viva de acessibilidade, variantes, auto-dismiss e toast persistente.
- Nenhuma mudança de API: `useToast()` (`success | warning | danger | info`, `duration` em ms) e o componente `ToastContainer` permanecem como estão.

## Capabilities

### New Capabilities
- `design-system/toasts`: sistema de feedback por toast do design system — ponto de montagem global do container, visibilidade em qualquer rota (Área Pública, Área Administrativa e vitrine), região viva `role="status"`/`aria-live="polite"`, variantes `success | warning | danger | info`, auto-dismiss padrão de 5000 ms com barra de progresso e persistência quando `duration <= 0`.

### Modified Capabilities
<!-- nenhuma — os requisitos de configuracoes-globais que exigem toast já existem e não mudam de texto;
     esta change apenas os torna cumpríveis/observáveis. -->

## Impact

- **Código:** `app/app.vue` (adição do `<UiToastContainer />`; arquivo hoje com 8 linhas). Sem alterações em `app/components/ui/ToastContainer.vue`, `app/composables/useToast.ts` ou nos consumidores (`pages/admin/configuracoes-globais.vue`, `components/configuracoes/AbaSeguranca.vue`, `pages/design.vue`).
- **Comportamento observável:** toasts voltam a aparecer em `/`, `/admin`, `/admin/configuracoes-globais` e `/design` (feedback de "Salvar Alterações Globais", "Atualizar", demo §8).
- **Especificações:** nova capacidade `design-system/toasts`; cenários pré-existentes de `configuracoes-globais` passam a ser observáveis sem mudança de requisito.
- **Documentação:** `docs/01 - design_system.md` §4.6 já descreve o comportamento desejado — sem divergência a corrigir após a change; `docs/RL01 - Relatório de Responsividade.md` BUG-01 é o gatilho.
- **Dependências/infraestrutura:** nenhuma (sem novos módulos, pacotes ou variáveis de ambiente).

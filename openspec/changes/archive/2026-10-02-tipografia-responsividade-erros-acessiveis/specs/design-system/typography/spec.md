# Spec Delta

## Purpose

Definir o carregamento e a resolução das fontes oficiais do design system (Plus Jakarta Sans e JetBrains Mono) — declaração no `head` de qualquer rota, mapeamento das classes `font-sans`/`font-mono` e correspondência com a escala tipográfica e a vitrine `/design` — para que código, documentação e validação de QA observem a mesma identidade tipográfica.

## ADDED Requirements

### Requirement: As fontes oficiais são declaradas no documento de qualquer rota
O sistema SHALL declarar o carregamento de Plus Jakarta Sans e JetBrains Mono no `head` do documento de todas as rotas (Área Pública, Área Administrativa e vitrine `/design`), com `preconnect` para os servidores de fonte, de modo que o navegador inicie o download sem dependência de JavaScript.

#### Scenario: Head declara o Google Fonts
- **WHEN** o HTML de qualquer rota é inspecionado
- **THEN** o `head` contém `preconnect` para `fonts.googleapis.com` e `fonts.gstatic.com` e uma folha de estilo requisitando Plus Jakarta Sans e JetBrains Mono

#### Scenario: Todas as áreas recebem as fontes
- **WHEN** `/`, `/admin/configuracoes-globais` e `/design` são renderizados
- **THEN** os mesmos links de fonte aparecem no HTML de cada uma das rotas

### Requirement: As classes de família resolvem nas fontes oficiais
O sistema SHALL fazer `font-sans` (incluindo o corpo do documento) resolver em **Plus Jakarta Sans** e `font-mono` em **JetBrains Mono**, de modo que o CSS gerado contenha explicitamente essas famílias e não apenas os stacks padrão do Tailwind.

#### Scenario: CSS de saída contém as famílias
- **WHEN** a folha de estilo gerada é inspecionada
- **THEN** ela contém `Plus Jakarta Sans` e `JetBrains Mono`, e não somente `ui-sans-serif, system-ui…` / `ui-monospace, SFMono-Regular…`

#### Scenario: Corpo renderiza na sans oficial
- **WHEN** qualquer página é renderizada
- **THEN** a `font-family` computada do corpo inclui `Plus Jakarta Sans`

#### Scenario: Elementos monoespaçados usam a mono oficial
- **WHEN** um elemento com `font-mono` (código, métrica, valor numérico) é renderizado
- **THEN** a `font-family` computada inclui `JetBrains Mono`, com `tabular-nums` quando declarado

### Requirement: A vitrine e a documentação correspondem às fontes carregadas
O sistema SHALL manter a seção 1 da vitrine `/design` e `docs/01 - design_system.md` coerentes com o mecanismo de carregamento efivamente implementado, de modo que os rótulos "Plus Jakarta Sans" e "JetBrains Mono" da vitrine correspondam a fontes que de fato renderizam.

#### Scenario: Seção 1 rotula e renderiza com as fontes oficiais
- **WHEN** a seção tipográfica da vitrine `/design` é renderizada
- **THEN** os blocos rotulados como Plus Jakarta Sans e JetBrains Mono renderizam com essas famílias, não com fonte de sistema

#### Scenario: Documentação descreve o mecanismo implementado
- **WHEN** `docs/01 - design_system.md` §1 é lida
- **THEN** o mecanismo de carregamento descrito (Google Fonts em `nuxt.config.ts`) é exatamente o implementado

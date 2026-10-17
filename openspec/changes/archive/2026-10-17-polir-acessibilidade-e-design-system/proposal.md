# Proposal

## Why

A varredura RL04 deixou pendente a cauda de acessibilidade/design da Etapa 3. São defeitos que impedem o uso pleno por teclado/tecnologia assistiva e desviam do design system: controles compostos sem nome acessível (Select nos filtros, checkbox do `CheckCard`, checkbox das linhas da importação), foco invisível em controles secundários, contraste fraco em texto de apoio, menus do header sem navegação por setas, cores de accent fora dos tokens, coluna vazia "ordenável" e estado vazio genérico na `UiDataTable`, vitrine com demos divergentes do componente real e Meu Perfil em tela branca quando a carga falha. São os itens RL04-M-17, M-18, M-19, M-20, B-03…B-08, B-28, B-29 e B-30.

## What Changes

- **Nomes acessíveis:** o `UiSelect` sem `label` (modais de filtro) passa a expor um nome acessível; o checkbox embutido no `CheckCard` passa a ter rótulo/`aria-label`; cada checkbox de linha da importação ganha nome que identifica o registro.
- **Foco visível:** botões secundários (limpar do `Select`/`DatePicker`, fechar do toast, navegação do calendário, "Copiar HEX" da vitrine) passam a exibir indicador de foco de teclado, sem perder o `outline:none` no clique.
- **Contraste e paleta:** o texto de apoio deixa de usar `slate-400` sobre superfície clara (passa a um tom com contraste AA); os dots de status/badge e o sino passam a usar os tokens documentados (não `*-500` crus).
- **DataTable:** colunas sem cabeçalho ordenável deixam de ser focáveis/ordenáveis; o estado vazio distingue "base vazia" de "filtro sem resultados".
- **Acessibilidade dos menus do header:** os painéis de notificações e do Account ganham navegação por setas/Home/End, fecham no `Escape` e ao perder o foco.
- **Vitrine:** as demos (toast, upload) espelham o componente real — variantes/cores/rótulos corretos, sem "Sucess" nem dica de SVG.
- **Meu Perfil:** a falha de carga exibe um estado de erro com ação de tentar novamente, em vez de tela em branco.
- **Avatares:** o rótulo do componente deixa claro que a foto é gravada como arquivo (URL), não `dataURL`.
- Sem mudança **BREAKING** para consumidores legítimos.

## Capabilities

### New Capabilities
<!-- Nenhuma: ajustes em capabilities existentes. -->

### Modified Capabilities
- `design-system/form-control-states`: nome acessível dos controles compostos (Select/CheckCard/Checkbox) e foco visível nos botões secundários.
- `design-system/toasts`: o botão de fechar exibe foco de teclado.
- `design-system/calendario`: o botão de limpar e a navegação do calendário exibem foco de teclado.
- `design-system/data-table`: colunas não ordenáveis não são focáveis; estado vazio distingue base vazia de filtro.
- `design-system/brand-tokens`: dots de status/badge usam tokens; texto secundário atende contraste AA.
- `design-system/layout-navigation`: menus do header navegáveis por teclado e fechados ao perder o foco.
- `vitrine`: as demos espelham os componentes reais.
- `meu-perfil`: falha de carga exibe estado de erro recuperável.
- `gestao-usuarios`: checkboxes da importação com nome acessível.

## Impact

- **Frontend:** `app/components/ui/{Select,DatePicker,Calendar,ToastContainer,CheckCard,DataTable,Badge}.vue`, `app/components/layout/AppHeader.vue`, `app/components/usuarios/Importar.vue`, `app/components/perfil/Avatar.vue`, `app/pages/admin/meu-perfil.vue`, `app/pages/design.vue`, e ajustes de contraste em telas com texto de apoio.
- **Documentação:** `docs/01 - design_system.md` (§5.20 Avatar) e `docs/RL04 - Relatório de Qualidade Completo.md`.
- **Banco / dependências:** nenhuma.
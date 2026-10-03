# Tasks

## 1. Menu Exportar — remover cabeçalho e alinhar fonte com o menu da conta

- [x] 1.1 Em `app/components/auditoria/Cabecalho.vue`, remover a barra de cabeçalho "Formato Download" e restaurar o container do menu para `py-1` sem `overflow-hidden` (voltar ao estado pré-cabeçalho); conferir que os itens permanecem `text-xs font-light text-slate-700` (`px-3 py-2`), idênticos ao menu suspenso da conta do `AppHeader` — verificar: o menu abre sem cabeçalho, direto nos itens "Exportar em CSV" e "Download em PDF" com separador; `Escape` e clique fora fecham; fonte/tamanho/peso computados iguais aos do menu da conta
- [x] 1.2 Atualizar `docs/05 - Gestão de Auditoria.md` §3.1 removendo a menção ao cabeçalho "Formato Download" — verificar: §3.1 descreve o menu apenas com os dois itens e a mecânica Esc/clique-fora

## 2. Modal de Filtros — três sessões com `UiSelect`

- [x] 2.1 Em `app/components/auditoria/Filtros.vue`, substituir a sessão "Classificação" (chips) por duas sessões com `UiSelect`: **"Usuário"** (`User`) com um select (placeholder "Todos os usuários", `clearable`), e **"Ação e Recurso"** (`Tags`) com dois selects rotulados "Ação" (placeholder "Todas as ações") e "Recurso" (placeholder "Todos os recursos"); sessão "Período" intacta; opções `computed` com a opção vazia implícita no placeholder e `:clearable` zerando para "todos" — verificar: o modal abre com três cards brancos (Período, Usuário, Ação e Recurso); selecionar em cada select e Aplicar filtra (badge > 0, KPIs recalculam); Limpar/Cancelar restauram; o dropdown do select não cria scrollbar no corpo do modal
- [x] 2.2 Atualizar `docs/05 - Gestão de Auditoria.md` §3.3 (três sessões com `UiSelect`, substituindo a nota "sem `UiSelect`") e §5/§2 conforme necessário — verificar: docs descrevem as três sessões e os selects, sem resquício de chips

## 3. Modal de Detalhe — sessão "Dados do Registro"

- [x] 3.1 Em `app/components/auditoria/Detalhe.vue`, envolver o `<dl>` em `UiModalSection title="Dados do Registro" :icon="Eye"` e mover o `v-if="registro"` do `<dl>` para a sessão (D6) — verificar: ao abrir o detalhe de uma linha o card exibe os 6 campos (Data/Hora, Usuário, Ação, Recurso, IP, Detalhes); `X`, `Escape` e "Fechar" fecham; nenhum card vazio é renderizado
- [x] 3.2 Atualizar `docs/05 - Gestão de Auditoria.md` §3.5 para descrever o conteúdo dentro da sessão "Dados do Registro" — verificar: §3.5 menciona a sessão e mantém a descrição do `dl` e do rodapé

## 4. Verificação integrada

- [x] 4.1 Rodar `npm run build` e confirmar conclusão sem erros (gate único do repositório)
- [x] 4.2 Checklist visual em `http://localhost:3000/admin/auditoria`: menu Exportar SEM cabeçalho, com fonte idêntica à do menu da conta (família Plus Jakarta Sans, `text-xs font-light`); CSV e PDF baixam sobre os registros filtrados; modal de Filtros com as **três** sessões (Período, Usuário, Ação e Recurso) com `UiSelect`, **sem scrollbar** (inclusive com o dropdown do select aberto); selects filtram via Aplicar e badge de contagem inalterada; modal de Detalhe com a sessão e os 6 campos; nenhuma mudança na tabela, KPIs ou rodapé

## 5. Correções pós-checklist — Escape em cascata e rolagem horizontal da grid

- [x] 5.1 Em `app/components/ui/Select.vue`, consumir o `Escape` com o dropdown aberto (`e.stopPropagation()` no branch de aberto, ao lado do `preventDefault` já existente) para o evento não chegar ao listener em `window` do `UiModal` — verificar: com o dropdown aberto num select do modal de filtros, o primeiro `Escape` fecha só o dropdown (modal segue aberto, rascunho preservado); um segundo `Escape` fecha o modal
- [x] 5.2 Em `app/components/ui/DatePicker.vue`, substituir `@keydown.esc="isOpen = false"` por handler que só faz `stopPropagation()` quando o popover está aberto (com o popover fechado o `Escape` segue propagando e fecha o modal) — verificar: com o calendário aberto, `Escape` fecha só o calendário; sem calendário aberto, `Escape` fecha o modal
- [x] 5.3 Eliminar a rolagem horizontal da grid ao trocar "Linhas por página": em `app/pages/admin/auditoria.vue` ampliar o container de `max-w-6xl` para `max-w-7xl` e, em `app/components/auditoria/Tabela.vue`, reduzir os `minWidth` das seis colunas (140/170/130/150/260/130 → 130/160/120/140/220/120; chão da tabela com a coluna Ações cai de 1060px para 970px) — a causa é a scrollbar vertical do `main` que aparece com mais linhas e rouba ~15px da largura, cruzando o chão anterior; verificar: em janela ≥1280px com sidebar expandida, trocar "Linhas por página" (5 → 20/50) não abre barra de rolagem horizontal na grid; abaixo de ~1280px a rolagem horizontal permanece como fallback aceito
- [x] 5.4 Atualizar artifacts desta change (`proposal.md`, `design.md` D9/D10, delta `specs/auditoria/spec.md`) e docs (`docs/01` — comportamento de `Escape` no `UiSelect`/`UiDatePicker`; `docs/05` — largura do container da página e `minWidth` das colunas) — verificar: docs e spec refletem a precedência do `Escape` (o popup consome o primeiro) e a largura da página/chão das colunas
- [x] 5.5 Rodar `npm run build` após as correções e confirmar conclusão sem erros (a checklist visual destas duas correções fica para a rodada de QA seguinte, a pedido do usuário)

# Proposal

## Why

A tela de Gestão de Auditoria foi entregue com dois `UiModal` do módulo (Filtros e Detalhe) montando o corpo solto sobre o fundo cinza, sem os containers `UiModalSection` que são a regra do kit (vitrine §15, `CameraWeb`). O modal de Filtros concentra os três filtros de classificação numa única sessão com chips, quando o usuário pediu desmembrar em sessões próprias com `UiSelect`.

A checklist visual destes ajustes expôs dois defeitos, pedidos em seguida pelo usuário: (1) um único `Escape` com o dropdown de um `UiSelect` aberto fechava o dropdown **e** o modal de uma vez (o evento seguia para o listener em `window` do `UiModal`); (2) ao trocar a quantidade de registros por página ("Linhas por página"), a grid passava a exibir rolagem horizontal — a scrollbar vertical que aparece no `main` rouba ~15px de largura e o chão de largura das sete colunas não cabia mais, embora essa quantidade de colunas não deveria exigir rolagem.

## What Changes

- **Modal de Filtros** (`AuditoriaFiltros`): o corpo passa a ser organizado em **três** `UiModalSection` — "Período" (os dois `UiDatePicker`, intacto), "Usuário" (um `UiSelect`) e "Ação e Recurso" (dois `UiSelect`), substituindo os chips `UiCheckChip`. Rascunho, ações do rodapé, badge do botão e semântica "vazio = todos" não mudam.
- **Modal de Detalhe** (`AuditoriaDetalhe`): o `<dl>` passa a ser envolvido por uma `UiModalSection` "Dados do Registro" com ícone. Todos os campos e o fechamento permanecem iguais.
- **Menu "Exportar"**: sem alteração funcional — o cabeçalho "Formato Download" que havia sido adicionado foi removido a pedido do usuário; os itens mantêm exatamente a fonte do menu suspenso da conta (`text-xs font-light`, Plus Jakarta Sans).
- **`Escape` com precedência para o popup** (kit): em `UiSelect`, o `Escape` com o dropdown aberto passa a consumir o evento (`stopPropagation`) e fecha só o dropdown; no `UiDatePicker`, idem quando o calendário está aberto (fechado, o `Escape` segue para o modal). O modal passa a fechar no `Escape` apenas quando não há popup aberto.
- **Grid sem rolagem horizontal nas larguras usuais**: container da página de `max-w-6xl` para `max-w-7xl` e `minWidth` das seis colunas reduzidos (chão da tabela de 1060px para 970px) para a scrollbar vertical do `main` não abrir a rolagem horizontal da grid ao trocar "Linhas por página"; abaixo de ~1280px a rolagem horizontal permanece como fallback.
- **Documentação**: `docs/05 - Gestão de Auditoria.md` (§2, §3.1, §3.3, §3.4, §3.5, §5) atualizada para refletir as três sessões com selects, a paridade de fonte do menu, a largura do container e os `minWidth`; `docs/01` (§ do `UiSelect` e do `UiDatePicker`) registra a precedência do `Escape`.

Sem mudança de comportamento de dados: nenhuma função de exportação, filtro ou fechamento é alterada; nenhuma dependência nova.

## Capabilities

### New Capabilities

*(nenhuma)*

### Modified Capabilities

- `auditoria`: três requirements ganham detalhe que hoje não consta — (1) o modal de filtros passa a exigir o corpo em **três** sessões `UiModalSection` ("Período", "Usuário", "Ação e Recurso") com os filtros de classificação em `UiSelect` (em vez de chips), mais o cenário de `Escape` com precedência para o dropdown aberto; (2) o detalhe do registro passa a exigir o conteúdo dentro de uma `UiModalSection` "Dados do Registro"; (3) a tabela passa a exigir que as sete colunas (seis + Ações) caibam **sem rolagem horizontal** na troca de "Linhas por página" nas larguras usuais de desktop. Rótulos, campos e ações existentes são mantidos.

## Impact

- **Código (módulo)**: `app/components/auditoria/Filtros.vue` (corpo do modal), `app/components/auditoria/Detalhe.vue` (corpo do modal), `app/pages/admin/auditoria.vue` (largura do container `max-w-7xl`), `app/components/auditoria/Tabela.vue` (`minWidth` das colunas). Ícone `User` soma aos imports já existentes de `@lucide/vue` em `Filtros.vue`. `Cabecalho.vue` teve o cabeçalho de menu adicionado e removido nesta change — estado final idêntico ao original (sem diff).
- **Kit**: `UiSelect` (consumir `Escape` do dropdown aberto) e `UiDatePicker` (idem com o calendário aberto) ganham precedência de `Escape` — mudança de comportamento intencional, pedida pelo usuário após a checklist. `UiModal`, `UiModalSection` e `UiDataTable` **não** são alterados.
- **Docs**: `docs/05 - Gestão de Auditoria.md` e `docs/01` (comportamento de `Escape` dos dois controles). A vitrine `/design` não muda (nenhum componente novo nem markup visual alterado nos popups).
- **Dependências**: nenhuma nova.
- **Verificação**: `npm run build` nesta etapa (checklist visual das duas correções fica para a rodada de QA seguinte, a pedido do usuário).

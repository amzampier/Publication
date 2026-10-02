# Proposal

## Why

Duas divergências visuais/funcionais apontadas pelo usuário na tela de Configurações Globais: (1) os `UiCheckCard` **marcados** da aba Sidebar exibem o estilo `slate` (cinza `bg-slate-100` + borda `border-slate-800`), divergindo do estado marcado definido no design system — `docs/01` §5.9 define checked = "borda/fundo **verde** (`border-brand-accent bg-lime-50/30 ring-brand-accent/40`)", o mesmo usado na vitrine §11; (2) o input "Caminho da imagem" da aba Logomarcas fica **editável** logo após o upload preenchê-lo, permitindo ao usuário alterar à mão o caminho gerado pela seleção do arquivo — o campo deve refletir somente o que o upload gravou.

## What Changes

- **Aba Sidebar:** os 6 `UiCheckCard` deixam de passar `variant="slate"` e passam a usar o variant padrão `lime` do kit → cartões marcados com `border-brand-accent bg-lime-50/30 ring-brand-accent/40` (borda/fundo verde do DS), mantendo `checkbox-position="start"`, badges e o comportamento de seleção única/múltipla inalterados.
- **Aba Logomarcas:** o `UiInput` "Caminho dos dois blocos (header e login) fica **desabilitado** quando o valor veio da seleção de arquivo no `UiUploadFiles`; permanece habilitado (editável à mão) enquanto vazio — removendo o arquivo na caixa de upload reabilita o campo.
- Documentação: `docs/04` atualizada (variante dos CheckCards e regra de edição do campo de caminho).
- Sem mudança no componente `CheckCard.vue`, no `Input.vue` ou em qualquer outro componente do kit.

## Capabilities

### New Capabilities

*(nenhuma)*

### Modified Capabilities

- `configuracoes-globais`: requirement do painel de logomarcas deixa de tratar o campo de caminho como sempre editável (passa a ser desabilitado após a seleção de arquivo, com cenário de limpeza coerente); requirement do painel de sidebar ganha o estado visual do design system para os cartões marcados (borda/fundo lime).

## Impact

- **Código:** `app/components/configuracoes/AbaLogomarcas.vue` (flag "veio do upload" + prop `disabled` nos 2 `UiInput`), `app/components/configuracoes/AbaSidebar.vue` (remoção de `variant="slate"` nos 6 cartões).
- **Specs:** delta em `openspec/specs/configuracoes-globais/spec.md` (1 MODIFIED + 1 ADDED).
- **Docs:** `docs/04 - Configurações Gerais.md` (§ Logomarcas e § Sidebar).
- **Fora de escopo:** componentes do kit (`CheckCard.vue`, `Input.vue`), vitrine §11, demais abas, `docs/01` (a definição do DS não muda — a aba passa a seguir o que já está documentado).

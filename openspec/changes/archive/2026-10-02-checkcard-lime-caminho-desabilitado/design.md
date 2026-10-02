# Design

## Context

A aba Sidebar passa `variant="slate"` explicitamente nos 6 `UiCheckCard` (herdado da build original da tela, `docs/04` §Sidebar), mas o estado marcado definido no design system é o lime (`docs/01` §5.9 — "checked = borda/fundo verde `border-brand-accent bg-lime-50/30 ring-brand-accent/40`"), que é o default do componente e o que a vitrine §11 demonstra. Já o input "Caminho da imagem" (`AbaLogomarcas.vue`) recebe o valor do upload e continua habilitado (`UiInput` já suporta prop `disabled`), permitindo divergir do caminho gerado pela seleção do arquivo. Ver proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Cartões marcados da aba Sidebar com o estado visual lime do DS, sem alterar seleção única/múltipla, badges, atenuação ou reflexo no shell
- Input de caminho não editável quando o valor veio do upload, em ambos os blocos (header e login), reabilitando ao limpar
- `openspec validate` verde e docs/04 coerentes

**Non-Goals:**
- Alterar `CheckCard.vue`, `Input.vue` ou qualquer componente do kit (o variant `slate` continua existindo e documentado para outros consumidores)
- Alterar `docs/01` (a definição do DS não muda — quem passa a segui-la é a aba)
- Persistência/banco, vitrine §11, demais abas da tela

## Decisions

1. **Variante lime via prop na página** — remover as 6 ocorrências de `variant="slate"` em `AbaSidebar.vue` (o default `'lime'` do `CheckCard` já aplica borda/fundo/anel verdes e faz o checkbox interno usar o mesmo variant). *Alternativas:* trocar o visual do variant `slate` dentro de `CheckCard.vue` (rejeitada — quebraria o contrato documentado de `slate` para quem já usa); criar um variant novo (rejeitada — `lime` já é exatamente o definido no DS).

2. **Desabilitar derivando do preview, não de flag** — `disabled` do `UiInput` = `preview.startsWith('data:')` em cada bloco: o upload grava um dataURL no preview (sobrevive à troca de aba no bloco do header via `useLogomarcaHeader`), enquanto a digitação manual grava o caminho digitado no mesmo preview (`aoEdit*` faz `preview = valor`). Assim o estado sobrevive ao remount do painel sem flag extra. *Alternativa:* ref booleana `veioUpload` (rejeitada — é estado local que se perde no remount do bloco do header, deixando o campo editável após voltar à aba).

3. **Limpeza sempre pela caixa de upload quando veio de arquivo** — com o campo desabilitado, remover o arquivo no `UiUploadFiles` é a via de limpar/restaurar (cenário "Remover o arquivo reabilita o campo" no delta); a limpeza manual segue válida apenas para o valor digitado à mão.

4. **Docs/04 atualizadas no mesmo change** — §Logomarcas ("editável manualmente" → regra de desabilitado) e §Sidebar (`variant="slate"` → lime), para a doc da tela não divergir da spec.

## Risks / Trade-offs

- [Campo desabilitado "esconde" a edição do caminho] → o valor continua visível/selecionável para conferência; a única forma de trocar um caminho de upload é remover o arquivo e (re)enviar ou digitar.
- [Janela assíncrona do FileReader: valor já preenchido e campo ainda habilitado por instantes] → leitura local de imagem é milissegundos; digitação acidental nessa janela é improvável e não corrompe estado (sobrescreve pelo `aoEdit` normalmente).
- [Fundo lime claro sobre o card branco do painel ter menos contraste que o slate escuro] → é exatamente o estado documentado no DS e demonstrado na vitrine; conferência visual na aba após o apply.
- [Remoção do `variant="slate"` altera também a cor do checkbox interno] → desejável (cenário do delta: checkbox acompanha lime); badge/ícones do cartão não são afetados.

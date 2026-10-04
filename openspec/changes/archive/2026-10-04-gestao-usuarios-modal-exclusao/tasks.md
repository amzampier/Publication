# Tasks

## 1. Fundação: composable e expose de kit

- [x] 1.1 Adicionar `excluirUsuario(base, id): { base }` em
      `app/components/usuarios/useUsuariosDemo.ts` — função pura/imutável no molde de
      `salvarUsuario` (filter por id; id inexistente devolve a base intacta) · **verificação:**
      `npm run build` compila e a função é exportada (busca por `excluirUsuario` no arquivo).
- [x] 1.2 Expor `focarBusca()` no `app/components/ui/DataTable.vue` (`ref` no wrapper do
      `UiInput` de busca + `defineExpose({ focarBusca })` focando o `input` do próprio subtree)
      e registrar a API exposta na `docs/01 - design_system.md` §5.11 · **verificação:**
      `npm run build` compila e o §5.11 documenta `focarBusca()` com o comportamento real.

## 2. Tabela emite `@excluir`

- [x] 2.1 Em `app/components/usuarios/Tabela.vue`: o `Trash2` deixa de chamar
      `avisoProximaEtapa('Excluir usuário')` e passa a `emit('excluir', row)` (emit tipado
      junto do `editar`), mantendo `UiTooltip`/`aria-label`/cor `rose-700` · **verificação:**
      `npm run build` compila e não resta nenhum `avisoProximaEtapa` no handler do Trash2
      (grep no arquivo).
- [x] 2.2 Na mesma `Tabela.vue`: `ref` no `<UiDataTable>` e `defineExpose({ focarBusca })`
      encadeando o método do kit · **verificação:** `npm run build` compila e o método é
      chamável pela página (uso no grupo 3 tipa sem erro).
- [x] 2.3 Atualizar `docs/06 - Gestão de Usuários.md` §3.3 (linha "Excluir usuário" da tabela
      de ações agora "emite `@excluir(usuario)` → abre o modal") e §5.5 (lista e contagem dos
      toasts remanescentes: seis → **cinco**, sem a linha Excluir) · **verificação:** a
      contagem de §5.5 confere com os `avisoProximaEtapa` restantes em `Tabela.vue` e com o
      `Filtros`/CEP do formulário.

## 3. Modal de exclusão e coordenação na página

- [x] 3.1 Criar `app/components/usuarios/Exclusao.vue` (`UsuariosExclusao`): `UiModal size="sm"`
      título "Excluir Usuário", `:icon="Trash2"`, subtítulo com o nome do alvo; corpo com um
      `UiModalSection` (e-mail do alvo em destaque + aviso de irreversibilidade); rodapé
      "Cancelar" (`UiButton outline`) e "Excluir" (`UiButton danger` + `Trash2`); props
      `modelValue`/`usuario`, emits `update:modelValue` e `confirmar` (componente
      apresentacional, sem escrita) · **verificação:** `npm run build` compila e o componente
      é importável como `UsuariosExclusao`.
- [x] 3.2 Em `app/pages/admin/gestao-usuarios.vue`: estado `exclusaoAberta` +
      `usuarioExcluir`, `@excluir` da tabela abrindo o modal, e handler de `@confirmar` que
      executa `excluirUsuario` → `usuarios.value = novaBase` → `toast.success('Gestão de
      Usuários', 'Usuário excluído com sucesso.')` → fecha o modal → `nextTick(() =>
      tabelaRef.value?.focarBusca())` · **verificação:** comportamento observável no dev
      server (`http://localhost:3000/admin/gestao-usuarios`): confirmar remove a linha,
      recalcula KPIs, mostra toast de sucesso e o foco do teclado cai no campo de busca
      (Tab a partir dele percorre a tabela); Cancelar/`Escape`/`X` mantêm a base intacta.
- [x] 3.3 Demo na vitrine `app/pages/design.vue` §15: botão "Abrir modal de confirmação"
      abrindo um `UiModal size="sm"` com `UiModalSection` e rodapé outline + danger, no mesmo
      padrão da demo de cadastro · **verificação:** `/design` renderiza sem rolagem horizontal
      (320–1440px) e a demo abre/fecha com `Escape`.
- [x] 3.4 Documentar o rodapé com a variante `danger` na `docs/01 - design_system.md` §5.12
      (linha "ações alinhadas à direita ... `outline` secundário + `primary` primário" passa a
      admitir `danger` destrutivo) e registrar em `docs/06` §1 (Excluir sai da lista de
      gatilhos com toast), §2 (árvore ganha `UsuariosExclusao` com estado na página), a nova
      subseção do modal de exclusão e §9 (demo da vitrine) · **verificação:** nenhum trecho de
      `docs/01`/`docs/06` contradiz o código (§5.5/§1/§3.3 já ajustados no grupo 2).

## 4. Verificação de integração

- [x] 4.1 Concluir `docs/06` §10 (tabela OpenSpec apontando a change
      `gestao-usuarios-modal-exclusao` com os deltas de `gestao-usuarios`), §11 (cenários de
      verificação: exclusão com foco na busca, descarte, última linha da última página, cinco
      toasts remanescentes) e §12 (remover "excluir" das pendências de ação de linha)
      · **verificação:** os números e contagens de §11/§12 batem com o comportamento observado.
- [x] 4.2 `npm run build` final sem erros + smoke no dev server: `/admin/gestao-usuarios`
      exclui, confirma, cancela e restaura na recarga; `/design` §15 íntegra; regressão dos
      modais da Auditoria (Filtros/Detalhe) e do modal de cadastro de usuário (incluindo
      modal filho da câmera) · **verificação:** build verde e checklist de cenários do delta
      `specs/gestao-usuarios/spec.md` todos observados manualmente.

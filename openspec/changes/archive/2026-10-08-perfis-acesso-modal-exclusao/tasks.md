# Tasks

## 1. Estado e exposição de foco

- [x] 1.1 Adicionar em `app/components/perfis/usePerfisDemo.ts` o helper puro
      `excluirPerfil(base, id): { base }` (espelho de `excluirUsuario`) e verificar que o
      arquivo compila sem tipos pendentes (`npm run build` passa nesta etapa)
- [x] 1.2 Adicionar em `app/components/perfis/Tabela.vue` o `ref` no `UiDataTable` e o
      `defineExpose({ focarBusca })` encadeado (cópia de `usuarios/Tabela.vue:26-28`) e
      verificar por inspeção que `focarBusca()` é exposto e delega ao kit

## 2. Componente de domínio PerfisExclusao

- [x] 2.1 Criar `app/components/perfis/Exclusao.vue` (auto-import `PerfisExclusao`) no molde
      de `usuarios/Exclusao.vue`: props `modelValue` + `perfil: LinhaPerfil | null`, emite
      `update:modelValue`/`confirmar`, `UiModal size="sm"` título "Excluir Perfil" com ícone
      `Trash2`, `UiModalSection` "Este perfil será excluído" (nome + contagem de usuários
      vinculados + aviso rose com `AlertTriangle`, **sem descrição**), footer `UiButton outline`
      "Cancelar" + `UiButton danger` "Excluir"; verificar com `npm run build` que o componente
      compila e que é apresentação pura (sem estado de gravação/toast)

## 3. Coordenação na página

- [x] 3.1 Em `app/pages/admin/perfis-acesso.vue`: criar estado `exclusaoAberta`,
      `perfilExcluir` e `tabelaRef`; `abrirExclusao(perfil)` sempre define o alvo e abre o
      modal (sem guarda na abertura); verificar que `@excluir` da `<PerfisTabela>` chama
      `abrirExclusao` e que Novo/Editar/Permissões seguem com `avisoProximaEtapa`
- [x] 3.2 Implementar `confirmarExclusao()`: fecha o modal e limpa o alvo; com `usuarios > 0`
      → `toast.warning` de bloqueio **sem tocar na base**; sem vínculos → `excluirPerfil()` em
      memória + `toast.success` + `nextTick(() => tabelaRef.value?.focarBusca())`; montar
      `<PerfisExclusao v-model :perfil @confirmar>` na página; atualizar o comentário de
      contrato; verificar com `npm run build` que a página compila sem `UiModal` órfão e sem
      import não usado

## 4. Documentação sincronizada

- [x] 4.1 Atualizar `docs/07 - Perfis de Acesso (RBAC).md`: §1 (sai "Sem modais" para
      guarda+modal de exclusão), §2 (árvore da página ganha `<PerfisExclusao>` e estado de
      coordenação), §3.3 (ações deixam de convertear só em toast), §3.4 (`excluirPerfil` entre
      os helpers) e nova §3.5 do componente `Exclusao.vue`; verificar que cada seção citada
      existe e descreve o código implementado
- [x] 4.2 Ajustar em `docs/07` a §5 (linha "Excluir perfil" da tabela de gatilhos: fase 1 =
      guarda→toast bloqueio / modal sem vínculo; fase 2 perde "modal de confirmação"), §11
      (nota da change `perfis-acesso-modal-exclusao`), §12 (checklist "os 4 gatilhos exibem
      toast e nenhum `UiModal` abre" corrigido) e §13 ("exclusão com confirmação" sai do item
      fase 2); verificar que nenhum trecho do documento ainda afirma "nenhum UiModal nesta
      página" para o gatilho Excluir

## 5. Verificação integrada

- [x] 5.1 Rodar `npm run build` (gate estrutural — não há lint/test no repositório) e
      `openspec validate "perfis-acesso-modal-exclusao" --strict`; ambos sem erro
- [x] 5.2 Conferência visual em `http://localhost:3000/admin/perfis-acesso`: clicar Excluir
      em qualquer perfil → modal abre com nome + "Usuários Vinculados: N" + aviso rose
      (sem descrição); Cancelar/Escape/X preservam a base; clicar "Excluir" com vínculos
      (semente: todos) → modal fecha + toast de bloqueio com nome do perfil, base intacta;
      zerar vínculos de um perfil (excluindo usuários em Gestão de Usuários) → "Excluir"
      remove a linha, recalcula KPIs, exibe toast de sucesso e devolve o foco à busca da
      tabela
- [x] 5.3 Regressão rápida: `/admin/gestao-usuarios` e `/design` inalterados (nenhum
      componente de kit modado) e recarga de `/admin/perfis-acesso` restaura os 4 perfis

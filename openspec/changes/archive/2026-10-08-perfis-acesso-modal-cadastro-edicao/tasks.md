# Tasks

## 1. Kit: componente UiTextarea

- [x] 1.1 Criar `app/components/ui/Textarea.vue` com `modelValue/label/placeholder/error/disabled/rows`
      (padrão 3), overlay de foco `.ds-bottom-clip` `brand-focus`, erro `rose-700` com mensagem
      `role="alert"` + `aria-describedby` e Enter quebra linha / Tab sai — **verificar:**
      `npm run build` passa e `UiTextarea` resolve por auto-import sem erro
- [x] 1.2 Documentar o componente: nova seção **§5.18 UiTextarea** em `docs/01 - design_system.md`
      (+ entrada no Sumário) e nova seção **19. Textarea (UiTextarea)** em `app/pages/design.vue`
      espelhando o componente real — **verificar:** `http://localhost:3000/design` renderiza a
      seção 19 com campo, foco e erro iguais aos do componente

## 2. Modelo em memória e KPIs de 3 estados

- [x] 2.1 Evoluir `app/components/perfis/usePerfisDemo.ts`: `SituacaoPerfil`
      (`'Ativo' | 'Inativo' | 'Bloqueado'`), `PerfilDemo` com `situacao`,
      `criado_em`/`atualizado_em` (ISO **fixos** na semente — sem `Date.now()` em evaluate),
      `matrizVazia()` e
      `salvarPerfil(base, registro, modo): { base }` puro (criação gera `id` com
      `crypto.randomUUID()`; edição preserva `criado_em`, grava `atualizado_em`) —
      **verificar:** `npm run build` e a página continua exibindo
      4 linhas com contagens 99/99, 45/99, 21/99, 6/99 e KPIs 4/4/0/171/396
- [x] 2.2 Renomear `status` → `situacao` em `LinhaPerfil`/`Tabela`/`Kpis`, estender
      `VARIANTE_POR_STATUS` para os 3 estados (`Bloqueado: 'blocked'`) e adicionar o 5º KPI
      "Bloqueados" (`#be123c`, ícone `ShieldOff`) com grid `xl:grid-cols-5` — **verificar:**
      `npm run build` e a página exibe 5 KPIs (Bloqueados 0 na semente) com o mapa de badge
      cobrindo os 3 valores
- [x] 2.3 Registrar o schema no modelo de dados: adicionar o DDL da tabela `perfis` (colunas
      `id` (UUID), `nome_perfil`, `descricao`, `padrao_sistema`, `situacao`,
      `cor_identificacao`, `criado_em`, `atualizado_em`) em `docs/02 - Guia de Arquitetura e
      Migrations.md` §3.5, marcando `padrao_sistema` e `cor_identificacao` como colunas
      futuras fora do UI atual — **verificar:** o §3.5 contém o bloco `CREATE TABLE` de `perfis`

## 3. Modal de cadastro/edição e orquestração da página

- [x] 3.1 Criar `app/components/perfis/Formulario.vue` (`<PerfisFormulario>`) no molde de
      `usuarios/Formulario.vue`: seção "Dados do Perfil" (Nome obrigatório,
      Descrição com `UiTextarea`, Situação com `UiSegmented` 3 opções — **sem campo de
      código**, o id é UUID gerado na criação), seção "Informações de
      Cadastro" só na edição com `criado_em`/`atualizado_em` desabilitados,
      `ORDEM_FOCO`/Enter/foco no 1º erro, rodapé Cancelar/Salvar, salvar via `salvarPerfil` +
      toast — **verificar:** `npm run build` e os fluxos de abertura/validação/salvar/descarte
      funcionam ao montar o modal na página
- [x] 3.2 Orquestrar em `app/pages/admin/perfis-acesso.vue`: `abrirNovo`/`abrirEdicao`
      (modo + registro completo por `id`), montar `<PerfisFormulario>` e retirar o
      `avisoProximaEtapa` de Novo/Editar, mantendo-o só para `@permissoes` — **verificar:**
      comportamento observado: Novo/Editar abrem o modal sem toast; Permissões ainda avisa
      por toast; criar perfil adiciona linha 0/99 com 0 usuários e recalcula KPIs (171/495);
      editar muda badge/KPIs; recarga restaura os 4 perfis
- [x] 3.3 Sincronizar `docs/07 - Perfis de Acesso (RBAC).md`: §1, §2 (+`Formulario.vue`),
      **§3.6 nova** (modal), §4 (kit `UiTextarea`), §5 (Novo/Editar abrem modal; só
      Permissões em transição), §6 (campos novos da semente e aceite da divergência
      renomear × contagem), §11 (deltas das 3 capabilities), §12 (verificação) e §13 (remove
      cadastro/edição das pendências; anota `padrao_sistema`/`cor_identificacao`/dropdown como
      futuros) — **verificar:** todas as seções listadas existem e o §13 não cita mais
      "cadastro/edição" como pendente

## 4. Verificação final (integração)

- [x] 4.1 `npm run build` completa sem erros — **verificar:** exit code 0
- [x] 4.2 `openspec validate "perfis-acesso-modal-cadastro-edicao" --strict` passa —
      **verificar:** exit code 0 sem erros
- [x] 4.3 Conferência visual/funcional em `http://localhost:3000`: seção 19 da vitrine
      (`/design`), modal de criação/edição com validações, datas desabilitadas, KPIs de 5
      colunas, badge de 3 estados e regressão do modal de exclusão — **verificar:** checklist
      executado sem divergência das specs; QA completo fica para depois do modal (decisão do
      usuário)

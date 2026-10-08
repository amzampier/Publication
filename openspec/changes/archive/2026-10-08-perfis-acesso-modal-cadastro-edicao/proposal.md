# Proposal

## Why

A página `/admin/perfis-acesso` ainda não permite criar nem editar perfis: "Novo Perfil" e
"Editar" apenas avisam por toast (contrato da fase 1 arquivado na change
`perfis-acesso-modal-exclusao`), e o modelo em memória não carrega os campos que a tabela
futura `perfis` exige (`situacao` de 3 estados, `criado_em`/`atualizado_em`).
Sem o modal de cadastro/edição não existe o passo [1] do ciclo de vida do RBAC
(cadastrar perfil → configurar permissões → atribuir ao usuário), e o kit não tem componente
de área de texto para o campo `descricao` (TEXT).

## What Changes

- Novo modal de cadastro/edição de perfil (`perfis/Formulario.vue`), no molde de
  `usuarios/Formulario.vue`: seção "Dados do Perfil" (nome, descrição, situação) e seção
  "Informações de Cadastro" **somente na edição** com `criado_em`/`atualizado_em`
  desabilitados.
- **Sem campo de código:** o identificador é o **UUID** (`id`) gerado no salvamento da
  criação — a tabela alvo (`docs/02` §3.5) não tem `codigo_perfil`.
- `situacao` de **3 estados** (`Ativo` | `Inativo` | `Bloqueado`) via `UiSegmented`; modelo,
  semente, badge da tabela e KPIs evoluem — KPIs ganham **"Bloqueados"** (5 KPIs) e o badge
  usa a variante `blocked`.
- Novo componente de kit **`UiTextarea`** (`app/components/ui/Textarea.vue`) para
  `descricao`, com foco/erro recortados e mensagem acessível — entra pelas três portas da
  regra do repo: spec `design-system/textarea`, seção `docs/01 §5.18`, seção 19 da vitrine
  `/design`.
- `perfis-acesso`: "Novo Perfil" e "Editar" passam a abrir o modal; só a ação
  **Permissões** (`KeyRound`) continua avisando por toast. Perfil novo nasce com matriz
  vazia (**0/99**) e 0 usuários.
- Salvamento em memória (`salvarPerfil`, contrato puro de `excluirPerfil`) + toasts de
  sucesso; nada de requisição HTTP; recarga restaura a semente.
- Documentação sincronizada: `docs/07` (estrutura/comportamento/dados/specs), `docs/01`
  §5.18, `docs/02` §3.5 (DDL de `perfis` com `padrao_sistema` e `cor_identificacao` como
  colunas futuras), vitrine `/design`.

**Não entra:** `padrao_sistema` no modal (flag de DB, semente `0`, guarda de exclusão
intacta) · `cor_identificacao` e componente de cor (retirados do escopo) · dropdown de
`/admin/gestao-usuarios` derivando da base de perfis (fica p/ o backend) · modal de
permissões granulares (passo 2).

**Aceito na demo:** renomear um perfil zera sua contagem de **Usuários** (casamento por
nome literal com `useUsuariosDemo`) e diverge do dropdown fixo de usuários — universos
desacoplados, restaurados na recarga; documentado em `docs/07`.

## Capabilities

### New Capabilities

- `design-system/textarea`: componente `UiTextarea` — contrato de props/v-model, label,
  foco e erro recortados na borda inferior, mensagem de erro persistente/`role="alert"`,
  `aria-describedby`, `disabled`, `rows` e comportamento de teclado (Enter quebra linha,
  Tab sai do campo).

### Modified Capabilities

- `perfis-acesso`:
  - "As ações da fase 1 avisam por toast e não abrem modal" → renomeado/reescrito: apenas
    **Permissões** avisa por toast; Novo/Editar abrem o modal de cadastro/edição; Excluir
    segue com o modal de exclusão.
  - "Os KPIs refletem o conjunto vigente de perfis" → ganha o KPI **"Bloqueados"** (5 KPIs).
  - "A listagem exibe perfis em UiDataTable com seis colunas" → badge de Status
    distinguível entre **Ativo, Inativo e Bloqueado**.
  - Requisito novo: "O modal de cadastro/edição cria e altera perfis" (abertura, validação de
    nome, id UUID gerado na criação, datas desabilitadas só na edição, salvar/descartar,
    matriz vazia 0/99, em memória + recarga).
- `design-system/form-control-states`: requisitos de foco e de erro/mensagem passam a
  incluir `Textarea` (mesmo recorte, `rose-700`, `role="alert"`, `aria-describedby`).

## Impact

- **Código:** `app/components/ui/Textarea.vue` (novo);
  `app/components/perfis/{Formulario.vue}` (novo), `usePerfisDemo.ts` (modelo + semente +
  `salvarPerfil`), `Kpis.vue` (5º KPI), `Tabela.vue` (`situacao`/badge 3 estados);
  `app/pages/admin/perfis-acesso.vue` (handlers Novo/Editar); `app/pages/design.vue`
  (seção 19).
- **Specs:** deltas em `perfis-acesso`, `design-system/form-control-states`; nova capability
  `design-system/textarea`.
- **Docs:** `docs/01` (§5.18 + sumário), `docs/07` (§1, §2, §3.6, §4, §5, §6, §11, §12, §13),
  `docs/02` §3.5 (DDL).
- **Sem** mudanças de API/rotas/server; verificação = `npm run build` +
  `openspec validate --strict` + conferência visual (QA completo fica para depois do modal).

# Design

## Context

A página `/admin/perfis-acesso` já tem cabeçalho (`novo`), tabela (`editar`/`permissoes`/`excluir`)
e modal de exclusão orquestrados pela página (estado do lado dela), mas `Novo`/`Editar` ainda
viram toast (contrato da fase 1 arquivado). O modelo `PerfilDemo` só carrega
`id/nome/descricao/status/permissoes` — não os campos da tabela futura `perfis`. O kit tem
`UiInput`, `UiSelect`, `UiSegmented`, `UiModal(Section)` etc., mas **não** um control de
multilinha. Ver motivação em `proposal.md` — Why.

## Goals / Non-Goals

**Goals:**
- Modal de cadastro/edição funcional 100% em memória, espelhando os mecanismos já validados
  do `usuarios/Formulario.vue` (rascunho, validação, foco em erro, Enter em cadeia).
- `UiTextarea` de kit nascente, com spec própria, docs e vitrine (regra do repo p/ componente).
- Modelo `PerfilDemo` alinhado ao DDL futuro de `perfis` (sem `padrao_sistema`/`cor_identificacao`
  no UI) e KPIs/badge preparados para `situacao` de 3 estados.

**Non-Goals:**
- Modal de permissões (passo 2), filtros, backend/`server/`, dropdown de usuários em
  `/admin/gestao-usuarios`, guarda de exclusão por `padrao_sistema`.
- Mudança no modal de exclusão, nos KPIs de permissões (171/396) ou na matriz normativa.

## Decisions

1. **Molde: clonar a mecânica do `usuarios/Formulario.vue`, não generalizar.**
   Rascunho (`rascunhoVazio`/`rascunhoDoRegistro`), `validar()` puro, `ORDEM_FOCO`,
   `focarCampo` por `[data-campo]`, `aoEnter` em cadeia (já ignora `TEXTAREA` — Enter quebra
   linha sem código extra), `watch` de erros reaparecendo só onde já falhou. Alternativa
   considerada: extrair um composable compartilhado de formulário — rejeitada agora (refactor
   transversal sem ganho de comportamento; escopo do change é o modal).
   *Novo componente:* `perfis/Formulario.vue` → `<PerfisFormulario>` com
   `props: { modelValue, modo: 'novo' | 'editar', perfil }` e `emit('update:modelValue')`.

2. **`UiTextarea` como componente novo (`app/components/ui/Textarea.vue`), não extensão do
   `UiInput`.** Contrato espelhando `Input`: `modelValue/label/placeholder/error/disabled/rows`
   (padrão 3), mesmo overlay `absolute -inset-[1px]` com `.ds-bottom-clip`, foco
   `brand-focus`, erro `rose-700`, mensagem `role="alert"` + `aria-describedby` — o delta de
   `form-control-states` formaliza a inclusão na família. Alternativa descartada (decisão do
   usuário): `type="textarea"` no `UiInput` (mistura tipos num componente já referenciado em
   specs como campo único). Nome em EN (convenção do kit: `Input`, `Select`, `Tabs`).

3. **Modelo em memória: evoluir `PerfilDemo` com o shape do DDL (menos campos futuros).**
   ```ts
   type SituacaoPerfil = 'Ativo' | 'Inativo' | 'Bloqueado'
   interface PerfilDemo {
     id: string; nome: string; descricao: string
     situacao: SituacaoPerfil
     criado_em: string; atualizado_em: string   // ISO fixo na semente
     permissoes: Record<ModuloId, Permissao[]>
   }
   ```
   - **Sem `codigo` (decisão revisada na apply):** o identificador é o `id` UUID (gerado com
     `crypto.randomUUID()` na criação) — a tabela alvo não carrega `codigo_perfil`. O campo
     havia sido previsto no planejamento e foi retirado a pedido do usuário.
   - Semente: `criado_em`/`atualizado_em` **strings ISO fixas** (nada de `Date.now()` na
     semente — evita divergência de hidratação cliente/servidor).
   - Ids novos: `crypto.randomUUID()` (alinha ao `id UUID` do DDL).
   - `VARIANTE_POR_STATUS` → `Record<SituacaoPerfil, 'done' | 'neutral' | 'blocked'>`
     (`Bloqueado: 'blocked'`, variante já existente do `UiBadge`).
   - `status` → `situacao` em `LinhaPerfil`, `Kpis` e `Tabela` (o `Exclusao` não usa o campo).
   - `matrizVazia()`: novo perfil nasce `0/99` (todos os módulos com lista vazia).
   - `salvarPerfil(base, registro, modo): { base }` — puro, mesmo contrato de
     `excluirPerfil`/`salvarUsuario`; na edição preserva `criado_em` e grava
     `atualizado_em` no momento do salvamento (fonte `new Date()` só no clique, nunca em
     evaluate do setup).

4. **Coordenação na página (mesmo padrão `gestao-usuarios`).**
   `modalAberto`, `modo` (`'novo' | 'editar'`), `perfilEditar`; `abrirEdicao(LinhaPerfil)`
   resolve o registro completo por `id` na base vigente (`perfis.value.find`). A página só
   troca `avisoProximaEtapa('Novo Perfil'|'Editar perfil')` por `abrirNovo`/`abrirEdicao`;
   `avisoProximaEtapa` permanece só para `@permissoes`.

5. **KPIs 5 colunas.** Novo card "Bloqueados" (`cor="#be123c"`, ícone `ShieldOff`), grid
   `sm:grid-cols-2 xl:grid-cols-5`. Alternativa descartada: dobrar a última linha
   (`xl:grid-cols-4`) — 5 cards ficam desiguais; 5 colunas mantém o padrão de uma linha em
   desktop.

6. **Decisões de escopo já decididas com o usuário** (não reabrir): `padrao_sistema` e
   `cor_identificacao` fora do modal/UI; divergência renomear × contagem de usuários aceita
   na demo (registrada em `docs/07`); dropdown de usuários fica p/ backend.

## Risks / Trade-offs

- [Renomear um perfil zera sua contagem **Usuários** e diverge do dropdown de
  `/admin/gestao-usuarios` (casamento por nome literal)] → Aceito na demo; documentar em
  `docs/07 §6/§13`; consistência por construção vem com o dropdown derivado (backend).
- [Badge `blocked` pulsa (comportamento do `UiBadge`: `pulsing` implícito para `blocked`)]
  → Conferir na vitrine/QA se o pulso na tabela não polui; se poluir, decisão de UI na
  hora (não altera spec — a spec pede apenas badge distinguível).
- [Grid de 5 KPIs pode apertar em `xl` médio] → `sm:grid-cols-2` cobre mobile/tablet;
  conferir em 1280px na QA.
- [`atualizado_em` editável só em memória pode divergir de `criado_em` em clocks de
  cliente] → Aceito na demo (formato exibido, não auditado); sem backend não há relógio
  confiável comum.
- [Spec `perfis-acesso` tem requisito REMOVED + ADDED na mesma capability] → Validar com
  `openspec validate --strict` antes do apply; sync no archive tratará delete+insert.

## Migration Plan

Sem migração: change 100% frontend, em memória, sem `server/`, sem dados persistentes.
Rollback = reverter os commits do change; a semente restaura o comportamento canônico.

## Open Questions

- Ícone do KPI "Bloqueados": `ShieldOff` é a sugestão; escolher na apply entre `ShieldOff` e
  `Ban` conforme vocabulário visual (não altera spec).

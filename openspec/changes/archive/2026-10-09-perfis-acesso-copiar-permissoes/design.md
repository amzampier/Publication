# Design

## Context

O modal de permissões (`app/components/perfis/Permissoes.vue`, `UiModal size="xl"`) já tem
rascunho isolado, abas `UiTabs`, interruptores `UiSwitch`, chips `UiCheckChip` e contador
"n/99" — ver spec delta em `specs/perfis-acesso/spec.md`. O rodapé do kit (`ui/Modal.vue`
§footer) é um flex `justify-end gap-2.5` fixo; slots de rodapé são conteúdo do chamador, e o
kit já mantém uma pilha de modais (`pilhaModais`) coberta pelos 4 requisitos de
`design-system/modais` (Esc/Tab/foco no topo), com demonstração de modal filho em
`design.vue`. `UiChoiceCard` é o controle de escolha única do kit (roving tabindex via
`role="radiogroup"`, molde em `usuarios/Convite.vue:233`). Ver motivação em `proposal.md`.

## Goals / Non-Goals

**Goals:**

- Duas ações de cópia no rodapé do modal (importar no rascunho / exportar imediato) sem
  alterar o kit `UiModal` nem criar componentes de kit novos.
- Reutilizar a pilha de modais e o `UiChoiceCard` como estão, sem delta em
  `design-system/modais` nem em `design-system/choice-card`.
- Manter invariante central: **as edições do perfil corrente só valem no Salvar**.

**Non-Goals:**

- Mescla (união/interseção) de matrizes — cópia é substituição integral.
- Exportar/importar arquivo, clipboard de sistema ou qualquer persistência (fase 1 é em
  memória).
- Copiar a partir do modal de cadastro ("Novo Perfil") — o fluxo é criar (0/99) e importar
  no próprio modal de permissões.
- Alterar timestamps (`atualizado_em`) nas cópias — mesmo comportamento do Salvar de
  permissões atual, que também não os atualiza.

## Decisions

**D1 — Rodapé esquerdo via grupo `mr-auto` no slot, sem tocar no kit.**
O container `justify-end` (`ui/Modal.vue`) com um filho `mr-auto` absorve o espaço livre e
empurra o grupo para a esquerda, mantendo `Cancelar`/`Salvar` à direita. *Alternativas
rejeitadas:* trocar o kit para `justify-between` (muda o alinhamento de todos os modais,
inclusive os de um único botão); criar slot `#footer-start` no kit (API nova para um único
consumidor).

**D2 — Seletor = modal filho (`UiModal size="sm"`) com `UiChoiceCard`.**
Mesmo molde do "modal filho" da vitrine: a pilha já garante Esc só no topo, Tab contido e
devolução de foco ao ícone que abriu (requisitos existentes de `design-system/modais`).
Cada perfil candidato vira um card (nome, descrição, badge `n/99`) dentro de um
`role="radiogroup"` — acessibilidade e teclado vêm de graça. *Alternativas rejeitadas:*
`UiSelect` embutido no rodapé (fura o padrão de botões do rodapé e é pequeno demais para
mostrar descrição/contagem); popover/menu (não existe no kit — componente novo sem
necessidade).

**D3 — Importar no rascunho; exportar imediato com a matriz salva.**
O rascunho é descartável por contrato ("Nada vale até Salvar"), então importar é só
`rascunho = clonarMatriz(origem)` — o mesmo clone do watch de abertura, com `toast.info`
reforçando que vale após Salvar. Exportar escreve **outro registro**: caso próprio e
atômico, imediato, com `toast.success` — ler a matriz **salva da base**
(`perfis.value.find`) evita o paradoxo "o alvo salvaria alterações que a origem ainda não
salvou"; exportar antes de Salvar as edições locais é sempre a matriz persistida.
*Alternativa rejeitada:* enfileirar a exportação até o Salvar (acopla dois registros num
mesmo commit, Cancelar mataria silenciosamente uma ação já pedida, e o estado
'rascunho + pendência de exportação' complica o modal).

**D4 — Um único modal filho dentro de `Permissoes.vue`, com modo `'de' | 'para'`.**
O seletor é específico deste domínio e pequeno (lista + confirmar); mantê-lo no mesmo
componente evita props/emits de coordenação e arquivo novo. Se um dia reaparecer em outra
tela, extrair para `perfis/Copia.vue` é mecânico.

**D5 — `clonarMatriz()` exportado de `usePerfisDemo.ts`.**
O clone "11 módulos, listas novas, sem referência compartilhada" já existe inline no watch
de abertura (`Permissoes.vue:70-72`) e será necessário no import; extrair para o composable
(segundo molde de `matriz()`, que já copia listas) evita terceira cópia do código. A
exportação não precisa dele: `salvarPermissoes` já clona por dentro.

**D6 — Estado vazio no seletor (ícones nunca desabilitados).**
Sem candidatos (base com um perfil), o modal filho exibe mensagem e só Cancelar — mantém os
ícones sempre clicáveis e descobríveis. *Alternativa rejeitada:* desabilitar os ícones
(adição reativa + tooltip explicando o motivo, para um caso raro).

**D7 — Sem confirm extra na importação.**
Substituir um rascunho descartável não justifica dupla confirmação; o próprio modal filho +
botão "Copiar" já é o degrau de fricção. O `toast.info` com "vale até Salvar" cobre o
resto.

## Risks / Trade-offs

- [Exportar com rascunho editado confundir ("cadê minhas alterações?")] → a exportação lê
  explicitamente a matriz salva; tooltip, toast e `docs/07` §3.7 dizem "matriz salva";
  cenário coberto na spec.
- [Importação sobrescreve edições do rascunho sem avisar] → aceito (D7): rascunho é
  descartável e a legenda do modal já anuncia "Nada vale até Salvar".
- [Dois `UiModal` no mesmo componente compartilham o container teleportado] → a pilha do
  kit é feita justamente para isso (dois elementos, só o topo reage); verificado no padrão
  câmera/sobre-formulário.
- [Grupo `mr-auto` + `gap` do rodapé podem juntar demais os elementos] → conferência visual
  no passo 3.3 do apply (375px e desktop).
- [KPIs do alvo recalculam atrás do backdrop durante a exportação] → comportamento desejado
  (computeds reativos); nada de estado duplicado.

## Migration Plan

Fase 1 em memória: sem dados persistentes, sem API, sem rollback operacional — qualquer
problema se resolve por revert do commit; a recarga restaura a semente.

## Open Questions

- Variante do badge `n/99` nos cards do seletor (provavelmente `neutral`/`slate`) e uso ou
  não do tile de ícone do card — detalhe visual menor, decide-se na conferência do passo
  3.3 sem alterar spec nem quebra de tarefas.

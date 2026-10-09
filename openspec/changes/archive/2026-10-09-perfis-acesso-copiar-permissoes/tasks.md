# Tasks

## 1. Núcleo em memória (`usePerfisDemo.ts`)

- [x] 1.1 Extrair `clonarMatriz(matriz)` como export de `app/components/perfis/usePerfisDemo.ts`
  (copia as 11 listas sem referência compartilhada) e refator o watch de abertura de
  `Permissoes.vue:70-72` para usá-lo — verificar: `npm run build` ok e editar célula após a
  abertura não alterar a base (clone íntegro)

## 2. Modal de permissões: rodapé e cópias (`Permissoes.vue`)

- [x] 2.1 Adicionar o grupo esquerdo do rodapé (`div` com `mr-auto`) com os ícones
  `ClipboardPaste` ("Copiar permissões de outro perfil") e `ClipboardCopy` ("Copiar
  permissões para outro perfil") no molde do `X` do cabeçalho (botão puro + `UiTooltip` +
  `aria-label` + `focus-visible:outline-brand-focus`), mantendo Cancelar/Salvar à direita —
  verificar: no `/admin/perfis-acesso` os dois ícones aparecem alinhados à esquerda do
  rodapé e os botões seguem à direita
- [x] 2.2 Implementar o modal filho (estado local `copia: 'de' | 'para'` + `perfilAlvo`):
  `UiModal size="sm"` com `UiModalSection`, `role="radiogroup"` e `UiChoiceCard` por perfil
  candidato (`perfis.filter(p => p.id !== perfil.id)`) exibindo nome, descrição e badge
  `n/99`; estado vazio quando não há candidatos; rodapé Cancelar + "Copiar" — verificar:
  o perfil atual nunca aparece, `Escape` fecha só o filho (pai intacto), Tab fica preso no
  filho e o foco volta ao ícone que o abriu ao fechar
- [x] 2.3 Implementar o handler de importar (`ClipboardPaste` → "de"): `rascunho =
  clonarMatriz(origem.permissoes)` + `toast.info` ("matriz copiada — vale após Salvar"),
  fechando o filho sem tocar na base — verificar: com o Editor aberto importar o Leitor, o
  contador vai a `6/99` e a coluna/KPI seguem `45/99`/`171/396` até Salvar; após Salvar a
  linha fica `6/99` e o KPI `132/396`; Cancelar antes de Salvar preserva tudo
- [x] 2.4 Implementar o handler de exportar (`ClipboardCopy` → "para"): ler a **matriz
  salva** do perfil corrente na base (`perfis.value.find`), `perfis.value =
  salvarPermissoes(perfis.value, alvo.id, matriz).base` + `toast.success`, fechando o filho —
  verificar: exportando Editor → Leitor a linha do Leitor vira `45/99` e o KPI `210/396` na
  hora, com rascunho do Editor editado o destino ainda recebe `45/99` (matriz salva), e
  Cancelar/Escape/X do modal pai não desfaz a cópia
- [x] 2.5 Atualizar `docs/07 - Perfis de Acesso (RBAC).md` (versão 1.4.0): §3.7 (rodapé com
  as duas cópias, semântica import/export), §5 (comportamento das ações), §11 (linha da
  delta desta change), §12 (checklist visual dos dois fluxos) — verificar: o documento cita
  ícones/semântica e mantém §7.5 (`99/45/21/6` · `171/396`) consistente com a tela
- [x] 2.6 Atualizar `docs/01 - design_system.md` §5.12 com 1 linha sobre o grupo de ícones
  à esquerda no slot de rodapé (padrão consumidor, kit intacto) — verificar: a seção cita o
  padrão `mr-auto`

## 3. Verificação da change

- [x] 3.1 `npm run build` termina com exit 0
- [x] 3.2 `openspec validate "perfis-acesso-copiar-permissoes" --strict` termina com exit 0
  e `openspec status --change "perfis-acesso-copiar-permissoes"` mostra os 4 artefatos done
- [x] 3.3 Conferência visual em `http://localhost:3000` no fluxo completo: abrir
  Permissões → ícones no rodapé esquerdo → importar (contador reage, base intacta, Salvar
  aplica com toast) → exportar (linha+KPI do alvo mudam com toast, descarte não desfaz) →
  `Escape`/Tab/foco no modal filho → layout íntegro a 375px e a 1280px → regressão das
  demais telas (`/design`, `/admin/gestao-usuarios`)

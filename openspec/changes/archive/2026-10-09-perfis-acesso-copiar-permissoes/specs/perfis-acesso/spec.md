# Spec Delta

## ADDED Requirements

### Requirement: O modal de permissões copia a matriz entre perfis
O sistema SHALL oferecer no rodapé do modal de permissões, **alinhadas ao lado esquerdo**
(grupo próprio à esquerda; `Cancelar` e `Salvar` permanecem à direita), duas ações de cópia
identificadas por ícone com tooltip e `aria-label` próprios:

- **Copiar de outro perfil** (`ClipboardPaste`): abre um modal filho com a lista de perfis da
  base (exceto o perfil corrente) e SHALL **substituir o rascunho** pela matriz escolhida
  (clone integral, sem mescla com o que havia no rascunho, sem alterar a base) — o contador
  "n/99" acompanha e a cópia **só vale após Salvar**, nos mesmos moldes das edições de célula.
- **Copiar para outro perfil** (`ClipboardCopy`): abre o mesmo modal filho e SHALL gravar
  **imediatamente** no perfil escolhido a **matriz salva** do perfil corrente (nunca o
  rascunho, mesmo com alterações não salvas), com toast de sucesso — a linha do perfil alvo
  e os KPIs recalculam na hora, e o descarte do modal corrente (Cancelar/Escape/X) **não
  desfaz** a cópia já feita no alvo.

O modal filho SHALL listar cada perfil candidato como escolha única com nome, descrição e
sua contagem `n/99`; o perfil corrente SHALL estar sempre ausente da lista, e, sem
candidatos (base com um único perfil), o modal filho SHALL exibir estado vazio com a ação
de descarte. Ao fechar o modal filho, o foco SHALL voltar ao botão de ícone que o abriu, com
o modal de permissões subjacente intacto (pilha de modais). Nenhuma das duas cópias SHALL
fazer requisição HTTP, e ambas SHALL ser descartadas na recarga junto da base em memória.

#### Scenario: Rodapé com as ações de cópia à esquerda
- **WHEN** o modal de permissões é aberto
- **THEN** o rodapé exibe os ícones `ClipboardPaste` e `ClipboardCopy` (com tooltip e
  `aria-label` próprios) agrupados à esquerda, e `Cancelar` e `Salvar` seguem à direita

#### Scenario: Importar substitui só o rascunho
- **WHEN** com o modal do Editor aberto (matriz salva 45/99) o usuário escolhe "copiar de"
  outro perfil cuja matriz tem 6/99 e confirma
- **THEN** o rascunho passa a 6/99 (substituído por inteiro), a coluna Permissões e os KPIs
  permanecem intactos até **Salvar**; ao salvar, a linha do Editor exibe `6/99` e o KPI de
  Permissões concedidas recalcula para `132/396`, com toast de sucesso

#### Scenario: Descartar após importar preserva a base
- **WHEN** o usuário importa a matriz de outro perfil e, sem salvar, aciona "Cancelar",
  `Escape` ou o `X` do cabeçalho
- **THEN** o modal fecha e matriz, coluna Permissões e KPIs permanecem idênticos ao estado
  anterior à importação

#### Scenario: Exportar grava imediatamente no perfil alvo
- **WHEN** com o modal do Editor aberto (matriz salva 45/99) o usuário escolhe "copiar
  para" o Leitor e confirma
- **THEN** a matriz do Leitor passa a ser a salva do Editor, sua linha exibe `45/99` (era
  `6/99`), o KPI de Permissões concedidas recalcula para `210/396` e um toast de sucesso é
  exibido; fechar em seguida o modal corrente não desfaz a cópia no Leitor

#### Scenario: Exportar usa a matriz salva, não o rascunho
- **WHEN** o usuário altera células do rascunho sem salvar e depois exporta o perfil corrente
  para outro perfil
- **THEN** o destino recebe a matriz **salva** do perfil corrente (a anterior às alterações
  descartáveis), não o conteúdo editado do rascunho

#### Scenario: O seletor exclui o perfil corrente
- **WHEN** qualquer uma das duas ações de cópia abre o modal filho
- **THEN** a lista apresenta somente os demais perfis da base como escolhas únicas com nome,
  descrição e contagem `n/99`; o perfil corrente nunca aparece e, sem candidatos, um estado
  vazio é exibido com a ação de descarte

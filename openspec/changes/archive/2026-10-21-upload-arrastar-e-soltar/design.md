# Design

## Context

O `UiUploadFiles` já possui `dragover/dragleave/drop` na raiz, mas o estado `arrastando` não tem
feedback textual e consumidores não têm como encaminhar drops feitos em áreas fora da raiz. A etapa
de mídias de Lançar as Chamadas e os seis modais de importação usam o componente; centralizar a
mudança nele evita sete implementações divergentes.

## Goals / Non-Goals

**Goals:**

- Drop em toda a raiz do `UiUploadFiles`, com overlay “Solte os arquivos aqui”.
- `dropEffect = copy` e estado estável ao passar por filhos.
- Operação pública para consumidores encaminharem drops de áreas externas.
- Rótulos de importação XLSX descobríveis para arrastar.
- Cobertura em `Midias` (imagens) sem duplicar o evento.

**Non-Goals:**

- Alterar validação de tipo/tamanho ou o fluxo de upload no salvar.
- Transformar o modal inteiro de importação em dropzone fora do componente.
- Criar um novo componente público ou mudar o layout do wizard.

## Decisions

### 1. Overlay no próprio `UiUploadFiles`

A raiz já é `relative`; o overlay é `absolute inset-0` com `pointer-events-none`, borda tracejada
`brand-accent`, fundo translúcido e ícone `Cloud`. Isso cobre os modos clássico e `listaSeparada`.
O estado usa `dragenter`/`dragover` para ativar e `dragleave` com checagem de `relatedTarget` para
não apagar ao entrar em filhos. `drop` limpa o estado e aplica os arquivos.

### 2. Operação pública `aplicarArquivos`

`defineExpose({ aplicarArquivos })` expõe o mesmo `aplicar` interno. Consumidores guardam uma `ref`
do componente e chamam a operação no drop do contêiner externo. O drop interno continua tratado pelo
próprio componente; `Midias` detecta `[data-upload-files]` no `event.target` e ignora o drop para
não duplicar. A raiz do `UiUploadFiles` recebe `data-upload-files`.

### 3. `Midias` como área de drop

O contêiner de `LancarChamadasMidias` recebe `dragover/drop`; se o alvo não estiver dentro do
`UiUploadFiles`, chama a operação exposta. O `change` resultante continua passando por
`incorporarArquivos`, que valida tipo/tamanho e atualiza a galeria. Assim, soltar sobre a galeria,
campos de link ou caixa de upload funciona igual.

### 4. Rótulos dos importadores

Os sete `Importar.vue` trocam o rótulo de “Clique para selecionar arquivos” para “Arraste o arquivo
aqui ou clique para selecionar”. O drop já é tratado pela raiz do `UiUploadFiles`, inclusive sobre os
cards do modo `listaSeparada`.

## Risks / Trade-offs

- **Drop duplicado** -> `Midias` ignora alvos dentro de `[data-upload-files]`; o componente aplica
  uma única vez.
- **Flicker do `dragleave`** -> checagem de `relatedTarget` e `dragover` contínuo.
- **Arquivo errado no importador** -> o parser já devolve mensagem de modelo inválido; a validação de
  tipo do componente permanece inalterada.
- **Acessibilidade** -> o overlay é apenas feedback visual (`aria-hidden`); a caixa continua sendo um
  botão focável com o mesmo rótulo.

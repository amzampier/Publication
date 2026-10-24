# design-system/upload Specification

## Purpose

Definir o comportamento do upload de arquivos do kit em modo lista separada — cards dos arquivos escolhidos (nome, tamanho e remoção) e caixa de upload que some enquanto houver arquivo — para áreas como a importação de usuários da Gestão de Usuários.

## Requirements

### Requirement: O upload do kit oferece modo de lista separada

O sistema SHALL oferecer ao `UiUploadFiles` um modo opt-in (`listaSeparada`, default `false`) em que os arquivos selecionados são exibidos em **cards próprios** — cada um com ícone de arquivo, nome, tamanho formatado em pt-BR e ação de remover —, enquanto a caixa de upload tracejada (ícone `Upload` + rótulo/dica) não exibe nome por dentro nem ações de canto. No modo single-file, a caixa SHALL **sumir enquanto houver um arquivo selecionado** (fica somente o card) e **voltar** quando o arquivo for removido; no modo `multiple` a caixa SHALL permanecer para acrescentar mais arquivos. Com a prop desabilitada (default), o comportamento clássico SHALL permanecer inalterado (caixa única, nome do arquivo no interior, ações no canto inferior direito e prévia de imagem).

#### Scenario: Arquivo selecionado no modo lista separada (single-file)
- **WHEN** um consumidor usa `listaSeparada` sem `multiple` e o usuário seleciona um arquivo
- **THEN** um card com ícone, nome, tamanho e ação de remover aparece e a caixa de upload some, ficando somente o arquivo selecionado

#### Scenario: Remover pelo card devolve a caixa
- **WHEN** o usuário aciona o remover do card no modo lista separada
- **THEN** o card é removido, o componente emite `change(null)` e a caixa de upload com o prompt reaparece

#### Scenario: Modo múltiplo mantém a caixa
- **WHEN** o componente usa `listaSeparada` junto com `multiple` e já há arquivos selecionados
- **THEN** os cards são exibidos e a caixa de upload permanece visível para acrescentar mais arquivos

#### Scenario: Modo clássico inalterado
- **WHEN** o componente é usado sem a prop `listaSeparada`
- **THEN** o comportamento permanece o mesmo (caixa única com nome por dentro, ações de canto e prévia de imagem)

### Requirement: O upload do kit aceita arrastar e soltar em toda a raiz

O `UiUploadFiles` SHALL aceitar arquivos arrastados sobre **qualquer ponto da sua raiz**, nos modos
clássico e `listaSeparada`, aplicando o mesmo fluxo do seletor de arquivos e emitindo `change` com os
arquivos aceitos. Enquanto houver um arquivo sobre a raiz, o componente SHALL exibir um feedback
visual explícito com a instrução “Solte os arquivos aqui” e `dropEffect = copy`. Ao sair da raiz, o
feedback SHALL desaparecer; a passagem do ponteiro sobre elementos filhos não SHALL apagar o estado
de arrasto. O componente SHALL expor uma operação pública para que consumidores encaminhem arquivos
soltos em áreas externas à caixa de upload, sem duplicar o evento quando o drop ocorrer dentro da
própria raiz.

#### Scenario: Arrastar sobre a raiz e soltar

- **WHEN** o usuário arrasta um arquivo sobre a raiz do `UiUploadFiles` e solta
- **THEN** o componente aplica o arquivo como se tivesse sido escolhido no seletor e emite `change`

#### Scenario: Feedback visual durante o arrasto

- **WHEN** um arquivo entra na raiz do componente
- **THEN** o componente exibe “Solte os arquivos aqui” com destaque visual e mantém o estado enquanto
  o ponteiro percorre os elementos filhos

#### Scenario: Drop em área externa encaminhado pelo consumidor

- **WHEN** o consumidor chama a operação pública de aplicar arquivos após um drop fora da raiz do
  `UiUploadFiles`
- **THEN** o componente aplica os arquivos e emite `change`, sem exigir clique na caixa de upload

#### Scenario: Drop dentro da raiz não duplica

- **WHEN** o drop acontece dentro da raiz do `UiUploadFiles` e o consumidor também escuta o evento
- **THEN** o arquivo é aplicado uma única vez

### Requirement: A dica padrão do upload reflete os formatos realmente aceitos

A dica padrão exibida pelo `UiUploadFiles` SHALL listar apenas formatos aceitos pelo componente e
pelo servidor, sem citar SVG quando SVG não é aceito. O chamador SHALL poder substituir a dica por
uma lista específica do seu contexto, e a substituição SHALL prevalecer sobre o padrão.

#### Scenario: Dica padrão sem formato não aceito

- **WHEN** o componente é renderizado sem uma dica customizada
- **THEN** a dica não cita SVG e lista os formatos de imagem efetivamente aceitos

#### Scenario: Dica customizada prevalece

- **WHEN** o chamador informa uma dica própria
- **THEN** o componente exibe exatamente a dica informada, sem concatenar o texto padrão

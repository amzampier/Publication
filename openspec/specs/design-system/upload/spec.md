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

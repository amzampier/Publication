# Spec Delta

## ADDED Requirements

### Requirement: As imagens da chamada são persistidas em `anexos_midias`

Cada imagem da chamada SHALL ser persistida como uma linha em `anexos_midias`, vinculada por
`entrega_item_id` com `ON DELETE CASCADE`, contendo a URL pública, o nome do arquivo, o tipo MIME, a
ordem de exibição, a indicação de capa e a legenda alternativa quando informada. A primeira imagem
SHALL ser a capa (`destaque_capa = 1`) e as demais SHALL manter a ordem de seleção. A leitura da
chamada SHALL devolver `midias` com os metadados e SHALL manter `imagens` como a lista derivada de
URLs, na mesma ordem, para compatibilidade com as telas atuais. A coluna JSON
`entregas_itens.imagens` SHALL permanecer como snapshot legado nesta change, sem ser a fonte de
verdade. A leitura SHALL usar `anexos_midias` e, apenas para registros ainda não backfilled, poderá
cair para o JSON legado. A tabela SHALL ter unicidade por `(entrega_item_id, url_arquivo)` e índice
por `url_arquivo` para a checagem de compartilhamento.

#### Scenario: Salvar cria as linhas relacionais

- **WHEN** uma chamada é criada ou editada com imagens
- **THEN** cada URL gera/atualiza uma linha em `anexos_midias`, com ordem e capa coerentes com o array

#### Scenario: Leitura devolve mídias e URLs

- **WHEN** a chamada é lida pela API
- **THEN** a resposta contém `midias` com os metadados e `imagens` com as mesmas URLs na ordem de exibição

#### Scenario: Compatibilidade com registros antigos

- **WHEN** uma chamada ainda não possui linhas em `anexos_midias`
- **THEN** a leitura usa o JSON legado como fallback, sem quebrar a tela

#### Scenario: Backfill dos registros existentes

- **WHEN** a migration 30 é aplicada
- **THEN** cada URL do JSON legado vira uma linha em `anexos_midias`, preservando a ordem e a primeira imagem como capa

#### Scenario: Remoção da chamada limpa as linhas

- **WHEN** a chamada é excluída
- **THEN** as linhas de `anexos_midias` são removidas por `ON DELETE CASCADE`

## MODIFIED Requirements

### Requirement: A validação impede dados inválidos

O sistema SHALL validar, no cliente, os campos antes de salvar: **Chamada** obrigatória, com no
máximo 60 caracteres e sem duplicidade no conjunto carregado; **Título** obrigatório, com no máximo
255 caracteres; **Software**, **Parceiro**, **Módulo** e **Descrição completa** obrigatórios;
**Módulo** com no máximo 100 caracteres; **Título do manual** com no máximo 255 caracteres; **Data de
lançamento** obrigatória e **Data de liberação** opcional, ambas válidas e, quando preenchidas, em
segunda-feira; links com URL `http(s)` quando informados; no máximo 12 tags, cada uma com até 30
caracteres; no máximo 100 imagens por chamada, nos formatos PNG, JPG ou WebP, com até 5 MB por
arquivo, tanto por seleção quanto por colagem. A obrigatoriedade da **Descrição completa** SHALL
considerar o texto puro derivado do conteúdo rico: uma descrição que renderiza vazia SHALL ser
tratada como ausente. A **Solução**, quando informada, SHALL respeitar um teto de tamanho em texto
puro. O primeiro erro SHALL receber foco e permanecer visível no campo.

#### Scenario: Campos obrigatórios ausentes

- **WHEN** o usuário tenta salvar sem chamada, título, software, parceiro, módulo, descrição, vínculo ou data de lançamento
- **THEN** o formulário exibe os erros, foca o primeiro campo inválido e não grava

#### Scenario: Descrição formatada vazia

- **WHEN** o usuário aplica apenas formatação sem digitar texto na Descrição completa
- **THEN** o formulário acusa a Descrição completa como obrigatória e não grava

#### Scenario: Chamada duplicada

- **WHEN** o usuário informa uma chamada já existente no conjunto carregado
- **THEN** o formulário exibe erro de duplicidade e não grava

#### Scenario: Data fora de segunda-feira

- **WHEN** a data de lançamento ou de liberação não é segunda-feira
- **THEN** o campo exibe erro e o formulário não grava

#### Scenario: Link inválido

- **WHEN** o usuário informa um link que não é `http(s)`
- **THEN** o campo exibe erro e o formulário não grava

#### Scenario: Limites de tags e imagens

- **WHEN** o usuário ultrapassa 12 tags, 30 caracteres por tag, 100 imagens ou envia imagem fora dos formatos/tamanho aceitos
- **THEN** o formulário informa o limite e não incorpora o excedente

### Requirement: O upload de imagens grava em `uploads/chamadas/<ano>/<mes>/`

As imagens do formulário SHALL ser enviadas ao salvar a chamada, e não no clique da imagem. O upload
SHALL usar a pasta `chamadas` e as subpastas `<ano>/<mes>` derivadas de `data_lancamento`, SHALL
validar tipo e tamanho, e SHALL retornar URLs públicas em `/uploads/chamadas/<ano>/<mes>/<arquivo>`.
As URLs SHALL ser persistidas em `anexos_midias` conforme o requisito de mídias relacionais; a tela
SHALL exibir as imagens salvas após recarregar a página. O envio SHALL exigir `criar` ou `alterar` no
módulo.

#### Scenario: Upload no salvar

- **WHEN** o usuário adiciona imagens e salva uma chamada
- **THEN** os arquivos são gravados em `uploads/chamadas/<ano>/<mes>/` e as URLs são persistidas em `anexos_midias`

#### Scenario: Pasta derivada da data de lançamento

- **WHEN** a chamada tem `data_lancamento` em outro ano ou mês
- **THEN** o upload usa o ano e o mês dessa data, não a data do servidor

#### Scenario: Imagens permanecem após recarregar

- **WHEN** o usuário recarrega a página após salvar uma chamada com imagens
- **THEN** as imagens são exibidas a partir das URLs persistidas em `anexos_midias`

#### Scenario: Arquivo inválido

- **WHEN** o arquivo enviado tem tipo ou tamanho não permitido
- **THEN** o upload é rejeitado e a chamada não é gravada com a imagem inválida

#### Scenario: Ordem e capa

- **WHEN** a chamada é salva com mais de uma imagem
- **THEN** a ordem de seleção é preservada em `ordem_exibicao` e a primeira imagem fica como capa

### Requirement: A exclusão e a edição limpam imagens vinculadas

Após confirmar a exclusão de uma chamada, o sistema SHALL remover os arquivos de imagem vinculados que
estejam sob `uploads/chamadas/`. Na edição, as imagens retiradas do array SHALL ter seus arquivos
removidos e as linhas correspondentes de `anexos_midias` SHALL ser eliminadas na mesma transação da
chamada. A limpeza SHALL ocorrer somente depois da confirmação no banco, SHALL ser best-effort (uma
falha de remoção não desfaz a operação) e SHALL preservar arquivos referenciados por outra chamada,
consultando `anexos_midias` por URL. Se a exclusão da chamada for bloqueada pelo status ou histórico,
nenhum arquivo SHALL ser removido.

#### Scenario: Exclusão remove imagens

- **WHEN** o usuário exclui uma chamada permitida que possui imagens
- **THEN** o registro e as linhas de `anexos_midias` são removidos e os arquivos vinculados sob `uploads/chamadas/` são apagados

#### Scenario: Edição remove imagem retirada

- **WHEN** o usuário remove uma imagem do array e salva a chamada
- **THEN** a linha correspondente sai de `anexos_midias` e o arquivo correspondente é apagado

#### Scenario: Imagem compartilhada é preservada

- **WHEN** a mesma URL de imagem está referenciada por outra chamada em `anexos_midias`
- **THEN** o arquivo não é apagado

#### Scenario: Exclusão bloqueada não limpa arquivos

- **WHEN** a exclusão da chamada é recusada pelo backend
- **THEN** nenhum arquivo de imagem é removido

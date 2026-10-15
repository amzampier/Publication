# Spec Delta

## ADDED Requirements

### Requirement: A aba Endereço busca o CEP pela ViaCEP e compõe o rascunho
A aba **Endereço** SHALL conter os campos CEP (com máscara e botão de busca ViaCEP), Endereço, Número, Complemento, Bairro, Cidade, Estado (seleção de UFs) e Região (seleção de regiões) — o mesmo contrato do modal de Gestão de Usuários. A busca de CEP SHALL consultar a API ViaCEP ao acionar o ícone e preencher Endereço, Bairro, Cidade, Estado e Região (preservando Número e Complemento), com os estados de carregamento, feedback de falha e bloqueio de cliques definidos na capability `busca-cep`; o preenchimento SHALL compor o rascunho e habilitar o "Salvar alterações". O endereço editado compõe o rascunho e é gravado via API no "Salvar alterações".

#### Scenario: Campos espelham o contrato do modal
- **WHEN** a aba Endereço é aberta
- **THEN** os oito campos aparecem com rótulos, máscaras, seleções e dicas idênticos aos do modal de usuários

#### Scenario: Busca de CEP preenche o endereço e habilita o salvar
- **WHEN** o usuário aciona o ícone de busca com um CEP válido e a ViaCEP responde
- **THEN** os campos de endereço são preenchidos conforme a `busca-cep`, nenhum toast de sucesso aparece e o botão "Salvar alterações" fica habilitado

#### Scenario: Falha da busca não altera o rascunho
- **WHEN** a busca falha (CEP incompleto, não encontrado ou falha de rede)
- **THEN** o toast da `busca-cep` é exibido com o título "Meu Perfil", nenhum campo de endereço muda e o estado do "Salvar alterações" não é alterado pela tentativa

## MODIFIED Requirements

### Requirement: A tela de Meu Perfil é documentada no `docs/09`
O sistema SHALL manter o documento `docs/09 - Meu Perfil.md` documentando a página (rota, estrutura componentizada, avatar com foto como arquivo, as quatro abas — com a Segurança via API e os demais dados gravados via API no registro real —, salvar/cancelar sobre o rascunho do registro do banco, navegação pelo menu da conta e pendências remanescentes: RBAC), na mesma estrutura dos demais documentos de tela; as mudanças visuais do avatar SHALL refletir também em `docs/01 - design_system.md` e a navegação do item do menu da conta em `docs/03 - Header e Sidebar.md`.

#### Scenario: Documento existe e bate com a tela
- **WHEN** o `docs/09` é consultado
- **THEN** ele descreve rota, componentes, abas, comportamento de salvar/cancelar (sobre o registro real) e navegação coerentes com a página implementada

#### Scenario: ViaCEP deixou de ser pendência
- **WHEN** a seção de pendências do `docs/09` é lida
- **THEN** a busca ViaCEP não é mais listada como pendência, restando apenas o RBAC

## REMOVED Requirements

### Requirement: A aba Endereço edita o endereço completo com o mesmo contrato do cadastro de usuários
**Reason**: O requirement era da fase 1, quando a busca de CEP era um stub; ele é substituído pelo requirement ADDED "A aba Endereço busca o CEP pela ViaCEP e compõe o rascunho", que mantém os oito campos e o contrato com o modal e descreve o comportamento real de busca.
**Migration**: Ler o requirement ADDED "A aba Endereço busca o CEP pela ViaCEP e compõe o rascunho" desta mesma delta — os campos e o ciclo rascunho/salvar permanecem; o cenário de stub é substituído pelos cenários de preenchimento e de falha.

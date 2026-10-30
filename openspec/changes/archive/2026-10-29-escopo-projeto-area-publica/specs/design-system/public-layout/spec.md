# Spec Delta

## MODIFIED Requirements

### Requirement: A sidebar pública indica o item ativo e preserva o estado de abertura
O sistema SHALL destacar o atalho Home quando nenhuma seleção estiver ativa e SHALL destacar a
release, o mês de manual ou o sistema de escopo selecionado. Selecionar uma release ou um mês de
manual SHALL atualizar o estado visual local, sem alterar a URL nesta capability. Selecionar um
sistema de escopo SHALL navegar para `/escopos/{id}?sistema={nome}` e acionar **“Ver Tudo”** SHALL
navegar para `/escopos/{id}`; o item ativo e o projeto aberto SHALL derivar da URL, de modo que
abrir, recarregar, compartilhar ou usar voltar/avançar preserve a seleção. Cada seção SHALL poder ser
aberta e fechada individualmente, preservando o estado das demais.

#### Scenario: Home ativo por padrão
- **WHEN** a Área Pública é carregada sem seleção
- **THEN** o atalho “Painel de Destaques & Busca” aparece como ativo

#### Scenario: Seleção de release
- **WHEN** o visitante seleciona uma release na sidebar
- **THEN** apenas aquele card de release fica destacado e o estado visual é mantido

#### Scenario: Seleção de mês de manual
- **WHEN** o visitante seleciona um mês em Manuais Mensais
- **THEN** apenas aquele mês fica destacado, com a contagem de manuais

#### Scenario: Seleção de sistema de escopo
- **WHEN** o visitante seleciona um sistema em Escopo de Projetos
- **THEN** o navegador vai para `/escopos/{id}?sistema={nome}`, aquele sistema fica destacado e o
  projeto permanece aberto

#### Scenario: Ver Tudo
- **WHEN** o visitante aciona “Ver Tudo” no card do projeto
- **THEN** o navegador vai para `/escopos/{id}` e o projeto permanece aberto, sem sistema destacado

#### Scenario: URL direta
- **WHEN** o visitante abre diretamente `/escopos/{id}?sistema={nome}`
- **THEN** o projeto correspondente é aberto e o sistema informado aparece como ativo

#### Scenario: Voltar aos Destaques
- **WHEN** o visitante aciona “Voltar aos Destaques” na página do escopo
- **THEN** o navegador retorna para `/` e o atalho Home aparece como ativo

#### Scenario: Abertura independente das seções
- **WHEN** o visitante fecha uma seção
- **THEN** as demais seções mantêm seu estado de abertura

# Spec Delta

## Purpose

Definir o comportamento da página exibida quando uma rota não existe — idioma, identidade visual e caminhos de retorno — para que o visitante permaneça dentro do design system em vez de ver a página padrão do framework.

## ADDED Requirements

### Requirement: Rota inexistente renderiza a página de erro do sistema em pt-BR
O sistema SHALL responder com status 404 e renderizar uma página de erro própria, com título e mensagem em português do Brasil, substituindo a página padrão do framework.

#### Scenario: Rota inexistente fora do sistema é substituída
- **WHEN** `/rota-inexistente` (ou qualquer rota não cadastrada) é aberta
- **THEN** a resposta tem status HTTP 404 e a página renderizada exibe texto em pt-BR (ex.: "Página não encontrada"), não o título padrão do framework ("404 - Page not found | Nuxt")

#### Scenario: Erro fora do shell administrativo
- **WHEN** a página de erro é renderizada para uma rota sob `/admin/**`
- **THEN** ela não exibe o shell (header/sidbar) da Área Administrativa, mantendo layout próprio

### Requirement: A página de erro usa a identidade do design system
O sistema SHALL apresentar a página 404 com os tokens do `docs/01 - design_system.md` (família tipográfica oficial, cores da marca, estilo de botão do kit), coerente com o restante da aplicação.

#### Scenario: Identidade visual aplicada
- **WHEN** a página de erro é renderizada
- **THEN** ela usa a tipografia oficial, as cores da marca e os controles do kit — sem estilos padrão do framework

#### Scenario: Ação de retorno disponível
- **WHEN** o visitante está na página de erro
- **THEN** há controle clicável para voltar à Área Pública (`/`) e, opcionalmente, para a Área Administrativa (`/admin`), que o leva ao destino ao ser acionado

### Requirement: O status HTTP permanece 404 para rotas inexistentes
O sistema SHALL manter o status HTTP 404 das rotas não encontradas (a página própria não substitui o código de status), de modo que navegadores e crawlers continuem classificando a resposta corretamente.

#### Scenario: Status preservado
- **WHEN** uma rota inexistente é requisitada
- **THEN** o servidor responde `404`, ainda que o HTML exiba a página própria do sistema

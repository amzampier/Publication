# Spec Delta

## Purpose

Permitir exportações CSV de grandes conjuntos sem materializar todas as linhas em memória, mantendo
filtros, permissões e o formato esperado pelo usuário.

## ADDED Requirements

### Requirement: A exportação CSV é entregue em fluxo

Os endpoints de exportação SHALL oferecer CSV em fluxo (`text/csv` + `Content-Disposition`) quando
solicitado `formato=csv`, lendo os registros por cursor/keyset e escrevendo cada linha na resposta
sem montar o arquivo inteiro em memória. A ordem SHALL ser estável e a resposta SHALL encerrar
corretamente em sucesso, erro ou desconexão do cliente.

#### Scenario: CSV grande em fluxo
- **WHEN** o usuário exporta um conjunto maior que o limite de página
- **THEN** a resposta chega como `text/csv` em partes e o servidor não carrega todas as linhas antes de responder

#### Scenario: Desconexão do cliente
- **WHEN** o cliente aborta o download no meio
- **THEN** o servidor interrompe a leitura e libera os recursos da consulta

### Requirement: A exportação em fluxo respeita filtros e RBAC

O CSV SHALL usar o mesmo conjunto filtrado da listagem e exigir a permissão de exportação do módulo.
O cabeçalho SHALL conter as mesmas colunas da exportação atual, e valores de texto SHALL ser
escapados para CSV (aspas, quebras e fórmulas).

#### Scenario: Filtros aplicados
- **WHEN** o usuário exporta com busca/status/período ativos
- **THEN** o CSV contém apenas os registros que satisfazem os filtros

#### Scenario: Sem permissão
- **WHEN** um perfil sem `exportar` solicita o CSV
- **THEN** a API responde `403` e não inicia o fluxo

# 06 – QA Performance

Especialista em **performance, escala e eficiência** do Publications (Dicas Teorema).

Deve ler previamente: `00-arquitetura-e-regras-gerais.md` (base compartilhada) e `docs/02 - Guia de Arquitetura e Migrations.md` (pool, transações, migrations).

> **Regra de maturidade**: sem `server/`/banco implementados, a auditoria se limita ao frontend existente e declara o restante como escopo não aplicável.

---

# O que auditar

## Frontend (camada existente)

* Número de requests por tela (fanout de chamadas na abertura; composables de API quando implementados).
* Renderização de listagens grandes (`UiDataTable`): tempo de carga, agrupamentos, totalizadores sob demanda.
* Re-renderizações desnecessárias e operações síncronas pesadas no cliente.

## Backend e banco (quando implementados)

* **N+1 em queries**: loops com query por registro devem virar JOIN/subquery.
* **Índices**: `WHERE`/`ORDER BY`/`JOIN` sem índice; migrations devem prever índices para colunas consultadas.
* **Custo do filtro de visibilidade**: toda query da Área Pública filtra por visibilidade (`status`/`ativo`) — o índice deve cobrir esse filtro; medir impacto em volume.
* **Paginação**: endpoints devem paginar (`?page=&perPage=`) — listagens sem limite são bug de performance.
* **Over-fetching**: trazer apenas colunas/associações usadas.
* **Transações** (`getTransaction`): evitar locks longos; operações compostas não devem segurar conexão com trabalho externo (HTTP, PDF) dentro da transação.
* **Pool mysql2**: `connectionLimit: 10` e `queueLimit: 50` (docs/02) — requisições concorrentes não devem esgotar o pool; fila não deve crescer sem controle.
* **Rate limit**: endpoints sensíveis protegidos sem degradar fluxos legítimos.
* **Auditoria**: `registrarAuditoria` não pode falhar nem atrasar a resposta principal.
* **Migrations na inicialização**: execução não deve bloquear o boot desnecessariamente.

## Carga e concorrência

* Comportamento sob volume: registros massivos, exportações grandes, múltiplos usuários simultâneos.
* Payloads: tamanho de respostas (listagens sem paginação, JSON redundante).

---

# Checklist de performance

* Tempo de resposta das listagens; evitar queries não indexadas.
* Nº de requests por tela.
* Over-fetching (colunas/associações não usadas).
* Uso de cache onde aplicável (configurações, dados estáticos).
* Filtro de visibilidade (`status`/`ativo`) sempre presente no plano de execução das queries da Área Pública (índice cobre visibilidade + demais filtros).
* Transações curtas; sem trabalho externo dentro de `getTransaction`.
* Pool não saturado sob concorrência realista.

---

# Saída

Relatório conforme `00-arquitetura-e-regras-gerais.md`, com medições (tempo, nº de queries, payload), gargalos e sugestões sem alterar código.

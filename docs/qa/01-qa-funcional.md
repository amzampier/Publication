# 01 – QA Funcional

Especialista em **comportamento e conformidade funcional** do Publications (Dicas Teorema).

Deve ler previamente: `00-arquitetura-e-regras-gerais.md` (base compartilhada), a **spec da capability auditada** em `openspec/specs/` (fonte da verdade) e `docs/02 - Guia de Arquitetura e Migrations.md` quando envolver arquitetura.

Escopo: **Etapas 1 a 5** do processo de QA (análise da documentação, testes funcionais, testes negativos, testes de borda e testes de regressão). As etapas 6 (permissões/RBAC) e 9 (segurança) pertencem ao agente de segurança; a etapa 7 ao agente de banco; a etapa 8 ao agente de UX; a conformidade profunda de documentação ao agente de documentação.

---

# Escopo de módulos (derivado de OpenSpec)

**Não existe lista fixa de módulos.** O inventário de capabilities auditáveis é obtido via `openspec list --specs`. Para cada auditoria:

1. Identifique a capability alvo no inventário.
2. Leia integralmente `openspec/specs/<capability>/spec.md` — requirements e cenários são o esperado.
3. Capabilities sem spec ou camadas ainda não implementadas seguem a regra de **escopo não aplicável** do `00` (pular com aviso, nunca FAIL).

> **Inventário vazio**: se `openspec list --specs` não retornar nenhuma capability, não há fonte de verdade de requisitos — apoie a auditoria apenas em `docs/01` e `docs/02` e reporte a ausência de spec como **lacuna de documentação** (nunca como violação de código).

---

# Etapa 1 – Análise da documentação

Ler integralmente a spec da capability (e docs de apoio relacionados: `docs/01`, `docs/02`).

Extrair:

* objetivo (Purpose)
* fluxo principal
* regras de negócio (Requirements)
* restrições
* permissões
* entidades
* integrações
* critérios de aceitação (Scenarios)

Gerar automaticamente todos os cenários de teste a partir dos cenários da spec.

---

# Etapa 2 – Testes funcionais

Validar o fluxo principal.

Verificar:

* criação
* edição
* visualização
* exclusão
* filtros
* ordenação
* paginação
* exportações
* ações secundárias
* persistência
* fronteira de áreas (o que é visível na Área Pública × o que é restrito à Área Administrativa)

---

# Etapa 3 – Testes negativos

Executar cenários inválidos.

Exemplos:

* campos obrigatórios
* datas inválidas
* tokens expirados
* registros inexistentes
* permissões insuficientes
* duplicidade
* formatos incorretos
* datas de publicação/agendamento inválidas conforme regra da spec
* acesso a rota ou API da Área Administrativa sem sessão/permissão
* conteúdo não publicado tentando aparecer na Área Pública

O sistema deve responder corretamente em todos os casos.

---

# Etapa 4 – Testes de borda

Validar limites.

Exemplos:

* data limite
* horário limite
* tamanho máximo
* tamanho mínimo
* quantidade máxima de registros
* caracteres especiais
* múltiplos acessos simultâneos
* fronteiras de data/horário de publicação e agendamento
* transições de status nas bordas do ciclo (rascunho → agendado → publicado)

---

# Etapa 5 – Testes de regressão

Identificar todas as capabilities impactadas (specs relacionadas e demais módulos existentes).

Executar obrigatoriamente testes nas funcionalidades relacionadas.

Nenhuma alteração pode quebrar funcionalidades existentes.

---

# Critérios obrigatórios de qualidade

## Funcionalidade

A funcionalidade deve cumprir exatamente a spec.

## Consistência

O comportamento deve ser consistente com as demais capabilities.

## Integridade

Os dados devem permanecer íntegros e consistentes entre a Área Administrativa e a Área Pública.

## Regressão

Nenhuma funcionalidade existente pode ser afetada.

## Usabilidade

O usuário deve conseguir executar o fluxo sem ambiguidade.

---

# Geração automática de casos de teste

Para cada funcionalidade, gerar obrigatoriamente.

## Fluxo feliz

O comportamento esperado.

## Fluxos alternativos

Variações válidas.

## Fluxos inválidos

Entradas incorretas.

## Casos de borda

Limites operacionais.

## Regressão

Impacto em funcionalidades relacionadas.

## Permissões

Todos os perfis aplicáveis (detalhamento de execução com o agente de segurança).

## Banco

Persistência e integridade (detalhamento com o agente de banco).

## Fronteira de Áreas

O que é público × o que é restrito entre a Área Pública e a Área Administrativa (detalhamento com os agentes de segurança e banco).

---

# Formato obrigatório dos casos de teste

Utilizar BDD.

## Estrutura

Dado

Quando

Então

Exemplo.

**Título**

(descrever a ação)

**Dado**

(contexto: perfil autenticado, área (Pública/Administrativa), dados pré-existentes)

**Quando**

(ação executada)

**Então**

* resultado esperado 1 (conforme requirement da spec)
* resultado esperado 2
* efeito esperado no banco, se aplicável

> Os cenários vêm dos `#### Scenario` da spec da capability — cada scenario da spec deve virar ao menos um caso BDD.

---

# Execução

Baseie a análise na spec da capability e confirme o comportamento no código (`app/pages`, `app/components`, `app/composables`, e `server/api`/`server/utils` quando implementados). Não corrija código — apenas reporte.

## Validação de regras de negócio conhecidas

* Regras de negócio vêm **exclusivamente** dos Requirements da spec da capability auditada — liste cada uma e confirme no código.
* Regra documentada sem implementação, ou código sem regra equivalente, é divergência a reportar (com o agente de documentação).
* Comportamento não documentado em nenhum lugar é lacuna de documentação — nunca é assumido como correto.
* Validação de senha/bcrypt e fluxos de login pertencem ao agente de segurança.

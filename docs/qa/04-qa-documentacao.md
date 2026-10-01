# 04 – QA Documentação

Especialista em **conformidade entre a fonte da verdade (OpenSpec) e a implementação** do Publications (Dicas Teorema).

Deve ler previamente: `00-arquitetura-e-regras-gerais.md` (base compartilhada).

Escopo: **análise profunda da Etapa 1** (análise da documentação) com foco em rastreabilidade, lacunas e divergências entre o que está especificado e o que está implementado.

---

# Fonte da verdade e documentos de referência

* `openspec/specs/<capability>/spec.md` — requirements e cenários oficiais (verdade primária). Inventário: `openspec list --specs`.
* `openspec/changes/` — deltas de mudanças em andamento (specs de capability em alteração; considere o delta vigente além da spec principal).
* `docs/01 - design_system.md` — convenções visuais e de componentes (convergindo com a spec `design-system`).
* `docs/02 - Guia de Arquitetura e Migrations.md` — arquitetura, migrations e mecanismos de segurança.
* `docs/qa/*` — este conjunto de specs de QA (processo, não negócio).

> **Inventário vazio**: se `openspec list --specs` não retornar nenhuma capability, não há fonte de verdade de requisitos — apoie a auditoria apenas em `docs/01` e `docs/02` e reporte a ausência de spec como **lacuna de documentação** (nunca como violação de código).

---

# O que auditar

Para cada capability/modulo solicitado:

1. Ler integralmente a spec da capability (e o delta em `openspec/changes/` se houver mudança em andamento).
2. Extrair requisitos: objetivo, fluxo principal, regras de negócio, restrições, permissões, entidades, integrações, critérios de aceitação.
3. Conferir a implementação no código:
   * rotas da API em `server/api/` (existência e contrato) — quando implementado
   * páginas e componentes em `app/pages/` e `app/components/`
   * composables em `app/composables/`
   * schema Zod em `server/utils/validation.ts`
   * migrations em `server/migration/` (estrutura do banco)
4. Produzir matriz de rastreabilidade: **requisito → spec (arquivo/cenário) → implementação (arquivo) → status**.

## Verificações de conformidade

* **Especificado, mas não implementado**: requirement/cenário da spec sem código correspondente (endpoint/página/campo ausente).
* **Implementado, mas não especificado**: comportamento/endpoint/campo existente sem requirement correspondente em nenhuma spec.
* **Divergência de contrato**: payload/resposta da API diferente do especificado (nomes de campos, tipos, enums, códigos HTTP).
* **Regras de negócio divergentes**: comportamento real diferente do especificado no requirement.
* **Nomenclatura inconsistente**: termos diferentes entre spec e código.
* **Obsoleto/desatualizado**: doc ou spec descreve arquitetura ou fluxo antigo (ex.: estrutura de diretórios que mudou, padrões inexistentes).

> Quando a implementação não existe porque a camada ainda não foi construída, o status na matriz é **"não implementado (escopo não aplicável)"** — reportado como aviso, não como violação, conforme o `00`.

---

# Regras específicas

* **A spec é a fonte da verdade** — mas a conformidade exige que a spec seja fiel ao código atual. Divergências devem ser reportadas dos dois lados.
* Nunca assumir comportamentos não documentados; marcar como "requisito implícito" quando necessário.
* `docs/01` e `docs/02` são apoio: quando divergirem da spec, a spec prevalece (e a divergência é reportada).
* Severidade e formato do relatório conforme `00-arquitetura-e-regras-gerais.md`.

---

# Saída

Relatório com matriz de rastreabilidade, lista de lacunas e divergências (com referência ao arquivo/linha e ao trecho da spec), e sugestão de correção da documentação ou do código — sem alterar arquivos.

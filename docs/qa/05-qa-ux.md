# 05 – QA UX / Responsividade

Especialista em **experiência do usuário, usabilidade, acessibilidade e responsividade** do Publications (Dicas Teorema).

Deve ler previamente: `00-arquitetura-e-regras-gerais.md` (base compartilhada), a spec `openspec/specs/design-system/spec.md` e `docs/01 - design_system.md` (padrões visuais).

Escopo: **Etapa 8 (testes de UX)** aprofundada.

---

# Etapa 8 – Testes de UX

Validar experiência do usuário.

Verificar:

* clareza
* consistência
* feedback visual
* mensagens
* loading
* estados vazios
* erros
* responsividade
* acessibilidade
* navegação

---

# Padrões conhecidos do sistema

Baseados na spec `design-system` e em `docs/01` (conferir sempre contra a implementação real; componente inexistente é escopo não aplicável):

* **UI kit próprio em `app/components/ui/`** (25 componentes, auto-importados): `UiBadge`, `UiBadgeCheckbox`, `UiButton`, `UiCalendar`, `UiCameraWeb`, `UiCheckbox`, `UiCheckboxGroup`, `UiCheckCard`, `UiCheckChip`, `UiChoiceCard`, `UiDataTable`, `UiDatePicker`, `UiInput`, `UiKpi`, `UiLoading`, `UiModal`, `UiModalSection`, `UiSegmented`, `UiSelect`, `UiSlider`, `UiTabs`, `UiTextarea`, `UiToastContainer`, `UiTooltip`, `UiUploadFiles`. **Preferir os componentes existentes em vez de novos.**
* Feedback de usuário via `useToast()` (`success`, `warning`, `danger`, `info`); container montado em `app.vue`. Nenhum módulo deve usar feedback customizado inconsistente.
* **Disciplina "Zero-Pill"**: badges operacionais `rounded-md` (nunca `rounded-full`); metadados/datas/categorias como texto limpo com separadores sutis.
* **Numéricos e códigos**: `JetBrains Mono` com `font-variant-numeric: tabular-nums` e alinhamento à direita; códigos de publicação também em monoespaçada.
* **Cores semânticas**: ação primária em Navy; status "Publicado"/concluído em Esmeralda — usar a paleta de `docs/01`, não cores genéricas.
* **Vitrine viva**: a rota `/design` (`app/pages/design.vue`) demonstra as seções/tokens — útil como referência de comportamento visual.
* Formatação de datas em `dd/mm/aaaa` e `dd/mm/aaaa HH:mm` (pt-BR).

---

# Consistência entre áreas

* O usuário deve sempre saber se está na **Área Pública** ou na **Área Administrativa** — a área atual é evidente pela rota e pelo layout.
* Status exibidos na Área Administrativa seguem o mapeamento status de publicação → variante do `Badge` definido em `docs/01` (rótulos coerentes entre listagem e detalhe).
* O mesmo registro não pode aparecer com status divergente entre listagem, detalhe e Área Pública.
* Operações destrutivas devem confirmar o que será afetado (ex.: conteúdo que deixará de estar público).

---

# Checklist de UX

* Mensagens de erro claras e acionáveis; não expor detalhes técnicos.
* Estados vazios tratados — nunca tela em branco sem contexto.
* Loading em operações assíncronas (listagens, upload).
* Feedback visual em ações destrutivas (confirmação antes de excluir/arquivar).
* Datas, códigos e slugs formatados de forma consistente entre módulos (tabular-nums para numéricos, alinhamento à direita).
* Responsividade: tabelas com rolagem, modais/ajustes a telas menores, sidebar colapsável.
* Acessibilidade: contraste, foco visível, labels associados aos inputs, navegação por teclado, `aria` em componentes interativos.
* Consistência visual: mesmo kit de componentes, tokens de `docs/01`, espaçamentos.

---

# Saída

Relatório conforme `00-arquitetura-e-regras-gerais.md`, incluindo evidências de layout quando aplicável. Não alterar código.
